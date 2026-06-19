import { parseNotificationPrefs } from "@/lib/users/notificationPrefs";
import { isStaffOrAdmin, type UserRole, type UserWithEmailRow } from "@/lib/users/schema";
import type { OrderEmailInput } from "./templates/types";

export type NotificationRecipient = {
  id: string;
  email: string | null;
  phone: string | null;
  role: NonNullable<UserWithEmailRow["role"]>;
  notificationPreferences: { email: boolean; sms: boolean };
};

export type RecipientRow = Pick<
  UserWithEmailRow,
  "id" | "email" | "phone" | "role" | "notification_preferences"
>;

export function buildOrderUrl(
  siteUrl: string,
  orderId: string,
  accountId: string,
  role: UserRole,
): string {
  if (isStaffOrAdmin(role)) {
    return `${siteUrl}/manage/orders/${orderId}`;
  }
  return `${siteUrl}/accounts/${accountId}/orders/${orderId}`;
}

/** Maps raw user rows into recipients, dropping anyone with neither email nor phone. */
export function mapRecipients(users: RecipientRow[]): NotificationRecipient[] {
  return users.flatMap((user) => {
    if (!user.email && !user.phone) return [];
    return [
      {
        id: user.id ?? "",
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role ?? "user",
        notificationPreferences: parseNotificationPrefs(user.notification_preferences),
      },
    ];
  });
}

/** Removes duplicate users by id, keeping first occurrence; drops rows with no id. */
export function dedupeById<T extends { id: string | null }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.id ?? "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type EmailTemplateKind = "staff" | "placer" | "account";

export type NotificationIntent =
  | { channel: "email"; to: string; template: EmailTemplateKind; emailInput: OrderEmailInput }
  | { channel: "sms"; to: string; smsInput: Omit<OrderEmailInput, "deliveryAddress" | "items"> };

export type PlanNotificationsInput = {
  recipients: NotificationRecipient[];
  siteUrl: string;
  orderId: string;
  accountId: string;
  placedById: string;
  baseInput: Omit<OrderEmailInput, "orderUrl">;
};

/**
 * Pure decision: given the recipients and order context, produce the list of
 * email/SMS intents to send. Decides per recipient which email template applies
 * (staff vs the placer vs a plain account member) and whether each channel fires
 * based on their preferences and available contact details.
 */
export function planNotifications(input: PlanNotificationsInput): NotificationIntent[] {
  const intents: NotificationIntent[] = [];

  for (const recipient of input.recipients) {
    const orderUrl = buildOrderUrl(input.siteUrl, input.orderId, input.accountId, recipient.role);
    const emailInput: OrderEmailInput = { ...input.baseInput, orderUrl };

    if (recipient.notificationPreferences.email && recipient.email) {
      const isPlacer = recipient.id === input.placedById;
      const template: EmailTemplateKind = isStaffOrAdmin(recipient.role)
        ? "staff"
        : isPlacer
          ? "placer"
          : "account";
      intents.push({ channel: "email", to: recipient.email, template, emailInput });
    }

    if (recipient.notificationPreferences.sms && recipient.phone) {
      intents.push({
        channel: "sms",
        to: recipient.phone,
        smsInput: {
          orderRef: input.baseInput.orderRef,
          accountName: input.baseInput.accountName,
          placedByName: input.baseInput.placedByName,
          orderUrl,
        },
      });
    }
  }

  return intents;
}
