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

export type PerfTiming = { name: string; duration: number };

export type PerfTimings = PerfTiming[];

export type PerfPayload = {
  start: (label: string) => void;
  end: (label: string) => void;
};

export type Perf = PerfPayload & {
  timings: PerfTimings;
  stop: () => void;
  prefix: (label: string) => PerfPayload;
};

function perf(page: Page | Elder, force = false) {
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
      prefix: (pre): PerfPayload => {
        return { start: (name) => page.perf.start(`${pre}.${name}`), end: (name) => page.perf.end(`${pre}.${name}`) };
      },
    };

    obs.observe({ entryTypes: ['measure'] });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const placeholder = (label: string) => {};
    // eslint-disable-next-line no-param-reassign
    page.perf = {
      timings: [],
      start: placeholder,
      end: placeholder,
      stop: () => {},
      prefix: (): PerfPayload => ({ start: placeholder, end: placeholder }),
    };
  }
}

export default perf;

export const displayPerfTimings = (timings: PerfTimings) => {
  const display = timings.sort((a, b) => a.duration - b.duration).map((t) => ({ ...t, ms: t.duration }));
  console.table(display, ['name', 'ms']);
};
