type PlainEmailArgs = {
  greeting?: string;
  title?: string;
  body: string[];
  footerLines?: string[];
};

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function signatureHtml(): string {
  return `
    <div style="margin-top:22px;">
      <div style="font-weight:800;color:#111827;">SIS Global Connect Team</div>
      <div style="color:#4b5563;margin-top:4px;">Candidate & Workforce Support</div>
      <div style="color:#6b7280;margin-top:10px;font-size:12px;">This is an automated email. Please do not reply to this message.</div>
    </div>
  `.trim();
}

function buildProfessionalEmailHtml(input: { greeting?: string; title: string; body: string[]; footerLines?: string[] }): string {
  const bodyHtml = input.body
    .map((line) => {
      if (!line) return '<div style="height:12px;"></div>';
      if (line.startsWith('- ')) {
        return `<li style="margin:0 0 8px 18px;color:#374151;">${escapeHtml(line.slice(2))}</li>`;
      }
      return `<div style="margin:0 0 10px 0;color:#374151;line-height:1.7;">${escapeHtml(line)}</div>`;
    })
    .join('');

  const footerLines = (input.footerLines?.length ? input.footerLines : [
    'If you did not request this, please contact support right away.',
  ]).map((line) => `<div style="margin:0 0 6px 0;color:#6b7280;">${escapeHtml(line)}</div>`).join('');

  return `
    <div style="margin:0;background:#f3f4f6;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#ffffff;">
          <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">SIS Global Connect</div>
          <div style="font-size:28px;line-height:1.2;font-weight:800;margin-top:12px;">${escapeHtml(input.title)}</div>
        </div>
        <div style="padding:30px 32px;">
          ${input.greeting ? `<div style="font-size:16px;color:#111827;margin-bottom:14px;">${escapeHtml(input.greeting)}</div>` : ''}
          ${bodyHtml}
          <div style="margin-top:24px;padding:18px 20px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;">
            ${footerLines}
          </div>
          ${signatureHtml()}
        </div>
      </div>
    </div>
  `.trim();
}

export function buildPlainEmail({ greeting, title, body, footerLines }: PlainEmailArgs): string {
  const lines: string[] = [];
  if (greeting) lines.push(greeting);
  if (greeting) lines.push('');

  if (title) {
    lines.push(title);
    lines.push('-'.repeat(Math.min(72, Math.max(12, title.length))));
  }

  lines.push(...body);
  lines.push('');
  lines.push('Thanks,');
  lines.push('SIS Global Connect');

  const footer = footerLines?.length
    ? footerLines
    : [
        '—',
        'This is an automated email. Please do not reply to this message.',
        'If you did not request this, you can safely ignore this email.',
      ];
  lines.push(...footer);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function otpEmailText(args: { name?: string | null; otpCode: string; expiresMinutes: number }): string {
  const greeting = `Hello${args.name ? ` ${String(args.name).trim()}` : ''},`.trim();
  return buildPlainEmail({
    greeting,
    title: 'Login verification code (OTP)',
    body: [
      'Use the OTP below to sign in. Do not share this code with anyone.',
      '',
      `OTP: ${args.otpCode}`,
      `Valid for: ${args.expiresMinutes} minutes`,
      '',
      'If you did not request this OTP, please change your password (if applicable) and contact your administrator.',
    ],
  });
}

export function credentialsEmailText(args: {
  name?: string | null;
  username: string;
  temporaryPassword: string;
  portalLabel?: string;
}): string {
  const greeting = `Hello${args.name ? ` ${String(args.name).trim()}` : ''},`.trim();
  return buildPlainEmail({
    greeting,
    title: args.portalLabel ? `${args.portalLabel} account credentials` : 'Account credentials',
    body: [
      'Your account has been created. Use the credentials below to sign in.',
      '',
      `Username: ${args.username}`,
      `Temporary password: ${args.temporaryPassword}`,
      '',
      'Security tips:',
      '- Change your password after your first sign-in.',
      '- Never share your password or OTP with anyone.',
    ],
  });
}

export function credentialsEmailHtml(args: {
  name?: string | null;
  username: string;
  temporaryPassword: string;
  portalLabel?: string;
}): string {
  const greeting = `Hello${args.name ? ` ${String(args.name).trim()}` : ''},`.trim();
  return buildProfessionalEmailHtml({
    greeting,
    title: args.portalLabel ? `${args.portalLabel} account credentials` : 'Account credentials',
    body: [
      'Your account has been created. Use the credentials below to sign in.',
      '',
      `Username: ${args.username}`,
      `Temporary password: ${args.temporaryPassword}`,
      '',
      'Security tips:',
      '- Change your password after your first sign-in.',
      '- Never share your password or OTP with anyone.',
    ],
    footerLines: [
      'Keep your login details secure and update your password after the first sign-in.',
      'If you need help, contact the SIS support team.',
    ],
  });
}

export function accountLinkedEmailText(args: {
  name?: string | null;
  username: string;
  temporaryPassword?: string | null;
  portalLabel?: string;
}): string {
  const greeting = `Hello${args.name ? ` ${String(args.name).trim()}` : ''},`.trim();
  return buildPlainEmail({
    greeting,
    title: args.portalLabel ? `${args.portalLabel} account updated` : 'Account updated',
    body: [
      'Your account has been linked and your details have been updated by the associate partner.',
      '',
      `Username: ${args.username}`,
      ...(args.temporaryPassword ? ['', `Temporary password: ${args.temporaryPassword}`] : []),
      '',
      'If you did not expect this update, please contact your administrator.',
    ],
  });
}

export function accountLinkedEmailHtml(args: {
  name?: string | null;
  username: string;
  temporaryPassword?: string | null;
  portalLabel?: string;
}): string {
  const greeting = `Hello${args.name ? ` ${String(args.name).trim()}` : ''},`.trim();
  return buildProfessionalEmailHtml({
    greeting,
    title: args.portalLabel ? `${args.portalLabel} account updated` : 'Account updated',
    body: [
      'Your account has been linked and your details have been updated by the associate partner.',
      '',
      `Username: ${args.username}`,
      ...(args.temporaryPassword ? ['', `Temporary password: ${args.temporaryPassword}`] : []),
      '',
      'If you did not expect this update, please contact your administrator.',
    ],
    footerLines: [
      'Review your portal access as soon as possible.',
      'Contact SIS support if anything looks incorrect.',
    ],
  });
}

export function otpEmailHtml(args: { name?: string | null; otpCode: string; expiresMinutes: number }): string {
  const greeting = `Hello${args.name ? ` ${String(args.name).trim()}` : ''},`.trim();
  return buildProfessionalEmailHtml({
    greeting,
    title: 'Login verification code (OTP)',
    body: [
      'Use the OTP below to sign in. Do not share this code with anyone.',
      '',
      `OTP: ${args.otpCode}`,
      `Valid for: ${args.expiresMinutes} minutes`,
      '',
      'If you did not request this OTP, please change your password (if applicable) and contact your administrator.',
    ],
    footerLines: [
      'This code is for one-time use only.',
    ],
  });
}
