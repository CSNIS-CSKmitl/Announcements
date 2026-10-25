# Announcements — กดแล้วโค้ดไปไหน

```mermaid
flowchart LR
  A[กดสร้างหรือแก้ประกาศ] --> B[+page.svelte: edit]
  B --> C[AnnouncementEditor.svelte: form ?/save]
  C --> D[+page.server.ts: actions.save]
  D --> E[validation.mjs: validateAnnouncement]
  E --> F[(PocketBase: announcements)]
  G[กดปิดประกาศ] --> H[+page.svelte: form ?/archive]
  H --> I[+page.server.ts: actions.archive]
  I --> F
```

| ผู้ใช้ทำอะไร | ตามไฟล์และฟังก์ชัน | ผลลัพธ์ |
| --- | --- | --- |
| กด “สร้างประกาศ” หรือแก้รายการ | [+page.svelte](src/routes/+page.svelte) `edit()` เปิด [AnnouncementEditor.svelte](src/lib/components/AnnouncementEditor.svelte) | ยังไม่บันทึก แค่เปิดฟอร์มและเติมค่ารายการเดิม |
| กดบันทึก/เผยแพร่ในฟอร์ม | `form action="?/save"` ใน [AnnouncementEditor.svelte](src/lib/components/AnnouncementEditor.svelte) → `actions.save` ใน [+page.server.ts](src/routes/+page.server.ts) → [validation.mjs](src/lib/validation.mjs) → `locals.pb.collection('announcements').create/update` | ตรวจสิทธิ์ admin และ revision; บันทึก draft หรือ published แล้วหน้าเว็บรับผลจาก form action |
| กดปิดประกาศ | [+page.svelte](src/routes/+page.svelte) ส่ง `?/archive` → `actions.archive` ใน [+page.server.ts](src/routes/+page.server.ts) | ตรวจ revision แล้วตั้ง `status: archived` ใน PocketBase |
| กดรีเฟรช | `refresh()` ใน [+page.svelte](src/routes/+page.svelte) → SvelteKit `invalidateAll()` → `load` ใน [+page.server.ts](src/routes/+page.server.ts) | ดึงรายการล่าสุดมาแสดง |

อ่าน [คู่มือระบบ](../Docs/HandOn/announcements.md) สำหรับกติกาการเผยแพร่และการเชื่อมเว็บปลายทาง
