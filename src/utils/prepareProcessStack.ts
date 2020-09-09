function prepareProcessStack(page) {
  return function processStack(name) {
    page.perf.start(`stack.${name}`);
    const str = page[name]
      .map((s) => ({ ...s, priority: s.priority || 50 }))
      .sort((a, b) => a.priority - b.priority)
      .reduce((out, cv, i, arr) => {
        if (page.settings.debug && page.settings.debug.stacks) {
          console.log(`stack.${name}`, arr, i);
          console.log(`Adding to ${name} from ${cv.source}`);
          console.log(cv);
        }
        if (cv.string && cv.string.length > 0) {
          out = `${out}${cv.string}`;
        }

        return out;
      }, '');

    page.perf.end(`stack.${name}`);
    return str;
  };
}

export default prepareProcessStack;
