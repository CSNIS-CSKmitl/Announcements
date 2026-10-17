import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

let admin: PocketBase | null = null;
let authenticatedAt = 0;
const AUTH_TTL_MS = 5 * 60 * 1000;

export function sourceIp(event: RequestEvent): string {
  if (env.TRUST_PROXY === 'true') {
    const realIp = event.request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
    const forwardedIp = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwardedIp) return forwardedIp;
  }
  try {
    return event.getClientAddress();
  } catch {
    return '127.0.0.1';
  }
}

export async function getAdmin(): Promise<PocketBase | null> {
  const url = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
  if (!env.PB_ADMIN_EMAIL || !env.PB_ADMIN_PASSWORD) return null;
  if (admin?.authStore.isValid && Date.now() - authenticatedAt < AUTH_TTL_MS) return admin;
  const client = new PocketBase(url);
  client.autoCancellation(false);
  try {
    try {
      await client.collection('_superusers').authWithPassword(env.PB_ADMIN_EMAIL, env.PB_ADMIN_PASSWORD);
    } catch {
      await client.admins.authWithPassword(env.PB_ADMIN_EMAIL, env.PB_ADMIN_PASSWORD);
    }
    admin = client;
    authenticatedAt = Date.now();
    return client;
  } catch (error) {
    console.warn('[audit] PocketBase admin auth failed:', error instanceof Error ? error.message : error);
    admin = null;
    return null;
  }
}

export async function writeServiceAudit(event: RequestEvent, input: { userId?: string | null; action: string; statusCode?: number; metadata?: Record<string, unknown> }) {
  const pb = await getAdmin();
  if (!pb) return;
  try {
    await pb.collection('service_access_logs').create({
      service: 'announcements', user: input.userId || undefined,
      source_ip: sourceIp(event), method: event.request.method,
      path: event.url.pathname, action: input.action, status_code: input.statusCode,
      user_agent: event.request.headers.get('user-agent') || undefined,
      request_id: event.request.headers.get('x-request-id') || undefined,
      metadata: input.metadata || {}
    });
  } catch (error) {
    console.warn('[audit] Unable to store announcements access log:', error instanceof Error ? error.message : error);
  }
}
