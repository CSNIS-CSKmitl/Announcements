import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { isAdminType } from '$lib/validation.mjs';
export const AUTH_COOKIE = 'announcements_auth';
export function createPb(event: RequestEvent) {
  const pb = new PocketBase(env.POCKETBASE_URL || 'http://127.0.0.1:8090');
  pb.autoCancellation(false);
  try { pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '', AUTH_COOKIE); } catch { pb.authStore.clear(); }
  return pb;
}
export function persistSession(event: RequestEvent) {
  event.cookies.set(AUTH_COOKIE, JSON.stringify({ token: event.locals.pb.authStore.token, record: event.locals.pb.authStore.record }), {
    path: '/', httpOnly: true, secure: event.url.protocol === 'https:', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
  });
}
export async function resolveUser(pb: PocketBase) {
  if (!pb.authStore.isValid) return null;
  await pb.collection('users').authRefresh();
  const id = pb.authStore.record?.id;
  if (!id) return null;
  const user = await pb.collection('users').getOne(id, { expand: 'user_type' });
  return { id, email: String(user.email || user.username || ''), name: String(user.name || user.username || user.email || 'ผู้ดูแล'), isAdmin: isAdminType(user.expand?.user_type?.type) };
}
