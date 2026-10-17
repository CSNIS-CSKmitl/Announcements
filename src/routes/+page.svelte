<script lang="ts">
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import * as Card from "$lib/components/ui/card";
  import * as Alert from "$lib/components/ui/alert";
  import * as Empty from "$lib/components/ui/empty";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import {
    Plus,
    RefreshCw,
    Pencil,
    Archive,
    Globe,
    Megaphone,
  } from "@lucide/svelte";
  import AnnouncementEditor from "$lib/components/AnnouncementEditor.svelte";
  import AnnouncementStats from "$lib/components/AnnouncementStats.svelte";
  import {
    filterAnnouncements,
    type DrilldownFilter,
    type TimeRange,
  } from "$lib/stats.mjs";
  import {
    displayState,
    targetLabel,
    priorityLabels,
    type Announcement,
  } from "$lib/types";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let search = $state(""),
    filter = $state<DrilldownFilter>("all"),
    range = $state<TimeRange>("all"),
    realtime = $state(false),
    editorOpen = $state(false),
    editing = $state<Announcement | null>(null);
  let editorValues = $state<Record<string, unknown> | null>(null),
    editorErrors = $state<Record<string, string>>({}),
    editorMessage = $state("");
  let now = $state(Date.now()),
    refreshing = $state(false);

  const filterOptions: Array<{ value: DrilldownFilter; label: string }> = [
    { value: "all", label: "ทุกสถานะ" },
    { value: "active", label: "กำลังแสดง" },
    { value: "scheduled", label: "รอกำหนดเวลา" },
    { value: "draft", label: "ฉบับร่าง" },
    { value: "expired", label: "หมดอายุ" },
    { value: "inactive", label: "ปิดประกาศ" },
    { value: "urgent", label: "ประกาศฉุกเฉิน" },
  ];

  const filterLabelMap = Object.fromEntries(
    filterOptions.map((opt) => [opt.value, opt.label]),
  ) as Record<DrilldownFilter, string>;

  let visible = $derived(
    filterAnnouncements(data.items, {
      range,
      drilldown: filter,
      search,
      now,
    }) as Announcement[],
  );

  onMount(() => {
    const timer = setInterval(() => {
      now = Date.now();
      if (realtime && !refreshing && document.visibilityState === "visible") {
        void refresh();
      }
    }, 15000);
    return () => clearInterval(timer);
  });

  $effect(() => {
    if (form?.ok) editorOpen = false;
    else if (form && "values" in form && form.values) {
      editorValues = form.values;
      editorErrors = "errors" in form ? form.errors || {} : {};
      editorMessage = form.message || "";
      editorOpen = true;
    }
  });

  function edit(item: Announcement | null) {
    editing = item;
    editorValues = null;
    editorErrors = {};
    editorMessage = "";
    editorOpen = true;
  }

  async function refresh() {
    refreshing = true;
    try {
      await invalidateAll();
      now = Date.now();
    } finally {
      refreshing = false;
    }
  }

  function formatDate(value: string) {
    return value
      ? new Intl.DateTimeFormat("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Bangkok",
        }).format(new Date(value))
      : "";
  }
</script>

<div class="flex flex-col gap-7">
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-primary">ศูนย์ประกาศกลาง</p>

      <p class="text-sm leading-relaxed text-muted-foreground">
        จัดการข่าวสำคัญ เลือกปลายทางประกาศ และกำหนดเวลาแสดงผล
      </p>
    </div>
    <Button
      onclick={() => edit(null)}
      disabled={data.setupRequired || !!data.loadError}
      class="min-h-11"><Plus data-icon="inline-start" />สร้างประกาศใหม่</Button
    >
  </div>
  {#if data.setupRequired}<Alert.Root
      ><Alert.Title>ยังไม่ได้ตั้งค่าฐานข้อมูลประกาศ</Alert.Title
      ><Alert.Description
        >ให้ผู้ดูแลติดตั้ง collection announcements
        ตามคู่มือของโปรเจกต์ก่อนเริ่มเผยแพร่</Alert.Description
      ></Alert.Root
    >{/if}
  {#if data.loadError}<Alert.Root variant="destructive"
      ><Alert.Title>โหลดข้อมูลไม่ได้</Alert.Title><Alert.Description
        >{data.loadError}</Alert.Description
      ></Alert.Root
    >{/if}
  {#if form?.message && !editorOpen}<Alert.Root
      variant={form.ok ? "default" : "destructive"}
      ><Alert.Title
        >{form.ok ? "ดำเนินการสำเร็จ" : "ดำเนินการไม่สำเร็จ"}</Alert.Title
      ><Alert.Description>{form.message}</Alert.Description></Alert.Root
    >{/if}
  <AnnouncementStats
    items={data.items}
    reads={data.reads}
    readsConfigured={data.readsConfigured}
    {now}
    bind:range
    bind:drilldown={filter}
    bind:realtime
    loading={refreshing}
    error={data.loadError}
    setupRequired={data.setupRequired}
    lastUpdated={data.loadedAt}
    onRefresh={refresh}
  />
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
    <section class="flex min-w-0 flex-col gap-4" aria-label="รายการประกาศ">
      <div class="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="ค้นหาประกาศ"
          placeholder="ค้นหาหัวข้อหรือข้อความ…"
          bind:value={search}
          class="min-h-11"
        /><Select.Root type="single" bind:value={filter}
          ><Select.Trigger
            class="min-h-11 w-full sm:w-48"
            aria-label="กรองสถานะ"
            >{filterLabelMap[filter] || "ทุกสถานะ"}</Select.Trigger
          ><Select.Content
            ><Select.Group
              >{#each filterOptions as opt (opt.value)}<Select.Item
                  value={opt.value}>{opt.label}</Select.Item
                >{/each}</Select.Group
            ></Select.Content
          ></Select.Root
        ><Button
          variant="outline"
          onclick={refresh}
          disabled={refreshing}
          aria-label="โหลดประกาศใหม่"
          class="min-h-11"><RefreshCw data-icon="inline-start" />รีเฟรช</Button
        >
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          {visible.length} รายการ · เวลาประเทศไทย
        </p>
        {#if filter !== "all" || range !== "all" || search}
          <button
            type="button"
            onclick={() => {
              filter = "all";
              range = "all";
              search = "";
            }}
            class="text-primary underline-offset-4 hover:underline"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        {/if}
      </div>
      {#each visible as item (item.id)}
        {@const state = displayState(item, now)}
        <Card.Root
          ><Card.Header
            ><div class="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                variant={item.priority === "emergency"
                  ? "destructive"
                  : "secondary"}>{priorityLabels[item.priority]}</Badge
              ><Badge variant={state === "กำลังแสดง" ? "default" : "outline"}
                >{state}</Badge
              >
            </div>
            <Card.Title>{item.title}</Card.Title><Card.Description
              ><span class="flex items-center gap-1.5"
                ><Globe aria-hidden="true" class="size-3.5" />{targetLabel(
                  item.targets,
                )}</span
              ></Card.Description
            ></Card.Header
          ><Card.Content
            ><p
              class="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground"
            >
              {item.body}
            </p>
            <p class="mt-4 text-xs leading-relaxed text-muted-foreground">
              {item.start_at
                ? `เริ่ม ${formatDate(item.start_at)}`
                : "เริ่มทันทีเมื่อเผยแพร่"} · {item.end_at
                ? `ถึง ${formatDate(item.end_at)}`
                : "ไม่กำหนดวันหมดอายุ"}
            </p></Card.Content
          ><Card.Footer class="flex-wrap justify-between gap-3"
            ><span class="text-xs text-muted-foreground"
              >แก้ไขล่าสุด {formatDate(item.updated)}</span
            >
            <div class="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onclick={() => edit(item)}
                class="min-h-11"
                ><Pencil data-icon="inline-start" />แก้ไข</Button
              >{#if item.status !== "archived"}<form
                  method="POST"
                  action="?/archive"
                  use:enhance
                >
                  <input type="hidden" name="id" value={item.id} /><input
                    type="hidden"
                    name="revision"
                    value={item.revision}
                  /><Button type="submit" variant="ghost" class="min-h-11"
                    ><Archive data-icon="inline-start" />ปิดประกาศ</Button
                  >
                </form>{/if}
            </div></Card.Footer
          ></Card.Root
        >
      {:else}<Empty.Root class="border border-dashed border-border bg-card"
          ><Empty.Header
            ><Empty.Media variant="icon"><Megaphone /></Empty.Media><Empty.Title
              >{search || filter !== "all" || range !== "all"
                ? "ไม่พบประกาศที่ตรงกัน"
                : "เริ่มประกาศแรกของคุณ"}</Empty.Title
            ><Empty.Description
              >{search || filter !== "all" || range !== "all"
                ? "ลองเปลี่ยนคำค้นหา ช่วงเวลา หรือตัวกรองสถานะ"
                : "เขียนครั้งเดียว แล้วเผยแพร่ไปยังเว็บที่ต้องการ"}</Empty.Description
            ></Empty.Header
          ><Empty.Content
            ><Button
              onclick={() => edit(null)}
              disabled={data.setupRequired || !!data.loadError}
              class="min-h-11"
              ><Plus data-icon="inline-start" />สร้างประกาศใหม่</Button
            ></Empty.Content
          ></Empty.Root
        >{/each}
    </section>
    <aside class="flex flex-col gap-4">
      <Card.Root
        ><Card.Header
          ><Card.Title>ก่อนเผยแพร่</Card.Title><Card.Description
            >ช่วยให้ประกาศถึงคนที่ต้องการได้ชัดเจน</Card.Description
          ></Card.Header
        ><Card.Content
          ><ol
            class="flex list-decimal flex-col gap-3 pl-4 text-sm leading-relaxed text-muted-foreground"
          >
            <li>ตรวจหัวข้อ ข้อความ และลิงก์</li>
            <li>เลือกปลายทางประกาศและความสำคัญ</li>
            <li>ตั้งเวลาเริ่มและหมดอายุถ้ามี</li>
            <li>ดูตัวอย่าง แล้วกดเผยแพร่</li>
          </ol></Card.Content
        ><Card.Footer></Card.Footer></Card.Root
      >
    </aside>
  </div>
</div>
<AnnouncementEditor
  bind:open={editorOpen}
  item={editing}
  values={editorValues}
  errors={editorErrors}
  message={editorMessage}
/>
