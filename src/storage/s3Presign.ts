import crypto from 'node:crypto';

export type PresignInput = {
  method: 'GET' | 'PUT';
  endpoint: string; // host or host:port
  useSSL: boolean;
  bucket: string;
  objectKey: string;
  accessKey: string;
  secretKey: string;
  region: string;
  expiresSeconds: number; // 1..3600
};

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function toAmzDate(d: Date): { amzDate: string; dateStamp: string } {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  const dateStamp = `${yyyy}${mm}${dd}`;
  const amzDate = `${dateStamp}T${hh}${mi}${ss}Z`;
  return { amzDate, dateStamp };
}

function encodeRfc3986(s: string): string {
  return encodeURIComponent(s).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalUri(bucket: string, objectKey: string): string {
  const key = objectKey.split('/').map(encodeRfc3986).join('/');
  return `/${encodeRfc3986(bucket)}/${key}`;
}

export function presignS3Url(input: PresignInput): string {
  const {
    method,
    endpoint,
    useSSL,
    bucket,
    objectKey,
    accessKey,
    secretKey,
    region,
    expiresSeconds,
  } = input;

  if (!endpoint) throw new Error('endpoint is required');
  if (!bucket) throw new Error('bucket is required');
  if (!objectKey) throw new Error('objectKey is required');
  if (!accessKey || !secretKey) throw new Error('accessKey/secretKey are required');

  const now = new Date();
  const { amzDate, dateStamp } = toAmzDate(now);

  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const signedHeaders = 'host';

  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKey}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresSeconds),
    'X-Amz-SignedHeaders': signedHeaders,
  };

  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(params[k])}`)
    .join('&');

  const host = endpoint;
  const uri = canonicalUri(bucket, objectKey);

  const canonicalHeaders = `host:${host}\n`;
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    method,
    uri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign).toString('hex');

  const scheme = useSSL ? 'https' : 'http';
  const finalQuery = `${canonicalQuery}&X-Amz-Signature=${signature}`;
  return `${scheme}://${host}${uri}?${finalQuery}`;
}

