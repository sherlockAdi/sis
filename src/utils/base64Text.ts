export function encodeBase64Text(input: string | null | undefined): string | null {
  if (input == null) return null;
  return Buffer.from(String(input), 'utf8').toString('base64');
}

export function decodeBase64Text(input: string | null | undefined): string | null {
  if (input == null) return null;
  const value = String(input);
  if (!value) return value;

  const looksLikeBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;
  if (!looksLikeBase64) return value;

  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    const reencoded = Buffer.from(decoded, 'utf8').toString('base64');
    return reencoded === value.replace(/\s+/g, '') ? decoded : value;
  } catch {
    return value;
  }
}
