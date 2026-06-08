import { renderOrderPlacedEmail } from "./orderPlaced.email";

const baseInput = {
  orderRef: "ORD-0042",
  accountName: "Acme Wines",
  placedByName: "Jane Smith",
  deliveryAddress: "12 Main St, Melbourne VIC 3000",
  items: [
    { productName: "Penfolds Grange", boxes: 2, extraBottles: 1 },
    { productName: "Henschke Hill of Grace", boxes: 1, extraBottles: 0 },
  ],
};

describe("renderOrderPlacedEmail", () => {
  it("generates correct subject", () => {
    const { subject } = renderOrderPlacedEmail(baseInput);

    expect(subject).toBe("New order ORD-0042 placed for Acme Wines");
  });

  it("includes order ref, account name, and placed-by name in html", () => {
    const { html } = renderOrderPlacedEmail(baseInput);

    expect(html).toContain("ORD-0042");
    expect(html).toContain("Acme Wines");
    expect(html).toContain("Jane Smith");
  });

  it("includes product names and quantities in html", () => {
    const { html } = renderOrderPlacedEmail(baseInput);

    expect(html).toContain("Penfolds Grange");
    expect(html).toContain("Henschke Hill of Grace");
    expect(html).toContain(">2<");
    expect(html).toContain(">1<");
  });

  it("includes delivery address when provided", () => {
    const { html } = renderOrderPlacedEmail(baseInput);

    expect(html).toContain("12 Main St, Melbourne VIC 3000");
  });

  it("omits delivery address row when null", () => {
    const { html } = renderOrderPlacedEmail({ ...baseInput, deliveryAddress: null });

    expect(html).not.toContain("Delivery address");
  });
});
