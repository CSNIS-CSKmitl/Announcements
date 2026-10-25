import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnnouncementStats,
  filterAnnouncements,
  isWithinRange,
  matchesDrilldown,
  parseSafeTimestamp,
  KNOWN_SITES
} from '../src/lib/stats.mjs';

const NOW = Date.parse('2026-10-17T12:00:00.000Z');

const sampleAnnouncements = [
  {
    id: 'ann_active_0001',
    title: 'แจ้งปิดปรับปรุงระบบเครือข่าย',
    body: 'จะปิดปรับปรุงเวลา 22:00',
    priority: 'emergency',
    status: 'published',
    targets: ['all'],
    start_at: '2026-10-17 01:00:00.000Z',
    end_at: '2026-10-18 01:00:00.000Z',
    created: '2026-10-17 00:30:00.000Z',
    updated: '2026-10-17 00:30:00.000Z'
  },
  {
    id: 'ann_sched_00002',
    title: 'กำหนดการสอบปลายภาค',
    body: 'รายละเอียดตารางสอบ',
    priority: 'important',
    status: 'published',
    targets: ['initd', 'printer'],
    start_at: '2026-10-20 01:00:00.000Z',
    end_at: '2026-10-25 01:00:00.000Z',
    created: '2026-10-15 08:00:00.000Z',
    updated: '2026-10-15 08:00:00.000Z'
  },
  {
    id: 'ann_draft_00003',
    title: 'ร่างประกาศทุนการศึกษา',
    body: 'รอตรวจสอบรายละเอียด',
    priority: 'info',
    status: 'draft',
    targets: ['initd'],
    start_at: '',
    end_at: '',
    created: '2026-10-02 10:00:00.000Z',
    updated: '2026-10-02 10:00:00.000Z'
  },
  {
    id: 'ann_expir_00004',
    title: 'ประกาศที่หมดอายุแล้ว',
    body: 'สิ้นสุดกิจกรรม',
    priority: 'info',
    status: 'published',
    targets: ['printer'],
    start_at: '2026-05-01 00:00:00.000Z',
    end_at: '2026-05-10 00:00:00.000Z',
    created: '2026-05-01 00:00:00.000Z',
    updated: '2026-05-01 00:00:00.000Z'
  },
  {
    id: 'ann_archv_00005',
    title: 'ประกาศเก่าที่ปิดแล้ว',
    body: 'เก็บเข้าคลัง',
    priority: 'emergency',
    status: 'archived',
    targets: ['android'],
    start_at: '',
    end_at: '',
    created: '2025-12-15 00:00:00.000Z',
    updated: '2025-12-15 00:00:00.000Z'
  }
];

const sampleReads = [
  {
    id: 'r1',
    announcement: 'ann_active_0001',
    revision: 'rev1',
    site: 'printer',
    viewer_hash: 'viewer_a',
    created: '2026-10-17 02:00:00.000Z'
  },
  {
    id: 'r2',
    announcement: 'ann_active_0001',
    revision: 'rev1',
    site: 'initd',
    viewer_hash: 'viewer_b',
    created: '2026-10-17 03:00:00.000Z'
  },
  {
    id: 'r3',
    announcement: 'ann_sched_00002',
    revision: 'rev1',
    site: 'initd',
    viewer_hash: 'viewer_a',
    created: '2026-10-16 05:00:00.000Z'
  }
];

test('handles empty data and null/undefined inputs safely without throwing', () => {
  const emptyStats = calculateAnnouncementStats([], [], { range: 'all', now: NOW });
  assert.equal(emptyStats.total, 0);
  assert.equal(emptyStats.active, 0);
  assert.equal(emptyStats.urgent, 0);
  assert.equal(emptyStats.totalReads, 0);
  assert.equal(emptyStats.avgReadsPerAnnouncement, 0);
  assert.equal(emptyStats.readRatePercent, 0);
  assert.equal(emptyStats.targetSitesCount, 0);
  assert.ok(Array.isArray(emptyStats.trend));
  assert.ok(emptyStats.trend.length > 0);

  // @ts-expect-error testing invalid runtime input
  const nullStats = calculateAnnouncementStats(null, undefined, { range: '7d', now: NOW });
  assert.equal(nullStats.total, 0);
  assert.equal(nullStats.avgReadsPerAnnouncement, 0);
});

test('parses valid and invalid dates safely', () => {
  assert.equal(parseSafeTimestamp(''), null);
  assert.equal(parseSafeTimestamp(null), null);
  assert.equal(parseSafeTimestamp('not-a-valid-date'), null);
  assert.equal(parseSafeTimestamp('2026-13-45 99:99:99Z'), null);
  assert.equal(
    parseSafeTimestamp('2026-10-17 00:30:00.000Z'),
    Date.parse('2026-10-17T00:30:00.000Z')
  );

  // Invalid date should be excluded when filtering by a specific range, but kept for 'all'
  assert.equal(isWithinRange('invalid-date', 'today', NOW), false);
  assert.equal(isWithinRange('invalid-date', 'all', NOW), true);

  const withInvalidDates = [
    {
      id: 'bad_date_item',
      title: 'Bad dates',
      body: 'Body',
      priority: 'info',
      status: 'published',
      targets: ['initd'],
      start_at: 'invalid-start',
      end_at: 'invalid-end',
      created: 'invalid-created'
    }
  ];
  const allRangeStats = calculateAnnouncementStats(withInvalidDates, [], { range: 'all', now: NOW });
  assert.equal(allRangeStats.total, 1);
  assert.equal(allRangeStats.active, 1);

  const todayRangeStats = calculateAnnouncementStats(withInvalidDates, [], { range: 'today', now: NOW });
  assert.equal(todayRangeStats.total, 0);
});

test('calculates status counts, audience coverage, urgent count, and read rates accurately', () => {
  const stats = calculateAnnouncementStats(sampleAnnouncements, sampleReads, {
    range: 'all',
    now: NOW
  });

  assert.equal(stats.total, 5);
  assert.equal(stats.active, 1);
  assert.equal(stats.scheduled, 1);
  assert.equal(stats.draft, 1);
  assert.equal(stats.expired, 1);
  assert.equal(stats.inactive, 1);
  assert.equal(stats.urgent, 2);
  assert.equal(stats.important, 1);
  assert.equal(stats.urgentAndImportant, 3);
  assert.equal(stats.publishedCount, 3);

  // Target site coverage: 'all' covers all known applications
  assert.equal(stats.targetSitesCount, KNOWN_SITES.length);
  assert.equal(stats.bySite.initd, 3); // 'all' + 'initd,printer' + 'initd'
  assert.equal(stats.bySite.printer, 3); // 'all' + 'initd,printer' + 'printer'
  assert.equal(stats.bySite.android, 2); // 'all' + 'android'
  assert.equal(stats.bySite.booking, 1); // 'all'
  assert.equal(stats.bySite.borrowly, 1); // 'all'
  assert.equal(stats.bySite.csnis, 1); // 'all'

  // Read statistics: 3 total reads across 2 distinct announcements out of 3 published
  assert.equal(stats.totalReads, 3);
  assert.equal(stats.uniqueReaders, 2); // viewer_a, viewer_b
  assert.equal(stats.readAnnouncementsCount, 2);
  assert.equal(stats.avgReadsPerAnnouncement, 1); // 3 reads / 3 published = 1.0
  assert.equal(stats.readRatePercent, 66.7); // 2 / 3 = 66.7%
});

test('filters by time range (today, 7d, month, year, all)', () => {
  const todayStats = calculateAnnouncementStats(sampleAnnouncements, sampleReads, {
    range: 'today',
    now: NOW
  });
  assert.equal(todayStats.total, 1);
  assert.equal(todayStats.totalReads, 2);

  const weekStats = calculateAnnouncementStats(sampleAnnouncements, sampleReads, {
    range: '7d',
    now: NOW
  });
  assert.equal(weekStats.total, 2); // Oct 17 + Oct 15
  assert.equal(weekStats.totalReads, 3);

  const monthStats = calculateAnnouncementStats(sampleAnnouncements, sampleReads, {
    range: 'month',
    now: NOW
  });
  assert.equal(monthStats.total, 3); // Oct 17, Oct 15, Oct 2

  const yearStats = calculateAnnouncementStats(sampleAnnouncements, sampleReads, {
    range: 'year',
    now: NOW
  });
  assert.equal(yearStats.total, 4); // All 2026 items
});

test('supports drill-down filtering across all card types and search query', () => {
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'all', now: NOW }).length, 5);
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'active', now: NOW }).length, 1);
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'scheduled', now: NOW }).length, 1);
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'draft', now: NOW }).length, 1);
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'expired', now: NOW }).length, 1);
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'inactive', now: NOW }).length, 1);
  assert.equal(filterAnnouncements(sampleAnnouncements, { drilldown: 'urgent', now: NOW }).length, 2);

  // Also works with Thai display state labels
  assert.equal(matchesDrilldown(sampleAnnouncements[0], 'กำลังแสดง', NOW), true);
  assert.equal(matchesDrilldown(sampleAnnouncements[4], 'ปิดประกาศ', NOW), true);

  // Combined range + drilldown + search
  const filtered = filterAnnouncements(sampleAnnouncements, {
    range: 'year',
    drilldown: 'urgent',
    search: 'เครือข่าย',
    now: NOW
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'ann_active_0001');
});
