import { AwsClient } from "aws4fetch";
import { company, getServerConfig } from "@/lib/config";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type SesConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromAddress: string;
};

// Mailpit requires a From address; SES_FROM_ADDRESS may be unset in local/CI.
const devFromAddress = "noreply@bwow.com.au";

async function sendViaSes(input: SendEmailInput, config: SesConfig): Promise<void> {
  const aws = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    service: "ses",
  });

  const body = new URLSearchParams({
    Action: "SendEmail",
    Source: `${company.name} <${config.fromAddress}>`,
    "Destination.ToAddresses.member.1": input.to,
    "Message.Subject.Data": input.subject,
    "Message.Subject.Charset": "UTF-8",
    "Message.Body.Html.Data": input.html,
    "Message.Body.Html.Charset": "UTF-8",
  });

  const res = await aws.fetch(`https://email.${config.region}.amazonaws.com/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SES error ${res.status}: ${text}`);
  }
}

async function sendViaMailpit(
  input: SendEmailInput,
  mailpitApiUrl: string,
  fromAddress: string,
): Promise<void> {
  const res = await fetch(`${mailpitApiUrl}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: fromAddress, Name: company.name },
      To: [{ Email: input.to }],
      Subject: input.subject,
      HTML: input.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailpit send error ${res.status}: ${text}`);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const {
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    SES_FROM_ADDRESS: fromAddress,
    MAILPIT_API_URL: mailpitApiUrl,
  } = getServerConfig();

  if (region && accessKeyId && secretAccessKey && fromAddress) {
    await sendViaSes(input, { region, accessKeyId, secretAccessKey, fromAddress });
    return;
  }

  if (mailpitApiUrl) {
    await sendViaMailpit(input, mailpitApiUrl, fromAddress ?? devFromAddress);
    return;
  }

  console.log(
    "[email] no transport configured — would send to:",
    input.to,
    "| subject:",
    input.subject,
  );
}
