import { createPb, resolveUser, persistSession, AUTH_COOKIE } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.pb = createPb(event);
  event.locals.user = null;
  if (event.locals.pb.authStore.isValid) {
    try { event.locals.user = await resolveUser(event.locals.pb); persistSession(event); }
    catch { event.locals.pb.authStore.clear(); event.cookies.delete(AUTH_COOKIE, { path: '/' }); }
  }
  const response = await resolve(event);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
};
