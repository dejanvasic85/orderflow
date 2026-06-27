import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { getServerConfig } from "@/lib/config";
import { log } from "@/lib/log/logger";

type SendSmsInput = {
  to: string;
  body: string;
};

export async function sendSms(input: SendSmsInput): Promise<void> {
  const { AWS_REGION: region } = getServerConfig();

  if (!region) {
    log.debug("notify.sms", "skipped — AWS not configured", { to: input.to });
    return;
  }

  const client = new SNSClient({ region });

  await client.send(
    new PublishCommand({
      PhoneNumber: input.to,
      Message: input.body,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    }),
  );
}
