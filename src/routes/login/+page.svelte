<script lang="ts">
  import { enhance } from "$app/forms";
  import * as Card from "$lib/components/ui/card";
  import * as Field from "$lib/components/ui/field";
  import * as Alert from "$lib/components/ui/alert";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Spinner } from "$lib/components/ui/spinner";
  import { ShieldCheck, ArrowRight } from "@lucide/svelte";
  import type { PageData, ActionData } from "./$types";
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let pending = $state(false);
</script>

<div class="mx-auto mt-6 max-w-md sm:mt-16">
  <Card.Root
    ><Card.Header
      ><ShieldCheck
        aria-hidden="true"
        class="mb-3 size-8 text-primary"
      /><Card.Title>เข้าสู่ระบบจัดการประกาศ</Card.Title><Card.Description
        >ใช้บัญชีแอดมินหรือ Superadmin ของ CS KMITL</Card.Description
      ></Card.Header
    ><Card.Content>
      <form
        method="POST"
        use:enhance={() => {
          pending = true;
          return async ({ update }) => {
            try {
              await update();
            } finally {
              pending = false;
            }
          };
        }}
        class="flex flex-col gap-5"
      >
        {#if form?.error}<Alert.Root variant="destructive"
            ><Alert.Title>เข้าสู่ระบบไม่สำเร็จ</Alert.Title><Alert.Description
              >{form.error}</Alert.Description
            ></Alert.Root
          >{/if}
        <Field.FieldGroup
          ><Field.Field
            ><Field.FieldLabel for="identity"
              >ชื่อผู้ใช้หรืออีเมล</Field.FieldLabel
            ><Input
              id="identity"
              name="identity"
              autocomplete="username"
              value={form?.identity || ""}
              required
            /></Field.Field
          ><Field.Field
            ><Field.FieldLabel for="password">รหัสผ่าน</Field.FieldLabel><Input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            /></Field.Field
          ></Field.FieldGroup
        >
        <Button type="submit" disabled={pending} class="min-h-11 w-full"
          >{#if pending}<Spinner
              data-icon="inline-start"
            />{/if}เข้าสู่ระบบ<ArrowRight data-icon="inline-end" /></Button
        >
      </form>
      {#if data.oidc}<Button
          href="/auth/oidc"
          variant="outline"
          class="mt-3 min-h-11 w-full">เข้าสู่ระบบด้วย KMITL SSO</Button
        >{/if}
    </Card.Content><Card.Footer
      ><p class="text-xs leading-relaxed text-muted-foreground">
        เผยแพร่ประกาศถึง init.d และ Printer-server จากที่เดียว
      </p></Card.Footer
    ></Card.Root
  >
</div>
