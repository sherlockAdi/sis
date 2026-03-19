import { Controller, Get, Query, Route, Security, Tags } from 'tsoa';
import { env } from '../../config/env';
import { presignS3Url } from '../../storage/s3Presign';
import { httpError } from '../../utils/httpErrors';

function requireMinioConfigured() {
  if (!env.MINIO_ENDPOINT || !env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) {
    throw httpError(500, 'MinIO is not configured (set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)');
  }
}

function minioHost(): string {
  // Allow MINIO_ENDPOINT to be "host" or "host:port"
  const ep = String(env.MINIO_ENDPOINT ?? '').trim();
  if (!ep) return ep;
  if (ep.includes(':')) return ep;
  return `${ep}:${env.MINIO_PORT}`;
}

@Route('files')
@Tags('Files')
export class FilesController extends Controller {
  @Get('presign-upload')
  @Security('jwt')
  public async presignUpload(
    @Query() object_key: string,
    @Query() expiry_seconds?: number
  ): Promise<{ url: string; bucket: string; object_key: string; expiry_seconds: number }> {
    requireMinioConfigured();
    const objectKey = String(object_key ?? '').trim();
    if (!objectKey) throw httpError(400, 'object_key is required');

    const expiry = Math.max(60, Math.min(Number(expiry_seconds ?? 900), 60 * 60));
    const url = presignS3Url({
      method: 'PUT',
      endpoint: minioHost(),
      useSSL: env.MINIO_USE_SSL,
      bucket: env.MINIO_BUCKET,
      objectKey,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      region: process.env.MINIO_REGION ?? 'us-east-1',
      expiresSeconds: expiry
    });
    return { url, bucket: env.MINIO_BUCKET, object_key: objectKey, expiry_seconds: expiry };
  }

  @Get('presign-download')
  @Security('jwt')
  public async presignDownload(
    @Query() object_key: string,
    @Query() expiry_seconds?: number
  ): Promise<{ url: string; bucket: string; object_key: string; expiry_seconds: number }> {
    requireMinioConfigured();
    const objectKey = String(object_key ?? '').trim();
    if (!objectKey) throw httpError(400, 'object_key is required');

    const expiry = Math.max(60, Math.min(Number(expiry_seconds ?? 900), 60 * 60));
    const url = presignS3Url({
      method: 'GET',
      endpoint: minioHost(),
      useSSL: env.MINIO_USE_SSL,
      bucket: env.MINIO_BUCKET,
      objectKey,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      region: process.env.MINIO_REGION ?? 'us-east-1',
      expiresSeconds: expiry
    });
    return { url, bucket: env.MINIO_BUCKET, object_key: objectKey, expiry_seconds: expiry };
  }
}
