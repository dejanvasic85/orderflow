import { getServerConfig } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isStaffOrAdmin, type UserRole, type UserWithEmailRow } from "@/lib/users/schema";
import { parseNotificationPrefs } from "@/lib/users/users.server";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { renderOrderPlacedSms } from "./templates/orderPlaced.sms";
import { renderOrderPlacedAccount } from "./templates/OrderPlacedAccount";
import { renderOrderPlacedPlacer } from "./templates/OrderPlacedPlacer";
import { renderOrderPlacedStaff } from "./templates/OrderPlacedStaff";
import { renderPasswordChanged } from "./templates/PasswordChanged";
import type { OrderEmailInput } from "./templates/types";

type NotifyOrderPlacedInput = Omit<OrderEmailInput, "orderUrl"> & {
  orderId: string;
  accountId: string;
  placedById: string;
};

function buildOrderUrl(
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

type NotificationRecipient = {
  id: string;
  email: string | null;
  phone: string | null;
  role: NonNullable<UserWithEmailRow["role"]>;
  notificationPreferences: { email: boolean; sms: boolean };
};

type RecipientRow = Pick<
  UserWithEmailRow,
  "id" | "email" | "phone" | "role" | "notification_preferences"
>;

function mapRecipients(users: RecipientRow[]): NotificationRecipient[] {
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

async function fetchOrderRecipients(accountId: string): Promise<NotificationRecipient[]> {
  const admin = createSupabaseAdminClient();

  const [accountUsersResult, staffAdminResult] = await Promise.all([
    admin.from("account_users").select("user_id").eq("account_id", accountId),
    admin
      .from("users")
      .select("id, phone, role, notification_preferences")
      .in("role", ["admin", "staff"]),
  ]);

  if (accountUsersResult.error) {
    console.error("[notifications] failed to fetch account_users:", accountUsersResult.error);
    return [];
  }

  if (staffAdminResult.error) {
    console.error("[notifications] failed to fetch staff/admin users:", staffAdminResult.error);
    return [];
  }

  const accountUserIds = (accountUsersResult.data ?? []).map((row) => row.user_id);

  const accountUsersData =
    accountUserIds.length > 0
      ? await admin
          .from("users")
          .select("id, phone, role, notification_preferences")
          .in("id", accountUserIds)
      : { data: [], error: null };

  if (accountUsersData.error) {
    console.error("[notifications] failed to fetch account user details:", accountUsersData.error);
    return [];
  }

  const allUsers = [...(accountUsersData.data ?? []), ...(staffAdminResult.data ?? [])];

  const seen = new Set<string>();
  const uniqueUsers = allUsers.filter((u) => {
    const key = u.id ?? "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueUsers.length === 0) {
    return [];
  }

  const userIds = uniqueUsers.map((u) => u.id);
  const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.error("[notifications] failed to fetch auth users:", authError);
    return [];
  }

  const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email ?? null]));

  const withEmails: RecipientRow[] = uniqueUsers
    .filter((u) => userIds.includes(u.id))
    .map((u) => ({
      ...u,
      email: emailMap.get(u.id) ?? null,
    }));

  return mapRecipients(withEmails);
}

export async function notifyOrderPlaced(input: NotifyOrderPlacedInput): Promise<void> {
  const recipients = await fetchOrderRecipients(input.accountId);
  if (recipients.length === 0) {
    console.log("WARN: notifyOrderPlaced: There are no recipients");
    return;
  }

  const { SITE_URL: siteUrl } = getServerConfig();

  const baseInput = {
    orderRef: input.orderRef,
    accountName: input.accountName,
    placedByName: input.placedByName,
    deliveryAddress: input.deliveryAddress,
    items: input.items,
  };

  console.log("**** notifyOrderPlaced: baseInput", baseInput);

  await Promise.allSettled(
    recipients.flatMap((recipient) => {
      const tasks: Promise<void>[] = [];
      const orderUrl = buildOrderUrl(siteUrl, input.orderId, input.accountId, recipient.role);
      const emailInput: OrderEmailInput = { ...baseInput, orderUrl };

      console.log("*** Recipient...", recipient.email, recipient.notificationPreferences);

      if (recipient.notificationPreferences.email && recipient.email) {
        const isPlacer = recipient.id === input.placedById;

        const templatePromise = isStaffOrAdmin(recipient.role)
          ? renderOrderPlacedStaff(emailInput)
          : isPlacer
            ? renderOrderPlacedPlacer(emailInput)
            : renderOrderPlacedAccount(emailInput);

        tasks.push(
          templatePromise
            .then((template) =>
              sendEmail({ to: recipient.email!, subject: template.subject, html: template.html }),
            )
            .catch((error) => console.error("[notifications] email send failed:", error)),
        );
      }

      if (recipient.notificationPreferences.sms && recipient.phone) {
        tasks.push(
          sendSms({
            to: recipient.phone,
            body: renderOrderPlacedSms({ ...baseInput, orderUrl }),
          }).catch((error) => console.error("[notifications] sms send failed:", error)),
        );
      }

      return tasks;
    }),
  );
}

export async function notifyPasswordChanged(input: { email: string }): Promise<void> {
  try {
    const template = await renderPasswordChanged({ email: input.email });
    await sendEmail({ to: input.email, subject: template.subject, html: template.html });
  } catch (error) {
    console.error("[notifications] password changed email send failed:", error);
  }
}
