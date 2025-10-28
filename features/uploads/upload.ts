export const uploadToSignedUrl = async (signedUrl: string, file: File) => {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'x-upsert': 'false'
    },
    body: file
  });

  if (!response.ok) {
    throw new Error('上传失败');
  }
};
