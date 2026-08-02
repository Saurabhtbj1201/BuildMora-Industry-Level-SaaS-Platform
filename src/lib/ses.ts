import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-ses";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

const ses = new SESClient({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL ?? "noreply@buildmora.com";
const FROM_NAME = process.env.AWS_SES_FROM_NAME ?? "BuildMora";
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

// ─────────────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  replyTo?: string;
}

/**
 * Send a transactional email via AWS SES using a React Email template.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, template, replyTo } = options;

  const [html, text] = await Promise.all([
    render(template),
    render(template, { plainText: true }),
  ]);

  const toAddresses = Array.isArray(to) ? to : [to];

  const input: SendEmailCommandInput = {
    Source: FROM,
    Destination: { ToAddresses: toAddresses },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text, Charset: "UTF-8" },
      },
    },
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
  };

  try {
    await ses.send(new SendEmailCommand(input));
  } catch (error) {
    console.error("[SES] Failed to send email:", { to, subject, error });
    // Don't throw — email failure should not crash the API response
    // Log to audit or monitoring in production
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Send a simple plain-text email (for internal notifications).
 */
export async function sendSimpleEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const input: SendEmailCommandInput = {
    Source: FROM,
    Destination: { ToAddresses: [params.to] },
    Message: {
      Subject: { Data: params.subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: params.text, Charset: "UTF-8" },
      },
    },
  };

  await ses.send(new SendEmailCommand(input));
}
