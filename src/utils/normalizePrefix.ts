const normalizePrefix = (prefix: string) => {
  if (!prefix) return '';

  // remove trailing slash
  prefix.replace(/\/+$/, '');

  // add leading slash
  return prefix[0] === '/' ? prefix : `/${prefix}`;
};

export default normalizePrefix;
