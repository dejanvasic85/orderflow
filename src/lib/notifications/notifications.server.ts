import { getServerConfig } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendEmail } from "./email";
import {
  dedupeById,
  mapRecipients,
  planNotifications,
  type NotificationIntent,
  type NotificationRecipient,
  type RecipientRow,
} from "./notifications.service";
import { sendSms } from "./sms";
import { renderAdminPasswordSet } from "./templates/AdminPasswordSet";
import { renderOrderPlacedSms } from "./templates/orderPlaced.sms";
import { renderOrderPlacedAccount } from "./templates/OrderPlacedAccount";
import { renderOrderPlacedPlacer } from "./templates/OrderPlacedPlacer";
import { renderOrderPlacedStaff } from "./templates/OrderPlacedStaff";
import { renderPasswordChanged } from "./templates/PasswordChanged";
import type { OrderEmailInput } from "./templates/types";

export type NotifyOrderPlacedInput = Omit<OrderEmailInput, "orderUrl"> & {
  orderId: string;
  accountId: string;
  placedById: string;
};

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

  const uniqueUsers = dedupeById(allUsers);

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

const emailRenderers = {
  staff: renderOrderPlacedStaff,
  placer: renderOrderPlacedPlacer,
  account: renderOrderPlacedAccount,
} as const;

function executeIntent(intent: NotificationIntent): Promise<void> {
  if (intent.channel === "email") {
    return emailRenderers[intent.template](intent.emailInput)
      .then((template) =>
        sendEmail({ to: intent.to, subject: template.subject, html: template.html }),
      )
      .catch((error) => console.error("[notifications] email send failed:", error));
  }
  return sendSms({ to: intent.to, body: renderOrderPlacedSms(intent.smsInput) }).catch((error) =>
    console.error("[notifications] sms send failed:", error),
  );
}

export async function notifyOrderPlaced(input: NotifyOrderPlacedInput): Promise<void> {
  const recipients = await fetchOrderRecipients(input.accountId);
  if (recipients.length === 0) {
    console.warn("[notifications] notifyOrderPlaced: no recipients");
    return;
  }

  const { SITE_URL: siteUrl } = getServerConfig();

  const intents = planNotifications({
    recipients,
    siteUrl,
    orderId: input.orderId,
    accountId: input.accountId,
    placedById: input.placedById,
    baseInput: {
      orderRef: input.orderRef,
      accountName: input.accountName,
      placedByName: input.placedByName,
      deliveryAddress: input.deliveryAddress,
      items: input.items,
    },
  });

  await Promise.allSettled(intents.map(executeIntent));
}

export async function notifyPasswordChanged(input: { email: string }): Promise<void> {
  try {
    const template = await renderPasswordChanged({ email: input.email });
    await sendEmail({ to: input.email, subject: template.subject, html: template.html });
  } catch (error) {
    console.error("[notifications] password changed email send failed:", error);
  }
}

export async function notifyAdminPasswordSet(input: {
  email: string;
  adminName: string;
}): Promise<void> {
  try {
    const template = await renderAdminPasswordSet(input);
    await sendEmail({ to: input.email, subject: template.subject, html: template.html });
  } catch (error) {
    console.error("[notifications] admin password set email send failed:", error);
  }
}
