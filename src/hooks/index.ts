import path from 'path';
import fs from 'fs-extra';
import { parseBuildPerf } from '../utils';
import externalHelpers from '../externalHelpers';
import { HookOptions } from './types';
import prepareShortcodeParser from '../utils/prepareShortcodeParser';
import Page from '../utils/Page';

const hooks: Array<HookOptions> = [
  {
    hook: 'bootstrap',
    name: 'elderAddExternalHelpers',
    description: 'Adds external helpers to helpers object',
    priority: 1,
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
  {
    hook: 'middleware',
    name: 'elderExpressLikeMiddleware',
    description: 'An express like middleware so requests can be served by Elder.js',
    priority: 1,
    run: async ({
      serverLookupObject,
      settings,
      query,
      helpers,
      data,
      routes,
      allRequests,
      runHook,
      errors,
      shortcodes,
      req,
      next,
      res,
      request,
    }) => {
      if (req.path) {
        let reqPath = req.path;

        if (settings.server.prefix && settings.server.prefix.length > 0) {
          if (reqPath.indexOf(settings.server.prefix) !== 0) {
            return next();
          }
        }

        // see if we have a request object with the path as is. (could include / or not.)
        let requestObject = serverLookupObject[reqPath];

        if (!requestObject && reqPath[reqPath.length - 1] === '/') {
          // check the path without a slash.
          requestObject = serverLookupObject[reqPath.substring(0, reqPath.length - 1)];
        } else if (!requestObject) {
          // check the path with a slash.
          reqPath += '/';
          requestObject = serverLookupObject[reqPath];
        }

        // if we have a requestObject then we know it is for ElderGuide
        if (requestObject) {
          let route = routes[requestObject.route];
          if (request && request.route) {
            route = routes[request.route];
          }
          const forPage = {
            request: { ...requestObject, ...request },
            settings,
            query,
            helpers,
            data,
            route,
            runHook,
            allRequests,
            routes,
            errors,
            shortcodes,
          };

          const page = new Page(forPage);

          const html = await page.html();

          if (html && !res.headerSent) {
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
          }
        } else {
          next();
        }
      } else {
        next();
      }
      return {};
    },
  },
  {
    hook: 'shortcodes',
    name: 'elderProcessShortcodes',
    description:
      "Builds the shortcode parser, parses shortcodes from the html returned by the route's html and appends anything needed to the stacks.",
    priority: 50,
    run: async ({
      helpers,
      data,
      settings,
      request,
      query,
      cssStack,
      headStack,
      customJsStack,
      layoutHtml,
      shortcodes,
      allRequests,
    }) => {
      const ShortcodeParser = prepareShortcodeParser({
        shortcodes,
        helpers,
        data,
        settings,
        request,
        query,
        cssStack,
        headStack,
        customJsStack,
        allRequests,
      });

      const html = await ShortcodeParser.parse(layoutHtml);

      return {
        layoutHtml: html,
        headStack,
        cssStack,
        customJsStack,
      };
    },
  },
  {
    hook: 'stacks',
    name: 'elderAddMetaCharsetToHead',
    description: `Adds <meta charset="UTF-8" /> to the head.`,
    priority: 100,
    run: async ({ headStack }) => {
      return {
        headStack: [
          ...headStack,
          {
            source: 'elderAddMetaCharsetToHead',
            string: `<meta charset="UTF-8" />`,
            priority: 100,
          },
        ],
      };
    },
  },
  {
    hook: 'stacks',
    name: 'elderAddMetaViewportToHead',
    description: `Adds <meta name="viewport" content="width=device-width, initial-scale=1" /> to the head.`,
    priority: 90,
    run: async ({ headStack }) => {
      return {
        headStack: [
          ...headStack,
          {
            source: 'elderAddMetaViewportToHead',
            string: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
            priority: 90,
          },
        ],
      };
    },
  },
  {
    hook: 'stacks',
    name: 'elderAddDefaultIntersectionObserver',
    description: 'Sets up the default polyfill for the intersection observer',
    priority: 100,
    run: async ({ beforeHydrateStack }) => {
      return {
        beforeHydrateStack: [
          {
            source: 'elderAddDefaultIntersectionObserver',
            string: `<script type="text/javascript">
      if (!('IntersectionObserver' in window)) {
          var script = document.createElement("script");
          script.src = "/static/intersection-observer.js";
          document.getElementsByTagName('head')[0].appendChild(script);
      };
      </script>
      `,
            priority: 100,
          },
          ...beforeHydrateStack,
        ],
      };
    },
  },
  {
    hook: 'stacks',
    name: 'elderAddHtmlLangAttributes',
    description: 'Add lang attributes to html according to elder.config.js',
    priority: 100,
    run: async ({ htmlAttributesStack, settings }) => {
      return {
        htmlAttributesStack: [
          ...htmlAttributesStack,
          {
            source: 'elderAddHtmlLangAttributes',
            priority: 50,
            string: `lang="${settings.lang}"`,
          },
        ],
      };
    },
  },
  {
    hook: 'stacks',
    name: 'elderAddBodyClassAttributes',
    description: 'Add class attributes to html based on request.route',
    priority: 100,
    run: async ({ bodyAttributesStack, request }) => {
      return {
        bodyAttributesStack: [
          ...bodyAttributesStack,
          {
            source: 'elderAddBodyClassAttributes',
            priority: 50,
            string: `class="${request.route}"`,
          },
        ],
      };
    },
  },
  {
    hook: 'compileHtml',
    name: 'elderCompileHtml',
    description: 'Creates an HTML string out of the Svelte layout and stacks.',
    priority: 50,
    run: async ({ htmlAttributesString, headString, bodyAttributesString, footerString, layoutHtml }) => {
      return {
        htmlString: `<!DOCTYPE html><html ${htmlAttributesString}><head>${headString}</head><body ${bodyAttributesString}>${layoutHtml}${footerString}</body></html>`,
      };
    },
  },

  {
    hook: 'error',
    name: 'elderConsoleLogErrors',
    description: 'Log any errors to the console.',
    priority: 1,
    run: async ({ errors, request, settings }) => {
      if (!settings.worker) {
        console.error(request.permalink, errors);
      }
    },
  },
  {
    hook: 'requestComplete',
    name: 'elderWriteHtmlFileToPublic',
    description: 'Write the html output to public.',
    priority: 1,
    run: async ({ settings, request, htmlString, errors }) => {
      if (settings.build) {
        const file = path.resolve(settings.distDir, `.${request.permalink}/index.html`);
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
        const buildOutputLocation = path.resolve(settings.rootDir, `./___ELDER___/build-errors-${Date.now()}.json`);
        console.log(
          `Errors during Elder.js build. Writing details on the ${errors.length} build errors to: ${buildOutputLocation}`,
        );
        fs.writeJSONSync(buildOutputLocation, { settings, buildErrors: errors });

        errors.forEach((error) => {
          console.error(error);
          console.error(`------`);
        });
      }
    },
  },
];

export default hooks;
