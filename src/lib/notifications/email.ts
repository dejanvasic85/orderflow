import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getServerConfig } from "@/lib/config";

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

  const client = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });

  await client.send(
    new SendEmailCommand({
      Source: fromAddress,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: input.subject, Charset: "UTF-8" },
        Body: { Html: { Data: input.html, Charset: "UTF-8" } },
      },
    }),
  );
}
