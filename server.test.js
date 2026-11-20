const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('./server');

async function startTestServer(t, options = {}) {
    const app = createServer({ dbPath: ':memory:', ...options });
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => app.close(resolve)));
    return `http://127.0.0.1:${app.address().port}`;
}

async function register(baseUrl, { company, name, email, password = 'secure-pass-123' }) {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, name, email, password })
    });
    return {
        response,
        user: (await response.json()).user,
        cookie: response.headers.get('set-cookie')?.split(';')[0]
    };
}

const stateFor = (id, name, amount) => ({
    customers: [{
        id,
        name,
        company: '',
        email: `${id}@example.com`,
        phone: '',
        createdAt: '2026-11-18T12:00:00.000Z'
    }],
    transactions: [{
        id,
        type: 'revenue',
        description: `${name} payment`,
        category: 'Sales',
        amount,
        date: '2026-11-18',
        createdAt: '2026-11-18T12:00:00.000Z'
    }]
});

test('registers companies, authenticates users, and requires a session for workspace data', async t => {
    const baseUrl = await startTestServer(t);
    const anonymousSession = await fetch(`${baseUrl}/api/auth/session`);
    assert.deepEqual(await anonymousSession.json(), { user: null });
    assert.equal((await fetch(`${baseUrl}/api/workspace`)).status, 401);

    const registration = await register(baseUrl, {
        company: 'Empresa Um',
        name: 'Pessoa Responsável',
        email: 'OWNER@example.com'
    });
    assert.equal(registration.response.status, 200);
    assert.equal(registration.user.company, 'Empresa Um');
    assert.match(registration.response.headers.get('set-cookie'), /HttpOnly/);
    assert.match(registration.response.headers.get('set-cookie'), /SameSite=Strict/);

    const session = await fetch(`${baseUrl}/api/auth/session`, {
        headers: { Cookie: registration.cookie }
    });
    assert.equal((await session.json()).user.tenantId, registration.user.tenantId);

    const initialWorkspace = await fetch(`${baseUrl}/api/workspace`, {
        headers: { Cookie: registration.cookie }
    });
    assert.deepEqual((await initialWorkspace.json()).state, { customers: [], transactions: [] });

    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@example.com', password: 'wrong-password' })
    });
    assert.equal(badLogin.status, 401);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'OWNER@example.com', password: 'secure-pass-123' })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    assert.equal((await login.json()).user.company, 'Empresa Um');

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookie }
    });
    assert.equal(logout.status, 200);
    assert.equal((await fetch(`${baseUrl}/api/workspace`, { headers: { Cookie: cookie } })).status, 401);
});

test('keeps customer and financial records isolated to their company', async t => {
    const baseUrl = await startTestServer(t);
    const companyOne = await register(baseUrl, {
        company: 'Empresa Um',
        name: 'Responsável Um',
        email: 'one@example.com'
    });
    const companyTwo = await register(baseUrl, {
        company: 'Empresa Dois',
        name: 'Responsável Dois',
        email: 'two@example.com'
    });

    const companyOneState = stateFor('record-shared-id', 'Cliente Um', 1200);
    const companyTwoState = stateFor('record-shared-id', 'Cliente Dois', 750);
    const saveOne = await fetch(`${baseUrl}/api/workspace`, {
        method: 'PUT',
        headers: { Cookie: companyOne.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify(companyOneState)
    });
    assert.equal(saveOne.status, 200);
    const saveTwo = await fetch(`${baseUrl}/api/workspace`, {
        method: 'PUT',
        headers: { Cookie: companyTwo.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify(companyTwoState)
    });
    assert.equal(saveTwo.status, 200);

    const loadOne = await fetch(`${baseUrl}/api/workspace`, { headers: { Cookie: companyOne.cookie } });
    const loadTwo = await fetch(`${baseUrl}/api/workspace`, { headers: { Cookie: companyTwo.cookie } });
    assert.deepEqual((await loadOne.json()).state, companyOneState);
    assert.deepEqual((await loadTwo.json()).state, companyTwoState);

    const updateOne = stateFor('record-shared-id', 'Atualizado Um', 1800);
    await fetch(`${baseUrl}/api/workspace`, {
        method: 'PUT',
        headers: { Cookie: companyOne.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify(updateOne)
    });
    const unchangedTwo = await fetch(`${baseUrl}/api/workspace`, { headers: { Cookie: companyTwo.cookie } });
    assert.deepEqual((await unchangedTwo.json()).state, companyTwoState);
});

test('rejects invalid workspace records and duplicate IDs within one company', async t => {
    const baseUrl = await startTestServer(t);
    const account = await register(baseUrl, {
        company: 'Empresa',
        name: 'Responsável',
        email: 'owner@example.com'
    });
    const invalid = await fetch(`${baseUrl}/api/workspace`, {
        method: 'PUT',
        headers: { Cookie: account.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: [], transactions: [{ id: 'bad', type: 'expense', amount: -1 }] })
    });
    assert.equal(invalid.status, 400);

    const duplicateState = stateFor('duplicate', 'Cliente', 10);
    duplicateState.customers.push({ ...duplicateState.customers[0] });
    const duplicate = await fetch(`${baseUrl}/api/workspace`, {
        method: 'PUT',
        headers: { Cookie: account.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateState)
    });
    assert.equal(duplicate.status, 400);
});

test('validates company registration and rejects duplicate account emails', async t => {
    const baseUrl = await startTestServer(t);
    const invalid = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            company: 'Empresa',
            name: 'Responsável',
            email: 'owner@example.com',
            password: 'onlyletters'
        })
    });
    assert.equal(invalid.status, 400);

    await register(baseUrl, {
        company: 'Empresa',
        name: 'Responsável',
        email: 'owner@example.com'
    });
    const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            company: 'Outra Empresa',
            name: 'Outra Pessoa',
            email: 'OWNER@example.com',
            password: 'secure-pass-123'
        })
    });
    assert.equal(duplicate.status, 409);
});

test('serves the Arkham frontend and its local application script', async t => {
    const baseUrl = await startTestServer(t);
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /Arkham Systems/);
    assert.match(html, /arkham\.js/);

    const script = await fetch(`${baseUrl}/arkham.js`);
    assert.equal(script.status, 200);
    assert.match(script.headers.get('content-type'), /javascript/);

    for (const privatePath of ['/server.js', '/.env', '/server.test.js', '/app.js', '/data/arkham.sqlite']) {
        const privateResponse = await fetch(`${baseUrl}${privatePath}`);
        assert.equal(privateResponse.status, 404, `${privatePath} must not be public`);
    }

    const legacyRoute = await fetch(`${baseUrl}/mekanik.html`, { redirect: 'manual' });
    assert.equal(legacyRoute.status, 308);
    assert.equal(legacyRoute.headers.get('location'), '/');
});

test('sets secure cookies for production deployments', async t => {
    const baseUrl = await startTestServer(t, { production: true });
    const registration = await register(baseUrl, {
        company: 'Empresa Segura',
        name: 'Responsável',
        email: 'secure@example.com'
    });
    assert.match(registration.response.headers.get('set-cookie'), /; Secure/);
});
