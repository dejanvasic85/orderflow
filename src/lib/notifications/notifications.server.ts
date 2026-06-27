import { getServerConfig } from "@/lib/config";
import { log } from "@/lib/log/logger";
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
    log.error("notify.recipients", "account_users fetch failed", {
      error: accountUsersResult.error.message,
    });
    return [];
  }

  if (staffAdminResult.error) {
    log.error("notify.recipients", "staff/admin fetch failed", {
      error: staffAdminResult.error.message,
    });
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
    log.error("notify.recipients", "account user details fetch failed", {
      error: accountUsersData.error.message,
    });
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
    log.error("notify.recipients", "auth users fetch failed", { error: authError.message });
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
      .catch((error: unknown) =>
        log.error("notify.email", "send failed", {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
  }
  return sendSms({ to: intent.to, body: renderOrderPlacedSms(intent.smsInput) }).catch(
    (error: unknown) =>
      log.error("notify.sms", "send failed", {
        error: error instanceof Error ? error.message : String(error),
      }),
  );
}

export async function notifyOrderPlaced(input: NotifyOrderPlacedInput): Promise<void> {
  const recipients = await fetchOrderRecipients(input.accountId);
  if (recipients.length === 0) {
    log.warn("notify", "no recipients", { accountId: input.accountId });
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
  } catch (error: unknown) {
    log.error("notify.email", "password changed send failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyAdminPasswordSet(input: {
  email: string;
  adminName: string;
}): Promise<void> {
  try {
    const template = await renderAdminPasswordSet(input);
    await sendEmail({ to: input.email, subject: template.subject, html: template.html });
  } catch (error: unknown) {
    log.error("notify.email", "admin password set send failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
