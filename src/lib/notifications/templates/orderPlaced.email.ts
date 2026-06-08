import { company } from "@/lib/config";

type OrderPlacedEmailInput = {
  orderRef: string;
  accountName: string;
  placedByName: string;
  items: { productName: string; boxes: number; extraBottles: number }[];
  deliveryAddress: string | null;
};

export function renderOrderPlacedEmail(input: OrderPlacedEmailInput): {
  subject: string;
  html: string;
} {
  const { orderRef, accountName, placedByName, items, deliveryAddress } = input;

  const subject = `New order ${orderRef} placed for ${accountName}`;

  const itemRows = items
    .map(
      ({ productName, boxes, extraBottles }) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${productName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${boxes}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${extraBottles}</td>
        </tr>`,
    )
    .join("");

  const deliveryRow = deliveryAddress
    ? `<p style="margin:0 0 8px;"><strong>Delivery address:</strong> ${deliveryAddress}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;color:#111827;margin:0;padding:0;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${company.name}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;">Order ${orderRef} placed</h1>
            <p style="margin:0 0 8px;"><strong>Account:</strong> ${accountName}</p>
            <p style="margin:0 0 24px;"><strong>Placed by:</strong> ${placedByName}</p>
            ${deliveryRow}
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:16px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;">Product</th>
                  <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;">Boxes</th>
                  <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;">Extra bottles</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f3f4f6;font-size:12px;color:#9ca3af;">
            You are receiving this because you are assigned to this account. Manage your notification preferences in OrderFlow.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
