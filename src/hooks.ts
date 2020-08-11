import path from 'path';
import fs from 'fs-extra';
import { parseBuildPerf } from './utils';
import externalHelpers from './externalHelpers';
import { HookOptions } from './hookInterface/types';

const hooks: Array<HookOptions> = [
  {
    hook: 'bootstrap',
    name: 'elderAddExternalHelpers',
    description: 'Adds external helpers to helpers object',
    priority: 100,
    run: async ({ helpers, query, settings }) => {
      let additionalHelpers = {};
      try {
        additionalHelpers = await externalHelpers({ helpers, query, settings });
      } catch (err) {
        console.error(err);
      }
      if (additionalHelpers) {
        return {
          helpers: {
            ...helpers,
            ...additionalHelpers,
          },
        };
      }
      return null;
    },
  },
  // {
  //   hook: 'initStacks',
  //   name: 'Something malicious',
  //   description: `Try and set a property on the data object where you shouldn't be able to.`,
  //   priority: 1,
  //   run: async ({ beforeHydrateStack, settings, data }) => {
  //     data.test = true;
  //     return {};
  //   },
  // },

  {
    hook: 'stacks',
    name: 'elderAddDefaultIntersectionObserver',
    description: 'Sets up the default polyfill for the intersection observer',
    priority: 1,
    run: async ({ beforeHydrateStack, settings }) => {
      if (settings && settings.locations && {}.hasOwnProperty.call(settings.locations, 'intersectionObserverPoly')) {
        if (settings.locations.intersectionObserverPoly) {
          return {
            beforeHydrateStack: [
              {
                source: 'elderjs',
                string: `<script type="text/javascript">
      if (!('IntersectionObserver' in window)) {
          var script = document.createElement("script");
          script.src = "${settings.locations.intersectionObserverPoly}";
          document.getElementsByTagName('head')[0].appendChild(script);
      };
      </script>`,
                priority: 1,
                name: 'intersectionObserver',
              },
              ...beforeHydrateStack,
            ],
          };
        }
      } else {
        console.log(
          'Not injecting intersection observer polyfill. To not see this warning set locations.intersectionObserverPoly = false in elder.config.js.',
        );
      }
      return null;
    },
  },
  {
    hook: 'stacks',
    name: 'elderAddSystemJs',
    description: 'AddsSystemJs',
    priority: 1,
    run: async ({ beforeHydrateStack, settings }) => {
      if (settings && settings.locations && {}.hasOwnProperty.call(settings.locations, 'systemJs')) {
        if (settings.locations.systemJs) {
          return {
            beforeHydrateStack: [
              {
                source: 'internal',
                string: `<script data-name="systemjs" src="${settings.locations.systemJs}"></script>`,
                priority: 2,
                name: 'systemjs',
              },
              ...beforeHydrateStack,
            ],
          };
        }
      } else {
        console.log(
          'Not injecting systemjs. To not see this warning set locations.systemJs = false in elder.config.js.',
        );
      }
      return null;
    },
  },
  {
    hook: 'error',
    name: 'elderConsoleLogErrors',
    description: 'Log any errors to the console.',
    priority: 100,
    run: async ({ errors }) => {
      console.error(errors);
    },
  },
  {
    hook: 'requestComplete',
    name: 'elderWriteHtmlFileToPublic',
    description: 'Write the html output to public.',
    priority: 100,
    run: async ({ settings, request, htmlString, errors }) => {
      if (settings.build) {
        const file = path.resolve(process.cwd(), `${settings.locations.public}${request.permalink}/index.html`);
        try {
          fs.outputFileSync(file, htmlString);
        } catch (e) {
          console.log(e);
          return {
            errors: [...errors, e],
          };
        }
      }
      return null;
    },
  },
  {
    hook: 'requestComplete',
    name: 'elderDisplayRequestTime',
    description: 'Page generating timings and logging.',
    priority: 50,
    run: async ({ timings, request, settings }) => {
      if (!settings.build && process.env.NODE_ENV !== 'production') {
        console.log(`${Math.round(timings.slice(-1)[0].duration * 10) / 10}ms: \t ${request.permalink}`);
        if (settings.debug.performance) {
          const outTimings = [...timings];
          const display = outTimings.sort((a, b) => a.duration - b.duration).map((t) => ({ ...t, ms: t.duration }));

          console.table(display, ['name', 'ms']);
        }
      }
    },
  },
  {
    hook: 'buildComplete',
    name: 'elderShowParsedBuildTimes',
    description: 'A breakdown of the average times of different stages of the build.',
    priority: 50,
    run: async ({ timings, settings }) => {
      if (settings.debug.performance) {
        const buildTimings = parseBuildPerf(timings);
        console.log(buildTimings);
      }
    },
  },
  {
    hook: 'buildComplete',
    name: 'elderWriteBuildErrors',
    description: 'Writes out any errors of a build to a JSON file in the ___ELDER___ folder.',
    priority: 50,
    run: async ({ errors, settings }) => {
      if (errors && errors.length > 0) {
        const buildOutputLocation = path.resolve(process.cwd(), `./___ELDER___/build-${Date.now()}.json`);
        console.log(`Writing details on the ${errors.length} build errors to: ${buildOutputLocation}`);
        fs.writeJSONSync(buildOutputLocation, { errors, settings });
      }
    },
  },
];

export default hooks;
