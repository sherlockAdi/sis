import { env } from '../config/env';
import { sendSmtpMail } from '../utils/smtpClient';
import {
  buildNotificationHtml,
  buildNotificationSubject,
  buildNotificationText,
  type NotificationMessageInput,
  type NotificationSignature,
} from '../utils/notificationTemplates';

export type NotificationRecipient = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

export type NotificationPayload = NotificationMessageInput & {
  recipient: NotificationRecipient;
  channels?: Array<'email' | 'phone' | 'whatsapp'>;
};

export type NotificationResult = {
  email_sent: boolean;
  phone_sent: boolean;
  whatsapp_sent: boolean;
};

function trimToNull(value: string | null | undefined): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function trimToUndefined(value: string | null | undefined): string | undefined {
  const text = trimToNull(value);
  return text ?? undefined;
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
  const subject = buildNotificationSubject(payload.subject);
  const text = buildChannelMessage({ ...payload, signature: signature() });
  const html = buildNotificationHtml({ ...payload, signature: signature() });

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
  return sendNotification({ ...payload, channels: ['email', 'phone', 'whatsapp'] });
}
