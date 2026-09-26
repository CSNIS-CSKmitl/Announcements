export const priorities = ['info', 'important', 'emergency'];
export const statuses = ['draft', 'published', 'archived'];
export const targets = ['all', 'initd', 'printer'];
/** @param {unknown} value */
export function isAdminType(value) { return typeof value === 'string' && ['admin', 'superadmin'].includes(value.trim().toLowerCase()); }
/** @param {unknown} value */
export function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const url = new URL(value.trim()); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
/** @param {unknown} value */
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
/** @param {unknown} value */
function date(value) {
  if (!value) return '';
  if (typeof value !== 'string') return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!parts) return null;
  const [, year, month, day, hour, minute, second] = parts;
  if (+month < 1 || +month > 12 || +day < 1 || +day > new Date(Date.UTC(+year, +month, 0)).getUTCDate() || +hour > 23 || +minute > 59 || +(second || 0) > 59) return null;
  const timestamp = Date.parse(parts[7] ? value : value + '+07:00');
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().replace('T', ' ') : null;
}
/** @param {Record<string, unknown>} raw */
export function validateAnnouncement(raw) {
  /** @type {Record<string, string>} */
  const errors = {};
  const title = text(raw.title), body = text(raw.body);
  if (!title || title.length > 180) errors.title = 'กรอกหัวข้อไม่เกิน 180 ตัวอักษร';
  if (!body || body.length > 6000) errors.body = 'กรอกข้อความไม่เกิน 6,000 ตัวอักษร';
  const priority = text(raw.priority), status = text(raw.status);
  if (!priorities.includes(priority)) errors.priority = 'เลือกระดับความสำคัญ';
  if (!statuses.includes(status)) errors.status = 'สถานะประกาศไม่ถูกต้อง';
  const chosen = Array.isArray(raw.targets) ? [...new Set(raw.targets.filter(item => typeof item === 'string'))] : [];
  if (!chosen.length || chosen.some(item => !targets.includes(item))) errors.targets = 'เลือกเว็บปลายทางอย่างน้อยหนึ่งเว็บ';
  const start_at = date(raw.start_at), end_at = date(raw.end_at);
  if (start_at === null) errors.start_at = 'วันเริ่มแสดงไม่ถูกต้อง';
  if (end_at === null) errors.end_at = 'วันหมดอายุไม่ถูกต้อง';
  if (start_at && end_at && Date.parse(end_at) <= Date.parse(start_at)) errors.end_at = 'วันหมดอายุต้องอยู่หลังวันเริ่มแสดง';
  const link_url = safeUrl(raw.link_url), source_url = safeUrl(raw.source_url), link_label = text(raw.link_label);
  if (link_url === null) errors.link_url = 'ใช้ลิงก์ http หรือ https ที่ไม่มีชื่อผู้ใช้และรหัสผ่าน';
  if (source_url === null) errors.source_url = 'ใช้ลิงก์ http หรือ https ที่ไม่มีชื่อผู้ใช้และรหัสผ่าน';
  if (link_label.length > 80 || (link_url && !link_label)) errors.link_label = 'กรอกชื่อปุ่มลิงก์ไม่เกิน 80 ตัวอักษร';
  return { errors, data: { title, body, priority, status, targets: chosen.includes('all') ? ['all'] : chosen, start_at: start_at ?? '', end_at: end_at ?? '', link_url: link_url ?? '', source_url: source_url ?? '', link_label } };
}
