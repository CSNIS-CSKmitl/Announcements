import type { UserRole } from "./role";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  role?: UserRole;
  roles?: string[];
  isAdmin: boolean;
}
