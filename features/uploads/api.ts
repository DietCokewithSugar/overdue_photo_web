import { apiFetch } from '@/lib/api';

export type UploadResource = 'post-image' | 'contest-poster' | 'contest-entry' | 'profile-avatar';

export interface SignedUploadResponse {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
  expiresIn: number;
}

export const requestSignedUpload = async (params: {
  resource: UploadResource;
  fileName: string;
  contentType: string;
  fileSize: number;
}) =>
  apiFetch<SignedUploadResponse>(`/api/uploads/sign`, {
    method: 'POST',
    json: params
  });
