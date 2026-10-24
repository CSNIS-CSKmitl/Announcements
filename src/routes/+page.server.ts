import { error, fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { validateAnnouncement } from '$lib/validation.mjs';
import { getAdmin, writeAnnouncementAudit } from '$lib/server/audit-log';
import type { Announcement, AnnouncementRead } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';
function requireAdmin(user: App.Locals['user']) {
  if (!user) redirect(303, '/login');
  if (!user.isAdmin) error(403, 'บัญชีนี้ไม่มีสิทธิ์จัดการประกาศ');
}
export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals.user);
  const loadedAt = new Date().toISOString();
  let items: Announcement[] = [];
  try {
    items = await locals.pb.collection('announcements').getFullList<Announcement>({ sort: '-updated', expand: 'created_by,updated_by,approved_by' });
  } catch (cause) {
    const status = (cause as { status?: number }).status;
    return {
      items: [] as Announcement[],
      reads: [] as AnnouncementRead[],
      readsConfigured: false,
      loadedAt,
      setupRequired: status === 404,
      loadError: status === 404 ? '' : 'โหลดประกาศไม่ได้ กรุณาตรวจสอบการเชื่อมต่อและสิทธิ์ของ collection announcements'
    };
  }

  let reads: AnnouncementRead[] = [];
  let readsConfigured = false;
  try {
    const readClient = (await getAdmin()) ?? locals.pb;
    reads = await readClient.collection('announcement_reads').getFullList<AnnouncementRead>({
      sort: '-created',
      fields: 'id,announcement,revision,site,user,viewer_hash,created'
    });
    readsConfigured = true;
  } catch {
    // Gracefully handle missing announcement_reads collection or restricted access
    reads = [];
    readsConfigured = false;
  }

  let auditLogs = [] as Array<Record<string, unknown>>;
  try {
    const auditClient = (await getAdmin()) ?? locals.pb;
    auditLogs = await auditClient.collection('audit_logs').getFullList({ sort: '-created', filter: 'service = "announcements"', expand: 'actor', fields: 'id,action,record_id,actor,created,expand.actor.email,expand.actor.name' });
  } catch { /* collection can be installed during rollout */ }
  return { items, reads, readsConfigured, auditLogs, loadedAt, setupRequired: false, loadError: '' };
};
export const actions: Actions = {
  save: async ({ request, locals }) => {
    requireAdmin(locals.user);
    const form = await request.formData();
    const id = String(form.get('id') || ''), revision = String(form.get('revision') || '');
    const values = Object.fromEntries(['title', 'body', 'priority', 'start_at', 'end_at', 'link_label', 'link_url', 'source_url'].map(key => [key, String(form.get(key) || '')]));
    const intent = String(form.get('intent') || 'draft');
    const raw = { ...values, status: intent, targets: form.getAll('targets').map(String) };
    const result = validateAnnouncement(raw);
    if (Object.keys(result.errors).length) return fail(400, { ok: false, id, values: raw, errors: result.errors, message: 'กรุณาตรวจสอบข้อมูลประกาศ' });
    if (id && !/^[a-z0-9]{15}$/.test(id)) return fail(400, { ok: false, id, values: raw, errors: {}, message: 'รหัสประกาศไม่ถูกต้อง' });
    try {
      if (id) {
        const current = await locals.pb.collection('announcements').getOne<Announcement>(id);
        if (!revision || current.revision !== revision) return fail(409, { ok: false, id, values: raw, errors: {}, message: 'ประกาศนี้ถูกแก้ไขแล้ว กรุณาปิดหน้าต่างและเปิดแก้ไขใหม่' });
        const next = { ...result.data, revision: randomUUID(), updated_by: locals.user!.id };
        await locals.pb.collection('announcements').update(id, next);
        await writeAnnouncementAudit({ actorId: locals.user!.id, action: result.data.status === 'published' && current.status !== 'published' ? 'publish' : 'update', recordId: id, before: current, after: { ...current, ...next } });
      } else {
        const created = await locals.pb.collection('announcements').create<Announcement>({ ...result.data, revision: randomUUID(), created_by: locals.user!.id, updated_by: locals.user!.id });
        await writeAnnouncementAudit({ actorId: locals.user!.id, action: result.data.status === 'published' ? 'publish' : 'create', recordId: created.id, after: created });
      }
    } catch { return fail(502, { ok: false, id, values: raw, errors: {}, message: 'บันทึกประกาศไม่ได้ กรุณาตรวจสอบการเชื่อมต่อและสิทธิ์' }); }
    return { ok: true, message: intent === 'published' ? 'เผยแพร่ประกาศแล้ว เว็บปลายทางจะตรวจพบในการโหลดหน้าหรือรอบตรวจถัดไป' : 'บันทึกประกาศแล้ว' };
  },
  archive: async ({ request, locals }) => {
    requireAdmin(locals.user);
    const form = await request.formData();
    const id = String(form.get('id') || ''), revision = String(form.get('revision') || '');
    if (!/^[a-z0-9]{15}$/.test(id)) return fail(400, { ok: false, message: 'รหัสประกาศไม่ถูกต้อง' });
    try {
      const item = await locals.pb.collection('announcements').getOne<Announcement>(id);
      if (!revision || item.revision !== revision) return fail(409, { ok: false, message: 'ประกาศถูกแก้ไขแล้ว กรุณาโหลดหน้าใหม่' });
      const next = { status: 'archived', revision: randomUUID(), updated_by: locals.user!.id };
      await locals.pb.collection('announcements').update(id, next);
      await writeAnnouncementAudit({ actorId: locals.user!.id, action: 'archive', recordId: id, before: item, after: { ...item, ...next } });
    } catch { return fail(502, { ok: false, message: 'ปิดประกาศไม่ได้ กรุณาลองอีกครั้ง' }); }
    return { ok: true, message: 'ปิดประกาศแล้ว เว็บปลายทางจะหยุดแสดงในรอบตรวจถัดไป' };
  }
};
