<script lang="ts">
  import '../app.css';
  import { version } from '$app/environment';
  import { page } from '$app/state';
  import { fly } from 'svelte/transition';
  import { LogOut, CheckCircle2, AlertCircle, Info, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { toast } from '$lib/toast';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import LegalConsent from '$lib/components/LegalConsent.svelte';
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  let isLegalPage = $derived(['/privacy', '/terms'].includes(page.url.pathname.replace(/\/$/, '')));
</script>
<svelte:head><title>Announcements — ศูนย์ประกาศกลาง</title><meta name="robots" content="noindex" /><link rel="icon" type="image/png" href="/logocs.png" /></svelte:head>
<div class="flex min-h-screen flex-col bg-background text-foreground">
  <header class="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
    <div class="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
      <a href="/" class="flex items-center gap-3 font-semibold"><img src="/logocs.png" alt="CS KMITL Logo" loading="lazy" decoding="async" class="size-10 shrink-0 object-contain" /><span class="flex flex-col"><span>Announcements</span><span class="text-xs font-normal text-muted-foreground">ศูนย์ประกาศกลาง · CS KMITL</span></span></a>
      {#if data.user}<div class="flex items-center gap-3"><span class="hidden text-sm text-muted-foreground sm:block">{data.user.name}</span><form method="POST" action="/logout"><Button type="submit" variant="outline" aria-label="ออกจากระบบ" class="min-h-11"><LogOut data-icon="inline-start" /><span class="hidden sm:inline">ออกจากระบบ</span></Button></form></div>{/if}
    </div>
  </header>
  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
    {#key page.url.pathname}
      <div class="animate-page-enter">{@render children()}</div>
    {/key}
  </main>
  <footer class="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
    <span>© {new Date().getFullYear()} · <a href="https://github.com/techasit5415" target="_blank" rel="noopener noreferrer" class="hover:text-foreground hover:underline">นาย เตชสิทธิ์ วาณิชภัทรกุล</a> · <span class="font-mono tabular-nums" title="Semantic Versioning: MAJOR.MINOR.PATCH">v{version}</span></span>
    <nav aria-label="นโยบายและข้อกำหนด" class="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-0">
      <a href="/privacy" class="inline-flex min-h-7 items-center underline underline-offset-4 hover:text-foreground">นโยบายความเป็นส่วนตัว</a>
      <a href="/terms" class="inline-flex min-h-7 items-center underline underline-offset-4 hover:text-foreground">ข้อกำหนดการใช้งาน</a>
    </nav>
  </footer>
  <LegalConsent userId={data.user?.id ?? null} enabled={!isLegalPage} />
</div>

{#if $toast.length > 0}
  <div
    class="pointer-events-none fixed top-4 left-1/2 z-[120] flex w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 flex-col gap-2"
    role="status"
    aria-live="polite"
  >
    {#each $toast as item (item.id)}
      <div
        transition:fly={{ y: -24, duration: 220 }}
        class="pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md {item.kind === 'error'
          ? 'border-destructive/30 bg-destructive text-white'
          : item.kind === 'success'
            ? 'border-emerald-600/30 bg-emerald-600 text-white'
            : 'border-border bg-card/95 text-foreground'}"
      >
        {#if item.kind === 'error'}
          <AlertCircle aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
        {:else if item.kind === 'success'}
          <CheckCircle2 aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
        {:else}
          <Info aria-hidden="true" class="mt-0.5 size-4 shrink-0 text-primary" />
        {/if}
        <p class="min-w-0 flex-1 leading-snug font-medium">{item.message}</p>
        <button
          type="button"
          onclick={() => toast.dismiss(item.id)}
          aria-label="ปิดการแจ้งเตือน"
          class="shrink-0 rounded-md p-0.5 opacity-80 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" class="size-4" />
        </button>
      </div>
    {/each}
  </div>
{/if}
