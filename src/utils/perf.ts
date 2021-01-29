import { performance, PerformanceObserver } from 'perf_hooks';
/**
 * A little helper around perf_hooks.
 * Returns an object with a start and end function.
 *
 * This allows you to pass in a page.perf.start('name') and then page.perf.end('name') and the result is stored in a timings array.
 *
 * @param {Object} page
 * @returns {Object}
 */
const perf = (page) => {
  if (page.settings.debug.performance) {
    let obs = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        if (entry.name.includes(page.uid)) {
          page.perf.timings.push({ name: entry.name.replace(`-${page.uid}`, ''), duration: entry.duration });
          performance.clearMarks(entry.name);
        }
      });
    });

    // eslint-disable-next-line no-param-reassign
    page.perf = {
      timings: [],
      /**
       * Marks the performance timeline with {label}-start.
       *
       * @param {String} label
       */
      start: (label: string) => {
        performance.mark(`${label}-start-${page.uid}`);
      },
      /**
       * Marks the performance timeline with {label}-stop
       * It then records triggers a recording of the measurement.
       * @param {*} label
       */
      end: (label) => {
        performance.mark(`${label}-end-${page.uid}`);
        performance.measure(`${label}-${page.uid}`, `${label}-start-${page.uid}`, `${label}-end-${page.uid}`);
      },
      stop: () => {
        if (obs) obs.disconnect();
        obs = null;
      },
    };

    obs.observe({ entryTypes: ['measure'] });
  } else {
    const placeholder = () => {};
    // eslint-disable-next-line no-param-reassign
    page.perf = {
      timings: [],
      start: placeholder,
      end: placeholder,
      stop: placeholder,
    };
  }
};

export default perf;
