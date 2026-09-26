<script lang="ts">
  import '../app.css';
  import { Megaphone, LogOut } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>
<svelte:head><title>Announcements — ศูนย์ประกาศกลาง</title><meta name="robots" content="noindex" /><link rel="icon" href="/favicon.svg" /></svelte:head>
<div class="min-h-screen bg-background text-foreground">
  <header class="border-b border-border bg-card">
    <div class="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
      <a href="/" class="flex items-center gap-3 font-semibold"><span class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Megaphone aria-hidden="true" class="size-5" /></span><span class="flex flex-col"><span>Announcements</span><span class="text-xs font-normal text-muted-foreground">ศูนย์ประกาศกลาง · CS KMITL</span></span></a>
      {#if data.user}<div class="flex items-center gap-3"><span class="hidden text-sm text-muted-foreground sm:block">{data.user.name}</span><form method="POST" action="/logout"><Button type="submit" variant="outline" aria-label="ออกจากระบบ" class="min-h-11"><LogOut data-icon="inline-start" /><span class="hidden sm:inline">ออกจากระบบ</span></Button></form></div>{/if}
    </div>
  </header>
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{@render children()}</main>
</div>
