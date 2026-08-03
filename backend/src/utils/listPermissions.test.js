import { isOwner, memberRole, canView, canEdit } from "./listPermissions.js";

const listWithMembers = (userId) => ({
  user: userId,
  members: [
    { user: "member1", role: "editor" },
    { user: "member2", role: "viewer" },
  ],
});

describe("isOwner", () => {
  it("returns true for the list owner", () => {
    expect(isOwner(listWithMembers("userA"), "userA")).toBe(true);
  });

  it("returns false for other users", () => {
    expect(isOwner(listWithMembers("userA"), "member1")).toBe(false);
  });
});

describe("memberRole", () => {
  const list = listWithMembers("userA");

  it("returns owner for the owner", () => {
    expect(memberRole(list, "userA")).toBe("owner");
  });

  it("returns editor for editors", () => {
    expect(memberRole(list, "member1")).toBe("editor");
  });

  it("returns viewer for viewers", () => {
    expect(memberRole(list, "member2")).toBe("viewer");
  });

  it("returns null for strangers", () => {
    expect(memberRole(list, "stranger")).toBe(null);
  });
});

describe("permission helpers", () => {
  it("lets owner, editor and viewer view", () => {
    expect(canView("owner")).toBe(true);
    expect(canView("editor")).toBe(true);
    expect(canView("viewer")).toBe(true);
  });

  it("lets owner and editor edit but not viewer", () => {
    expect(canEdit("owner")).toBe(true);
    expect(canEdit("editor")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });
});
