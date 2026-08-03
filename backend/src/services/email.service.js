import nodemailer from "nodemailer";

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@expirytracker.app";

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[email.service] SMTP not configured. Set SMTP_USER/SMTP_PASS to enable email.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_PORT === "465" || process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  return transporter;
};

const layout = (title, body) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:24px 32px;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">${title}</h1>
      </div>
      <div style="padding:32px;">
        ${body}
      </div>
      <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">Sent by ExpiryTracker. If you didn't request this, you can safely ignore it.</p>
      </div>
    </div>
  </div>
`;

export const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  if (!transport) {
    return { ok: false, error: "SMTP not configured" };
  }

  try {
    await transport.sendMail({
      from: `"ExpiryTracker" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error("[email.service] Email send failed:", error.message);
    return { ok: false, error: error.message };
  }
};

export const sendVerificationEmail = async ({ to, token }) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  const html = layout(
    "Verify your email",
    `
      <p style="color:#374151;font-size:15px;line-height:1.6;">Hi there,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">Please confirm your email address to activate your ExpiryTracker account.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
        Verify Email
      </a>
      <p style="color:#6b7280;font-size:13px;">Or copy this link:<br/>${url}</p>
      <p style="color:#9ca3af;font-size:12px;">This link expires in 24 hours.</p>
    `
  );
  return sendEmail({ to, subject: "Verify your ExpiryTracker email", html });
};

export const sendResetPasswordEmail = async ({ to, token }) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  const html = layout(
    "Reset your password",
    `
      <p style="color:#374151;font-size:15px;line-height:1.6;">Hi there,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:13px;">Or copy this link:<br/>${url}</p>
      <p style="color:#9ca3af;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `
  );
  return sendEmail({ to, subject: "Reset your ExpiryTracker password", html });
};
