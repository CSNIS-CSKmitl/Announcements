/**
 * @typedef {'today' | '7d' | 'month' | 'year' | 'all'} TimeRange
 * @typedef {'all' | 'active' | 'scheduled' | 'draft' | 'expired' | 'inactive' | 'urgent'} DrilldownFilter
 *
 * @typedef {Object} StatAnnouncement
 * @property {string} id
 * @property {string} [title]
 * @property {string} [body]
 * @property {'info' | 'important' | 'emergency' | string} [priority]
 * @property {'draft' | 'published' | 'archived' | string} [status]
 * @property {string[]} [targets]
 * @property {string} [start_at]
 * @property {string} [end_at]
 * @property {string} [created]
 * @property {string} [updated]
 *
 * @typedef {Object} AnnouncementReadRecord
 * @property {string} [id]
 * @property {string} announcement
 * @property {string} [revision]
 * @property {string} [site]
 * @property {string} [user]
 * @property {string} [viewer_hash]
 * @property {string} [created]
 */

export const KNOWN_SITES = [
  { id: 'initd', name: 'init.d' },
  { id: 'printer', name: 'Printer-server' },
  { id: 'booking', name: 'Booking' },
  { id: 'borrowly', name: 'Borrowly' },
  { id: 'csnis', name: 'CSNIS Portal' },
  { id: 'android', name: 'Android app' }
];

/** @type {Array<{ id: TimeRange; label: string }>} */
export const TIME_RANGES = [
  { id: 'today', label: 'วันนี้' },
  { id: '7d', label: '7 วัน' },
  { id: 'month', label: 'เดือนนี้' },
  { id: 'year', label: 'ปีนี้' },
  { id: 'all', label: 'ทั้งหมด' }
];

/**
 * Safely parse a date string or number into a millisecond timestamp.
 * Handles PocketBase format ("YYYY-MM-DD HH:mm:ss.SSSZ") and ISO 8601.
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseSafeTimestamp(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)
    ? trimmed.replace(' ', 'T')
    : trimmed;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Compute start timestamp for a given time range relative to `now`.
 * @param {TimeRange | string} range
 * @param {number} [now]
 * @returns {number | null}
 */
export function getRangeStartTimestamp(range, now = Date.now()) {
  const safeNow = Number.isFinite(now) ? now : Date.now();
  const d = new Date(safeNow);
  switch (range) {
    case 'today':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
    case '7d':
      return safeNow - 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0);
    case 'year':
      return Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    case 'all':
    default:
      return null;
  }
}

/**
 * Check if a date string/timestamp falls within the requested time range.
 * @param {unknown} dateValue
 * @param {TimeRange | string} range
 * @param {number} [now]
 * @returns {boolean}
 */
export function isWithinRange(dateValue, range, now = Date.now()) {
  if (!range || range === 'all') return true;
  const ts = parseSafeTimestamp(dateValue);
  if (ts === null) return false;
  const start = getRangeStartTimestamp(range, now);
  if (start === null) return true;
  const safeNow = Number.isFinite(now) ? now : Date.now();
  return ts >= start && ts <= safeNow + 365 * 24 * 60 * 60 * 1000;
}

/**
 * Compute the Thai display state of an announcement safely (handles invalid start_at/end_at).
 * @param {StatAnnouncement} item
 * @param {number} [now]
 * @returns {'ฉบับร่าง' | 'ปิดประกาศ' | 'หมดอายุ' | 'รอกำหนดเวลา' | 'กำลังแสดง'}
 */
export function getAnnouncementState(item, now = Date.now()) {
  if (!item || typeof item !== 'object') return 'ฉบับร่าง';
  if (item.status === 'draft') return 'ฉบับร่าง';
  if (item.status === 'archived') return 'ปิดประกาศ';
  const endTs = parseSafeTimestamp(item.end_at);
  if (endTs !== null && endTs <= now) return 'หมดอายุ';
  const startTs = parseSafeTimestamp(item.start_at);
  if (startTs !== null && startTs > now) return 'รอกำหนดเวลา';
  return 'กำลังแสดง';
}

/**
 * Check if an announcement matches a drill-down filter key or Thai state label.
 * @param {StatAnnouncement} item
 * @param {DrilldownFilter | string} filter
 * @param {number} [now]
 * @returns {boolean}
 */
export function matchesDrilldown(item, filter, now = Date.now()) {
  if (!filter || filter === 'all') return true;
  if (!item || typeof item !== 'object') return false;
  const state = getAnnouncementState(item, now);
  switch (filter) {
    case 'active':
    case 'กำลังแสดง':
      return state === 'กำลังแสดง';
    case 'scheduled':
    case 'รอกำหนดเวลา':
      return state === 'รอกำหนดเวลา';
    case 'draft':
    case 'ฉบับร่าง':
      return state === 'ฉบับร่าง';
    case 'expired':
    case 'หมดอายุ':
      return state === 'หมดอายุ';
    case 'inactive':
    case 'archived':
    case 'ปิดประกาศ':
      return state === 'ปิดประกาศ';
    case 'urgent':
    case 'ประกาศฉุกเฉิน':
      return item.priority === 'emergency';
    default:
      return state === filter;
  }
}

/**
 * Filter announcements by time range and optional drilldown/search.
 * @param {StatAnnouncement[]} items
 * @param {{ range?: TimeRange | string; drilldown?: DrilldownFilter | string; search?: string; now?: number }} [options]
 * @returns {StatAnnouncement[]}
 */
export function filterAnnouncements(items, options = {}) {
  if (!Array.isArray(items)) return [];
  const { range = 'all', drilldown = 'all', search = '', now = Date.now() } = options;
  const q = typeof search === 'string' ? search.trim().toLowerCase() : '';
  return items.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const dateVal = item.created || item.updated || item.start_at || '';
    if (range !== 'all' && !isWithinRange(dateVal, range, now)) return false;
    if (!matchesDrilldown(item, drilldown, now)) return false;
    if (q) {
      const hay = `${item.title || ''} ${item.body || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Build trend buckets for announcements and reads over the given time range.
 * @param {StatAnnouncement[]} items
 * @param {AnnouncementReadRecord[]} reads
 * @param {TimeRange | string} range
 * @param {number} [now]
 * @returns {Array<{ key: string; label: string; announcements: number; reads: number }>}
 */
export function buildAnnouncementTrend(items, reads, range = 'all', now = Date.now()) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeReads = Array.isArray(reads) ? reads : [];
  const safeNow = Number.isFinite(now) ? now : Date.now();
  const baseDate = new Date(safeNow);

  /** @type {Array<{ key: string; label: string; start: number; end: number; announcements: number; reads: number }>} */
  const buckets = [];

  if (range === 'today' || range === '7d') {
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate() - i));
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const key = d.toISOString().slice(0, 10);
      const label = `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
      buckets.push({ key, label, start, end, announcements: 0, reads: 0 });
    }
  } else if (range === 'month') {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const step = 5;
    for (let day = 1; day <= daysInMonth; day += step) {
      const endDay = Math.min(day + step - 1, daysInMonth);
      const start = Date.UTC(year, month, day, 0, 0, 0);
      const end = Date.UTC(year, month, endDay + 1, 0, 0, 0);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const label = `${day}-${endDay}/${month + 1}`;
      buckets.push({ key, label, start, end, announcements: 0, reads: 0 });
    }
  } else {
    // 'year' or 'all': last 6 months
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() - i, 1));
      const start = d.getTime();
      const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = monthNames[d.getUTCMonth()];
      buckets.push({ key, label, start, end, announcements: 0, reads: 0 });
    }
  }

  for (const item of safeItems) {
    if (!item || typeof item !== 'object') continue;
    const ts = parseSafeTimestamp(item.created || item.updated || item.start_at);
    if (ts === null) continue;
    for (const b of buckets) {
      if (ts >= b.start && ts < b.end) {
        b.announcements += 1;
        break;
      }
    }
  }

  for (const r of safeReads) {
    if (!r || typeof r !== 'object') continue;
    const ts = parseSafeTimestamp(r.created);
    if (ts === null) continue;
    for (const b of buckets) {
      if (ts >= b.start && ts < b.end) {
        b.reads += 1;
        break;
      }
    }
  }

  return buckets.map(({ key, label, announcements, reads: rCount }) => ({
    key,
    label,
    announcements,
    reads: rCount
  }));
}

/**
 * Calculate comprehensive statistics for Announcements.
 * @param {StatAnnouncement[]} items
 * @param {AnnouncementReadRecord[]} [reads]
 * @param {{ range?: TimeRange | string; now?: number }} [options]
 */
export function calculateAnnouncementStats(items, reads = [], options = {}) {
  const safeItems = Array.isArray(items) ? items.filter((x) => x && typeof x === 'object') : [];
  const safeReads = Array.isArray(reads) ? reads.filter((x) => x && typeof x === 'object') : [];
  const range = options.range || 'all';
  const now = Number.isFinite(options.now) ? /** @type {number} */ (options.now) : Date.now();

  const filteredItems = filterAnnouncements(safeItems, { range, now });
  const itemIds = new Set(filteredItems.map((i) => i.id).filter(Boolean));

  const filteredReads = safeReads.filter((r) => {
    if (!r.announcement) return false;
    if (range !== 'all') {
      if (r.created && !isWithinRange(r.created, range, now)) return false;
      if (!r.created && !itemIds.has(r.announcement)) return false;
    }
    return true;
  });

  let active = 0;
  let scheduled = 0;
  let draft = 0;
  let expired = 0;
  let inactive = 0;
  let urgent = 0;
  let important = 0;
  let publishedCount = 0;

  /** @type {Set<string>} */
  const coveredSites = new Set();
  /** @type {Record<string, number>} */
  const bySite = Object.fromEntries(KNOWN_SITES.map((site) => [site.id, 0]));

  for (const item of filteredItems) {
    const state = getAnnouncementState(item, now);
    if (state === 'กำลังแสดง') active += 1;
    else if (state === 'รอกำหนดเวลา') scheduled += 1;
    else if (state === 'ฉบับร่าง') draft += 1;
    else if (state === 'หมดอายุ') expired += 1;
    else if (state === 'ปิดประกาศ') inactive += 1;

    if (item.priority === 'emergency') urgent += 1;
    else if (item.priority === 'important') important += 1;

    if (item.status === 'published') {
      publishedCount += 1;
    }

    const targets = Array.isArray(item.targets) ? item.targets : [];
    if (targets.includes('all')) {
      for (const s of KNOWN_SITES) {
        coveredSites.add(s.id);
        bySite[s.id] = (bySite[s.id] || 0) + 1;
      }
    } else {
      for (const t of targets) {
        if (KNOWN_SITES.some((s) => s.id === t)) {
          coveredSites.add(t);
          bySite[t] = (bySite[t] || 0) + 1;
        }
      }
    }
  }

  const totalReads = filteredReads.length;
  const uniqueViewerSet = new Set(
    filteredReads.map((r) => r.viewer_hash || r.user || r.id).filter(Boolean)
  );
  const uniqueReaders = uniqueViewerSet.size;

  const readAnnouncementIds = new Set(
    filteredReads
      .map((r) => r.announcement)
      .filter((id) => itemIds.has(id))
  );

  const denominator = publishedCount > 0 ? publishedCount : filteredItems.length;
  const avgReadsPerAnnouncement =
    denominator > 0 ? Math.round((totalReads / denominator) * 10) / 10 : 0;
  const readRatePercent =
    denominator > 0
      ? Math.min(100, Math.round((readAnnouncementIds.size / denominator) * 1000) / 10)
      : 0;

  const trend = buildAnnouncementTrend(filteredItems, filteredReads, range, now);

  return {
    total: filteredItems.length,
    active,
    scheduled,
    draft,
    expired,
    inactive,
    urgent,
    important,
    urgentAndImportant: urgent + important,
    publishedCount,
    targetSitesCount: coveredSites.size,
    totalKnownSites: KNOWN_SITES.length,
    bySite,
    totalReads,
    uniqueReaders,
    readAnnouncementsCount: readAnnouncementIds.size,
    avgReadsPerAnnouncement,
    readRatePercent,
    trend
  };
}
