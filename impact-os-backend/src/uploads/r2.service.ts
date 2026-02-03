import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export type UploadType = 'testimonial' | 'partner' | 'avatar' | 'intake';

const PREFIX: Record<UploadType, string> = {
  testimonial: 'testimonials/',
  partner: 'partners/',
  avatar: 'avatars/',
  intake: 'intake/',
};

const ALLOWED_CONTENT_TYPES = new Set([
  'image/webp',
  'image/jpeg',
  'image/png',
]);

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private s3: S3Client | null = null;
  private isConfigured = false;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'R2 credentials not configured - uploads will be disabled',
      );
      return;
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.isConfigured = true;
    this.logger.log('R2 storage service initialized');
  }

  /**
   * Generate a pre-signed URL for direct browser-to-R2 upload
   */
  async signUpload(params: {
    type: UploadType;
    contentType: string;
  }): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const { type, contentType } = params;

    if (!this.isConfigured || !this.s3) {
      throw new BadRequestException('Storage service is not configured');
    }

    if (!PREFIX[type]) {
      throw new BadRequestException(`Invalid upload type: ${type}`);
    }

    // Validate content type
    if (!contentType?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new BadRequestException(
        `Unsupported image type. Allowed: ${[...ALLOWED_CONTENT_TYPES].join(', ')}`,
      );
    }

    // Determine file extension
    const ext =
      contentType === 'image/webp'
        ? 'webp'
        : contentType === 'image/png'
          ? 'png'
          : 'jpg';

    // Generate unique key with prefix
    const key = `${PREFIX[type]}${randomUUID()}.${ext}`;

    const bucket = process.env.R2_BUCKET;
    const publicBase = process.env.R2_PUBLIC_BASE_URL;

    if (!bucket) {
      throw new BadRequestException('R2_BUCKET not configured');
    }
    if (!publicBase) {
      throw new BadRequestException('R2_PUBLIC_BASE_URL not configured');
    }

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    // Generate pre-signed URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: 60 });

    // Construct public URL (e.g., https://media.cycle28.org/testimonials/uuid.webp)
    const publicUrl = `${publicBase.replace(/\/$/, '')}/${key}`;

    this.logger.debug(`Generated signed URL for ${type} upload: ${key}`);

    return { uploadUrl, key, publicUrl };
  }

  /**
   * Derive the public URL from a stored key
   */
  getPublicUrl(key: string): string | null {
    if (!key) return null;
    const publicBase = process.env.R2_PUBLIC_BASE_URL;
    if (!publicBase) return null;
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }

  /**
   * Check if the service is properly configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }
}
