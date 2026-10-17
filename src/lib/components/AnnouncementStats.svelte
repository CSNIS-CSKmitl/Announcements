<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import {
    AlertTriangle,
    Archive,
    BarChart3,
    CalendarClock,
    Clock,
    Eye,
    FileText,
    Globe,
    Megaphone,
    Radio,
    RefreshCw,
    Siren
  } from '@lucide/svelte';
  import {
    calculateAnnouncementStats,
    KNOWN_SITES,
    TIME_RANGES,
    type DrilldownFilter,
    type TimeRange
  } from '$lib/stats.mjs';
  import { type Announcement, type AnnouncementRead } from '$lib/types';

  let {
    items = [],
    reads = [],
    readsConfigured = false,
    now = Date.now(),
    range = $bindable<TimeRange>('all'),
    drilldown = $bindable<DrilldownFilter>('all'),
    loading = false,
    error = '',
    setupRequired = false,
    lastUpdated = '',
    realtime = $bindable(false),
    onRefresh
  }: {
    items: Announcement[];
    reads?: AnnouncementRead[];
    readsConfigured?: boolean;
    now: number;
    range?: TimeRange;
    drilldown?: DrilldownFilter;
    loading?: boolean;
    error?: string;
    setupRequired?: boolean;
    lastUpdated?: string;
    realtime?: boolean;
    onRefresh?: () => void | Promise<void>;
  } = $props();

  const computed = $derived(calculateAnnouncementStats(items, reads, { range, now }));

  const cards = $derived([
    {
      key: 'all' as DrilldownFilter,
      label: 'ประกาศทั้งหมด',
      count: computed.total,
      sub: `เผยแพร่ ${computed.publishedCount} รายการ`,
      icon: Megaphone
    },
    {
      key: 'active' as DrilldownFilter,
      label: 'กำลังแสดง',
      count: computed.active,
      sub: 'แสดงผลบนเว็บปลายทาง',
      icon: Radio
    },
    {
      key: 'scheduled' as DrilldownFilter,
      label: 'รอกำหนดเวลา',
      count: computed.scheduled,
      sub: 'รอถึงเวลาเริ่มแสดง',
      icon: CalendarClock
    },
    {
      key: 'draft' as DrilldownFilter,
      label: 'ฉบับร่าง',
      count: computed.draft,
      sub: 'ยังไม่เผยแพร่',
      icon: FileText
    },
    {
      key: 'expired' as DrilldownFilter,
      label: 'หมดอายุ',
      count: computed.expired,
      sub: 'ครบกำหนดเวลาแสดง',
      icon: Clock
    },
    {
      key: 'inactive' as DrilldownFilter,
      label: 'ปิดประกาศ',
      count: computed.inactive,
      sub: 'เก็บเข้าคลังแล้ว',
      icon: Archive
    },
    {
      key: 'urgent' as DrilldownFilter,
      label: 'ประกาศฉุกเฉิน',
      count: computed.urgent,
      sub: `สำคัญ ${computed.important} รายการ`,
      icon: Siren
    }
  ]);

  const maxTrendValue = $derived(
    Math.max(
      1,
      ...computed.trend.map((point) => Math.max(point.announcements, point.reads))
    )
  );

  function selectCard(key: DrilldownFilter) {
    drilldown = drilldown === key && key !== 'all' ? 'all' : key;
  }

  function formatUpdatedTime(value: string) {
    if (!value) return 'เมื่อสักครู่';
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return 'เมื่อสักครู่';
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'Asia/Bangkok'
    }).format(new Date(parsed));
  }
</script>

<section class="flex flex-col gap-4" aria-label="สถิติประกาศ">
  <!-- Header bar: Title, Realtime/Snapshot badge, Last updated, Time range selector, Refresh -->
  <div class="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
    <div class="flex flex-wrap items-center gap-2.5">
      <h2 class="text-base font-semibold">ภาพรวมสถิติประกาศ</h2>
      <button
        type="button"
        onclick={() => (realtime = !realtime)}
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors {realtime
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-border bg-muted text-muted-foreground'}"
        title="คลิกเพื่อสลับโหมดอัปเดตอัตโนมัติ (Realtime) และโหมดข้อมูลคงที่ (Snapshot)"
      >
        <span
          class="size-2 rounded-full {realtime
            ? 'animate-pulse bg-emerald-500'
            : 'bg-muted-foreground'}"
        ></span>
        {realtime ? 'Realtime' : 'Snapshot'}
      </button>
      <span class="text-xs text-muted-foreground">
        อัปเดตล่าสุด {formatUpdatedTime(lastUpdated)}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div
        class="inline-flex flex-wrap rounded-lg border border-border bg-muted/40 p-1"
        role="group"
        aria-label="เลือกช่วงเวลาสถิติ"
      >
        {#each TIME_RANGES as item (item.id)}
          <button
            type="button"
            onclick={() => (range = item.id)}
            aria-pressed={range === item.id}
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {range === item.id
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'}"
          >
            {item.label}
          </button>
        {/each}
      </div>

      {#if onRefresh}
        <Button
          variant="outline"
          size="sm"
          onclick={onRefresh}
          disabled={loading}
          aria-label="รีเฟรชสถิติ"
          class="h-8 gap-1.5 text-xs"
        >
          <RefreshCw class="size-3.5 {loading ? 'animate-spin' : ''}" />
          รีเฟรช
        </Button>
      {/if}
    </div>
  </div>

  <!-- Error / Setup / Loading handling instead of showing false 0s -->
  {#if error || setupRequired}
    <Card.Root class="border-destructive/50 bg-destructive/5">
      <Card.Header class="flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <AlertTriangle class="size-5 shrink-0 text-destructive" />
          <div>
            <Card.Title class="text-base text-destructive">โหลดข้อมูลไม่ได้</Card.Title>
            <Card.Description>
              {error || 'ยังไม่ได้ตั้งค่าฐานข้อมูลประกาศ จึงไม่สามารถคำนวณสถิติได้ในขณะนี้'}
            </Card.Description>
          </div>
        </div>
        {#if onRefresh}
          <Button variant="outline" size="sm" onclick={onRefresh} disabled={loading}>
            <RefreshCw class="size-3.5" />ลองใหม่
          </Button>
        {/if}
      </Card.Header>
    </Card.Root>
  {:else if loading && items.length === 0}
    <Card.Root>
      <Card.Content class="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
        <RefreshCw class="size-4 animate-spin" />
        <span>กำลังโหลดสถิติ...</span>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Clickable Drill-down Status Cards -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {#each cards as stat (stat.key)}
        {@const selected = drilldown === stat.key}
        <button
          type="button"
          onclick={() => selectCard(stat.key)}
          aria-pressed={selected}
          class="group text-left focus-visible:outline-2 focus-visible:outline-primary rounded-xl transition-all"
        >
          <Card.Root
            class="h-full transition-all hover:border-primary/60 {selected
              ? 'border-primary ring-2 ring-primary/25 bg-primary/5'
              : ''}"
          >
            <Card.Header class="flex-row items-start justify-between pb-2">
              <Card.Title class="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {stat.label}
              </Card.Title>
              <stat.icon
                aria-hidden="true"
                class="size-4 shrink-0 {stat.key === 'urgent' && stat.count > 0
                  ? 'text-destructive'
                  : selected
                    ? 'text-primary'
                    : 'text-muted-foreground'}"
              />
              <Card.Description class="sr-only">จำนวน{stat.label}</Card.Description>
            </Card.Header>
            <Card.Content>
              <p class="text-2xl font-semibold tabular-nums">
                {loading ? '…' : stat.count.toLocaleString()}
              </p>
              <p class="mt-1 text-[11px] text-muted-foreground">{stat.sub}</p>
            </Card.Content>
            <Card.Footer class="sr-only">{stat.label} {stat.count} รายการ</Card.Footer>
          </Card.Root>
        </button>
      {/each}
    </div>

    <!-- App-specific metrics + Trend Chart -->
    <div class="grid gap-4 lg:grid-cols-12">
      <!-- App-specific metric 1: Target sites / Audience coverage -->
      <Card.Root class="lg:col-span-4">
        <Card.Header class="pb-2">
          <div class="flex items-center justify-between">
            <Card.Title class="text-sm font-medium">จำนวนผู้รับ / ไซต์เป้าหมาย</Card.Title>
            <Globe class="size-4 text-muted-foreground" />
          </div>
          <Card.Description class="text-xs">ความครอบคลุมของระบบปลายทาง</Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-semibold tabular-nums">
              {computed.targetSitesCount} / {computed.totalKnownSites}
            </span>
            <span class="text-xs text-muted-foreground">ไซต์ที่ได้รับประกาศ</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            {#each KNOWN_SITES as site (site.id)}
              <Badge variant={computed.bySite[site.id] > 0 ? 'secondary' : 'outline'} class="text-xs">
                {site.name}: {computed.bySite[site.id] ?? 0}
              </Badge>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>

      <!-- App-specific metric 2: Emergency/Urgent & Read rate -->
      <Card.Root class="lg:col-span-4">
        <Card.Header class="pb-2">
          <div class="flex items-center justify-between">
            <Card.Title class="text-sm font-medium">จำนวนการอ่าน & อัตราการอ่านเฉลี่ย</Card.Title>
            <Eye class="size-4 text-muted-foreground" />
          </div>
          <Card.Description class="text-xs">
            {readsConfigured
              ? 'ข้อมูลจาก announcement_reads'
              : 'พร้อมบันทึกเมื่อเปิดใช้งาน announcement_reads'}
          </Card.Description>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-muted-foreground">จำนวนการอ่านทั้งหมด</p>
            <p class="mt-0.5 text-2xl font-semibold tabular-nums">
              {computed.totalReads.toLocaleString()}
            </p>
            <p class="text-[11px] text-muted-foreground">
              ผู้ชม {computed.uniqueReaders.toLocaleString()} คน · อ่านแล้ว {computed.readRatePercent}%
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">อัตราการอ่านเฉลี่ยต่อประกาศ</p>
            <p class="mt-0.5 text-2xl font-semibold tabular-nums">
              {computed.avgReadsPerAnnouncement.toLocaleString()}
            </p>
            <p class="text-[11px] text-muted-foreground">
              ฉุกเฉิน/สำคัญ {computed.urgentAndImportant} รายการ
            </p>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Trend Chart: Announcements & Reads over time -->
      <Card.Root class="lg:col-span-4">
        <Card.Header class="pb-2">
          <div class="flex items-center justify-between">
            <Card.Title class="text-sm font-medium">แนวโน้มประกาศและการอ่าน</Card.Title>
            <BarChart3 class="size-4 text-muted-foreground" />
          </div>
          <Card.Description class="flex items-center gap-3 text-xs">
            <span class="inline-flex items-center gap-1">
              <span class="size-2 rounded-xs bg-primary"></span>ประกาศ
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="size-2 rounded-xs bg-emerald-500"></span>การอ่าน
            </span>
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex h-28 items-end gap-2 pt-2" role="img" aria-label="กราฟแนวโน้มประกาศและการอ่าน">
            {#each computed.trend as point (point.key)}
              {@const annHeight = Math.max(4, Math.round((point.announcements / maxTrendValue) * 72))}
              {@const readHeight = Math.max(4, Math.round((point.reads / maxTrendValue) * 72))}
              <div class="flex flex-1 flex-col items-center gap-1">
                <div class="flex w-full items-end justify-center gap-1 h-20">
                  <div
                    class="w-2.5 rounded-t bg-primary transition-all"
                    style="height: {point.announcements > 0 ? annHeight : 3}px; opacity: {point.announcements > 0 ? 1 : 0.25}"
                    title="{point.label}: ประกาศ {point.announcements} รายการ"
                  ></div>
                  <div
                    class="w-2.5 rounded-t bg-emerald-500 transition-all"
                    style="height: {point.reads > 0 ? readHeight : 3}px; opacity: {point.reads > 0 ? 1 : 0.25}"
                    title="{point.label}: การอ่าน {point.reads} ครั้ง"
                  ></div>
                </div>
                <span class="truncate text-[10px] tabular-nums text-muted-foreground">
                  {point.label}
                </span>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</section>
