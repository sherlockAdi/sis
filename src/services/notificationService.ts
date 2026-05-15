import { env } from '../config/env';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/pool';
import { sendSmtpMail } from '../utils/smtpClient';
import {
  buildNotificationHtml,
  buildNotificationSubject,
  buildNotificationText,
  type NotificationMessageInput,
  type NotificationSignature,
} from '../utils/notificationTemplates';
import {
  accountLinkedEmailHtml,
  accountLinkedEmailText,
  credentialsEmailHtml,
  credentialsEmailText,
  otpEmailHtml,
  otpEmailText,
} from '../utils/emailTemplates';

const DEFAULT_NOTIFICATION_CC = [
  'mrsrivastava@neuralinfo.org',
  'sneha.s@neuralinfo.org',
  'aditya.d@neuralinfo.org',
];

type NotificationTemplateRow = RowDataPacket & {
  template_id: number;
  template_code: string;
  template_name: string;
  category: string;
  channel: string;
  recipient_type: string;
  subject_template: string | null;
  text_template: string | null;
  html_template: string | null;
  signature_name: string | null;
  signature_title: string | null;
  status: 0 | 1 | boolean;
};

export type NotificationRecipient = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

export type NotificationPayload = NotificationMessageInput & {
  recipient: NotificationRecipient;
  channels?: Array<'email' | 'phone' | 'whatsapp'>;
  rendered?: {
    subject: string;
    text: string;
    html: string;
  };
};

export type NotificationResult = {
  email_sent: boolean;
  phone_sent: boolean;
  whatsapp_sent: boolean;
};

export type NotificationMailRecipient = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

function trimToNull(value: string | null | undefined): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function trimToUndefined(value: string | null | undefined): string | undefined {
  const text = trimToNull(value);
  return text ?? undefined;
}

function normalizeEmailList(values?: string[]): string[] | undefined {
  const emails = Array.from(
    new Set(
      (values ?? [])
        .map((value) => trimToNull(value))
        .filter((value): value is string => Boolean(value))
    )
  );
  return emails.length ? emails : undefined;
}

function defaultCc(cc?: string[]): string[] | undefined {
  return normalizeEmailList([...(DEFAULT_NOTIFICATION_CC ?? []), ...(cc ?? [])]);
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replaceTokens(template: string, values: Record<string, string>, mode: 'text' | 'html'): string {
  return String(template ?? '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const raw = values[key] ?? '';
    return mode === 'html' ? escapeHtml(raw) : raw;
  });
}

async function loadNotificationTemplate(templateCode: string): Promise<NotificationTemplateRow | null> {
  const [rows] = await pool.query<(RowDataPacket & NotificationTemplateRow)[]>(
    `SELECT template_id, template_code, template_name, category, channel, recipient_type,
            subject_template, text_template, html_template, signature_name, signature_title, status
     FROM NOTI_U01_notification_templates
     WHERE template_code = :template_code
       AND status = TRUE
     LIMIT 1`,
    { template_code: templateCode },
  );
  return rows[0] ?? null;
}

function toTemplateValues(values: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    out[key] = String(value ?? '');
  }
  return out;
}

function buildRowsText(rows: Array<{ label: string; value: string }> = []): string {
  return rows.map((row) => `${row.label}: ${row.value}`).join('\n');
}

function buildRowsHtml(rows: Array<{ label: string; value: string }> = []): string {
  if (!rows.length) return '';
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;margin-top:20px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      ${rows
        .map(
          (row) => `
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:34%;font-size:14px;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(row.value)}</td>
            </tr>`,
        )
        .join('')}
    </table>
  `.trim();
}

function buildStepsText(nextSteps: string[] = []): string {
  if (!nextSteps.length) return '';
  return ['Next steps:', ...nextSteps.map((step) => `- ${step}`)].join('\n');
}

function buildStepsHtml(nextSteps: string[] = []): string {
  if (!nextSteps.length) return '';
  return `
    <div style="margin-top:22px;padding:18px 20px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;">
      <div style="font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0f172a;margin-bottom:10px;">Next Steps</div>
      <ul style="margin:0;padding:0 0 0 8px;">
        ${nextSteps.map((step) => `<li style="margin:0 0 8px 18px;color:#374151;">${escapeHtml(step)}</li>`).join('')}
      </ul>
    </div>
  `.trim();
}

function resolveCredentialTemplateCode(portalLabel?: string): string {
  const label = String(portalLabel ?? '').toLowerCase();
  if (label.includes('candidate')) return 'CANDIDATE_CREDENTIALS';
  if (label.includes('partner')) return 'PARTNER_CREDENTIALS';
  if (label.includes('company')) return 'COMPANY_CREDENTIALS';
  if (label.includes('associate')) return 'ASSOCIATE_PARTNER_CREDENTIALS';
  if (label.includes('employee')) return 'EMPLOYEE_CREDENTIALS';
  return 'ACCOUNT_CREDENTIALS';
}

function resolveStatusTemplateCode(payload: NotificationPayload): string {
  const headline = String(payload.headline ?? '').toLowerCase();
  const status = String(payload.statusLabel ?? '').toLowerCase();
  const subject = String(payload.subject ?? '').toLowerCase();
  const blob = `${headline} ${status} ${subject}`;

  if (blob.includes('interview')) return 'INTERVIEW_SCHEDULED';
  if (blob.includes('application submitted') || blob.includes('job applied')) return 'APPLICATION_SUBMITTED';
  if (blob.includes('shortlist')) return 'APPLICATION_SHORTLISTED';
  if (blob.includes('selected') || blob.includes('offer')) return 'APPLICATION_SELECTED';
  if (blob.includes('closed') || blob.includes('rejected')) return 'APPLICATION_CLOSED';
  if (blob.includes('deployment')) return 'DEPLOYMENT_STATUS';
  if (blob.includes('employee record created') || blob.includes('employee created')) return 'EMPLOYEE_CREATED';
  if (blob.includes('employee status updated') || blob.includes('employee disabled')) return 'EMPLOYEE_STATUS';
  return 'APPLICATION_STATUS';
}

async function renderTemplateMail(input: {
  templateCode: string;
  fallbackSubject: string;
  fallbackText: string;
  fallbackHtml: string;
  values: Record<string, unknown>;
  signature?: NotificationSignature;
}): Promise<{ subject: string; text: string; html: string }> {
  const template = await loadNotificationTemplate(input.templateCode);
  const templateValues = toTemplateValues({
    ...input.values,
    signature_name: template?.signature_name ?? input.signature?.name ?? env.NOTIFICATION_SIGNATURE_NAME,
    signature_title: template?.signature_title ?? input.signature?.title ?? env.NOTIFICATION_SIGNATURE_TITLE,
  });

  if (!template) {
    return {
      subject: input.fallbackSubject,
      text: input.fallbackText,
      html: input.fallbackHtml,
    };
  }

  return {
    subject: template.subject_template ? replaceTokens(template.subject_template, templateValues, 'text') : input.fallbackSubject,
    text: template.text_template ? replaceTokens(template.text_template, templateValues, 'text') : input.fallbackText,
    html: template.html_template ? replaceTokens(template.html_template, templateValues, 'html') : input.fallbackHtml,
  };
}

function signature(): NotificationSignature {
  return {
    name: env.NOTIFICATION_SIGNATURE_NAME,
    title: env.NOTIFICATION_SIGNATURE_TITLE,
    email: trimToUndefined(env.NOTIFICATION_SIGNATURE_EMAIL),
    phone: trimToUndefined(env.NOTIFICATION_SIGNATURE_PHONE),
    website: trimToUndefined(env.NOTIFICATION_SIGNATURE_WEBSITE),
  };
}

async function postWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  const target = trimToNull(url);
  if (!target) return;

  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Notification webhook failed with HTTP ${response.status}`);
  }
}

function buildChannelMessage(input: NotificationMessageInput & { recipient: NotificationRecipient }): string {
  const greeting = input.greeting ? `${input.greeting}\n\n` : '';
  const rows = (input.rows ?? []).map((row) => `${row.label}: ${row.value}`).join('\n');
  const steps = (input.nextSteps ?? []).length
    ? `\n\nNext steps:\n${(input.nextSteps ?? []).map((step) => `- ${step}`).join('\n')}`
    : '';
  const footer = input.footerNote ? `\n\n${input.footerNote}` : '';
  const who = input.recipient.name ? ` ${input.recipient.name}` : '';
  return `${greeting}${input.headline}\nStatus: ${input.statusLabel ?? 'Update'}\n\nHello${who},\n${input.summary}${rows ? `\n\n${rows}` : ''}${steps}${footer}\n\nRegards,\n${signature().name}\n${signature().title}`.trim() + '\n';
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const channels = payload.channels ?? ['email', 'phone', 'whatsapp'];
  const subject = payload.rendered?.subject ?? buildNotificationSubject(payload.subject);
  const text = payload.rendered?.text ?? buildChannelMessage({ ...payload, signature: signature() });
  const html = payload.rendered?.html ?? buildNotificationHtml({ ...payload, signature: signature() });

  console.log('[notification] prepare', JSON.stringify({
    subject,
    channels,
    recipient: {
      name: payload.recipient.name ?? null,
      email: payload.recipient.email ?? null,
      phone: payload.recipient.phone ?? null,
      whatsapp: payload.recipient.whatsapp ?? null,
    },
  }));

  let email_sent = false;
  let phone_sent = false;
  let whatsapp_sent = false;

  const recipientEmail = trimToNull(payload.recipient.email);
  if (!channels.includes('email')) {
    console.log('[notification] email skipped', 'channel_disabled');
  } else if (!recipientEmail) {
    console.log('[notification] email skipped', 'missing_recipient_email');
  } else if (!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)) {
    console.log('[notification] email skipped', 'smtp_not_configured');
  } else {
    try {
      await sendSmtpMail(
        {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
          from: env.SMTP_FROM || env.SMTP_USER,
        },
        {
          to: recipientEmail,
          subject,
          text,
          html,
        }
      );
      email_sent = true;
      console.log('[notification] email sent', recipientEmail);
    } catch (error) {
      console.warn('[notification] email send failed', error instanceof Error ? error.message : error);
    }
  }

  const phone = trimToNull(payload.recipient.phone);
  if (!channels.includes('phone')) {
    console.log('[notification] sms skipped', 'channel_disabled');
  } else if (!phone) {
    console.log('[notification] sms skipped', 'missing_phone');
  } else if (!trimToNull(env.SMS_WEBHOOK_URL)) {
    console.log('[notification] sms skipped', 'sms_webhook_not_configured');
  } else {
    try {
      await postWebhook(env.SMS_WEBHOOK_URL, {
        channel: 'sms',
        to: phone,
        subject,
        message: text,
        meta: { recipient: payload.recipient.name ?? null, status: payload.statusLabel ?? null },
      });
      phone_sent = true;
      console.log('[notification] sms sent', phone);
    } catch (error) {
      console.warn('[notification] sms send failed', error instanceof Error ? error.message : error);
    }
  }

  const whatsapp = trimToNull(payload.recipient.whatsapp) ?? phone;
  if (!channels.includes('whatsapp')) {
    console.log('[notification] whatsapp skipped', 'channel_disabled');
  } else if (!whatsapp) {
    console.log('[notification] whatsapp skipped', 'missing_whatsapp');
  } else if (!trimToNull(env.WHATSAPP_WEBHOOK_URL)) {
    console.log('[notification] whatsapp skipped', 'whatsapp_webhook_not_configured');
  } else {
    try {
      await postWebhook(env.WHATSAPP_WEBHOOK_URL, {
        channel: 'whatsapp',
        to: whatsapp,
        subject,
        message: text,
        meta: { recipient: payload.recipient.name ?? null, status: payload.statusLabel ?? null },
      });
      whatsapp_sent = true;
      console.log('[notification] whatsapp sent', whatsapp);
    } catch (error) {
      console.warn('[notification] whatsapp send failed', error instanceof Error ? error.message : error);
    }
  }

  console.log('[notification] result', JSON.stringify({ email_sent, phone_sent, whatsapp_sent, subject }));

  return { email_sent, phone_sent, whatsapp_sent };
}

export async function sendStatusNotification(payload: Omit<NotificationPayload, 'channels'>): Promise<NotificationResult> {
  const rendered = await renderTemplateMail({
    templateCode: resolveStatusTemplateCode(payload),
    fallbackSubject: buildNotificationSubject(payload.subject),
    fallbackText: buildChannelMessage({ ...payload, signature: signature() }),
    fallbackHtml: buildNotificationHtml({ ...payload, signature: signature() }),
    values: {
      greeting: payload.greeting ?? '',
      subject: String(payload.subject ?? '').trim(),
      headline: payload.headline,
      status_label: payload.statusLabel ?? '',
      summary: payload.summary,
      rows: buildRowsText(payload.rows ?? []),
      rows_html: buildRowsHtml(payload.rows ?? []),
      next_steps: buildStepsText(payload.nextSteps ?? []),
      next_steps_html: buildStepsHtml(payload.nextSteps ?? []),
      footer_note: payload.footerNote ?? '',
      recipient_name: payload.recipient.name ?? '',
      recipient_email: payload.recipient.email ?? '',
      recipient_phone: payload.recipient.phone ?? '',
      recipient_whatsapp: payload.recipient.whatsapp ?? '',
    },
    signature: signature(),
  });
  return sendNotification({ ...payload, channels: ['email', 'phone', 'whatsapp'], rendered });
}

async function sendEmailTemplate(input: {
  recipientEmail?: string | null;
  subject: string;
  text: string;
  html: string;
  cc?: string[];
}): Promise<boolean> {
  const recipientEmail = trimToNull(input.recipientEmail);
  if (!recipientEmail) return false;
  if (!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)) return false;

  await sendSmtpMail(
    {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.SMTP_FROM || env.SMTP_USER,
    },
    {
      to: recipientEmail,
      cc: defaultCc(input.cc),
      subject: input.subject,
      text: input.text,
      html: input.html,
    }
  );
  return true;
}

export async function sendOtpNotification(input: {
  recipient: NotificationMailRecipient;
  otpCode: string;
  expiresMinutes: number;
}): Promise<NotificationResult> {
  console.log('[notification] otp prepare', JSON.stringify({ recipient: input.recipient, expiresMinutes: input.expiresMinutes }));
  const rendered = await renderTemplateMail({
    templateCode: 'OTP_LOGIN',
    fallbackSubject: 'SIS Global Connect - Login OTP',
    fallbackText: otpEmailText({ name: input.recipient.name ?? null, otpCode: input.otpCode, expiresMinutes: input.expiresMinutes }),
    fallbackHtml: otpEmailHtml({ name: input.recipient.name ?? null, otpCode: input.otpCode, expiresMinutes: input.expiresMinutes }),
    values: {
      name: input.recipient.name ?? '',
      otp_code: input.otpCode,
      expires_minutes: input.expiresMinutes,
      recipient_name: input.recipient.name ?? '',
      recipient_email: input.recipient.email ?? '',
    },
    signature: signature(),
  });
  const subject = rendered.subject;
  const text = rendered.text;
  const html = rendered.html;
  const email_sent = await sendEmailTemplate({ recipientEmail: input.recipient.email, subject, text, html });
  console.log('[notification] otp result', JSON.stringify({ email_sent, subject }));
  return { email_sent, phone_sent: false, whatsapp_sent: false };
}

export async function sendCredentialNotification(input: {
  recipient: NotificationMailRecipient;
  username: string;
  temporaryPassword: string;
  portalLabel?: string;
  subject?: string;
  cc?: string[];
}): Promise<NotificationResult> {
  console.log('[notification] credential prepare', JSON.stringify({ recipient: input.recipient, portalLabel: input.portalLabel ?? null }));
  const fallbackSubject = input.subject ?? `SIS Global Connect - ${input.portalLabel ?? 'Account'} credentials`;
  const rendered = await renderTemplateMail({
    templateCode: resolveCredentialTemplateCode(input.portalLabel),
    fallbackSubject,
    fallbackText: credentialsEmailText({
      name: input.recipient.name ?? null,
      username: input.username,
      temporaryPassword: input.temporaryPassword,
      portalLabel: input.portalLabel,
    }),
    fallbackHtml: credentialsEmailHtml({
      name: input.recipient.name ?? null,
      username: input.username,
      temporaryPassword: input.temporaryPassword,
      portalLabel: input.portalLabel,
    }),
    values: {
      name: input.recipient.name ?? '',
      username: input.username,
      temporary_password: input.temporaryPassword,
      portal_label: input.portalLabel ?? '',
      recipient_name: input.recipient.name ?? '',
      recipient_email: input.recipient.email ?? '',
    },
    signature: signature(),
  });
  const subject = rendered.subject;
  const text = rendered.text;
  const html = rendered.html;
  const email_sent = await sendEmailTemplate({ recipientEmail: input.recipient.email, subject, text, html, cc: input.cc });
  console.log('[notification] credential result', JSON.stringify({ email_sent, subject }));
  return { email_sent, phone_sent: false, whatsapp_sent: false };
}

export async function sendAccountLinkedNotification(input: {
  recipient: NotificationMailRecipient;
  username: string;
  temporaryPassword?: string | null;
  portalLabel?: string;
  subject?: string;
  cc?: string[];
}): Promise<NotificationResult> {
  console.log('[notification] linked-account prepare', JSON.stringify({ recipient: input.recipient, portalLabel: input.portalLabel ?? null }));
  const fallbackSubject = input.subject ?? `SIS Global Connect - ${input.portalLabel ?? 'Account'} updated`;
  const rendered = await renderTemplateMail({
    templateCode: 'ACCOUNT_LINKED',
    fallbackSubject,
    fallbackText: accountLinkedEmailText({
      name: input.recipient.name ?? null,
      username: input.username,
      temporaryPassword: input.temporaryPassword ?? null,
      portalLabel: input.portalLabel,
    }),
    fallbackHtml: accountLinkedEmailHtml({
      name: input.recipient.name ?? null,
      username: input.username,
      temporaryPassword: input.temporaryPassword ?? null,
      portalLabel: input.portalLabel,
    }),
    values: {
      name: input.recipient.name ?? '',
      username: input.username,
      temporary_password: input.temporaryPassword ?? '',
      temporary_password_line: input.temporaryPassword ? `Temporary password: ${input.temporaryPassword}` : '',
      portal_label: input.portalLabel ?? '',
      recipient_name: input.recipient.name ?? '',
      recipient_email: input.recipient.email ?? '',
    },
    signature: signature(),
  });
  const subject = rendered.subject;
  const text = rendered.text;
  const html = rendered.html;
  const email_sent = await sendEmailTemplate({ recipientEmail: input.recipient.email, subject, text, html, cc: input.cc });
  console.log('[notification] linked-account result', JSON.stringify({ email_sent, subject }));
  return { email_sent, phone_sent: false, whatsapp_sent: false };
}
