import test from "node:test";
import assert from "node:assert/strict";

function getUserRoles(record) {
  if (!record) return [];
  const roles = new Set();
  if (Array.isArray(record.roles)) {
    for (const r of record.roles) {
      if (typeof r === "string") roles.add(r.toLowerCase().trim());
    }
  }
  const expanded = record.expand?.user_type;
  if (Array.isArray(expanded)) {
    for (const item of expanded) {
      if (item?.type) roles.add(item.type.toLowerCase().trim());
      if (item?.id) addIdRole(item.id, roles);
    }
  } else if (expanded && typeof expanded === "object") {
    if (expanded.type) roles.add(expanded.type.toLowerCase().trim());
    if (expanded.id) addIdRole(expanded.id, roles);
  }
  return Array.from(roles);
}

function addIdRole(id, set) {
  if (id === "000000000000000") set.add("admin");
  if (id === "000000000000009") {
    set.add("superadmin");
    set.add("super_admin");
  }
  if (id === "000000000000005") set.add("head");
}

function isAnnouncementsAdmin(user) {
  if (!user) return false;
  if (user.email === "log@cskmitl.com") return true;
  const roles = getUserRoles(user);
  return (
    roles.includes("admin") ||
    roles.includes("superadmin") ||
    roles.includes("super_admin") ||
    roles.includes("head")
  );
}

test("isAnnouncementsAdmin correctly identifies admin permissions", () => {
  assert.equal(isAnnouncementsAdmin({ email: "log@cskmitl.com" }), true);
  assert.equal(
    isAnnouncementsAdmin({ expand: { user_type: { type: "admin" } } }),
    true,
  );
  assert.equal(
    isAnnouncementsAdmin({ expand: { user_type: { type: "superadmin" } } }),
    true,
  );
  assert.equal(
    isAnnouncementsAdmin({ expand: { user_type: { id: "000000000000005" } } }),
    true,
  );
  assert.equal(
    isAnnouncementsAdmin({ expand: { user_type: { type: "student" } } }),
    false,
  );
});
