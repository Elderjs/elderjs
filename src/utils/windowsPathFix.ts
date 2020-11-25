const windowsPathFix = (filePath: string | undefined): string | undefined => {
  if (typeof filePath === 'string') {
    return filePath.replace(/\\/gm, '/');
  }
  return undefined;
};

export default windowsPathFix;
