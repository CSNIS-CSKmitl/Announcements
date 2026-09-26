import { error, redirect } from '@sveltejs/kit';
import { resolveUser, persistSession } from '$lib/server/session';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async event => {
  const raw = event.cookies.get('announcements_oauth');
  event.cookies.delete('announcements_oauth', { path: '/auth' });
  let flow: { provider: string; state: string; verifier: string; redirectUrl: string };
  try { flow = JSON.parse(raw || ''); } catch { error(400, 'กรุณาเริ่มเข้าสู่ระบบใหม่'); }
  const code = event.url.searchParams.get('code'), state = event.url.searchParams.get('state');
  if (!code || !state || state !== flow.state || flow.redirectUrl !== `${event.url.origin}/auth/callback`) error(400, 'ข้อมูลยืนยันการเข้าสู่ระบบไม่ถูกต้อง');
  try { await event.locals.pb.collection('users').authWithOAuth2Code(flow.provider, code, flow.verifier, flow.redirectUrl); }
  catch { error(401, 'เข้าสู่ระบบผ่าน SSO ไม่สำเร็จ'); }
  const user = await resolveUser(event.locals.pb).catch(() => null);
  if (!user?.isAdmin) { event.locals.pb.authStore.clear(); error(403, 'บัญชีนี้ไม่มีสิทธิ์จัดการประกาศ'); }
  persistSession(event);
  redirect(303, '/');
};
