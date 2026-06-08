import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { getServerConfig } from "@/lib/config";

type SendSmsInput = {
  to: string;
  body: string;
};

export async function sendSms(input: SendSmsInput): Promise<void> {
  const { AWS_REGION: region } = getServerConfig();

  if (!region) {
    console.log("[sms] AWS not configured — would send to:", input.to, "| body:", input.body);
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
