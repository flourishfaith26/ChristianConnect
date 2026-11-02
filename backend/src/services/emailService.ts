import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// SMTP Transporter fallback / option
const smtpTransporter = process.env.SMTP_HOST && process.env.SMTP_USER
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? process.env.SMTP_USER ?? 'noreply@christianconnect.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@christianconnect.app';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({ to, from: FROM_EMAIL, subject, html });
      console.log(`[Email] Sent "${subject}" to ${to} via SendGrid`);
      return;
    } catch (err) {
      console.error('[Email] SendGrid error:', err);
    }
  }

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent "${subject}" to ${to} via SMTP`);
      return;
    } catch (err) {
      console.error('[Email] SMTP error:', err);
    }
  }

  console.log(`[Email] No active email provider (SendGrid/SMTP) configured — logging instead:`);
  console.log(`  TO: ${to}`);
  console.log(`  SUBJECT: ${subject}`);
}

// ─── Parental Consent Email ───────────────────────────────────────────────────

/**
 * Sends a parental consent email to the parent/guardian of a minor.
 * The consentToken is a signed token embedded in a link for the parent to click.
 */
export async function sendParentalConsentEmail(
  parentEmail: string,
  childDisplayName: string,
  consentToken: string
): Promise<void> {
  const consentUrl = `${process.env.FRONTEND_URL}/parental-consent?token=${consentToken}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 24px;">Parental Consent Required</h1>
      <p>Hello,</p>
      <p>
        <strong>${childDisplayName}</strong> is creating an account on <strong>ChristianConnect</strong>,
        a faith-based community platform. Because they are under 18, we require parental or guardian
        consent before they can access the platform.
      </p>
      <p><strong>What your child's account can access:</strong></p>
      <ul>
        <li>✅ Bible Reading Plans</li>
        <li>✅ Devotionals</li>
        <li>✅ Scripture Explanations</li>
        <li>✅ Faith Chat (AI Q&amp;A)</li>
        <li>❌ Direct messaging and chat (not available)</li>
        <li>❌ Stories (not available)</li>
        <li>❌ Dating or matching features (not available)</li>
      </ul>
      <p>
        To give your consent, please click the button below:
      </p>
      <a
        href="${consentUrl}"
        style="
          display: inline-block;
          background: #4f46e5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 16px 0;
        "
      >
        Give Parental Consent
      </a>
      <p style="color: #666; font-size: 14px;">
        If you did not request this, please ignore this email. The account will remain inactive.
        This link expires in 7 days.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        ChristianConnect · Faith &amp; Community · <a href="${process.env.FRONTEND_URL}">christianconnect.app</a>
      </p>
    </div>
  `;

  await sendEmail(parentEmail, 'Parental Consent Required — ChristianConnect', html);
}

// ─── Admin Flagged Content Notification ──────────────────────────────────────

/**
 * Notifies the admin team when content is flagged by the moderation pipeline.
 */
export async function notifyAdminFlaggedContent(
  targetType: 'message' | 'story' | 'profile' | 'dating_profile',
  targetId: string,
  reason: string
): Promise<void> {
  const adminUrl = `${process.env.FRONTEND_URL}/admin?tab=queue&target=${targetType}&id=${targetId}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #dc2626;">⚠️ Flagged Content — Admin Review Required</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 120px;">Type:</td>
          <td style="padding: 8px;">${targetType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">ID:</td>
          <td style="padding: 8px; font-family: monospace;">${targetId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Reason:</td>
          <td style="padding: 8px;">${reason}</td>
        </tr>
      </table>
      <a
        href="${adminUrl}"
        style="
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 16px 0;
        "
      >
        Review in Admin Queue
      </a>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, `[Action Required] Flagged ${targetType} — ChristianConnect`, html);
}

// ─── Admin Report Notification ────────────────────────────────────────────────

/**
 * Notifies the admin team when a user submits a report.
 */
export async function notifyAdminNewReport(
  reportId: string,
  targetType: string,
  reason: string
): Promise<void> {
  const adminUrl = `${process.env.FRONTEND_URL}/admin?tab=reports&id=${reportId}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #d97706;">📋 New User Report Submitted</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 120px;">Report ID:</td>
          <td style="padding: 8px; font-family: monospace;">${reportId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Target:</td>
          <td style="padding: 8px;">${targetType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Reason:</td>
          <td style="padding: 8px;">${reason}</td>
        </tr>
      </table>
      <a
        href="${adminUrl}"
        style="
          display: inline-block;
          background: #d97706;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 16px 0;
        "
      >
        Review Report
      </a>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, `[New Report] ${targetType} reported — ChristianConnect`, html);
}
