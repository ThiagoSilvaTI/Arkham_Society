const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const COLLECTIONS = [
    'customers',
    'vehicles',
    'services',
    'mechanics',
    'suppliers',
    'parts',
    'orders',
    'budgets',
    'brands'
];
const SESSION_COOKIE = 'mekanik_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
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

function validateWorkshopState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
    if (!state.counters || typeof state.counters !== 'object' || Array.isArray(state.counters)) return false;
    return COLLECTIONS.every(collection =>
        Array.isArray(state[collection]) && state[collection].every(record =>
            record && typeof record === 'object' && !Array.isArray(record) &&
            typeof (collection === 'brands' ? record.name : record.id) === 'string'
        )
    );
}

function createServer(options = {}) {
    const adminEmail = String(options.adminEmail || '').trim().toLowerCase();
    const adminPasswordHash = String(options.adminPasswordHash || (
        options.adminPassword ? hashPassword(String(options.adminPassword)) : ''
    ));
    if (!adminEmail || !isPasswordHash(adminPasswordHash)) {
        throw new Error('Configure ADMIN_EMAIL e ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH nas variáveis de ambiente do serviço.');
    }

    const dbPath = options.dbPath || path.join(ROOT, 'data', 'mekanik.sqlite');
    if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const database = new DatabaseSync(dbPath);
    database.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS workshop_records (
            collection TEXT NOT NULL,
            record_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (collection, record_id)
        );
        CREATE TABLE IF NOT EXISTS workshop_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
    const readRecords = database.prepare(
        'SELECT record_id, payload FROM workshop_records WHERE collection = ? ORDER BY position'
    );
    const deleteRecords = database.prepare('DELETE FROM workshop_records');
    const insertRecord = database.prepare(
        'INSERT INTO workshop_records (collection, record_id, position, payload) VALUES (?, ?, ?, ?)'
    );
    const readMetadata = database.prepare('SELECT value FROM workshop_metadata WHERE key = ?');
    const writeMetadata = database.prepare(
        'INSERT INTO workshop_metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );
    const sessions = new Map();
    const loginAttempts = new Map();
    const production = options.production ?? process.env.NODE_ENV === 'production';

    const readState = () => {
        if (!readMetadata.get('initialized')) return null;
        const state = {};
        for (const collection of COLLECTIONS) {
            state[collection] = readRecords.all(collection).map(row => JSON.parse(row.payload));
        }
        const counters = readMetadata.get('counters');
        if (!counters) throw new Error('Os contadores da oficina não foram encontrados no banco de dados.');
        state.counters = JSON.parse(counters.value);
        return state;
    };

    const saveState = state => {
        database.exec('BEGIN IMMEDIATE');
        try {
            deleteRecords.run();
            for (const collection of COLLECTIONS) {
                state[collection].forEach((record, position) => {
                    const id = collection === 'brands' ? record.name : record.id;
                    insertRecord.run(collection, id, position, JSON.stringify(record));
                });
            }
            writeMetadata.run('counters', JSON.stringify(state.counters));
            writeMetadata.run('initialized', '1');
            database.exec('COMMIT');
        } catch (error) {
            database.exec('ROLLBACK');
            throw error;
        }
    };

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

    const app = http.createServer(async (request, response) => {
        let url;
        try {
            url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        } catch {
            sendJson(response, 400, { error: 'Endereço de solicitação inválido.' });
            return;
        }

        try {
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
                const accepted = email === adminEmail && verifyPassword(password, adminPasswordHash);
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
                const token = crypto.randomBytes(32).toString('base64url');
                const user = { name: 'Administrador', email: adminEmail, role: 'admin' };
                sessions.set(token, { user, expiresAt: Date.now() + SESSION_DURATION_MS });
                sendJson(response, 200, { user }, {
                    'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}${production ? '; Secure' : ''}`
                });
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
                    'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production ? '; Secure' : ''}`
                });
                return;
            }

            if (url.pathname === '/api/workshop' && (request.method === 'GET' || request.method === 'PUT')) {
                if (!getSession(request)) {
                    sendJson(response, 401, { error: 'Autenticação administrativa necessária.' });
                    return;
                }
                if (request.method === 'GET') {
                    sendJson(response, 200, { state: readState() });
                    return;
                }
                if (!requireSameOrigin(request, response)) return;
                const state = await readJson(request);
                if (!validateWorkshopState(state)) {
                    sendJson(response, 400, { error: 'Os dados enviados para a oficina são inválidos.' });
                    return;
                }
                for (const collection of COLLECTIONS) {
                    const ids = state[collection].map(record => collection === 'brands' ? record.name : record.id);
                    if (new Set(ids).size !== ids.length) {
                        sendJson(response, 400, { error: `Há identificadores repetidos em ${collection}.` });
                        return;
                    }
                }
                saveState(state);
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
            const decodedPath = decodeURIComponent(url.pathname);
            const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
            const filePath = path.resolve(ROOT, relativePath);
            if (!filePath.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
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
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || (
        process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD) : ''
    );
    const app = createServer({
        adminEmail: process.env.ADMIN_EMAIL,
        adminPasswordHash: passwordHash,
        dbPath: process.env.DATABASE_PATH
            ? path.resolve(ROOT, process.env.DATABASE_PATH)
            : path.join(ROOT, 'data', 'mekanik.sqlite')
    });
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || (process.env.RENDER ? '0.0.0.0' : '127.0.0.1');
    app.listen(port, host, () => console.log(`Mekanik disponível em http://${host}:${port}`));
}

module.exports = { createServer, hashPassword, loadEnvironment, validateWorkshopState };
