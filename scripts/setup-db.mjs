import PocketBase from 'pocketbase';
import { mkdirSync, writeFileSync } from 'node:fs';
const apply = process.argv.includes('--apply');
const seed = process.argv.includes('--seed-flood');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
if (!process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) throw new Error('Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD for one-time setup (or use node --env-file=../init.d/.env scripts/setup-db.mjs).');
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
const users = await pb.collections.getOne('users');
const userTypeField = users.fields.find(field => field.name === 'user_type');
if (!userTypeField?.collectionId) throw new Error('users.user_type must be a relation. No changes made.');
const roles = await pb.collection(userTypeField.collectionId).getFullList();
const adminRoleIds = roles.filter(role => ['admin', 'superadmin'].includes(String(role.type || '').trim().toLowerCase())).map(role => role.id);
if (!adminRoleIds.length) throw new Error('No admin or superadmin user types found. No changes made.');
const adminRule = '@request.auth.id != "" && (' + adminRoleIds.map(id => `@request.auth.user_type = "${id}"`).join(' || ') + ')';
const activeRule = 'status = "published" && (start_at = "" || start_at <= @now) && (end_at = "" || end_at > @now)';
const schema = {
  name: 'announcements', type: 'base',
  listRule: `(${adminRule}) || (${activeRule})`, viewRule: `(${adminRule}) || (${activeRule})`,
  createRule: `${adminRule} && @request.body.created_by = @request.auth.id`,
  updateRule: `${adminRule} && @request.body.created_by:isset = false`, deleteRule: null,
  fields: [
    { type: 'text', name: 'title', required: true, max: 180 },
    { type: 'text', name: 'body', required: true, max: 6000 },
    { type: 'select', name: 'priority', required: true, maxSelect: 1, values: ['info', 'important', 'emergency'] },
    { type: 'select', name: 'status', required: true, maxSelect: 1, values: ['draft', 'published', 'archived'] },
    { type: 'select', name: 'targets', required: true, maxSelect: 3, values: ['all', 'initd', 'printer'] },
    { type: 'date', name: 'start_at' }, { type: 'date', name: 'end_at' },
    { type: 'text', name: 'link_label', max: 80 }, { type: 'url', name: 'link_url' }, { type: 'url', name: 'source_url' },
    { type: 'text', name: 'revision', required: true, max: 100 },
    { type: 'relation', name: 'created_by', hidden: true, collectionId: users.id, maxSelect: 1 },
    { type: 'relation', name: 'updated_by', hidden: true, collectionId: users.id, maxSelect: 1 },
    { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
    { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE INDEX idx_announcements_status_start ON announcements (status, start_at)']
};
let existing;
try { existing = await pb.collections.getOne('announcements'); } catch (cause) { if (cause.status !== 404) throw cause; }
if (existing) {
  for (const field of schema.fields) if (!existing.fields.some(item => item.name === field.name && item.type === field.type)) throw new Error(`Existing announcements.${field.name} differs. No changes made.`);
  for (const key of ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule']) if (existing[key] !== schema[key]) throw new Error(`Existing announcements.${key} differs. Review it manually; no changes made.`);
  console.log('Announcements collection is already configured for admin and superadmin.');
} else {
  console.log(`Create announcements collection; ${adminRoleIds.length} admin/superadmin user types; public visitors read active published notices only.`);
  if (!apply) { console.log('Dry run only. Add --apply to create the collection.'); process.exit(0); }
  const created = await pb.collections.create(schema);
  mkdirSync('.data', { recursive: true });
  writeFileSync('.data/announcements-schema.json', JSON.stringify(created, null, 2));
  const verified = await pb.collections.getOne('announcements');
  if (verified.createRule !== schema.createRule || verified.updateRule !== schema.updateRule) throw new Error('Collection rule verification failed.');
  console.log('Created and verified announcements collection. Existing collections were not modified.');
}
if (apply && seed) {
  const version = 'kmitl-flood-relief-2026-09-26';
  const prior = await pb.collection('announcements').getList(1, 1, { filter: pb.filter('revision = {:version}', { version }) });
  if (!prior.items.length) {
    await pb.collection('announcements').create({
      title: 'ความช่วยเหลือสำหรับนักศึกษาที่ได้รับผลกระทบจากน้ำท่วม',
      body: 'KMITL แจ้งช่องทางขอความช่วยเหลือสำหรับนักศึกษาที่ไม่สามารถพักอาศัยในที่พักเดิมได้จากเหตุฝนตกหนักและน้ำท่วม\n\nแจ้งสถานการณ์ผ่านเว็บไซต์ SOS KMITL และระบุข้อความ\n“น้ำท่วมต้องการที่พักฉุกเฉิน”',
      priority: 'emergency', status: 'published', targets: ['all'], revision: version,
      link_label: 'ไปที่ SOS KMITL', link_url: 'https://sos.kmitl.ac.th/', source_url: 'https://www.facebook.com/share/p/14psjugaVdE/'
    });
    console.log('Moved the existing flood announcement into the central collection.');
  } else console.log('The existing flood announcement is already in the central collection.');
}
