import PocketBase from 'pocketbase';

const apply = process.argv.includes('--apply');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
if (!process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) throw new Error('Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD.');
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
const announcements = await pb.collections.getOne('announcements');
const users = await pb.collections.getOne('users');
const schema = {
  name: 'announcement_reads', type: 'base', listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""', createRule: null, updateRule: null, deleteRule: null,
  fields: [
    { type: 'relation', name: 'announcement', required: true, collectionId: announcements.id, maxSelect: 1, cascadeDelete: true },
    { type: 'text', name: 'revision', required: true, max: 100 },
    { type: 'select', name: 'site', required: true, maxSelect: 1, values: ['initd', 'printer', 'booking', 'borrowly', 'android', 'csnis'] },
    { type: 'relation', name: 'user', collectionId: users.id, maxSelect: 1 },
    { type: 'text', name: 'viewer_hash', required: true, max: 128 },
    { type: 'autodate', name: 'created', onCreate: true, onUpdate: false }
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_announcement_reads_unique ON announcement_reads (announcement, revision, site, viewer_hash)',
    'CREATE INDEX idx_announcement_reads_created ON announcement_reads (created)'
  ]
};
try {
  const existing = await pb.collections.getOne(schema.name);
  const requiredFields = [
    ['announcement', 'relation'],
    ['revision', 'text'],
    ['site', 'select'],
    ['user', 'relation'],
    ['viewer_hash', 'text'],
  ];
  const fieldsMatch = requiredFields.every(([name, type]) =>
    existing.fields.some((f) => f.name === name && f.type === type)
  );
  const indexesMatch = (existing.indexes || []).length >= 2;
  if (fieldsMatch && indexesMatch) {
    console.log('announcement_reads already exists and schema is complete.');
    process.exit(0);
  }
  console.log('announcement_reads exists but has incomplete/mismatched fields or indexes.');
  if (!apply) {
    console.log('Dry run only. Add --apply to repair the collection.');
    process.exit(0);
  }
  const records = await pb.collection(schema.name).getList(1, 1);
  if (records.totalItems === 0) {
    await pb.collections.delete(existing.id);
    await pb.collections.create(schema);
    console.log('Recreated empty announcement_reads collection with full schema and indexes.');
  } else {
    await pb.collections.update(existing.id, schema);
    console.log('Updated announcement_reads collection with full schema and indexes.');
  }
} catch (cause) {
  if (cause.status !== 404) throw cause;
  console.log('Create private announcement_reads collection for read-rate statistics.');
  if (!apply) {
    console.log('Dry run only. Add --apply to create the collection.');
    process.exit(0);
  }
  await pb.collections.create(schema);
  console.log('Created announcement_reads. Writes must go through a trusted server endpoint.');
}
