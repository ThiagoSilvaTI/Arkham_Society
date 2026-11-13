const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer, hashPassword } = require('./server');

const adminPasswordHash = hashPassword('test-password-123');
const validState = {
    customers: [{ id: 'CLI-0001', name: 'Cliente de teste' }],
    vehicles: [],
    services: [],
    mechanics: [],
    suppliers: [],
    parts: [],
    orders: [],
    budgets: [],
    brands: [],
    counters: { customer: 1 }
};

async function startTestServer(t) {
    const app = createServer({
        adminEmail: 'admin@example.com',
        adminPasswordHash,
        dbPath: ':memory:'
    });
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => app.close(resolve)));
    return `http://127.0.0.1:${app.address().port}`;
}

test('requires a valid admin session for SQLite-backed workshop data', async t => {
    const baseUrl = await startTestServer(t);
    const session = await fetch(`${baseUrl}/api/auth/session`);
    assert.deepEqual(await session.json(), { user: null });
    const unauthorized = await fetch(`${baseUrl}/api/workshop`);
    assert.equal(unauthorized.status, 401);

    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'wrong-password' })
    });
    assert.equal(badLogin.status, 401);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ADMIN@example.com', password: 'test-password-123' })
    });
    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/);
    const cookie = login.headers.get('set-cookie').split(';')[0];

    const emptyState = await fetch(`${baseUrl}/api/workshop`, { headers: { Cookie: cookie } });
    assert.deepEqual(await emptyState.json(), { state: null });

    const save = await fetch(`${baseUrl}/api/workshop`, {
        method: 'PUT',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify(validState)
    });
    assert.equal(save.status, 200);

    const load = await fetch(`${baseUrl}/api/workshop`, { headers: { Cookie: cookie } });
    assert.deepEqual((await load.json()).state, validState);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookie }
    });
    assert.equal(logout.status, 200);
    const deniedAfterLogout = await fetch(`${baseUrl}/api/workshop`, { headers: { Cookie: cookie } });
    assert.equal(deniedAfterLogout.status, 401);
});

test('rejects invalid and duplicate workshop records', async t => {
    const baseUrl = await startTestServer(t);
    const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'test-password-123' })
    });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const invalid = await fetch(`${baseUrl}/api/workshop`, {
        method: 'PUT',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: [] })
    });
    assert.equal(invalid.status, 400);

    const duplicateState = structuredClone(validState);
    duplicateState.customers.push({ id: 'CLI-0001', name: 'Duplicado' });
    const duplicate = await fetch(`${baseUrl}/api/workshop`, {
        method: 'PUT',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateState)
    });
    assert.equal(duplicate.status, 400);
});

test('serves the organized frontend from the Node server', async t => {
    const baseUrl = await startTestServer(t);
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /styles\.css/);
});
