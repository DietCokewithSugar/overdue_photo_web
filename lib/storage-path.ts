export const buildStorageProxyUrl = (storagePath?: string) => {
  if (!storagePath) return null;
  const [bucket, ...rest] = storagePath.split('/');
  const path = rest.join('/');
  if (!bucket || !path) return null;
  const params = new URLSearchParams({ bucket, path });
  return `/api/uploads/proxy?${params.toString()}`;
};
