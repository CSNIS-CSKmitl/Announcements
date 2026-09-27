<script lang="ts">
  import { enhance } from "$app/forms";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Field from "$lib/components/ui/field";
  import * as Select from "$lib/components/ui/select";
  import * as Alert from "$lib/components/ui/alert";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Spinner } from "$lib/components/ui/spinner";
  import { Eye, ExternalLink, Send, Save } from "@lucide/svelte";
  import { sites, priorityLabels, type Announcement } from "$lib/types";
  import { safeUrl } from "$lib/validation.mjs";
  type Values = Record<string, unknown>;
  let {
    open = $bindable(false),
    item = null,
    errors = {},
    values = null,
    message = "",
  }: {
    open?: boolean;
    item?: Announcement | null;
    errors?: Record<string, string>;
    values?: Values | null;
    message?: string;
  } = $props();
  let title = $state(""),
    body = $state(""),
    priority = $state("info");
  let all = $state(true),
    selected = $state<string[]>([]);
  let start = $state(""),
    end = $state(""),
    linkLabel = $state(""),
    linkUrl = $state(""),
    sourceUrl = $state("");
  let pending = $state(false);
  function localTime(value: unknown) {
    if (!value || typeof value !== "string") return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed)
      ? new Date(parsed + 7 * 3600000).toISOString().slice(0, 16)
      : "";
  }
  $effect(() => {
    if (!open) return;
    const draft = values || item;
    title = String(draft?.title || "");
    body = String(draft?.body || "");
    priority = String(draft?.priority || "info");
    const targets = Array.isArray(draft?.targets)
      ? ([...draft.targets] as string[])
      : ["all"];
    all = targets.includes("all");
    selected = targets.filter((target) => target !== "all");
    start = localTime(draft?.start_at);
    end = localTime(draft?.end_at);
    linkLabel = String(draft?.link_label || "");
    linkUrl = String(draft?.link_url || "");
    sourceUrl = String(draft?.source_url || "");
  });
  let previewUrl = $derived(safeUrl(linkUrl));
  let previewSource = $derived(safeUrl(sourceUrl));
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
    <Dialog.Header
      ><Dialog.Title>{item ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}</Dialog.Title
      ><Dialog.Description
        >ผู้เข้าชมเห็นได้โดยไม่ต้องล็อกอิน และแสดงทุกครั้งที่เปิดหรือรีโหลดเว็บ</Dialog.Description
      ></Dialog.Header
    >
    <form
      method="POST"
      action="?/save"
      use:enhance={() => {
        pending = true;
        return async ({ update }) => {
          try {
            await update({ reset: false });
          } finally {
            pending = false;
          }
        };
      }}
      class="flex flex-col gap-6"
    >
      <input type="hidden" name="id" value={item?.id || ""} /><input
        type="hidden"
        name="revision"
        value={item?.revision || ""}
      />
      <input type="hidden" name="priority" value={priority} />
      {#if all}<input
          type="hidden"
          name="targets"
          value="all"
        />{:else}{#each selected as target}<input
            type="hidden"
            name="targets"
            value={target}
          />{/each}{/if}
      {#if message}<Alert.Root variant="destructive"
          ><Alert.Title>บันทึกไม่ได้</Alert.Title><Alert.Description
            >{message}</Alert.Description
          ></Alert.Root
        >{/if}
      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Field.FieldGroup>
          <Field.Field data-invalid={!!errors.title}
            ><Field.FieldLabel for="title">หัวข้อประกาศ</Field.FieldLabel><Input
              id="title"
              name="title"
              bind:value={title}
              maxlength={180}
              required
              aria-invalid={!!errors.title}
              placeholder="เช่น ขอความช่วยเหลือสำหรับนักศึกษาที่ได้รับผลกระทบจากน้ำท่วม"
            />{#if errors.title}<Field.FieldError
                >{errors.title}</Field.FieldError
              >{/if}</Field.Field
          >
          <Field.Field data-invalid={!!errors.body}
            ><Field.FieldLabel for="body">ข้อความประกาศ</Field.FieldLabel
            ><Textarea
              id="body"
              name="body"
              bind:value={body}
              class="min-h-36"
              maxlength={6000}
              required
              aria-invalid={!!errors.body}
              placeholder="รายละเอียดและสิ่งที่ผู้เข้าชมต้องทราบ"
            />{#if errors.body}<Field.FieldError>{errors.body}</Field.FieldError
              >{/if}</Field.Field
          >
          <Field.Field data-invalid={!!errors.priority}
            ><Field.FieldLabel for="priority">ระดับความสำคัญ</Field.FieldLabel
            ><Select.Root type="single" bind:value={priority}
              ><Select.Trigger
                id="priority"
                class="w-full"
                aria-invalid={!!errors.priority}
                >{priorityLabels[priority as keyof typeof priorityLabels] ||
                  "เลือกระดับ"}</Select.Trigger
              ><Select.Content
                ><Select.Group
                  >{#each Object.entries(priorityLabels) as [value, label]}<Select.Item
                      {value}>{label}</Select.Item
                    >{/each}</Select.Group
                ></Select.Content
              ></Select.Root
            >{#if errors.priority}<Field.FieldError
                >{errors.priority}</Field.FieldError
              >{/if}</Field.Field
          >
          <Field.FieldSet
            ><Field.FieldLegend>ปลายทางประกาศ</Field.FieldLegend><Field.Field
              orientation="horizontal"
              ><input
                id="all-sites"
                type="checkbox"
                bind:checked={all}
                class="size-4 accent-primary"
              /><Field.FieldLabel for="all-sites"
                >ทุกเว็บและ Android</Field.FieldLabel
              ></Field.Field
            >{#each sites as site}<Field.Field
                orientation="horizontal"
                data-disabled={all}
                ><input
                  id={`target-${site.id}`}
                  type="checkbox"
                  bind:group={selected}
                  value={site.id}
                  disabled={all}
                  class="size-4 accent-primary"
                /><Field.FieldLabel for={`target-${site.id}`}
                  >{site.name}</Field.FieldLabel
                ></Field.Field
              >{/each}{#if errors.targets}<Field.FieldError
                >{errors.targets}</Field.FieldError
              >{/if}</Field.FieldSet
          >
          <Field.FieldSet
            ><Field.FieldLegend>ช่วงเวลาแสดงผล</Field.FieldLegend
            ><Field.FieldDescription
              >เวลาประเทศไทย (UTC+7)
              เว้นว่างเพื่อเริ่มทันทีหรือไม่กำหนดวันหมดอายุ</Field.FieldDescription
            ><Field.Field
              ><Field.FieldLabel for="start">เริ่มแสดง</Field.FieldLabel><Input
                id="start"
                name="start_at"
                type="datetime-local"
                bind:value={start}
                aria-invalid={!!errors.start_at}
              />{#if errors.start_at}<Field.FieldError
                  >{errors.start_at}</Field.FieldError
                >{/if}</Field.Field
            ><Field.Field
              ><Field.FieldLabel for="end">หมดอายุ</Field.FieldLabel><Input
                id="end"
                name="end_at"
                type="datetime-local"
                bind:value={end}
                aria-invalid={!!errors.end_at}
              />{#if errors.end_at}<Field.FieldError
                  >{errors.end_at}</Field.FieldError
                >{/if}</Field.Field
            ></Field.FieldSet
          >
          <Field.FieldSet
            ><Field.FieldLegend>ลิงก์เพิ่มเติม</Field.FieldLegend><Field.Field
              ><Field.FieldLabel for="link-label"
                >ชื่อปุ่มลิงก์</Field.FieldLabel
              ><Input
                id="link-label"
                name="link_label"
                bind:value={linkLabel}
                maxlength={80}
                placeholder="เช่น ไปที่ SOS KMITL"
                aria-invalid={!!errors.link_label}
              />{#if errors.link_label}<Field.FieldError
                  >{errors.link_label}</Field.FieldError
                >{/if}</Field.Field
            ><Field.Field
              ><Field.FieldLabel for="link-url">ลิงก์หลัก</Field.FieldLabel
              ><Input
                id="link-url"
                name="link_url"
                type="url"
                bind:value={linkUrl}
                placeholder="https://"
                aria-invalid={!!errors.link_url}
              />{#if errors.link_url}<Field.FieldError
                  >{errors.link_url}</Field.FieldError
                >{/if}</Field.Field
            ><Field.Field
              ><Field.FieldLabel for="source-url">ลิงก์อ้างอิง</Field.FieldLabel
              ><Input
                id="source-url"
                name="source_url"
                type="url"
                bind:value={sourceUrl}
                placeholder="https://"
                aria-invalid={!!errors.source_url}
              />{#if errors.source_url}<Field.FieldError
                  >{errors.source_url}</Field.FieldError
                >{/if}</Field.Field
            ></Field.FieldSet
          >
        </Field.FieldGroup>
        <aside class="flex flex-col gap-3 lg:sticky lg:top-0 lg:self-start">
          <p
            class="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <Eye aria-hidden="true" class="size-4" />ตัวอย่างป๊อปอัป
          </p>
          <div
            class="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <Badge
              variant={priority === "emergency" ? "destructive" : "secondary"}
              >{priorityLabels[priority as keyof typeof priorityLabels] ||
                "ทั่วไป"}</Badge
            >
            <h3 class="break-words text-lg font-semibold">
              {title || "หัวข้อประกาศ"}
            </h3>
            <p
              class="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground"
            >
              {body || "ข้อความประกาศจะแสดงที่นี่"}
            </p>
            {#if previewUrl}<Button
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-11"
                >{linkLabel || "เปิดลิงก์"}<ExternalLink
                  data-icon="inline-end"
                /></Button
              >{/if}
            {#if previewSource}<Button
                href={previewSource}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                class="min-h-11"
                >อ่านข้อมูลอ้างอิง<ExternalLink
                  data-icon="inline-end"
                /></Button
              >{/if}
            <Button type="button" variant="secondary" disabled class="min-h-11"
              >รับทราบ</Button
            >
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            ปิดแล้วจะไม่เด้งซ้ำระหว่างอยู่ในเว็บ
            แต่จะขึ้นอีกครั้งเมื่อเปิดหรือรีโหลดเว็บ
          </p>
        </aside>
      </div>
      <Dialog.Footer class="flex-wrap gap-2"
        ><Button
          type="button"
          variant="ghost"
          onclick={() => (open = false)}
          disabled={pending}
          class="min-h-11">ยกเลิก</Button
        ><Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={pending}
          class="min-h-11"
          >{#if pending}<Spinner data-icon="inline-start" />{:else}<Save
              data-icon="inline-start"
            />{/if}บันทึกฉบับร่าง</Button
        ><Button
          type="submit"
          name="intent"
          value="published"
          disabled={pending}
          class="min-h-11"
          >{#if pending}<Spinner data-icon="inline-start" />{:else}<Send
              data-icon="inline-start"
            />{/if}{item ? "บันทึกและเผยแพร่" : "เผยแพร่ประกาศ"}</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>
