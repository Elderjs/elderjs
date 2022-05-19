function fixCircularJson(val, cache = undefined) {
  cache = cache || new WeakSet();

  if (val && typeof val === 'object') {
    if (cache.has(val)) return '[Circular]';

    cache.add(val);

    const obj = Array.isArray(val) ? [] : {};
    for (const idx of Object.keys(val)) {
      obj[idx] = fixCircularJson(val[idx], cache);
    }

    cache.delete(val);
    return obj;
  }

  return val;
}
export default fixCircularJson;
