# Announcements — ศูนย์ประกาศกลาง

โปรเจกต์แยกสำหรับ admin และ superadmin ใน PocketBase เดิม เขียนประกาศครั้งเดียวแล้วเลือกทุกเว็บและ Android หรือเฉพาะ init.d / Printer-server / Android ผู้เข้าชมไม่ต้องล็อกอิน เห็นป๊อปอัปทุกครั้งที่เปิดหรือรีโหลดเว็บ

## เริ่มใช้งาน

ใช้ Node.js 22.12 ขึ้นไป ตั้ง POCKETBASE_URL ใน .env (ไม่ต้องมี credential ของ PocketBase superuser)

```powershell
npm ci
npm run dev
```

เปิด http://127.0.0.1:5175 แล้วล็อกอินด้วยบัญชี users เดิมที่เป็น admin หรือ superadmin ใช้รหัสผ่าน หรือ OIDC ถ้า provider เดิมเปิดอยู่ OIDC ต้องอนุญาต callback URL `/auth/callback` ของเว็บนี้ด้วย

## ติดตั้งฐานข้อมูลครั้งเดียว

```powershell
# ตรวจ schema และสิทธิ์ก่อน โดยอ่าน credential จาก init.d
node --env-file=../init.d/.env scripts/setup-db.mjs
node --env-file=../init.d/.env scripts/setup-db.mjs --apply --seed-flood
```

เพิ่ม collection announcements เท่านั้น ไม่แก้ collection เดิม บันทึก schema ใน .data/announcements-schema.json ถ้า collection เดิมไม่ตรงจะหยุดให้ตรวจเอง --seed-flood เพิ่มประกาศน้ำท่วมเดิมครั้งเดียว

ผู้ชมอ่านเฉพาะ published ที่ถึงเวลาเริ่มและยังไม่หมดอายุ Admin/superadmin อ่านทุกสถานะ สร้างและแก้ไขได้ โดยตรวจ role จริงจากฐานข้อมูลทุก request ผู้สร้างเปลี่ยนไม่ได้ ไม่เปิดสิทธิ์ลบถาวร ใช้ “ปิดประกาศ” เพื่อเก็บประวัติและเผยแพร่ใหม่ได้

PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD ใช้เฉพาะ CLI ติดตั้ง ไม่ต้องใส่ใน runtime และห้าม commit .env

## การใช้งาน

- กรอกหัวข้อ ข้อความ ความสำคัญ ปลายทางประกาศ และลิงก์ HTTP/HTTPS
- เวลาที่กรอกเป็นเวลาประเทศไทย UTC+7 เว้นเวลาเริ่มเพื่อเริ่มทันที เว้นหมดอายุเพื่อแสดงต่อเนื่อง
- “บันทึกฉบับร่าง” ยังไม่แสดง “เผยแพร่ประกาศ” แสดงเมื่อถึงเวลา
- แก้ไขแล้วเผยแพร่จะเปลี่ยน revision ให้เว็บที่เปิดอยู่เห็นอีกครั้ง
- “ปิดประกาศ” หยุดแสดงในรอบตรวจถัดไปและเก็บรายการไว้

เว็บปลายทางอ่าน PocketBase ร่วมกันผ่าน /api/announcements ตรวจเมื่อเปิดหน้า ทุก 30 วินาทีเมื่อแท็บมองเห็น และเมื่อกลับมาเปิดแท็บ ปิดแล้วไม่เด้งซ้ำในการเปิดเว็บครั้งนั้น ยกเว้นมีประกาศใหม่หรือแก้ไข ไม่มีการเก็บการรับทราบใน localStorage จึงแสดงใหม่เมื่อรีโหลด ข้อความแสดงเป็น plain text

เมื่อยังไม่มี collection หรือโหลดครั้งแรกไม่ได้ จะใช้ประกาศน้ำท่วมสำรองใน src/lib/flood-announcement.ts ของเว็บปลายทาง (enabled: false ปิดสำรองได้) ถ้าโหลดสำเร็จแล้วจะเก็บผลรอบล่าสุดในหน่วยความจำระหว่างการเชื่อมต่อขัดข้อง

## เพิ่มเว็บใหม่

เพิ่มรหัสเว็บใน src/lib/types.ts, validation และ select targets ของ collection หลังสำรอง schema ใช้ endpoint ใน integrations/api-template.ts และ helpers ประกอบ component shadcn/native ตาม frontend ของเว็บใหม่ กำหนด SITE_ID และปรับ fallback เป็น null หากไม่มีประกาศสำรอง “ทุกเว็บ” รองรับเว็บใหม่หลังเชื่อมกับฐานข้อมูลนี้

## ตรวจและรัน production

```powershell
npm run check
npm test
npm run build
npm run test:web
$env:POCKETBASE_URL = 'https://your-pocketbase.example'
$env:ORIGIN = 'https://announcements.example'
$env:PORT = '5175'
npm start
```

test:web ใช้ PocketBase จำลองและ production build ตรวจสิทธิ์ การเผยแพร่ validation และการปิดประกาศ ไม่เรียกฐานข้อมูลจริง ตรวจ UI ด้วย `node tests/mock-pocketbase.mjs` แล้วเปิด dev serverโดยตั้ง POCKETBASE_URL=http://127.0.0.1:31876 บัญชี admin@example.test / superadmin@example.test รหัสผ่าน demo-test-only (ใช้เฉพาะ mock)

ตั้ง ORIGIN ให้ตรง URL จริงหลัง reverse proxy เพื่อให้การตรวจ origin ของ SvelteKit ทำงานถูกต้อง ไม่ expose superuser credential ให้ browser

## ประกาศบน Android

เลือก “ทุกเว็บและ Android” หรือ “Android” เพื่อส่งเข้าแอป CS KMITL เดิมผ่าน Firebase/FCM ผู้ดูแลยังใช้สิทธิ์ admin หรือ superadmin เหมือนเดิม เว็บอ่านประกาศโดยไม่ต้องเข้าสู่ระบบและแสดงใหม่เมื่อรีโหลด ส่วน Android ส่งให้เครื่องที่เข้าสู่ระบบ ลงทะเบียน FCM และอนุญาตแจ้งเตือนแล้ว

Android รับหนึ่งครั้งต่อประกาศและ revision ต่ออุปกรณ์ มีหลายประกาศได้และเก็บแยกในหน้าแจ้งเตือน แตะรายการเพื่ออ่านข้อความเต็มและเปิดลิงก์ แก้ไขแล้วเผยแพร่เป็น revision ใหม่จึงแจ้งอีกครั้ง รอบส่งตรวจทุกนาที รวมประกาศที่ตั้งเวลาเริ่มและอุปกรณ์ที่เพิ่งลงทะเบียน การปิดประกาศยกเลิกคิวที่ยังไม่ส่ง แต่ไม่เรียกคืน notification ที่ส่งไปแล้ว

Backend ใช้โปรเจกต์ `../cskmitl-android-backend` และ migration `1790450000_add_announcement_push.js` เพื่อเพิ่ม target Android และคิวรายอุปกรณ์ ต้องติดตั้ง backend นี้ก่อนเลือก Android ในระบบจริง
