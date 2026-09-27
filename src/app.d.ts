import type PocketBase from 'pocketbase';
import type { AdminUser } from '$lib/types';
declare global { namespace App { interface Locals { pb: PocketBase; user: AdminUser | null; } } }
export { };
