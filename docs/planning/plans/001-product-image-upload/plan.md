---
title: "Product Image Upload: Execution Plan"
number: "001"
status: planning
created: "2026-06-13"
updated: "2026-06-13"
idea: ""
started: ""
completed: ""
estimated-hours: "4-6"
tags: [products, images, r2, cloudflare, upload]
---

## Overview

Implement direct browser-to-R2 image upload for product management. Admins select (and optionally crop) an image in `ProductEditPanel`; the browser resizes it to WebP client-side, then PUTs it directly to Cloudflare R2 via a presigned URL returned by a server function. The resulting public R2 URL is saved as `image_url`. No file bytes pass through the Worker. No changes to the DB schema — `image_url` is already a nullable string column.

---

## Phase 1 — Infrastructure

### 1.1 Create the R2 bucket

Using the Cloudflare dashboard or Wrangler CLI:

```bash
npx wrangler r2 bucket create orderflow-product-images
```

Enable the **public R2.dev subdomain** on the bucket in the Cloudflare dashboard (Settings → Public access → Allow Access). This gives a stable `pub-<hash>.r2.dev` base URL for dev. For production, attach a custom domain (e.g. `images.bwow.com.au`) later.

### 1.2 Create R2 API token

In Cloudflare dashboard → R2 → Manage R2 API tokens → Create API token:

- Permissions: **Object Read & Write** on the `orderflow-product-images` bucket only
- Note the **Access Key ID**, **Secret Access Key**, and **Account ID**

### 1.3 Add env vars

**`.env.example`** — add a new section below the AWS block:

```
# Cloudflare R2 — product image storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=orderflow-product-images
R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev
```

**`wrangler.jsonc`** — add to `vars`:

```jsonc
"R2_BUCKET_NAME": "orderflow-product-images",
"R2_PUBLIC_BASE_URL": "https://pub-<hash>.r2.dev",
```

Secrets (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) are added via:

```bash
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

### 1.4 Extend server config

**File:** `src/lib/config.ts`

Add to `serverEnvSchema` (all optional so local dev without R2 still works):

```ts
R2_ACCOUNT_ID: z.string().optional(),
R2_ACCESS_KEY_ID: z.string().optional(),
R2_SECRET_ACCESS_KEY: z.string().optional(),
R2_BUCKET_NAME: z.string().optional(),
R2_PUBLIC_BASE_URL: z.url().optional(),
```

Add corresponding reads inside `getServerConfig()`:

```ts
R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
```

---

## Phase 2 — Server function (presigned upload URL)

### 2.1 Create storage module

**New file:** `src/lib/storage/storage.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { AwsClient } from "aws4fetch";
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
      throw new Error("R2 not configured");
    }

    const aws = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });

    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${data.key}`;

    // Pre-sign a PUT with a 5-minute expiry
    const signed = await aws.sign(new Request(endpoint, { method: "PUT" }), {
      aws: { signQuery: true },
      expiresIn: 300,
    });

    return {
      uploadUrl: signed.url,
      publicUrl: `${R2_PUBLIC_BASE_URL}/${data.key}`,
    };
  });
```

> **Why a dedicated module?** Storage is a cross-cutting concern; keeping it separate from `products.functions.ts` means the same presign fn could serve avatars or account logos later without coupling to product schema.

---

## Phase 3 — Install dependencies

```bash
vp add react-dropzone react-easy-crop
```

Check React 19 peer compat — both libraries declare `react >= 16` so they accept 19. Pin to exact versions in `package.json` after install.

---

## Phase 4 — UI components

### 4.1 `ImageUpload` component

**New file:** `src/components/products/ImageUpload.tsx`

Responsibilities:

- Dropzone (react-dropzone): accept `image/*`, max 10 MB, show drag-active state
- Preview the selected file before upload
- Optional crop (react-easy-crop): square aspect by default, produceable canvas blob
- Client-side resize + WebP conversion via `<canvas>` before upload:
  ```ts
  canvas.toBlob(resolve, "image/webp", 0.82);
  ```
  Target: scale down so longest dimension ≤ 1200 px
- Call `getProductImageUploadUrl({ data: { key, contentType: 'image/webp' } })` on submit
- `PUT` the blob to the presigned URL with `Content-Type: image/webp`
- On success invoke `onUploaded(publicUrl: string)` callback
- While uploading show a progress indicator (indeterminate spinner)
- On error show sonner toast

Props interface:

```ts
type ImageUploadProps = {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
};
```

Key name format: `products/<uuid>-<timestamp>.webp` (generated client-side with `crypto.randomUUID()`).

### 4.2 Update `ProductEditPanel`

**File:** `src/components/products/ProductEditPanel.tsx`

Replace the `imageUrl` text `<Input>` field with `<ImageUpload>`. The `onUploaded` callback calls `field.handleChange(url)`. The form schema keeps `imageUrl` as a URL string — no schema change needed.

Remove the now-unused `FieldLabel`/`Input` for image URL and the `"Hosted image URL (Cloudflare)"` hint text. Keep the `imageUrl` field in the form so the existing save path works unchanged.

---

## Phase 5 — Update image serving (ProductCard)

No change needed for MVP — `ProductCard` already renders `<img src={imageUrl} />` and the stored URL is the public R2 URL. When Cloudflare Image Transformations are added later, swap `src` to a transformation URL:

```
https://orderflow.team-manager.workers.dev/cdn-cgi/image/width=600,format=auto,quality=80/<publicUrl>
```

That is an optional future step and requires the Cloudflare Images addon — not part of this plan.

---

## Phase 6 — Update documentation

**File:** `docs/project-context.md`

Update the Architecture section to reflect:

- R2 bucket `orderflow-product-images` stores product image originals
- Browser uploads directly via presigned URLs; Worker never handles file bytes
- `image_url` on the products table holds the public R2 object URL
- Cloudflare Image Transformations can be layered on later via `/cdn-cgi/image/` prefix

---

## Verification Checklist

- [ ] `vp check` (lint + format + type checks pass)
- [ ] `vp test` (existing product tests still pass; no new unit tests needed — the component makes real network calls and the server fn is a thin aws4fetch wrapper)
- [ ] `vp build` (Worker bundle builds without errors)
- [ ] Manual: create a new product, upload an image, verify it appears on the product card
- [ ] Manual: edit an existing product, change the image, verify old image is replaced in the form

---

## Rollback Plan

If R2 is misconfigured or the presigned URL server fn fails:

- The `ImageUpload` component shows an error toast and leaves `imageUrl` unchanged
- Admins can still type a URL manually — the `imageUrl` field remains in the form (just hidden behind the upload UI); a simple prop like `allowManualUrl` can re-expose it
- To revert entirely: remove `ImageUpload` from `ProductEditPanel`, restore the text `<Input>` from git, remove `src/lib/storage/storage.functions.ts`
