<script lang="ts">
  import { Search, ArrowRight, Grid2X2, Server, Smartphone, Megaphone, CalendarDays, Package, Printer } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";

  type Service = { name: string; description: string; type: string; status: string; icon: typeof Grid2X2; tone: string };
  const services: Service[] = [
    { name: "Announcements", description: "ระบบประกาศข่าวสารและการสื่อสารภายใน", type: "Web app", status: "พร้อมใช้งาน", icon: Megaphone, tone: "bg-violet-100 text-violet-700" },
    { name: "Booking", description: "ระบบจองห้อง อุปกรณ์ หรือทรัพยากรส่วนกลาง", type: "Web app", status: "พร้อมใช้งาน", icon: CalendarDays, tone: "bg-emerald-100 text-emerald-700" },
    { name: "Borrow Item", description: "ระบบยืมคืนอุปกรณ์และติดตามสถานะรายการ", type: "Web app", status: "พร้อมใช้งาน", icon: Package, tone: "bg-orange-100 text-orange-700" },
    { name: "CSNIS", description: "ระบบสารสนเทศสำหรับงานและข้อมูลของหน่วยงาน", type: "Web app", status: "พร้อมใช้งาน", icon: Server, tone: "bg-sky-100 text-sky-700" },
    { name: "Android App", description: "แอปพลิเคชัน Android และ backend ที่เกี่ยวข้อง", type: "Mobile", status: "กำลังพัฒนา", icon: Smartphone, tone: "bg-pink-100 text-pink-700" },
    { name: "Printer Server", description: "บริการจัดการเครื่องพิมพ์และงานพิมพ์ส่วนกลาง", type: "Infrastructure", status: "พร้อมใช้งาน", icon: Printer, tone: "bg-slate-100 text-slate-700" }
  ];

  let query = "";
  let selected = "ทั้งหมด";
  const filters = ["ทั้งหมด", "Web app", "Backend", "Mobile", "Infrastructure"];
  $: filtered = services.filter((service) =>
    (selected === "ทั้งหมด" || service.type === selected) &&
    `${service.name} ${service.description}`.toLowerCase().includes(query.toLowerCase())
  );
</script>

<svelte:head><title>CS-Proj Services</title><meta name="description" content="รวมระบบและบริการของ CS-Proj" /></svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900">
  <header class="border-b bg-white">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <a href="/services" class="flex items-center gap-2 font-bold tracking-tight"><span class="grid size-9 place-items-center rounded-xl bg-teal-700 text-lg text-white">✦</span> CS-Proj Services</a>
      <nav class="hidden items-center gap-6 text-sm text-slate-500 md:flex"><a class="font-semibold text-slate-900" href="#services">บริการทั้งหมด</a><a href="#about">เกี่ยวกับระบบ</a></nav>
      <Button variant="outline" size="sm">เข้าสู่ระบบ</Button>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-6 pb-16">
    <section class="py-16 text-center md:py-20">
      <Badge variant="secondary" class="mb-4">CS-KMITL services</Badge>
      <h1 class="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">รวมระบบและบริการ<br /><span class="text-teal-700">ของ CS-Proj ไว้ที่เดียว</span></h1>
      <p class="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-500">เข้าถึงโปรเจกต์ เครื่องมือ และระบบภายในได้ง่ายจากหน้าเดียว</p>
      <div class="mx-auto mt-8 flex max-w-2xl gap-2 rounded-xl border bg-white p-2 shadow-sm">
        <div class="flex flex-1 items-center gap-2 px-3"><Search class="size-5 text-slate-400" /><Input bind:value={query} placeholder="ค้นหาระบบ เช่น Booking, Printer..." class="border-0 bg-transparent shadow-none focus-visible:ring-0" /></div>
        <Button>ค้นหา</Button>
      </div>
    </section>

    <section id="services">
      <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 class="text-2xl font-bold">ระบบในโปรเจกต์</h2><p class="mt-1 text-slate-500">เลือกเปิดใช้งานระบบที่ต้องการ</p></div><span class="text-sm text-slate-500">{filtered.length} ระบบ</span></div>
      <div class="mb-6 flex flex-wrap gap-2">{#each filters as filter}<Button variant={selected === filter ? "default" : "outline"} size="sm" onclick={() => selected = filter}>{filter}</Button>{/each}</div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each filtered as service}
          <Card class="transition hover:-translate-y-1 hover:shadow-md"><CardHeader><div class="flex items-start justify-between"><div class={`grid size-11 place-items-center rounded-xl ${service.tone}`}><svelte:component this={service.icon} class="size-5" /></div><Badge variant="outline" class="text-emerald-700">{service.status}</Badge></div><CardTitle class="mt-5">{service.name}</CardTitle></CardHeader><CardContent><p class="min-h-12 text-sm leading-6 text-slate-500">{service.description}</p></CardContent><CardFooter class="justify-between border-t pt-4 text-sm"><span class="text-slate-500">{service.type}</span><Button variant="ghost" size="sm">เปิดระบบ <ArrowRight class="ml-1 size-4" /></Button></CardFooter></Card>
        {:else}<div class="col-span-full rounded-xl border border-dashed bg-white p-12 text-center text-slate-500">ไม่พบระบบที่ค้นหา</div>{/each}
      </div>
    </section>
  </main>
</div>
