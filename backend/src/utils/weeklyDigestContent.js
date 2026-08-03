import { daysUntil } from "./expiryLogic.js";
import { layout } from "../services/email.service.js";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const quantityLabel = (product) => {
  const qty = product.quantity;
  if (!qty || qty <= 1) return "";
  return `${qty}${product.unit ? ` ${product.unit}` : ""} `;
};

const daysLeftLabel = (days) => {
  if (days <= 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
};

export const buildDigestBody = (products, userName) => {
  const rows = products
    .map((p) => {
      const days = daysUntil(p.expiryDate);
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${quantityLabel(p)}${p.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">${p.category || "—"}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;white-space:nowrap;">${formatDate(p.expiryDate)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#b45309;font-size:14px;font-weight:bold;white-space:nowrap;">${daysLeftLabel(days)}</td>
      </tr>`;
    })
    .join("");

  return `
    <p style="color:#374151;font-size:15px;line-height:1.6;">Hi ${userName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Here's what's expiring in the next 7 days:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 0;color:#6b7280;font-size:12px;text-transform:uppercase;">Product</th>
          <th style="text-align:left;padding:8px 0;color:#6b7280;font-size:12px;text-transform:uppercase;">Category</th>
          <th style="text-align:left;padding:8px 0;color:#6b7280;font-size:12px;text-transform:uppercase;">Expiry Date</th>
          <th style="text-align:left;padding:8px 0;color:#6b7280;font-size:12px;text-transform:uppercase;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" style="display:inline-block;margin:16px 0;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
      View on Dashboard
    </a>`;
};

export const buildDigestHtml = ({ userName, products }) =>
  layout("Your weekly expiry digest", buildDigestBody(products, userName));
