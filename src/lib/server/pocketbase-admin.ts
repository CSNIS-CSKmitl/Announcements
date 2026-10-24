import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { resolveClientIp } from './client-ip.mjs';

let admin: PocketBase | null = null;
let authenticatedAt = 0;
const AUTH_TTL_MS = 5 * 60 * 1000;

export function sourceIp(event: RequestEvent): string {
	let remoteAddress = '';
	try { remoteAddress = event.getClientAddress(); } catch { /* unavailable in some adapters */ }
	return resolveClientIp({
		headers: Object.fromEntries(event.request.headers.entries()),
		remoteAddress,
		trustProxy: env.TRUST_PROXY === 'true'
	});
}

export async function getAdmin(): Promise<PocketBase | null> {
	const url = env.POCKETBASE_URL || 'http://192.168.15.14:8080';
	const email = env.PB_ADMIN_EMAIL || 'log@cskmitl.com';
	const password = env.PB_ADMIN_PASSWORD || 'log@cskmitl.com';
	if (!email || !password) return null;
	if (admin?.authStore.isValid && Date.now() - authenticatedAt < AUTH_TTL_MS) return admin;
	const client = new PocketBase(url);
	client.autoCancellation(false);
	try {
		try { await client.collection('_superusers').authWithPassword(email, password); }
		catch { await client.admins.authWithPassword(email, password); }
		admin = client;
		authenticatedAt = Date.now();
		return client;
	} catch (error) {
		console.warn('PocketBase admin auth failed:', error instanceof Error ? error.message : error);
		admin = null;
		return null;
	}
}
