import { normalizePhone, userChannels } from "./notification.service.js";

describe("normalizePhone", () => {
  it("strips non-digits", () => {
    expect(normalizePhone("+91 98765 43210", "91")).toBe("919876543210");
  });

  it("drops the 00 international prefix", () => {
    expect(normalizePhone("00919876543210", "91")).toBe("919876543210");
  });

  it("prepends the country code when missing", () => {
    expect(normalizePhone("9876543210", "91")).toBe("919876543210");
  });

  it("does not duplicate an existing country code", () => {
    expect(normalizePhone("919876543210", "91")).toBe("919876543210");
  });

  it("returns empty string for missing numbers", () => {
    expect(normalizePhone("", "91")).toBe("");
    expect(normalizePhone(undefined, "91")).toBe("");
    expect(normalizePhone(null, "91")).toBe("");
  });
});

describe("userChannels", () => {
  const base = {
    email: "test@example.com",
    notificationPreferences: { email: true, whatsapp: false },
  };

  it("includes email when enabled", () => {
    expect(userChannels(base)).toContain("email");
  });

  it("excludes email when disabled", () => {
    const user = {
      ...base,
      notificationPreferences: { email: false, whatsapp: false },
    };
    expect(userChannels(user)).not.toContain("email");
  });

  it("includes whatsapp only when a phone number is present", () => {
    const withPhone = {
      ...base,
      phone: "9876543210",
      countryCode: "91",
      notificationPreferences: { email: true, whatsapp: true },
    };
    expect(userChannels(withPhone)).toContain("whatsapp");

    const withoutPhone = {
      ...withPhone,
      phone: "",
    };
    expect(userChannels(withoutPhone)).not.toContain("whatsapp");
  });

  it("includes push when subscriptions exist", () => {
    const user = {
      ...base,
      pushSubscriptions: [{ endpoint: "https://push/1", keys: {} }],
    };
    expect(userChannels(user)).toContain("push");
  });

  it("excludes push when there are no subscriptions", () => {
    expect(userChannels({ ...base, pushSubscriptions: [] })).not.toContain("push");
  });
});
