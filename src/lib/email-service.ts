import { sendHtmlEmail } from "./ses";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.buildmora.tech";
const APP_NAME = "BuildMora";
const SUPPORT_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "support@buildmora.tech";

/**
 * Modern, clean, responsive email container that renders flawlessly in
 * Gmail, Outlook, Apple Mail, and mobile clients with full dark mode support.
 */
function renderEmailShell(options: {
  title: string;
  preheader?: string;
  badge?: { text: string; color?: "violet" | "emerald" | "amber" | "sky" };
  bodyHtml: string;
  cta?: { text: string; url: string; secondary?: boolean };
  footerNote?: string;
}): string {
  const { title, preheader, badge, bodyHtml, cta, footerNote } = options;

  const badgeColorMap = {
    violet: "background-color: #f3f0ff; color: #7c3aed; border: 1px solid #ddd6fe;",
    emerald: "background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;",
    amber: "background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a;",
    sky: "background-color: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd;",
  };
  const badgeStyle = badge ? (badgeColorMap[badge.color ?? "violet"]) : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; }
    a { color: #6366f1; text-decoration: none; }
    .btn { display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; }
    .btn-primary { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff !important; }
    .card { background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
  </style>
</head>
<body style="background-color: #f8fafc; padding: 32px 12px;">
  ${preheader ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <!-- Brand Header -->
    <tr>
      <td style="padding-bottom: 24px; text-align: center;">
        <a href="${APP_URL}" style="display: inline-flex; align-items: center; text-decoration: none;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="width: 38px; height: 38px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); border-radius: 10px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px;">
                B
              </td>
              <td style="padding-left: 10px; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                ${APP_NAME}
              </td>
            </tr>
          </table>
        </a>
      </td>
    </tr>

    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px;">
          ${
            badge
              ? `<tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; margin-bottom: 16px; ${badgeStyle}">
                      ${badge.text}
                    </span>
                  </td>
                </tr>`
              : ""
          }
          <tr>
            <td>
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="color: #334155; font-size: 15px; line-height: 1.6;">
              ${bodyHtml}
            </td>
          </tr>
          ${
            cta
              ? `<tr>
                  <td style="padding-top: 28px;">
                    <a href="${cta.url}" class="btn btn-primary" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff;">
                      ${cta.text} &rarr;
                    </a>
                  </td>
                </tr>`
              : ""
          }
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding-top: 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
        ${footerNote ? `<p style="margin: 0 0 8px;">${footerNote}</p>` : ""}
        <p style="margin: 0;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
          <a href="${APP_URL}" style="color: #64748b; text-decoration: underline;">${APP_URL.replace(/^https?:\/\//, "")}</a> &bull;
          <a href="mailto:${SUPPORT_EMAIL}" style="color: #64748b; text-decoration: underline;">Support</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTACT FORM EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendContactNotificationToOwner(params: {
  ownerEmail: string;
  ownerName?: string | null;
  siteName: string;
  visitorName: string;
  visitorEmail: string;
  subject?: string | null;
  message: string;
}) {
  const html = renderEmailShell({
    title: `New message from ${params.visitorName}`,
    preheader: `Message received on your portfolio ${params.siteName}`,
    badge: { text: "Contact Submission", color: "violet" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.ownerName || "there"}</strong>,
      </p>
      <p style="margin: 0 0 20px;">
        A visitor just submitted a new message through your portfolio contact form on <strong>${params.siteName}</strong>:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Name:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.visitorName}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Email:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">
            <a href="mailto:${params.visitorEmail}" style="color: #4f46e5;">${params.visitorEmail}</a>
          </td>
        </tr>
        ${
          params.subject
            ? `<tr>
                <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Subject:</strong></td>
                <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.subject}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="vertical-align: top; font-size: 13px; color: #64748b;"><strong>Message:</strong></td>
          <td style="font-size: 14px; color: #0f172a; white-space: pre-wrap;">${params.message}</td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        You can reply directly to this email or contact <a href="mailto:${params.visitorEmail}" style="color: #4f46e5;">${params.visitorEmail}</a>.
      </p>
    `,
    cta: {
      text: "View In Dashboard",
      url: `${APP_URL}/dashboard/contacts`,
    },
    footerNote: `This notification was generated because a message was sent on your ${params.siteName} portfolio.`,
  });

  return sendHtmlEmail({
    to: params.ownerEmail,
    replyTo: params.visitorEmail,
    subject: `[${params.siteName}] New Contact Message: ${params.subject || params.visitorName}`,
    html,
  });
}

export async function sendContactConfirmationToVisitor(params: {
  visitorEmail: string;
  visitorName: string;
  siteName: string;
}) {
  const html = renderEmailShell({
    title: `Message sent to ${params.siteName}`,
    preheader: `Thank you for contacting ${params.siteName}.`,
    badge: { text: "Delivered", color: "emerald" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.visitorName}</strong>,
      </p>
      <p style="margin: 0 0 16px;">
        Thank you for reaching out! Your message has been safely delivered to <strong>${params.siteName}</strong>.
      </p>
      <p style="margin: 0;">
        They will review your message and get back to you as soon as possible.
      </p>
    `,
    footerNote: `Powered by ${APP_NAME} — The portfolio and client portal engine.`,
  });

  return sendHtmlEmail({
    to: params.visitorEmail,
    subject: `Thank you for contacting ${params.siteName}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ENQUIRY EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendEnquiryNotificationToOwner(params: {
  ownerEmail: string;
  ownerName?: string | null;
  siteName: string;
  name: string;
  email: string;
  phone?: string | null;
  source: string;
  entityTitle?: string | null;
  message: string;
}) {
  const sourceLabel = params.source.replace("_", " ");

  const html = renderEmailShell({
    title: `New ${sourceLabel} Enquiry from ${params.name}`,
    preheader: `New prospective client inquiry on ${params.siteName}`,
    badge: { text: `${sourceLabel} Inquiry`, color: "sky" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.ownerName || "there"}</strong>,
      </p>
      <p style="margin: 0 0 20px;">
        You have received a new business inquiry on your <strong>${params.siteName}</strong> website:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Client:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.name}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Email:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">
            <a href="mailto:${params.email}" style="color: #4f46e5;">${params.email}</a>
          </td>
        </tr>
        ${
          params.phone
            ? `<tr>
                <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Phone:</strong></td>
                <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.phone}</td>
              </tr>`
            : ""
        }
        ${
          params.entityTitle
            ? `<tr>
                <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Regarding:</strong></td>
                <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.entityTitle}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="vertical-align: top; font-size: 13px; color: #64748b;"><strong>Message:</strong></td>
          <td style="font-size: 14px; color: #0f172a; white-space: pre-wrap;">${params.message}</td>
        </tr>
      </table>
    `,
    cta: {
      text: "Open Enquiries",
      url: `${APP_URL}/dashboard/enquiries`,
    },
  });

  return sendHtmlEmail({
    to: params.ownerEmail,
    replyTo: params.email,
    subject: `[${params.siteName}] New ${sourceLabel} Enquiry: ${params.name}`,
    html,
  });
}

export async function sendEnquiryConfirmationToVisitor(params: {
  email: string;
  name: string;
  siteName: string;
  entityTitle?: string | null;
}) {
  const html = renderEmailShell({
    title: `Inquiry Received`,
    preheader: `Thank you for your interest in ${params.siteName}`,
    badge: { text: "Inquiry Received", color: "emerald" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.name}</strong>,
      </p>
      <p style="margin: 0 0 16px;">
        Thank you for your interest${params.entityTitle ? ` in <strong>${params.entityTitle}</strong>` : ""}!
        Your inquiry has been successfully transmitted to <strong>${params.siteName}</strong>.
      </p>
      <p style="margin: 0;">
        The team will review your project requirements and respond promptly.
      </p>
    `,
  });

  return sendHtmlEmail({
    to: params.email,
    subject: `Inquiry received for ${params.entityTitle || params.siteName}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REVIEW RECEIVED NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function sendReviewNotificationToOwner(params: {
  ownerEmail: string;
  ownerName?: string | null;
  siteName: string;
  reviewerName: string;
  rating: number;
  content?: string | null;
  itemTitle?: string | null;
}) {
  const stars = "★".repeat(Math.min(5, Math.max(1, params.rating))) + "☆".repeat(5 - Math.min(5, Math.max(1, params.rating)));

  const html = renderEmailShell({
    title: `New ${params.rating}-Star Review on ${params.siteName}`,
    preheader: `${params.reviewerName} left a ${params.rating}-star review`,
    badge: { text: "Review Received", color: "amber" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.ownerName || "there"}</strong>,
      </p>
      <p style="margin: 0 0 20px;">
        <strong>${params.reviewerName}</strong> just submitted a new review${params.itemTitle ? ` for <strong>${params.itemTitle}</strong>` : ""}:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="color: #f59e0b; font-size: 20px; margin-bottom: 10px; letter-spacing: 2px;">
          ${stars} <span style="font-size: 14px; font-weight: 600; color: #475569;">(${params.rating}/5)</span>
        </div>
        ${
          params.content
            ? `<p style="margin: 0; font-size: 14px; color: #1e293b; font-style: italic;">&ldquo;${params.content}&rdquo;</p>`
            : `<p style="margin: 0; font-size: 13px; color: #64748b;">(No text content provided)</p>`
        }
      </div>
      <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
        This review is currently marked as <strong>Pending</strong>. You can review and publish it from your dashboard.
      </p>
    `,
    cta: {
      text: "Moderate Reviews",
      url: `${APP_URL}/dashboard/reviews`,
    },
  });

  return sendHtmlEmail({
    to: params.ownerEmail,
    subject: `[${params.siteName}] New Review (${params.rating}★) from ${params.reviewerName}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SITE SETTINGS CHANGED NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function sendSettingsChangedNotification(params: {
  userEmail: string;
  userName?: string | null;
  siteName: string;
  changes: string[];
}) {
  const html = renderEmailShell({
    title: `Site Settings Updated`,
    preheader: `Your settings for ${params.siteName} were modified`,
    badge: { text: "Security Notice", color: "violet" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.userName || "there"}</strong>,
      </p>
      <p style="margin: 0 0 16px;">
        This is a confirmation that settings for your portfolio <strong>${params.siteName}</strong> were recently updated:
      </p>
      <ul style="margin: 0 0 20px; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
        ${params.changes.map((c) => `<li>${c}</li>`).join("")}
      </ul>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        If you did not make these changes, please secure your account immediately or contact support.
      </p>
    `,
    cta: {
      text: "View Settings",
      url: `${APP_URL}/dashboard/settings`,
    },
  });

  return sendHtmlEmail({
    to: params.userEmail,
    subject: `[BuildMora] Site Settings Updated: ${params.siteName}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BILLING & SUBSCRIPTION EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendBillingReceiptNotification(params: {
  userEmail: string;
  userName?: string | null;
  plan: string;
  amount?: number | string;
  currency?: string;
  paymentId?: string;
  subscriptionId?: string;
}) {
  const html = renderEmailShell({
    title: `Subscription Activated: ${params.plan} Tier`,
    preheader: `Your BuildMora ${params.plan} plan is active!`,
    badge: { text: "Payment Successful", color: "emerald" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.userName || "there"}</strong>,
      </p>
      <p style="margin: 0 0 20px;">
        Thank you for choosing BuildMora! Your subscription to the <strong>${params.plan}</strong> tier has been activated.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Plan:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a; font-weight: 600;">${params.plan}</td>
        </tr>
        ${
          params.paymentId
            ? `<tr>
                <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Payment ID:</strong></td>
                <td style="padding-bottom: 8px; font-size: 14px; font-family: monospace; color: #0f172a;">${params.paymentId}</td>
              </tr>`
            : ""
        }
        ${
          params.subscriptionId
            ? `<tr>
                <td style="font-size: 13px; color: #64748b;"><strong>Subscription ID:</strong></td>
                <td style="font-size: 14px; font-family: monospace; color: #0f172a;">${params.subscriptionId}</td>
              </tr>`
            : ""
        }
      </table>
      <p style="margin: 0; font-size: 14px; color: #334155;">
        You now have access to custom domain verification, higher AI generation credits, advanced analytics, and priority features.
      </p>
    `,
    cta: {
      text: "Manage Billing",
      url: `${APP_URL}/dashboard/billing`,
    },
  });

  return sendHtmlEmail({
    to: params.userEmail,
    subject: `[BuildMora] Your ${params.plan} Subscription is Active!`,
    html,
  });
}

export async function sendBillingCancelledNotification(params: {
  userEmail: string;
  userName?: string | null;
  plan: string;
  endDate?: Date | string;
}) {
  const html = renderEmailShell({
    title: `Subscription Cancellation Notice`,
    preheader: `Your ${params.plan} subscription has been cancelled`,
    badge: { text: "Subscription Update", color: "amber" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.userName || "there"}</strong>,
      </p>
      <p style="margin: 0 0 16px;">
        We received your request to cancel your <strong>${params.plan}</strong> subscription.
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">
        Your plan benefits will remain active until the end of your current billing period. You will not be charged again.
      </p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        If you change your mind, you can reactivate your subscription at any time from your billing dashboard.
      </p>
    `,
    cta: {
      text: "Billing Portal",
      url: `${APP_URL}/dashboard/billing`,
    },
  });

  return sendHtmlEmail({
    to: params.userEmail,
    subject: `[BuildMora] Subscription Cancellation: ${params.plan}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUPPORT REQUEST EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendSupportCreatedNotification(params: {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
}) {
  // 1. Notify Super Admin
  const adminHtml = renderEmailShell({
    title: `New Support Ticket: ${params.subject}`,
    preheader: `Ticket #${params.ticketId.slice(-6)} from ${params.name}`,
    badge: { text: `${params.priority} Priority`, color: params.priority === "URGENT" || params.priority === "HIGH" ? "amber" : "sky" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        A new support ticket has been submitted:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Ticket ID:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; font-family: monospace; color: #0f172a;">${params.ticketId}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>User:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.name} (${params.email})</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-size: 13px; color: #64748b;"><strong>Subject:</strong></td>
          <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a;">${params.subject}</td>
        </tr>
        <tr>
          <td style="vertical-align: top; font-size: 13px; color: #64748b;"><strong>Message:</strong></td>
          <td style="font-size: 14px; color: #0f172a; white-space: pre-wrap;">${params.message}</td>
        </tr>
      </table>
    `,
    cta: {
      text: "Open Support Queue",
      url: `${APP_URL}/super-admin/support`,
    },
  });

  await sendHtmlEmail({
    to: SUPPORT_EMAIL,
    replyTo: params.email,
    subject: `[Support Ticket #${params.ticketId.slice(-6)}] ${params.subject}`,
    html: adminHtml,
  });

  // 2. Acknowledge to User
  const userHtml = renderEmailShell({
    title: `Support Ticket Received #${params.ticketId.slice(-6)}`,
    preheader: `We have received your support request: ${params.subject}`,
    badge: { text: "Ticket Logged", color: "emerald" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.name}</strong>,
      </p>
      <p style="margin: 0 0 16px;">
        Thank you for reaching out to BuildMora Support. We have received your request regarding:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0f172a;">${params.subject}</p>
        <p style="margin: 0; font-size: 13px; color: #475569; white-space: pre-wrap;">${params.message}</p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Our engineering and support team will investigate and update you shortly.
      </p>
    `,
  });

  return sendHtmlEmail({
    to: params.email,
    subject: `[BuildMora Support #${params.ticketId.slice(-6)}] We received your request: ${params.subject}`,
    html: userHtml,
  });
}

export async function sendSupportResolvedNotification(params: {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  adminNotes?: string | null;
}) {
  const isResolved = params.status === "RESOLVED" || params.status === "CLOSED";

  const html = renderEmailShell({
    title: `Ticket ${params.status.replace("_", " ")}: #${params.ticketId.slice(-6)}`,
    preheader: `Update on your support ticket ${params.subject}`,
    badge: { text: params.status, color: isResolved ? "emerald" : "sky" },
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        Hi <strong>${params.name}</strong>,
      </p>
      <p style="margin: 0 0 16px;">
        Your support ticket <strong>&ldquo;${params.subject}&rdquo;</strong> status has been updated to:
        <strong style="color: ${isResolved ? "#059669" : "#0284c7"};">${params.status}</strong>.
      </p>
      ${
        params.adminNotes
          ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;">Note from Support Team:</p>
              <p style="margin: 0; font-size: 14px; color: #0f172a; white-space: pre-wrap;">${params.adminNotes}</p>
            </div>`
          : ""
      }
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        If you have further questions or need additional assistance, you can reply directly to this email.
      </p>
    `,
  });

  return sendHtmlEmail({
    to: params.email,
    subject: `[BuildMora Support #${params.ticketId.slice(-6)}] Status Update: ${params.status}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUPER ADMIN BROADCAST / BULK EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export async function sendBroadcastEmail(params: {
  to: string;
  recipientName?: string | null;
  subject: string;
  heading: string;
  bodyContent: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
}) {
  const html = renderEmailShell({
    title: params.heading,
    preheader: params.subject,
    badge: { text: "Platform Announcement", color: "violet" },
    bodyHtml: `
      ${params.recipientName ? `<p style="margin: 0 0 16px;">Hi <strong>${params.recipientName}</strong>,</p>` : ""}
      <div style="font-size: 15px; line-height: 1.7; color: #334155;">
        ${params.bodyContent}
      </div>
    `,
    cta:
      params.ctaText && params.ctaUrl
        ? {
            text: params.ctaText,
            url: params.ctaUrl,
          }
        : undefined,
    footerNote: `You received this official announcement as a registered member of BuildMora.`,
  });

  return sendHtmlEmail({
    to: params.to,
    subject: params.subject,
    html,
  });
}
