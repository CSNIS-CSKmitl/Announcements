export interface AdminUser {
	id: string;
	email: string;
	name: string;
	username?: string;
	role?: 'admin' | 'user';
	roles?: string[];
	isAdmin: boolean;
}
