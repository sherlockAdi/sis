type PlainEmailArgs = {
  greeting?: string;
  title?: string;
  body: string[];
  footerLines?: string[];
};

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

