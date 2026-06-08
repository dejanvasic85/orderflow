import { getServerConfig } from "@/lib/config";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] would send to:", input.to, "| subject:", input.subject);
    return;
  }

  const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

  const config = getAwsEmailConfig();
  const client = new SESClient({ region: config.region });

  await client.send(
    new SendEmailCommand({
      Source: config.fromAddress,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: input.subject, Charset: "UTF-8" },
        Body: { Html: { Data: input.html, Charset: "UTF-8" } },
      },
    }),
  );
}

function getAwsEmailConfig() {
  const { AWS_REGION: region, SES_FROM_ADDRESS: fromAddress } = getServerConfig();

  if (!region || !fromAddress) {
    throw new Error("Missing required env vars: AWS_REGION, SES_FROM_ADDRESS");
  }

  return { region, fromAddress };
}
