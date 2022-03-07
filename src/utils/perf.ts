import { performance, PerformanceObserver } from 'perf_hooks';
import { Elder } from '..';
import Page from './Page';
/**
 * A little helper around perf_hooks.
 * Returns an object with a start and end function.
 *
 * This allows you to pass in a page.perf.start('name') and then page.perf.end('name') and the result is stored in a timings array.
 *
 */

export type TPerfTiming = { name: string; duration: number };

export type TPerfTimings = TPerfTiming[];

const perf = (page: Page | Elder, force = false) => {
  if (page.settings.debug.performance || force) {
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

  // eslint-disable-next-line no-param-reassign
  page.perf.prefix = (pre) => {
    return { start: (name) => page.perf.start(`${pre}.${name}`), end: (name) => page.perf.end(`${pre}.${name}`) };
  };
};

export default perf;

export const displayPerfTimings = (timings: TPerfTimings) => {
  const display = timings.sort((a, b) => a.duration - b.duration).map((t) => ({ ...t, ms: t.duration }));
  console.table(display, ['name', 'ms']);
};
