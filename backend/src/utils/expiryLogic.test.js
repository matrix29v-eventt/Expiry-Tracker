import { classifyExpiry, daysUntil } from "./expiryLogic.js";

describe("classifyExpiry", () => {
  const now = new Date("2026-08-03T12:00:00");

  it("classifies past dates as expired", () => {
    expect(classifyExpiry("2026-08-02T23:59:59", now)).toBe("expired");
  });

  it("classifies any time today as expiringToday", () => {
    expect(classifyExpiry("2026-08-03T00:00:00", now)).toBe("expiringToday");
    expect(classifyExpiry("2026-08-03T23:59:59", now)).toBe("expiringToday");
  });

  it("classifies tomorrow as upcoming", () => {
    expect(classifyExpiry("2026-08-04T00:00:00", now)).toBe("upcoming");
  });
});

describe("daysUntil", () => {
  const now = new Date("2026-08-03T12:00:00");

  it("rounds partial days up", () => {
    expect(daysUntil("2026-08-04T12:00:00", now)).toBe(1);
    expect(daysUntil("2026-08-03T18:00:00", now)).toBe(1);
  });

  it("returns negative for past dates", () => {
    expect(daysUntil("2026-08-02T12:00:00", now)).toBe(-1);
  });
});
