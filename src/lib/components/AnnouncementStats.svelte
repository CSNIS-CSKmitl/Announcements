<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Archive, CalendarClock, FileText, Megaphone, Radio } from '@lucide/svelte';
  import { displayState, type Announcement } from '$lib/types';

  let { items, now }: { items: Announcement[]; now: number } = $props();
  const stats = $derived([
    { label: 'ประกาศทั้งหมด', count: items.length, icon: Megaphone },
    { label: 'กำลังแสดง', count: items.filter((item) => displayState(item, now) === 'กำลังแสดง').length, icon: Radio },
    { label: 'รอกำหนดเวลา', count: items.filter((item) => displayState(item, now) === 'รอกำหนดเวลา').length, icon: CalendarClock },
    { label: 'ฉบับร่าง', count: items.filter((item) => item.status === 'draft').length, icon: FileText },
    { label: 'หมดอายุ', count: items.filter((item) => displayState(item, now) === 'หมดอายุ').length, icon: CalendarClock },
    { label: 'ปิดประกาศ', count: items.filter((item) => item.status === 'archived').length, icon: Archive }
  ]);
</script>

<section class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" aria-label="สถิติประกาศ">
  {#each stats as stat}
    <Card.Root>
      <Card.Header class="flex-row items-start justify-between">
        <Card.Title>{stat.label}</Card.Title>
        <stat.icon aria-hidden="true" class="size-5 text-muted-foreground" />
        <Card.Description class="sr-only">จำนวน{stat.label}</Card.Description>
      </Card.Header>
      <Card.Content><p class="text-3xl font-semibold tabular-nums">{stat.count}</p></Card.Content>
      <Card.Footer class="sr-only">{stat.label} {stat.count} รายการ</Card.Footer>
    </Card.Root>
  {/each}
</section>
