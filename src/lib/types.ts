export interface AdminUser { id: string; email: string; name: string; isAdmin: boolean; }
export interface Announcement {
  id: string; title: string; body: string; priority: 'info' | 'important' | 'emergency';
  status: 'draft' | 'published' | 'archived'; targets: string[];
  start_at: string; end_at: string; link_label: string; link_url: string; source_url: string;
  revision: string; created: string; updated: string;
}
export const sites = [{ id: 'initd', name: 'init.d' }, { id: 'printer', name: 'Printer-server' }] as const;
export const priorityLabels = { info: 'ทั่วไป', important: 'สำคัญ', emergency: 'ฉุกเฉิน' } as const;
export function displayState(item: Announcement, now = Date.now()) {
  if (item.status === 'draft') return 'ฉบับร่าง';
  if (item.status === 'archived') return 'ปิดประกาศ';
  if (item.end_at && Date.parse(item.end_at) <= now) return 'หมดอายุ';
  if (item.start_at && Date.parse(item.start_at) > now) return 'รอกำหนดเวลา';
  return 'กำลังแสดง';
}
export function targetLabel(targets: string[]) {
  return targets.includes('all') ? 'ทุกเว็บ' : sites.filter(site => targets.includes(site.id)).map(site => site.name).join(', ');
}
