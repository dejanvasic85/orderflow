const mailpitUrl = "http://localhost:54324";

export type MailpitMessage = {
  ID: string;
  Subject: string;
  To: { Address: string }[];
};

export async function deleteAllMailpitMessages(): Promise<void> {
  await fetch(`${mailpitUrl}/api/v1/messages`, { method: "DELETE" });
}

/**
 * Polls Mailpit until an email addressed to `toEmail` arrives, then returns it.
 * Match on recipient only — subjects vary across runs/auth-image builds, so callers
 * assert on the subject themselves once they have the message.
 */
export async function waitForMessageTo(
  toEmail: string,
  timeoutMs = 15000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${mailpitUrl}/api/v1/messages`);
    const { messages } = (await res.json()) as { messages: MailpitMessage[] };

    const message = messages.find((m) => m.To.some((t) => t.Address === toEmail));
    if (message) return message;

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No email found for ${toEmail} within ${timeoutMs}ms`);
}

/** Returns the plain-text body of a Mailpit message by ID. */
export async function getMessageText(id: string): Promise<string> {
  const res = await fetch(`${mailpitUrl}/api/v1/message/${id}`);
  const body = (await res.json()) as { Text: string };
  return body.Text;
}
