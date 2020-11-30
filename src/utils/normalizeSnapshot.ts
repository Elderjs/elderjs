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
      out[normalizeSnapshot(cv)] = normalizeSnapshot(val[cv]);
      return out;
    }, {});
  }
  if (Object.prototype.toString.call(val) === '[object Set]') {
    const arr = [...val.values()].map(normalizeSnapshot);
    return new Set(arr);
  }

  if (Object.prototype.toString.call(val) === '[object Map]') {
    const map = new Map();
    for (const [k, v] of val.entries()) {
      map.set(normalizeSnapshot(k), normalizeSnapshot(v));
    }
    return map;
  }
  return val;
};

export default normalizeSnapshot;
