import { AwsClient } from "aws4fetch";
import { getServerConfig } from "@/lib/config";
import { log } from "@/lib/log/logger";

type SendSmsInput = {
  to: string;
  body: string;
};

function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{2})/g, "*");
}

/** Converts an AU-local mobile number (04xxxxxxxx, per the users.phone DB constraint) to E.164. */
function toE164Au(phone: string): string {
  return `+61${phone.slice(1)}`;
}

export async function sendSms(input: SendSmsInput): Promise<void> {
  const {
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
  } = getServerConfig();

  if (!region || !accessKeyId || !secretAccessKey) {
    log.debug("notify.sms", "skipped — AWS not configured", { to: maskPhone(input.to) });
    return;
  }

  const aws = new AwsClient({ accessKeyId, secretAccessKey, region, service: "sns" });

  const body = new URLSearchParams({
    Action: "Publish",
    Version: "2010-03-31",
    PhoneNumber: toE164Au(input.to),
    Message: input.body,
    "MessageAttributes.entry.1.Name": "AWS.SNS.SMS.SMSType",
    "MessageAttributes.entry.1.Value.DataType": "String",
    "MessageAttributes.entry.1.Value.StringValue": "Transactional",
  });

  const res = await aws.fetch(`https://sns.${region}.amazonaws.com/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SNS error ${res.status}: ${text}`);
  }
}
