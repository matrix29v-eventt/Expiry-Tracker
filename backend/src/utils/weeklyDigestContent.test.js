import { buildDigestBody, buildDigestHtml } from "./weeklyDigestContent.js";

const products = [
  { name: "Milk", expiryDate: "2026-08-06T00:00:00", category: "Food & Beverages", quantity: 2, unit: "liters" },
  { name: "Aspirin", expiryDate: "2026-08-10T00:00:00", category: "Medicine" },
];

describe("buildDigestBody", () => {
  it("includes product names and expiry dates", () => {
    const html = buildDigestBody(products, "Ada");
    expect(html).toContain("Ada");
    expect(html).toContain("Milk");
    expect(html).toContain("Aspirin");
  });

  it("renders quantity prefix when quantity is above one", () => {
    const html = buildDigestBody(products, "Ada");
    expect(html).toContain("2 liters Milk");
  });

  it("renders days-left status", () => {
    const html = buildDigestBody(products, "Ada");
    expect(html).toMatch(/days left/);
  });
});

describe("buildDigestHtml", () => {
  it("wraps the body in the shared email layout", () => {
    const html = buildDigestHtml({ userName: "Ada", products });
    expect(html).toContain("weekly expiry digest");
    expect(html).toContain("Ada");
    expect(html).toContain("Milk");
  });
});
