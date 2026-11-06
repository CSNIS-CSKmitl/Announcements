import { json } from "@sveltejs/kit";
import { createHash } from "node:crypto";
import { getAdmin, sourceIp } from "$lib/server/pocketbase-admin";
import type { RequestHandler } from "./$types";

const SITE_ID_MAP: Record<string, string> = {
  booking: "utmqt5k92gmsodh",
  borrowly: "3kzy4o7ckfcrsm9",
  loan: "3kzy4o7ckfcrsm9",
  "borrow-item": "3kzy4o7ckfcrsm9",
  announcements: "ow2zg8jqdqai2t9",
  announcement: "ow2zg8jqdqai2t9",
  printer: "ytan4m3hbzj53zt",
  "printer-server": "ytan4m3hbzj53zt",
  initd: "r2e4nkzzi6mae93",
  "init.d": "r2e4nkzzi6mae93",
  "init-d": "r2e4nkzzi6mae93",
  csnis: "i1xjo94dysy434b",
  "csnis-portal": "i1xjo94dysy434b",
  android: "2cfqpyms90uk8pf",
  jupyterhub: "nmeunbwtz11fxde",
  aipass: "pdvl438335wuv5h",
  "ai-passport": "pdvl438335wuv5h",
};

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user || !locals.user.isAdmin) {
    return json({ message: "Forbidden" }, { status: 403 });
  }
  const client = (await getAdmin()) ?? locals.pb;
  try {
    const reads = await client.collection("announcement_reads").getFullList({
      sort: "-created",
      fields: "id,announcement,revision,site,user,viewer_hash,created",
    });
    return json(
      { reads, configured: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    const status = (cause as { status?: number })?.status;
    if (status === 404 || status === 403) {
      return json(
        { reads: [], configured: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return json(
      { reads: [], configured: false, error: "ไม่สามารถโหลดสถิติการอ่านได้" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
};

export const POST: RequestHandler = async (event) => {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await event.request.json()) as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, message: "ข้อมูล JSON ไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const announcement = String(payload.announcement || payload.id || "").trim();
  const revision = String(payload.revision || "v1")
    .trim()
    .slice(0, 100);
  const rawSite = String(payload.site || "initd")
    .trim()
    .toLowerCase();
  const site =
    SITE_ID_MAP[rawSite] ||
    (/^[a-z0-9]{15}$/.test(rawSite) ? rawSite : SITE_ID_MAP["initd"]);
  const user =
    typeof payload.user === "string" && /^[a-z0-9]{15}$/.test(payload.user)
      ? payload.user
      : event.locals.user?.id || undefined;

  if (!announcement || !/^[a-zA-Z0-9_-]{1,32}$/.test(announcement)) {
    return json(
      { ok: false, message: "รหัสประกาศไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const rawViewer =
    typeof payload.viewer_hash === "string" && payload.viewer_hash.trim()
      ? payload.viewer_hash.trim()
      : `${user || sourceIp(event)}:${event.request.headers.get("user-agent") || "unknown"}`;

  const viewer_hash = createHash("sha256")
    .update(rawViewer)
    .digest("hex")
    .slice(0, 64);

  const client = (await getAdmin()) ?? event.locals.pb;
  try {
    await client.collection("announcement_reads").create({
      announcement,
      revision: revision || "default",
      site,
      ...(user ? { user } : {}),
      viewer_hash,
    });
    return json({ ok: true, recorded: true, configured: true });
  } catch (cause) {
    const status = (cause as { status?: number })?.status;
    // 404 = announcement_reads collection not yet set up; 400 = already recorded (unique index)
    if (status === 404) {
      return json({ ok: true, recorded: false, configured: false });
    }
    if (status === 400) {
      return json({
        ok: true,
        recorded: false,
        duplicate: true,
        configured: true,
      });
    }
    return json({ ok: true, recorded: false, configured: false });
  }
};
