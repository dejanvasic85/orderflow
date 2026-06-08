






  deliveryAddress: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderOrderPlacedEmail(input: OrderPlacedEmailInput): {
  subject: string;
  html: string;






    .map(
      ({ productName, boxes, extraBottles }) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(productName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${boxes}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${extraBottles}</td>
        </tr>`,

    .join("");

  const deliveryRow = deliveryAddress
    ? `<p style="margin:0 0 8px;"><strong>Delivery address:</strong> ${escapeHtml(deliveryAddress)}</p>`
    : "";

  const html = `<!DOCTYPE html>











        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;">Order ${orderRef} placed</h1>
            <p style="margin:0 0 8px;"><strong>Account:</strong> ${escapeHtml(accountName)}</p>
            <p style="margin:0 0 24px;"><strong>Placed by:</strong> ${escapeHtml(placedByName)}</p>
            ${deliveryRow}
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:16px;">
              <thead>
