import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
function toEndpointUrl(endpoint: string, useSSL: boolean): string {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  const scheme = useSSL ? 'https' : 'http';
  return `${scheme}://${endpoint}`;
}

export async function presignS3Url(input: PresignInput): Promise<string> {
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

  const endpointUrl = toEndpointUrl(endpoint, useSSL);
  if (!endpointUrl) throw new Error('endpointUrl is required');

  const client = new S3Client({
    region,
    endpoint: endpointUrl,
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const expiresIn = Math.max(1, Math.min(Number(expiresSeconds), 60 * 60));
  const command =
    method === 'PUT'
      ? new PutObjectCommand({ Bucket: bucket, Key: objectKey })
      : new GetObjectCommand({ Bucket: bucket, Key: objectKey });

  return getSignedUrl(client, command, { expiresIn });
}
