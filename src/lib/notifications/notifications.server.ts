import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { parseNotificationPrefs } from "@/lib/users/users.server";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { renderOrderPlacedEmail } from "./templates/orderPlaced.email";
import { renderOrderPlacedSms } from "./templates/orderPlaced.sms";

type NotifyOrderPlacedInput = {
  orderRef: string;
  accountId: string;
  accountName: string;
  placedByName: string;
  deliveryAddress: string | null;
  items: { productName: string; boxes: number; extraBottles: number }[];
};

type NotificationRecipient = {
  email: string;
  phone: string | null;
  notificationPreferences: { email: boolean; sms: boolean };
};

function mapRecipients(
  users: { email: string | null; phone: string | null; notification_preferences: unknown }[],
): NotificationRecipient[] {
  return users.flatMap((user) => {
    if (!user.email) return [];
    return [
      {
        email: user.email,
        phone: user.phone ?? null,
        notificationPreferences: parseNotificationPrefs(user.notification_preferences),
      },
    ];
  });
}

async function fetchAccountRecipients(accountId: string): Promise<NotificationRecipient[]> {
  const admin = createSupabaseAdminClient();

  const [accountUsersResult, staffAdminResult] = await Promise.all([
    admin.from("account_users").select("user_id").eq("account_id", accountId),
    admin
      .from("users_with_email")
      .select("email, phone, notification_preferences")
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
          .from("users_with_email")
          .select("email, phone, notification_preferences")
          .in("id", accountUserIds)
      : { data: [], error: null };

  if (accountUsersData.error) {
    console.error("[notifications] failed to fetch account user details:", accountUsersData.error);
    return [];
  }

  const allUsers = [...(accountUsersData.data ?? []), ...(staffAdminResult.data ?? [])];

  // Deduplicate by email — an admin assigned to the account appears in both lists
  const seen = new Set<string>();
  const unique = allUsers.filter((u) => {
    if (!u.email || seen.has(u.email)) return false;
    seen.add(u.email);
    return true;
  });

  return mapRecipients(unique);
}

export async function notifyOrderPlaced(input: NotifyOrderPlacedInput): Promise<void> {
  const recipients = await fetchAccountRecipients(input.accountId);

  if (recipients.length === 0) return;

  const emailTemplate = renderOrderPlacedEmail({
    orderRef: input.orderRef,
    accountName: input.accountName,
    placedByName: input.placedByName,
    deliveryAddress: input.deliveryAddress,
    items: input.items,
  });

  const smsBody = renderOrderPlacedSms({
    orderRef: input.orderRef,
    accountName: input.accountName,
    placedByName: input.placedByName,
  });

  await Promise.allSettled(
    recipients.flatMap((recipient) => {
      const tasks: Promise<void>[] = [];

      if (recipient.notificationPreferences.email) {
        tasks.push(
          sendEmail({
            to: recipient.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          }).catch((error) =>
            console.error("[notifications] email failed for", recipient.email, error),
          ),
        );
      }

      if (recipient.notificationPreferences.sms && recipient.phone) {
        tasks.push(
          sendSms({ to: recipient.phone, body: smsBody }).catch((error) =>
            console.error("[notifications] sms failed for", recipient.phone, error),
          ),
        );
      }

      return tasks;
    }),
  );
}
