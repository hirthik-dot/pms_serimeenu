import { v2 as cloudinary } from 'cloudinary';

import { getEnv } from '@/config/env';
import { UPLOAD } from '@/constants/app';
import { ValidationError } from '@/lib/errors';

export function configureCloudinary(): boolean {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return false;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return true;
}

export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<string> {
  if (!UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as (typeof UPLOAD.ALLOWED_IMAGE_TYPES)[number])) {
    throw new ValidationError('Invalid file type. Allowed: JPEG, PNG, WebP');
  }

  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    throw new ValidationError('File size exceeds 5 MB limit');
  }

  const configured = configureCloudinary();

  if (!configured) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mime = file.type;
    return `data:${mime};base64,${base64}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${UPLOAD.CLOUDINARY_FOLDER}/avatars`,
        public_id: `user-${userId}`,
        overwrite: true,
        resource_type: 'image',
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve(uploadResult as { secure_url: string });
      },
    );
    stream.end(buffer);
  });

  return result.secure_url;
}

export async function uploadPatientPhoto(
  file: File,
  patientId: string,
): Promise<string> {
  if (!UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as (typeof UPLOAD.ALLOWED_IMAGE_TYPES)[number])) {
    throw new ValidationError('Invalid file type. Allowed: JPEG, PNG, WebP');
  }

  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    throw new ValidationError('File size exceeds 5 MB limit');
  }

  const configured = configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!configured) {
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
  }

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${UPLOAD.CLOUDINARY_FOLDER}/patients/${patientId}`,
        public_id: `profile-${patientId}`,
        overwrite: true,
        resource_type: 'image',
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve(uploadResult as { secure_url: string });
      },
    );
    stream.end(buffer);
  });

  return result.secure_url;
}

export async function uploadPatientDocument(
  file: File,
  patientId: string,
  category: string,
): Promise<{ url: string; publicId?: string }> {
  const isImage = UPLOAD.ALLOWED_IMAGE_TYPES.includes(
    file.type as (typeof UPLOAD.ALLOWED_IMAGE_TYPES)[number],
  );
  const isDocument = UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(
    file.type as (typeof UPLOAD.ALLOWED_DOCUMENT_TYPES)[number],
  );

  if (!isImage && !isDocument) {
    throw new ValidationError('Invalid file type for patient document');
  }

  const maxSize = isImage ? UPLOAD.MAX_FILE_SIZE : UPLOAD.MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds ${maxSize / (1024 * 1024)} MB limit`);
  }

  const configured = configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!configured) {
    const base64 = buffer.toString('base64');
    return { url: `data:${file.type};base64,${base64}` };
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${UPLOAD.CLOUDINARY_FOLDER}/patients/${patientId}/${category}`,
        resource_type: isImage ? 'image' : 'raw',
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve(uploadResult as { secure_url: string; public_id: string });
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deletePatientPhoto(imageUrl: string): Promise<void> {
  if (!imageUrl || imageUrl.startsWith('data:')) return;

  const configured = configureCloudinary();
  if (!configured) return;

  const match = imageUrl.match(/\/patients\/([^/]+)\/([^/.]+)/);
  if (!match) return;

  const publicId = `${UPLOAD.CLOUDINARY_FOLDER}/patients/${match[1]}/${match[2]}`;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
