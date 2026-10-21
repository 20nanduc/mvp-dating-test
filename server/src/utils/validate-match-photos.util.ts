import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { getStorage } from 'firebase-admin/storage';

export async function validateMatchPhotos(
  uid: string,
  fullPath: string,
  thumbPath: string,
  bucketName: string,
): Promise<void> {
  // Validate photo ownership and path structure
  const match = fullPath.match(
    /^users\/([^/]+)\/profile\/([A-Za-z0-9_-]{8,80})\/full\.webp$/,
  );

  if (!match || match[1] !== uid) {
    throw new BadRequestException('Invalid photo path');
  }

  const expectedThumb =
    `users/${uid}/profile/${match[2]}/thumb.webp`;

  if (thumbPath !== expectedThumb) {
    throw new BadRequestException('Invalid thumbnail path');
  }

  if (!bucketName) {
    throw new ServiceUnavailableException(
      'Firebase Storage is not configured',
    );
  }

  const bucket = getStorage().bucket(bucketName);

  try {
    const [fullResult, thumbResult] = await Promise.all([
      bucket.file(fullPath).getMetadata(),
      bucket.file(thumbPath).getMetadata(),
    ]);

    const full = fullResult[0];
    const thumb = thumbResult[0];

    if (
      full.contentType !== 'image/webp' ||
      thumb.contentType !== 'image/webp' ||
      Number(full.size) <= 0 ||
      Number(full.size) > 1024 * 1024 ||
      Number(thumb.size) <= 0 ||
      Number(thumb.size) > 256 * 1024
    ) {
      throw new BadRequestException(
        'Invalid image format or size',
      );
    }
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    const code = (error as { code?: number | string })?.code;

    if (Number(code) === 404) {
      throw new BadRequestException('Uploaded photos not found');
    }

    throw new ServiceUnavailableException(
      'Unable to verify uploaded photos',
    );
  }
}