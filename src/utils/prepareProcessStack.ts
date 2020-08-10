function prepareProcessStack(page) {
  return function processStack(name) {
    page.perf.start(`stack.${name}`);
    const str = page[name]
      .map((s) => ({ ...s, priority: s.priority || 50 }))
      .sort((a, b) => a.priority - b.priority)
      .reduce((out, cv) => {
        if (page.settings.debug && page.settings.debug.hooks) {
          console.log(`Adding from ${cv.source}`);
          console.log(cv);
        }
        if (cv.string && cv.string.length > 0) {
          out = cv.string + out;
        }

        return out;
      }, '');

    page.perf.end(`stack.${name}`);
    return str;
  };
}

// eslint-disable-next-line import/prefer-default-export
export { prepareProcessStack };
