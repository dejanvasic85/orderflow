import {
  buildOrderUrl,
  dedupeById,
  mapRecipients,
  planNotifications,
  type NotificationRecipient,
} from "./notifications.service";

describe("buildOrderUrl", () => {
  it("routes admins to the manage path", () => {
    const url = buildOrderUrl("https://app.test", "order-1", "acc-1", "admin");

    expect(url).toBe("https://app.test/manage/orders/order-1");
  });

  it("routes staff to the manage path", () => {
    const url = buildOrderUrl("https://app.test", "order-1", "acc-1", "staff");

    expect(url).toBe("https://app.test/manage/orders/order-1");
  });

  it("routes regular users to the account-scoped path", () => {
    const url = buildOrderUrl("https://app.test", "order-1", "acc-1", "user");

    expect(url).toBe("https://app.test/accounts/acc-1/orders/order-1");
  });
});

describe("mapRecipients", () => {
  it("drops users with neither email nor phone", () => {
    const result = mapRecipients([
      {
        id: "u-1",
        email: null,
        phone: null,
        role: "user",
        notification_preferences: { email: true, sms: true },
      },
    ]);

    expect(result).toEqual([]);
  });

  it("keeps a user with an email and parses their preferences", () => {
    const result = mapRecipients([
      {
        id: "u-1",
        email: "user@test.com",
        phone: null,
        role: "user",
        notification_preferences: { email: true, sms: false },
      },
    ]);

    expect(result).toEqual([
      {
        id: "u-1",
        email: "user@test.com",
        phone: null,
        role: "user",
        notificationPreferences: { email: true, sms: false },
      },
    ]);
  });

  it("defaults missing role to user and falls back preferences when unparseable", () => {
    const result = mapRecipients([
      {
        id: "u-1",
        email: "user@test.com",
        phone: null,
        role: null,
        notification_preferences: null,
      },
    ]);

    expect(result).toEqual([
      {
        id: "u-1",
        email: "user@test.com",
        phone: null,
        role: "user",
        notificationPreferences: { email: true, sms: false },
      },
    ]);
  });
});

describe("dedupeById", () => {
  it("keeps the first occurrence of each id", () => {
    const result = dedupeById([
      { id: "a", tag: "first" },
      { id: "b", tag: "second" },
      { id: "a", tag: "duplicate" },
    ]);

    expect(result).toEqual([
      { id: "a", tag: "first" },
      { id: "b", tag: "second" },
    ]);
  });

  it("drops rows without an id", () => {
    const result = dedupeById([
      { id: null, tag: "no-id" },
      { id: "b", tag: "kept" },
    ]);

    expect(result).toEqual([{ id: "b", tag: "kept" }]);
  });
});

const baseInput = {
  orderRef: "ORD-0007",
  accountName: "Acme Wines",
  placedByName: "Jane Smith",
  deliveryAddress: "1 Vine St",
  items: [{ productName: "Shiraz", boxes: 2, extraUnits: 1 }],
};

function recipient(overrides: Partial<NotificationRecipient> = {}): NotificationRecipient {
  return {
    id: "u-1",
    email: "user@test.com",
    phone: "0400000000",
    role: "user",
    notificationPreferences: { email: true, sms: false },
    ...overrides,
  };
}

describe("planNotifications", () => {
  it("uses the staff template for staff/admin recipients", () => {
    const intents = planNotifications({
      recipients: [recipient({ id: "s-1", role: "staff" })],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([
      {
        channel: "email",
        to: "user@test.com",
        template: "staff",
        emailInput: { ...baseInput, orderUrl: "https://app.test/manage/orders/order-1" },
      },
    ]);
  });

  it("uses the placer template when the recipient placed the order", () => {
    const intents = planNotifications({
      recipients: [recipient({ id: "u-9", role: "user" })],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([
      {
        channel: "email",
        to: "user@test.com",
        template: "placer",
        emailInput: { ...baseInput, orderUrl: "https://app.test/accounts/acc-1/orders/order-1" },
      },
    ]);
  });

  it("uses the account template for a non-placer account user", () => {
    const intents = planNotifications({
      recipients: [recipient({ id: "u-1", role: "user" })],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([
      {
        channel: "email",
        to: "user@test.com",
        template: "account",
        emailInput: { ...baseInput, orderUrl: "https://app.test/accounts/acc-1/orders/order-1" },
      },
    ]);
  });

  it("skips email when the recipient has email notifications disabled", () => {
    const intents = planNotifications({
      recipients: [recipient({ notificationPreferences: { email: false, sms: false } })],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([]);
  });

  it("skips email when the recipient has no email address", () => {
    const intents = planNotifications({
      recipients: [recipient({ email: null })],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([]);
  });

  it("adds an sms intent when sms is enabled and a phone exists", () => {
    const intents = planNotifications({
      recipients: [
        recipient({ notificationPreferences: { email: false, sms: true }, phone: "0411111111" }),
      ],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([
      {
        channel: "sms",
        to: "0411111111",
        smsInput: {
          orderRef: "ORD-0007",
          accountName: "Acme Wines",
          placedByName: "Jane Smith",
          orderUrl: "https://app.test/accounts/acc-1/orders/order-1",
        },
      },
    ]);
  });

  it("produces both email and sms intents when both channels are enabled", () => {
    const intents = planNotifications({
      recipients: [
        recipient({ notificationPreferences: { email: true, sms: true }, phone: "0411111111" }),
      ],
      siteUrl: "https://app.test",
      orderId: "order-1",
      accountId: "acc-1",
      placedById: "u-9",
      baseInput,
    });

    expect(intents).toEqual([
      {
        channel: "email",
        to: "user@test.com",
        template: "account",
        emailInput: { ...baseInput, orderUrl: "https://app.test/accounts/acc-1/orders/order-1" },
      },
      {
        channel: "sms",
        to: "0411111111",
        smsInput: {
          orderRef: "ORD-0007",
          accountName: "Acme Wines",
          placedByName: "Jane Smith",
          orderUrl: "https://app.test/accounts/acc-1/orders/order-1",
        },
      },
    ]);
  });
});
