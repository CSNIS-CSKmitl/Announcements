import http from 'node:http';
import { pathToFileURL } from 'node:url';
export async function startMock(port = 0) {
  const records = [];
  const users = Object.fromEntries(['admin', 'superadmin', 'member'].map((role, i) => [role, { id: `testuser000000${i}`, collectionId: 'testusers000000', collectionName: 'users', email: `${role}@example.test`, name: `Test ${role}`, user_type: `${role}role`, expand: { user_type: { id: `${role}role`, type: role } } }]));
  const token = user => `test.${Buffer.from(JSON.stringify({ id: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`;
  function authenticated(request) {
    try { const payload = JSON.parse(Buffer.from(String(request.headers.authorization || '').replace(/^Bearer /, '').split('.')[1], 'base64url')); return Object.values(users).find(user => user.id === payload.id); } catch { return null; }
  }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1'); let body = {};
    try { let text = ''; for await (const chunk of req) text += chunk; body = text ? JSON.parse(text) : {}; } catch {}
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const parts = url.pathname.split('/'), collection = parts[3], operation = parts[4], id = parts[5]; const user = authenticated(req);
    if (collection === 'users' && operation === 'auth-methods') return send(200, { password: { enabled: true }, oauth2: { enabled: false, providers: [] } });
    if (collection === 'users' && operation === 'auth-with-password') {
      const found = Object.values(users).find(item => item.email === body.identity);
      return found && body.password === 'demo-test-only' ? send(200, { token: token(found), record: found }) : send(400, { message: 'Invalid test account' });
    }
    if (collection === 'users' && operation === 'auth-refresh') return user ? send(200, { token: token(user), record: user }) : send(401, { message: 'Not authenticated' });
    if (collection === 'users' && operation === 'records' && id) {
      const found = Object.values(users).find(item => item.id === id); return found && user ? send(200, found) : send(404, { message: 'Not found' });
    }
    if (collection === 'announcements' && operation === 'records') {
      if (!user || user === users.member) return send(403, { message: 'Admin required in test backend' });
      const found = records.find(item => item.id === id);
      if (req.method === 'GET') return id ? send(found ? 200 : 404, found || { message: 'Not found' }) : send(200, { page: 1, perPage: 500, totalItems: records.length, totalPages: 1, items: records });
      if (req.method === 'POST') { const item = { ...body, id: String(records.length + 1).padStart(15, '0'), created: new Date().toISOString(), updated: new Date().toISOString() }; records.unshift(item); return send(200, item); }
      if (req.method === 'PATCH' && found) { Object.assign(found, body, { updated: new Date().toISOString() }); return send(200, found); }
    }
    send(404, { message: 'Not found in mock' });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  return { server, records, users, token, port: server.address().port };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { const mock = await startMock(31876); console.log(`Test-only PocketBase: http://127.0.0.1:${mock.port}`); }
