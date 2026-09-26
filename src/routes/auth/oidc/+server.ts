import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, cookies, url }) => {
  let provider;
  try { provider = (await locals.pb.collection('users').listAuthMethods()).oauth2?.providers.find(item => item.name === 'oidc'); } catch { error(503, 'เชื่อมต่อระบบเข้าสู่ระบบไม่ได้'); }
  if (!provider) error(503, 'ยังไม่ได้ตั้งค่า OIDC ใน PocketBase');
  const redirectUrl = `${url.origin}/auth/callback`;
  cookies.set('announcements_oauth', JSON.stringify({ provider: provider.name, state: provider.state, verifier: provider.codeVerifier, redirectUrl }), { path: '/auth', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', maxAge: 600 });
  redirect(303, provider.authURL + encodeURIComponent(redirectUrl));
};
