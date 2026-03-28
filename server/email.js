import nodemailer from "nodemailer";

/** Lazy Ethereal test account (development only) — see preview URL in server logs. */
let etherealAccountPromise = null;
function getEtherealAccount() {
  if (!etherealAccountPromise) {
    etherealAccountPromise = nodemailer.createTestAccount();
  }
  return etherealAccountPromise;
}

/**
 * Order confirmation email.
 * - Production: requires SMTP_HOST + MAIL_FROM (and usually SMTP_USER + SMTP_PASS).
 * - Development: if SMTP not set, uses Ethereal — open the logged "preview" URL to see the message.
 */
function getSmtpConfig() {
  const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
  const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;
  let SMTP_HOST = process.env.SMTP_HOST;
  const domain = SMTP_USER?.split("@")[1]?.toLowerCase();
  if (!SMTP_HOST && (domain === "gmail.com" || domain === "googlemail.com")) {
    SMTP_HOST = "smtp.gmail.com";
  }
  return {
    SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
  };
}

export async function sendOrderConfirmationEmail(to, { orderId, totalFormatted, itemCount }) {
  const text = `Your Flipkart Clone order ${orderId} is placed.\nTotal: ${totalFormatted}\nItems: ${itemCount}\nThank you for shopping!`;
  const subject = `Order confirmed: ${orderId}`;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = getSmtpConfig();
  const hasSmtp = Boolean(SMTP_HOST && MAIL_FROM);
  const isProd = process.env.NODE_ENV === "production";

  if (hasSmtp) {
    const port = Number(SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
      },
    });
    const recipients = to || MAIL_FROM;
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: recipients,
      subject,
      text,
    });
    console.log(`[order email] SMTP → ${recipients} (messageId: ${info.messageId})`);
    return;
  }

  if (isProd) {
    console.warn(
      `[order email skipped] Set SMTP_* or EMAIL_USER + EMAIL_PASS (+ SMTP_HOST for non-Gmail). ` +
        `Order ${orderId}, intended to: ${to || "n/a"}`,
    );
    console.warn(text);
    return;
  }

  try {
    const account = await getEtherealAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    const recipients = to || account.user;
    const info = await transporter.sendMail({
      from: `"Flipkart Clone" <noreply@example.com>`,
      to: recipients,
      subject,
      text,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    console.log(
      `[order email] Dev inbox (Ethereal) — open this URL to read the message:\n  ${preview || "(missing preview URL)"}`,
    );
  } catch (err) {
    console.error(
      "[order email] Ethereal failed (offline?). Configure SMTP in .env or check network.",
      err?.message || err,
    );
    throw err;
  }
}
