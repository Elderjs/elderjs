function prepareProcessStack(page) {
  return function processStack(name) {
    page.perf.start(`stack.${name}`);

    // used to check if we've already add this string to the stack.
    const seen = new Set();

    const str = page[name]
      .map((s) => ({ ...s, priority: s.priority || 50 }))
      .sort((a, b) => b.priority - a.priority)
      .reduce((out, cv, i, arr) => {
        if (page.settings.debug && page.settings.debug.stacks) {
          console.log(`stack.${name}`, arr, i);
          console.log(`Adding to ${name} from ${cv.source}`);
          console.log(cv);
        }
        if (cv.string && cv.string.length > 0 && !seen.has(cv.string)) {
          // eslint-disable-next-line no-param-reassign
          out = `${out}${cv.string}`;
          seen.add(cv.string);
        }

        return out;
      }, '');

    page.perf.end(`stack.${name}`);
    return str;
  };
}

export default prepareProcessStack;
