let pendingFiles: File[] = [];

export const setPendingNewPostFiles = (files: File[]) => {
  pendingFiles = files;
};

export const consumePendingNewPostFiles = () => {
  const files = pendingFiles;
  pendingFiles = [];
  return files;
};
