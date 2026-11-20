const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const COLLECTIONS = ['customers', 'transactions'];
const SESSION_COOKIE = 'arkham_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_RECORDS_PER_COLLECTION = 5000;
const PUBLIC_FILES = new Map([
    ['/index.html', 'index.html'],
    ['/styles.css', 'styles.css'],
    ['/arkham.js', 'arkham.js'],
    ['/assets/arkham-logo.jpeg', path.join('assets', 'arkham-logo.jpeg')]
]);
const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
};

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${derivedKey}`;
}

function isPasswordHash(encodedHash) {
    const [algorithm, salt, hash] = String(encodedHash || '').split('$');
    return algorithm === 'scrypt' && /^[a-f0-9]{32}$/i.test(salt || '') && /^[a-f0-9]{128}$/i.test(hash || '');
}

function verifyPassword(password, encodedHash) {
    const [algorithm, salt, expectedHex] = String(encodedHash || '').split('$');
    if (!isPasswordHash(encodedHash)) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
}

function loadEnvironment(filePath = path.join(ROOT, '.env')) {
    if (!fs.existsSync(filePath)) return;
    const contents = fs.readFileSync(filePath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || match[1] in process.env) continue;
        const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
        process.env[match[1]] = value;
    }
}

function sendJson(response, status, payload, headers = {}) {
    response.writeHead(status, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        ...headers
    });
    response.end(JSON.stringify(payload));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', chunk => {
            body += chunk;
            if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
                reject(Object.assign(new Error('A solicitação excede o limite permitido.'), { status: 413 }));
                request.destroy();
            }
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch {
                reject(Object.assign(new Error('Corpo JSON inválido.'), { status: 400 }));
            }
        });
        request.on('error', reject);
    });
}

function parseCookies(header = '') {
    return Object.fromEntries(header.split(';').map(part => {
        const separator = part.indexOf('=');
        if (separator < 0) return ['', ''];
        return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }).filter(([key]) => key));
}

function validString(value, maxLength, required = false) {
    return typeof value === 'string' && value.length <= maxLength && (!required || value.trim().length > 0);
}

function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateWorkspaceState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
    return COLLECTIONS.every(collection =>
        Array.isArray(state[collection]) &&
        state[collection].length <= MAX_RECORDS_PER_COLLECTION &&
        state[collection].every(record => {
            if (!record || typeof record !== 'object' || Array.isArray(record) || !validString(record.id, 100, true)) return false;
            if (collection === 'customers') {
                return validString(record.name, 120, true) &&
                    validString(record.company, 120) &&
                    validString(record.email, 160) &&
                    validString(record.phone, 30) &&
                    typeof record.createdAt === 'string' &&
                    Number.isFinite(Date.parse(record.createdAt));
            }
            return (record.type === 'revenue' || record.type === 'expense') &&
                validString(record.description, 140, true) &&
                validString(record.category, 80, true) &&
                typeof record.amount === 'number' &&
                Number.isFinite(record.amount) &&
                record.amount > 0 &&
                record.amount <= 1_000_000_000_000 &&
                isValidDate(record.date) &&
                typeof record.createdAt === 'string' &&
                Number.isFinite(Date.parse(record.createdAt));
        })
    );
}

function createServer(options = {}) {
    const dbPath = options.dbPath || path.join(ROOT, 'data', 'arkham.sqlite');
    if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const database = new DatabaseSync(dbPath);
    database.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS tenants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL REFERENCES tenants(id),
            name TEXT NOT NULL,
            email TEXT NOT NULL COLLATE NOCASE UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);
        CREATE TABLE IF NOT EXISTS tenant_records (
            tenant_id TEXT NOT NULL REFERENCES tenants(id),
            collection TEXT NOT NULL,
            record_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (tenant_id, collection, record_id)
        );
        CREATE INDEX IF NOT EXISTS tenant_records_list_idx
            ON tenant_records (tenant_id, collection, position);
    `);

    const findUser = database.prepare(`
        SELECT users.id, users.tenant_id, users.name, users.email, users.password_hash, tenants.name AS company
        FROM users JOIN tenants ON tenants.id = users.tenant_id
        WHERE users.email = ?
    `);
    const createTenant = database.prepare('INSERT INTO tenants (id, name, created_at) VALUES (?, ?, ?)');
    const createUser = database.prepare(
        'INSERT INTO users (id, tenant_id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const readRecords = database.prepare(
        'SELECT record_id, payload FROM tenant_records WHERE tenant_id = ? AND collection = ? ORDER BY position'
    );
    const deleteTenantRecords = database.prepare('DELETE FROM tenant_records WHERE tenant_id = ?');
    const insertTenantRecord = database.prepare(
        'INSERT INTO tenant_records (tenant_id, collection, record_id, position, payload) VALUES (?, ?, ?, ?, ?)'
    );
    const sessions = new Map();
    const loginAttempts = new Map();
    const production = options.production ?? process.env.NODE_ENV === 'production';

    const getSession = request => {
        const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
        const session = token && sessions.get(token);
        if (!session) return null;
        if (session.expiresAt <= Date.now()) {
            sessions.delete(token);
            return null;
        }
        return { token, user: session.user };
    };

    const requireSameOrigin = (request, response) => {
        const origin = request.headers.origin;
        const host = request.headers.host;
        if (origin) {
            try {
                if (!host || new URL(origin).host !== host) {
                    sendJson(response, 403, { error: 'Origem da solicitação não autorizada.' });
                    return false;
                }
            } catch {
                sendJson(response, 403, { error: 'Origem da solicitação não autorizada.' });
                return false;
            }
        }
        return true;
    };

    const setSessionCookie = (token, maxAge) =>
        `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${production ? '; Secure' : ''}`;

    const createSession = (user, response) => {
        const token = crypto.randomBytes(32).toString('base64url');
        sessions.set(token, { user, expiresAt: Date.now() + SESSION_DURATION_MS });
        sendJson(response, 200, { user }, {
            'Set-Cookie': setSessionCookie(token, SESSION_DURATION_MS / 1000)
        });
    };

    const readWorkspace = tenantId => Object.fromEntries(COLLECTIONS.map(collection => [
        collection,
        readRecords.all(tenantId, collection).map(row => JSON.parse(row.payload))
    ]));

    const saveWorkspace = (tenantId, state) => {
        database.exec('BEGIN IMMEDIATE');
        try {
            deleteTenantRecords.run(tenantId);
            for (const collection of COLLECTIONS) {
                state[collection].forEach((record, position) => {
                    insertTenantRecord.run(tenantId, collection, record.id, position, JSON.stringify(record));
                });
            }
            database.exec('COMMIT');
        } catch (error) {
            database.exec('ROLLBACK');
            throw error;
        }
    };

    const app = http.createServer(async (request, response) => {
        let url;
        try {
            url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        } catch {
            sendJson(response, 400, { error: 'Endereço de solicitação inválido.' });
            return;
        }

        try {
            if (url.pathname === '/api/auth/register' && request.method === 'POST') {
                if (!requireSameOrigin(request, response)) return;
                const values = await readJson(request);
                const company = String(values.company || '').trim();
                const name = String(values.name || '').trim();
                const email = String(values.email || '').trim().toLowerCase();
                const password = String(values.password || '');
                if (!validString(company, 120, true) || !validString(name, 100, true) ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 ||
                    password.length < 8 || password.length > 128 ||
                    !/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
                    sendJson(response, 400, { error: 'Confira os dados e use uma senha com pelo menos 8 caracteres, incluindo letras e números.' });
                    return;
                }
                if (findUser.get(email)) {
                    sendJson(response, 409, { error: 'Já existe uma conta com este e-mail.' });
                    return;
                }
                const now = new Date().toISOString();
                const tenantId = crypto.randomUUID();
                const user = { id: crypto.randomUUID(), tenantId, name, email, company };
                database.exec('BEGIN IMMEDIATE');
                try {
                    createTenant.run(tenantId, company, now);
                    createUser.run(user.id, tenantId, name, email, hashPassword(password), now);
                    database.exec('COMMIT');
                } catch (error) {
                    database.exec('ROLLBACK');
                    if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
                        sendJson(response, 409, { error: 'Já existe uma conta com este e-mail.' });
                        return;
                    }
                    throw error;
                }
                createSession(user, response);
                return;
            }

            if (url.pathname === '/api/auth/login' && request.method === 'POST') {
                if (!requireSameOrigin(request, response)) return;
                const ip = request.socket.remoteAddress || 'unknown';
                const attempts = loginAttempts.get(ip);
                if (attempts && attempts.blockedUntil > Date.now()) {
                    sendJson(response, 429, { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
                    return;
                }
                const values = await readJson(request);
                const email = String(values.email || '').trim().toLowerCase();
                const password = String(values.password || '');
                const account = email.length <= 160 && password.length <= 128 ? findUser.get(email) : null;
                const accepted = account && verifyPassword(password, account.password_hash);
                if (!accepted) {
                    const recent = attempts && Date.now() - attempts.startedAt < 15 * 60 * 1000
                        ? attempts
                        : { count: 0, startedAt: Date.now(), blockedUntil: 0 };
                    recent.count += 1;
                    if (recent.count >= 8) recent.blockedUntil = Date.now() + 15 * 60 * 1000;
                    loginAttempts.set(ip, recent);
                    sendJson(response, 401, { error: 'E-mail ou senha incorretos.' });
                    return;
                }
                loginAttempts.delete(ip);
                createSession({
                    id: account.id,
                    tenantId: account.tenant_id,
                    name: account.name,
                    email: account.email,
                    company: account.company
                }, response);
                return;
            }

            if (url.pathname === '/api/auth/session' && request.method === 'GET') {
                const session = getSession(request);
                sendJson(response, 200, { user: session?.user || null });
                return;
            }

            if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
                if (!requireSameOrigin(request, response)) return;
                const session = getSession(request);
                if (session) sessions.delete(session.token);
                sendJson(response, 200, { ok: true }, {
                    'Set-Cookie': setSessionCookie('', 0)
                });
                return;
            }

            if (url.pathname === '/api/workspace' && (request.method === 'GET' || request.method === 'PUT')) {
                const session = getSession(request);
                if (!session) {
                    sendJson(response, 401, { error: 'Entre na sua conta para acessar o espaço de trabalho.' });
                    return;
                }
                if (request.method === 'GET') {
                    sendJson(response, 200, { state: readWorkspace(session.user.tenantId) });
                    return;
                }
                if (!requireSameOrigin(request, response)) return;
                const state = await readJson(request);
                if (!validateWorkspaceState(state)) {
                    sendJson(response, 400, { error: 'Os dados enviados são inválidos. Revise os campos e tente novamente.' });
                    return;
                }
                for (const collection of COLLECTIONS) {
                    const ids = state[collection].map(record => record.id);
                    if (new Set(ids).size !== ids.length) {
                        sendJson(response, 400, { error: `Há identificadores repetidos em ${collection}.` });
                        return;
                    }
                }
                saveWorkspace(session.user.tenantId, state);
                sendJson(response, 200, { ok: true });
                return;
            }

            if (url.pathname.startsWith('/api/')) {
                sendJson(response, 404, { error: 'Rota da API não encontrada.' });
                return;
            }

            if (request.method !== 'GET' && request.method !== 'HEAD') {
                sendJson(response, 405, { error: 'Método não permitido.' });
                return;
            }
            if (url.pathname === '/mekanik.html') {
                response.writeHead(308, { Location: '/', 'Cache-Control': 'no-cache' });
                response.end();
                return;
            }
            let decodedPath;
            try {
                decodedPath = decodeURIComponent(url.pathname);
            } catch {
                sendJson(response, 400, { error: 'Endereço de solicitação inválido.' });
                return;
            }
            const publicFile = PUBLIC_FILES.get(decodedPath === '/' ? '/index.html' : decodedPath);
            if (!publicFile) {
                sendJson(response, 404, { error: 'Arquivo não encontrado.' });
                return;
            }
            const filePath = path.join(ROOT, publicFile);
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                sendJson(response, 404, { error: 'Arquivo não encontrado.' });
                return;
            }
            response.writeHead(200, {
                'Cache-Control': 'no-cache',
                'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
                'X-Content-Type-Options': 'nosniff'
            });
            if (request.method === 'HEAD') {
                response.end();
                return;
            }
            fs.createReadStream(filePath).pipe(response);
        } catch (error) {
            if (response.headersSent || response.destroyed) return;
            sendJson(response, error.status || 500, {
                error: error.status ? error.message : 'Erro interno do servidor.'
            });
            if (!error.status) console.error('Falha ao processar solicitação:', error);
        }
    });

    app.on('close', () => database.close());
    return app;
}

if (require.main === module) {
    loadEnvironment();
    const app = createServer({
        dbPath: process.env.ARKHAM_DATABASE_PATH
            ? path.resolve(ROOT, process.env.ARKHAM_DATABASE_PATH)
            : path.join(ROOT, 'data', 'arkham.sqlite')
    });
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || (process.env.RENDER ? '0.0.0.0' : '127.0.0.1');
    app.listen(port, host, () => console.log(`Arkham Systems disponível em http://${host}:${port}`));
}

module.exports = {
    createServer,
    hashPassword,
    loadEnvironment,
    validateWorkspaceState
};
