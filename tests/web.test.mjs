import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { startMock } from './mock-pocketbase.mjs';
test('production manager verifies roles, publishing, validation, revision checks and archiving', async () => {
  const mock = await startMock(); const origin = 'http://127.0.0.1:31875';
  const child = spawn(process.execPath, ['build/index.js'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '31875', ORIGIN: origin, POCKETBASE_URL: `http://127.0.0.1:${mock.port}` }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; child.stdout.on('data', chunk => { logs += chunk; }); child.stderr.on('data', chunk => { logs += chunk; });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) { try { await fetch(`${origin}/login`); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); } } assert.ok(ready, logs);
    const post = (path, values, cookie = '') => fetch(origin + path, { method: 'POST', redirect: 'manual', headers: { Origin: origin, Cookie: cookie, Accept: 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values) });
    const values = { title: 'Important test announcement', body: 'Public content', priority: 'important', intent: 'published', targets: 'all', start_at: '', end_at: '', link_label: 'Help', link_url: 'https://example.test/help', source_url: '' };
    assert.equal((await post('/?/save', values)).status, 303); assert.equal(mock.records.length, 0);
    assert.equal((await post('/login', { identity: 'member@example.test', password: 'demo-test-only' })).status, 403);
    const forged = `announcements_auth=${encodeURIComponent(JSON.stringify({ token: mock.token(mock.users.member), record: { ...mock.users.member, expand: { user_type: { type: 'admin' } } } }))}`;
    assert.equal((await post('/?/save', values, forged)).status, 403);
    for (const role of ['admin', 'superadmin']) {
      const login = await post('/login', { identity: `${role}@example.test`, password: 'demo-test-only' }); assert.equal(login.status, 303, `${role} login`);
      const cookie = login.headers.get('set-cookie').split(';')[0]; assert.equal((await fetch(origin, { headers: { Cookie: cookie } })).status, 200);
      assert.equal((await post('/?/save', { ...values, link_url: 'javascript:alert(1)' }, cookie)).status, 400);
      const previous = mock.records.length;
      assert.equal((await post('/?/save', { ...values, start_at: '2030-01-01T09:30', end_at: '2030-01-02T09:30' }, cookie)).status, 200); assert.equal(mock.records.length, previous + 1);
      const item = mock.records[0]; assert.equal(item.created_by, mock.users[role].id); assert.equal(item.start_at, '2030-01-01 02:30:00.000Z'); assert.deepEqual(item.targets, ['all']);
      assert.equal((await post('/?/save', { ...values, id: item.id, revision: 'stale' }, cookie)).status, 409);
      assert.equal((await post('/?/archive', { id: item.id, revision: item.revision }, cookie)).status, 200); assert.equal(item.status, 'archived');
    }
    assert.equal(mock.records.length, 2);
  } finally { child.kill(); await new Promise(resolve => mock.server.close(resolve)); }
});
