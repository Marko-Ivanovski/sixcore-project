import { apiFetch } from './api';

export type UploadFolder = 'avatars' | 'posts' | 'tweets' | 'misc';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const validateImageFile = (file: File): string | null => {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be 5MB or less.';
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Only JPG, PNG, WEBP, or GIF images are allowed.';
  }

  return null;
};

export async function uploadImage(
  file: File,
  folder: UploadFolder,
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append('file', file);

  const data = await apiFetch<{ url: string }>(
    `/api/uploads?folder=${folder}`,
    {
      method: 'POST',
      body: formData,
    },
  );

  return data.url;
}
