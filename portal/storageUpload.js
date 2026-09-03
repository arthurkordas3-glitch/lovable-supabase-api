import * as tus from 'tus-js-client';

const SUPABASE_PROJECT_ID = 'ttizdyjfumqgnzzfpjrx';
const BUCKET_NAME = 'Private-portal';
const TUS_ENDPOINT = `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;

/**
 * Authenticated, resumable Portal upload with progress reporting.
 * The caller supplies the current Supabase access token from the signed-in user session.
 * Never pass a service-role/secret key here.
 */
export function uploadPortalFile({ file, accessToken, objectName, onProgress, onSuccess, onError }) {
  if (!(file instanceof File)) throw new TypeError('file must be a File');
  if (!accessToken) throw new Error('Authenticated Supabase access token required');

  const safeName = objectName || file.name;

  const upload = new tus.Upload(file, {
    endpoint: TUS_ENDPOINT,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-upsert': 'false',
    },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    chunkSize: 6 * 1024 * 1024,
    metadata: {
      bucketName: BUCKET_NAME,
      objectName: safeName,
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
    },
    onError(error) {
      onError?.(error);
    },
    onProgress(bytesUploaded, bytesTotal) {
      const percent = bytesTotal ? (bytesUploaded / bytesTotal) * 100 : 0;
      onProgress?.({ bytesUploaded, bytesTotal, percent });
    },
    onSuccess() {
      onSuccess?.({
        bucket: BUCKET_NAME,
        path: safeName,
        uploadUrl: upload.url,
      });
    },
  });

  return {
    upload,
    start: async () => {
      const previous = await upload.findPreviousUploads();
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    },
    abort: () => upload.abort(),
  };
}

export { BUCKET_NAME, TUS_ENDPOINT };
