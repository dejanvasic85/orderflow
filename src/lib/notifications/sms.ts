type SendSmsInput = {
  to: string;
  body: string;
};

export async function sendSms(input: SendSmsInput): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[sms] would send to:", input.to, "| body:", input.body);
    return;
  }

  const { SNSClient, PublishCommand } = await import("@aws-sdk/client-sns");

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("Missing required env var: AWS_REGION");
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
