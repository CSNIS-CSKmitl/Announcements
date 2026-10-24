export interface AdminUser { id: string; email: string; name: string; isAdmin: boolean; }
export interface Announcement {
  id: string; title: string; body: string; priority: 'info' | 'important' | 'emergency';
  status: 'draft' | 'published' | 'archived'; targets: string[];
  start_at: string; end_at: string; link_label: string; link_url: string; source_url: string;
  revision: string; created: string; updated: string;
  created_by?: string; updated_by?: string; approved_by?: string; approved_at?: string;
  expand?: { created_by?: AdminUser; updated_by?: AdminUser; approved_by?: AdminUser };
}
export interface AnnouncementRead {
  id: string;
  announcement: string;
  revision: string;
  site: string;
  user?: string;
  viewer_hash: string;
  created: string;
}
export const sites = [
  { id: 'initd', name: 'init.d' },
  { id: 'printer', name: 'Printer-server' },
  { id: 'booking', name: 'Booking' },
  { id: 'borrowly', name: 'Borrowly' },
  { id: 'csnis', name: 'CSNIS Portal' },
  { id: 'android', name: 'Android app' }
] as const;
export const priorityLabels = { info: 'ทั่วไป', important: 'สำคัญ', emergency: 'ฉุกเฉิน' } as const;
export function displayState(item: Announcement, now = Date.now()) {
  if (item.status === 'draft') return 'ฉบับร่าง';
  if (item.status === 'archived') return 'ปิดประกาศ';
  if (item.end_at && Date.parse(item.end_at) <= now) return 'หมดอายุ';
  if (item.start_at && Date.parse(item.start_at) > now) return 'รอกำหนดเวลา';
  return 'กำลังแสดง';
}
export function targetLabel(targets: string[]) {
  return targets.includes('all') ? 'ทุกเว็บและ Android' : sites.filter(site => targets.includes(site.id)).map(site => site.name).join(', ');
}
