import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnnouncement, safeUrl, isAdminType } from '../src/lib/validation.mjs';
const base = { title: 'ประกาศ', body: 'ข้อความ', priority: 'important', status: 'published', targets: ['all'], start_at: '', end_at: '', link_url: '', link_label: '', source_url: '' };
test('both administrator roles are allowed, other roles are denied', () => {
  for (const role of ['admin', 'Admin', ' superadmin ', 'SUPERADMIN']) assert.equal(isAdminType(role), true);
  for (const role of ['teacher', 'user', undefined, '', 'administrator', { type: 'admin' }]) assert.equal(isAdminType(role), false);
});
test('prevents executable, credential-bearing and invalid links', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,a', 'https://user:password@example.com/', '//example.com', 'not a url']) assert.equal(safeUrl(url), null);
  assert.equal(safeUrl('https://sos.kmitl.ac.th'), 'https://sos.kmitl.ac.th/');
});
test('requires valid recipients, status and priority', () => {
  assert.deepEqual(validateAnnouncement(base).errors, {});
  assert.ok(validateAnnouncement({ ...base, targets: [] }).errors.targets);
  assert.ok(validateAnnouncement({ ...base, targets: ['unknown'] }).errors.targets);
  assert.ok(validateAnnouncement({ ...base, status: 'deleted', priority: 'urgent' }).errors.status);
  assert.deepEqual(validateAnnouncement({ ...base, targets: ['all', 'printer'] }).data.targets, ['all']);
  assert.deepEqual(validateAnnouncement({ ...base, targets: ['android'] }).errors, {});
  assert.deepEqual(validateAnnouncement({ ...base, targets: ['android', 'printer'] }).data.targets, ['android', 'printer']);
});
test('Bangkok schedule converts consistently and invalid calendars are rejected', () => {
  const result = validateAnnouncement({ ...base, start_at: '2026-09-26T12:00', end_at: '2026-09-26T13:00' });
  assert.deepEqual(result.errors, {});
  assert.equal(result.data.start_at, '2026-09-26 05:00:00.000Z');
  assert.ok(validateAnnouncement({ ...base, start_at: '2026-02-30T12:00' }).errors.start_at);
  assert.ok(validateAnnouncement({ ...base, start_at: '2026-09-26T12:00', end_at: '2026-09-26T11:59' }).errors.end_at);
});
test('requires meaningful content and link labels', () => {
  const result = validateAnnouncement({ ...base, title: ' ', body: '', link_url: 'https://example.com' });
  assert.ok(result.errors.title); assert.ok(result.errors.body); assert.ok(result.errors.link_label);
});
