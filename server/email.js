import nodemailer from "nodemailer";

/** Lazy Ethereal test account (development only) — see preview URL in server logs. */
let etherealAccountPromise = null;
function getEtherealAccount() {
  if (!etherealAccountPromise) {
    etherealAccountPromise = nodemailer.createTestAccount();
  }
  return etherealAccountPromise;
}

function trimEnv(v) {
  if (v == null) return "";
  return String(v).trim();
}

/** Gmail app passwords are shown with spaces; SMTP expects 16 characters without them. */
function normalizeAppPassword(pass) {
  if (!pass) return "";
  return String(pass).replace(/\s+/g, "");
}

function isGmailAddress(email) {
  const d = trimEnv(email).split("@")[1]?.toLowerCase();
  return d === "gmail.com" || d === "googlemail.com";
}

function isGmailSmtpHost(host) {
  return trimEnv(host).toLowerCase().includes("gmail");
}

/**
 * Order confirmation email.
 * - Production: requires SMTP_HOST + MAIL_FROM (and usually SMTP_USER + SMTP_PASS).
 * - Development: if SMTP not fully set, uses Ethereal — open the logged "preview" URL to see the message.
 */
function getSmtpConfig() {
  const SMTP_USER = trimEnv(process.env.SMTP_USER || process.env.EMAIL_USER);
  const SMTP_PASS_RAW = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const SMTP_PASS = normalizeAppPassword(SMTP_PASS_RAW);
  let MAIL_FROM = trimEnv(process.env.MAIL_FROM || SMTP_USER);
  let SMTP_HOST = trimEnv(process.env.SMTP_HOST);
  const SMTP_PORT = trimEnv(process.env.SMTP_PORT);

  const inferredGmail = !SMTP_HOST && isGmailAddress(SMTP_USER || MAIL_FROM);
  if (inferredGmail) {
    SMTP_HOST = "smtp.gmail.com";
  }

  return {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
  };
}

function createSmtpTransport(cfg) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = cfg;
  const authUser = SMTP_USER || MAIL_FROM;
  const useGmail =
    (SMTP_PASS && authUser && (isGmailSmtpHost(SMTP_HOST) || isGmailAddress(authUser)));

  if (useGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: authUser, pass: SMTP_PASS },
    });
  }

  const port = Number(SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

export async function sendOrderConfirmationEmail(to, { orderId, totalFormatted, itemCount }) {
  const text = `Your Flipkart Clone order ${orderId} is placed.\nTotal: ${totalFormatted}\nItems: ${itemCount}\nThank you for shopping!`;
  const subject = `Order confirmed: ${orderId}`;
  const smtpCfg = getSmtpConfig();
  const { SMTP_HOST, SMTP_PASS, MAIL_FROM, SMTP_USER } = smtpCfg;
  const hasSmtp = Boolean(SMTP_HOST && MAIL_FROM);
  const isProd = process.env.NODE_ENV === "production";
  const authUser = SMTP_USER || MAIL_FROM;

  if (hasSmtp) {
    const needsPassword =
      isGmailSmtpHost(SMTP_HOST) ||
      isGmailAddress(authUser) ||
      Boolean(SMTP_USER);
    if (needsPassword && !SMTP_PASS) {
      const msg =
        "[order email] Missing SMTP_PASS / EMAIL_PASS. For Gmail: Google Account → Security → 2-Step Verification → App passwords (use the 16-character password, spaces optional).";
      console.error(msg);
      throw new Error(msg);
    }

    try {
      const transporter = createSmtpTransport(smtpCfg);
      const recipients = trimEnv(to) || MAIL_FROM;
      const fromHeader = MAIL_FROM.includes("<") ? MAIL_FROM : `Flipkart Clone <${MAIL_FROM}>`;
      const info = await transporter.sendMail({
        from: fromHeader,
        to: recipients,
        subject,
        text,
      });
      console.log(`[order email] SMTP → ${recipients} (messageId: ${info.messageId})`);
    } catch (err) {
      const detail = err?.response || err?.message || err;
      console.error("[order email] SMTP send failed:", detail);
      throw err;
    }
    return;
  }

  if (isProd) {
    console.warn(
      `[order email skipped] Set SMTP_HOST + MAIL_FROM + SMTP_PASS (and SMTP_USER for non-Gmail). ` +
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
    const recipients = trimEnv(to) || account.user;
    const info = await transporter.sendMail({
      from: `"Flipkart Clone" <noreply@example.com>`,
      to: recipients,
      subject,
      text,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    console.log(
      `[order email] Dev (Ethereal) — not real email. Open:\n  ${preview || "(missing preview URL)"}`,
    );
    console.log(
      `[order email] For real Gmail, add SMTP_* vars to .env in project root and restart npm run dev.`,
    );
  } catch (err) {
    console.error(
      "[order email] Ethereal failed (offline?). Configure SMTP in .env or check network.",
      err?.message || err,
    );
    throw err;
  }
}
