export type NotificationSignature = {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export type NotificationRow = {
  label: string;
  value: string;
};

export type NotificationMessageInput = {
  greeting?: string;
  subject: string;
  headline: string;
  statusLabel?: string;
  summary: string;
  rows?: NotificationRow[];
  nextSteps?: string[];
  footerNote?: string;
  signature?: NotificationSignature;
};

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function compactLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const value = String(line ?? '').trimEnd();
    if (!value && out[out.length - 1] === '') continue;
    out.push(value);
  }
  return out.filter((line, idx, arr) => !(line === '' && idx === arr.length - 1));
}

function signatureLines(signature?: NotificationSignature): string[] {
  const lines = [
    signature?.name || 'SIS Global Connect Team',
    signature?.title ? signature.title : 'Candidate & Workforce Support',
    signature?.email ? `Email: ${signature.email}` : '',
    signature?.phone ? `Phone: ${signature.phone}` : '',
    signature?.website ? `Website: ${signature.website}` : '',
  ];
  return lines.filter(Boolean);
}

export function buildNotificationText(input: NotificationMessageInput): string {
  const lines: string[] = [];
  if (input.greeting) {
    lines.push(input.greeting);
    lines.push('');
  }
  lines.push(input.headline);
  lines.push('-'.repeat(Math.min(72, Math.max(16, input.headline.length))));
  if (input.statusLabel) {
    lines.push(`Status: ${input.statusLabel}`);
  }
  lines.push(input.summary);
  lines.push('');
  for (const row of input.rows ?? []) {
    lines.push(`${row.label}: ${row.value}`);
  }
  if (input.nextSteps?.length) {
    lines.push('');
    lines.push('Next steps:');
    for (const step of input.nextSteps) lines.push(`- ${step}`);
  }
  if (input.footerNote) {
    lines.push('');
    lines.push(input.footerNote);
  }
  lines.push('');
  lines.push('Regards,');
  lines.push(...signatureLines(input.signature));
  lines.push('');
  lines.push('This is an automated notification. Please do not reply to this message.');
  return compactLines(lines).join('\n').trim() + '\n';
}

export function buildNotificationHtml(input: NotificationMessageInput): string {
  const rowsHtml = (input.rows ?? [])
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:34%;font-size:14px;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join('');

  const nextStepsHtml = (input.nextSteps ?? [])
    .map((step) => `<li style="margin:0 0 8px 18px;color:#374151;">${escapeHtml(step)}</li>`)
    .join('');

  const signature = input.signature ?? {};
  const signatureLinesHtml = signatureLines(signature)
    .map((line) => `<div style="margin:0 0 4px 0;color:#111827;">${escapeHtml(line)}</div>`)
    .join('');

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:720px;margin:0 auto;padding:32px 18px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
          <div style="padding:30px 34px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#ffffff;">
            <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.88;">SIS Global Connect</div>
            <div style="font-size:28px;line-height:1.2;font-weight:800;margin-top:12px;">${escapeHtml(input.headline)}</div>
            ${input.statusLabel ? `<div style="display:inline-block;margin-top:14px;padding:7px 12px;background:rgba(255,255,255,0.14);border-radius:999px;font-size:13px;font-weight:700;">Status: ${escapeHtml(input.statusLabel)}</div>` : ''}
          </div>
          <div style="padding:30px 34px;">
            ${input.greeting ? `<div style="font-size:16px;color:#111827;margin-bottom:14px;">${escapeHtml(input.greeting)}</div>` : ''}
            <div style="font-size:16px;line-height:1.7;color:#374151;">${escapeHtml(input.summary)}</div>
            ${rowsHtml ? `
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;margin-top:24px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                ${rowsHtml}
              </table>` : ''}
            ${nextStepsHtml ? `
              <div style="margin-top:26px;padding:20px 22px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;">
                <div style="font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0f172a;margin-bottom:10px;">Next Steps</div>
                <ul style="margin:0;padding:0 0 0 8px;">${nextStepsHtml}</ul>
              </div>` : ''}
            ${input.footerNote ? `<div style="margin-top:24px;font-size:14px;color:#6b7280;">${escapeHtml(input.footerNote)}</div>` : ''}
          </div>
          <div style="padding:26px 34px;border-top:1px solid #e5e7eb;background:#f8fafc;">
            <div style="font-weight:800;color:#111827;margin-bottom:8px;">Regards,</div>
            <div style="font-size:15px;line-height:1.6;">${signatureLinesHtml || '<div style="color:#111827;">SIS Global Connect Team</div>'}</div>
            <div style="margin-top:18px;font-size:12px;line-height:1.7;color:#6b7280;">
              This is an automated notification. Please do not reply to this message.
            </div>
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

export function buildNotificationSubject(title: string): string {
  return `SIS Global Connect - ${String(title ?? '').trim()}`;
}
