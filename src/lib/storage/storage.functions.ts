import { createServerFn } from "@tanstack/react-start";
import { AwsV4Signer } from "aws4fetch";
import { z } from "zod";
import { getServerConfig } from "@/lib/config";

const presignRequestSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
});

export const getProductImageUploadUrl = createServerFn({ method: "POST" })
  .validator(presignRequestSchema)
  .handler(async ({ data }) => {
    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      R2_PUBLIC_BASE_URL,
    } = getServerConfig();

    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET_NAME ||
      !R2_PUBLIC_BASE_URL
    ) {
      throw new Error("R2 storage is not configured");
    }

    // Set X-Amz-Expires before signing so the presigned URL is valid for 5 minutes.
    // AwsV4Signer defaults to 86400s when the param is absent.
    const url = new URL(
      `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${data.key}`,
    );
    url.searchParams.set("X-Amz-Expires", "300");

    const signer = new AwsV4Signer({
      url: url.toString(),
      method: "PUT",
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
      signQuery: true,
    });

    const { url: signedUrl } = await signer.sign();

    return {
      uploadUrl: signedUrl.toString(),
      publicUrl: `${R2_PUBLIC_BASE_URL}/${data.key}`,
    };
  });
