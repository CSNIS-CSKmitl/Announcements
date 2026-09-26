import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE } from '$lib/server/session';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = ({ locals, cookies }) => { locals.pb.authStore.clear(); cookies.delete(AUTH_COOKIE, { path: '/' }); redirect(303, '/login'); };
