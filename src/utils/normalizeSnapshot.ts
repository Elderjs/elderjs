import windowsPathFix from './windowsPathFix';

const normalizeSnapshot = (val) => {
  if (Object.prototype.toString.call(val) === '[object String]') {
    return windowsPathFix(val);
  }
  if (Object.prototype.toString.call(val) === '[object Array]') {
    return val.map(normalizeSnapshot);
  }
  if (Object.prototype.toString.call(val) === '[object Object]') {
    return Object.keys(val).reduce((out, cv) => {
      // eslint-disable-next-line no-param-reassign
      out[cv] = normalizeSnapshot(val[cv]);
      return out;
    }, {});
  }
  return val;
};

export default normalizeSnapshot;
