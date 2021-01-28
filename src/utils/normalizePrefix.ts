const normalizePrefix = (prefix: string) => {
  if (!prefix) return '';

  // remove trailing slash
  const trimmed = prefix.replace(/\/+$/, '');

  // add leading slash
  return trimmed[0] === '/' ? trimmed : `/${trimmed}`;
};

export default normalizePrefix;
