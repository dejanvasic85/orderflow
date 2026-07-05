import { AwsClient } from "aws4fetch";
import { getServerConfig } from "@/lib/config";
import { log } from "@/lib/log/logger";

type SendSmsInput = {
  to: string;
  body: string;
};

export async function sendSms(input: SendSmsInput): Promise<void> {
  const {
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
  } = getServerConfig();

  if (!region || !accessKeyId || !secretAccessKey) {
    log.debug("notify.sms", "skipped — AWS not configured", { to: input.to });
    return;
  }

  const aws = new AwsClient({ accessKeyId, secretAccessKey, region, service: "sns" });

  const body = new URLSearchParams({
    Action: "Publish",
    PhoneNumber: input.to,
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
