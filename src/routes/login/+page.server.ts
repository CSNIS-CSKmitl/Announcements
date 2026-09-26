import { fail, redirect } from '@sveltejs/kit';
import { resolveUser, persistSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.isAdmin) redirect(303, '/');
  let oidc = false;
  try { const methods = await locals.pb.collection('users').listAuthMethods(); oidc = !!methods.oauth2?.providers.some(provider => provider.name === 'oidc'); } catch { /* Password sign-in still available. */ }
  return { oidc };
};
export const actions: Actions = {
  default: async event => {
    const form = await event.request.formData();
    const identity = String(form.get('identity') || '').trim(), password = String(form.get('password') || '');
    if (!identity || !password) return fail(400, { error: 'กรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน', identity });
    try {
      await event.locals.pb.collection('users').authWithPassword(identity, password);
      const user = await resolveUser(event.locals.pb);
      if (!user?.isAdmin) { event.locals.pb.authStore.clear(); return fail(403, { error: 'บัญชีนี้ไม่มีสิทธิ์จัดการประกาศ', identity }); }
      persistSession(event);
    } catch { return fail(401, { error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบบัญชีและการเชื่อมต่อ', identity }); }
    redirect(303, '/');
  }
};
