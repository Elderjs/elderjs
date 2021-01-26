const formatPrefix = (prefix: string) => {
  // remove trailing
  prefix.replace(/\/+$/, '');

  return prefix[0] === '/' ? prefix : `/${prefix}`;
};

export default formatPrefix;
