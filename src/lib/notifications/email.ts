import { AwsClient } from "aws4fetch";
import { company, getServerConfig } from "@/lib/config";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const {
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    SES_FROM_ADDRESS: fromAddress,
  } = getServerConfig();

  if (!region || !accessKeyId || !secretAccessKey || !fromAddress) {
    console.log(
      "[email] AWS not configured — would send to:",
      input.to,
      "| subject:",
      input.subject,
    );
    return;
  }

  const aws = new AwsClient({ accessKeyId, secretAccessKey, region, service: "ses" });

  const body = new URLSearchParams({
    Action: "SendEmail",
    Source: `${company.name} <${fromAddress}>`,
    "Destination.ToAddresses.member.1": input.to,
    "Message.Subject.Data": input.subject,
    "Message.Subject.Charset": "UTF-8",
    "Message.Body.Html.Data": input.html,
    "Message.Body.Html.Charset": "UTF-8",
  });

  const res = await aws.fetch(`https://email.${region}.amazonaws.com/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SES error ${res.status}: ${text}`);
  }
}
