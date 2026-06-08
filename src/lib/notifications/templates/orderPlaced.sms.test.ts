import { renderOrderPlacedSms } from "./orderPlaced.sms";

describe("renderOrderPlacedSms", () => {
  it("formats the sms body with order ref, account name, and placed-by name", () => {
    const result = renderOrderPlacedSms({
      orderRef: "ORD-0007",
      accountName: "Acme Wines",
      placedByName: "Jane Smith",
      orderUrl: "https://example.com/orders/abc-123",
    });

    expect(result).toBe(
      "bwow: ORD-0007 placed for Acme Wines by Jane Smith. https://example.com/orders/abc-123",
    );
  });
});
