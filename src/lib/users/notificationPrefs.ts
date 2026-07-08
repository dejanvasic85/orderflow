export type NotificationPrefs = { email: boolean; sms: boolean };

export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TS can't narrow `object` to an indexable record; each field is validated below
    const obj = raw as Record<string, unknown>;
    return {
      email: typeof obj.email === "boolean" ? obj.email : true,
      sms: typeof obj.sms === "boolean" ? obj.sms : false,
    };
  }
  return { email: true, sms: false };
}
