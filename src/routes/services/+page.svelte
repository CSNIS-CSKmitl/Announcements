<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    Search,
    ArrowRight,
    Grid2X2,
    Server,
    Smartphone,
    Megaphone,
    CalendarDays,
    Package,
    Printer,
    RefreshCw,
  } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { toast } from "$lib/toast";

  type Service = {
    name: string;
    description: string;
    type: string;
    status: string;
    icon: typeof Grid2X2;
    tone: string;
    href?: string;
  };

  const services: Service[] = [
    {
      name: "Announcements",
      description: "ระบบประกาศข่าวสารและการสื่อสารภายใน",
      type: "Web app",
      status: "พร้อมใช้งาน",
      icon: Megaphone,
      tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
      href: "/",
    },
    {
      name: "Booking",
      description: "ระบบจองห้อง อุปกรณ์ หรือทรัพยากรส่วนกลาง",
      type: "Web app",
      status: "พร้อมใช้งาน",
      icon: CalendarDays,
      tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      name: "Borrow Item",
      description: "ระบบยืมคืนอุปกรณ์และติดตามสถานะรายการ",
      type: "Web app",
      status: "พร้อมใช้งาน",
      icon: Package,
      tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      name: "CSNIS",
      description: "ระบบสารสนเทศสำหรับงานและข้อมูลของหน่วยงาน",
      type: "Web app",
      status: "พร้อมใช้งาน",
      icon: Server,
      tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      name: "Android App",
      description: "แอปพลิเคชัน Android และ backend ที่เกี่ยวข้อง",
      type: "Mobile",
      status: "กำลังพัฒนา",
      icon: Smartphone,
      tone: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
    },
    {
      name: "Printer Server",
      description: "บริการจัดการเครื่องพิมพ์และงานพิมพ์ส่วนกลาง",
      type: "Infrastructure",
      status: "พร้อมใช้งาน",
      icon: Printer,
      tone: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    },
  ];

  const filters = ["ทั้งหมด", "Web app", "Backend", "Mobile", "Infrastructure"];

  let query = $state("");
  let selected = $state("ทั้งหมด");
  let loading = $state(false);

  let filtered = $derived(
    services.filter(
      (service) =>
        (selected === "ทั้งหมด" || service.type === selected) &&
        `${service.name} ${service.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    ),
  );

  function handleSearch(event: SubmitEvent) {
    event.preventDefault();
    const el = document.getElementById("services");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (filtered.length === 0) {
      toast.error("ไม่พบระบบที่ตรงกับคำค้นหา");
    } else if (query.trim()) {
      toast.info(`พบ ${filtered.length} ระบบที่ตรงกับ "${query.trim()}"`);
    }
  }

  async function refreshServices() {
    if (loading) return;
    loading = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      toast.success("อัปเดตสถานะระบบล่าสุดแล้ว");
    } catch {
      toast.error("โหลดรายการระบบไม่สำเร็จ");
    } finally {
      loading = false;
    }
  }

  function openService(service: Service) {
    if (service.status === "กำลังพัฒนา") {
      toast.info(`${service.name} อยู่ระหว่างการพัฒนา`);
      return;
    }
    if (service.href) {
      toast.success(`กำลังเปิดระบบ ${service.name}`);
      void goto(service.href);
      return;
    }
    toast.info(`ระบบ ${service.name} พร้อมใช้งานผ่านพอร์ทัล CS-Proj`);
  }
</script>

<svelte:head>
  <title>CS-Proj Services — รวมระบบและบริการ</title>
  <meta name="description" content="รวมระบบและบริการของ CS-Proj" />
</svelte:head>

<div class="flex flex-col gap-10">
  <section class="py-6 text-center md:py-10">
    <Badge variant="secondary" class="mb-4">CS-KMITL services</Badge>
    <h1 class="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
      รวมระบบและบริการ<br /><span class="text-primary">ของ CS-Proj ไว้ที่เดียว</span>
    </h1>
    <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
      เข้าถึงโปรเจกต์ เครื่องมือ และระบบภายในได้ง่ายจากหน้าเดียว
    </p>
    <form
      onsubmit={handleSearch}
      class="mx-auto mt-7 flex max-w-2xl flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-center"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Search aria-hidden="true" class="size-5 shrink-0 text-muted-foreground" />
        <Input
          bind:value={query}
          aria-label="ค้นหาระบบ"
          placeholder="ค้นหาระบบ เช่น Booking, Printer..."
          class="min-h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" class="min-h-10 sm:px-6">ค้นหา</Button>
    </form>
  </section>

  <section id="services" class="flex flex-col gap-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 class="text-2xl font-bold">ระบบในโปรเจกต์</h2>
        <p class="mt-1 text-sm text-muted-foreground">เลือกเปิดใช้งานระบบที่ต้องการ</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="text-sm text-muted-foreground">{filtered.length} ระบบ</span>
        <Button
          variant="outline"
          size="sm"
          onclick={refreshServices}
          disabled={loading}
          aria-label="รีเฟรชรายการระบบ"
          class="min-h-9 gap-1.5"
        >
          <RefreshCw aria-hidden="true" class="size-3.5 {loading ? 'animate-spin' : ''}" />
          รีเฟรช
        </Button>
        <Button href="/login" variant="outline" size="sm" class="min-h-9">เข้าสู่ระบบ</Button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each filters as filter (filter)}
        <Button
          variant={selected === filter ? "default" : "outline"}
          size="sm"
          onclick={() => (selected = filter)}
          class="min-h-9"
        >
          {filter}
        </Button>
      {/each}
    </div>

    {#if loading}
      <div
        class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="กำลังโหลดรายการระบบ"
      >
        {#each Array(6) as _, i (i)}
          <Card class="animate-pulse">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="size-11 rounded-xl bg-muted"></div>
                <div class="h-5 w-20 rounded-full bg-muted"></div>
              </div>
              <div class="mt-5 h-5 w-36 rounded bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div class="h-3.5 w-full rounded bg-muted"></div>
                <div class="h-3.5 w-4/5 rounded bg-muted"></div>
              </div>
            </CardContent>
            <CardFooter class="justify-between border-t border-border pt-4">
              <div class="h-4 w-20 rounded bg-muted"></div>
              <div class="h-8 w-24 rounded-md bg-muted"></div>
            </CardFooter>
          </Card>
        {/each}
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each filtered as service (service.name)}
          {@const Icon = service.icon}
          <Card class="transition hover:-translate-y-1 hover:shadow-md">
            <CardHeader>
              <div class="flex items-start justify-between gap-2">
                <div class={`grid size-11 shrink-0 place-items-center rounded-xl ${service.tone}`}>
                  <Icon aria-hidden="true" class="size-5" />
                </div>
                <Badge
                  variant="outline"
                  class={service.status === "พร้อมใช้งาน"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"}
                >
                  {service.status}
                </Badge>
              </div>
              <CardTitle class="mt-5">{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="min-h-12 text-sm leading-6 text-muted-foreground">
                {service.description}
              </p>
            </CardContent>
            <CardFooter class="justify-between border-t border-border pt-4 text-sm">
              <span class="text-muted-foreground">{service.type}</span>
              <Button
                variant="ghost"
                size="sm"
                onclick={() => openService(service)}
                class="min-h-9"
              >
                เปิดระบบ <ArrowRight aria-hidden="true" class="ml-1 size-4" />
              </Button>
            </CardFooter>
          </Card>
        {:else}
          <div class="col-span-full rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            ไม่พบระบบที่ค้นหา
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
