import { UPLOAD } from '@/constants/app';

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? (parts.at(-1)?.toLowerCase() ?? '') : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function isAllowedImageType(mimeType: string): boolean {
  return (UPLOAD.ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedDocumentType(mimeType: string): boolean {
  return (UPLOAD.ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType);
}

export function isWithinSizeLimit(bytes: number, maxBytes = UPLOAD.MAX_FILE_SIZE): boolean {
  return bytes <= maxBytes;
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
