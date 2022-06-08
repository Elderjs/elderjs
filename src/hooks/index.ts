/* eslint-disable consistent-return */
import path from 'path';
import fs from 'fs-extra';
import { parseBuildPerf } from '../utils';
import externalHelpers from '../externalHelpers';
import { THooksArray } from './types';
import prepareShortcodeParser from '../utils/prepareShortcodeParser';
import { displayPerfTimings } from '../utils/perf';

const hooks: THooksArray = [
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
    },
  },
  {
    hook: 'middleware',
    name: 'elderExpressLikeMiddleware',
    description: 'An express like middleware so requests can be served by Elder.js',
    priority: 1,
    run: async ({ req, next, res, request, router }) => {
      return router({ req, res, next, request });
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
      perf,
    }) => {
      const ShortcodeParser = prepareShortcodeParser({
        perf,
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
    name: 'elderAddCssFileToHead',
    description: `Adds the css found in the svelte files to the head if 'css' in your 'elder.config.js' file is set to 'file'.`,
    priority: 100,
    run: async ({ headStack, settings }) => {
      if (settings.css === 'file' && settings.$$internal.publicCssFile) {
        return {
          headStack: [
            ...headStack,
            {
              source: 'elderAddCssFileToHead',
              string: `<link rel="stylesheet" href="${settings.$$internal.publicCssFile}" media="all" />`,
              priority: 30,
            },
          ],
        };
      }
      if (settings.css === 'lazy' && settings.$$internal.publicCssFile) {
        return {
          headStack: [
            ...headStack,
            {
              source: 'elderAddCssFileToHead',
              string: `<link rel="preload" href="${settings.$$internal.publicCssFile}" as="style" /><link rel="stylesheet" href="${settings.$$internal.publicCssFile}" media="print" onload="this.media='all'" /><noscript><link rel="stylesheet" href="${settings.$$internal.publicCssFile}" media="all" /></noscript>`,
              priority: 30,
            },
          ],
        };
      }
    },
  },
  {
    hook: 'compileHtml',
    name: 'elderCompileHtml',
    description: 'Creates an HTML string out of the Svelte layout and stacks.',
    priority: 50,
    run: async ({
      request,
      settings,
      htmlAttributesString,
      bodyAttributesString,
      headString,
      footerString,
      layoutHtml,
    }) => {
      const htmlAttString =
        htmlAttributesString && htmlAttributesString.length > 0 ? htmlAttributesString : `lang="${settings.lang}"`;
      const bodyAttString =
        bodyAttributesString && bodyAttributesString.length > 0 ? bodyAttributesString : `class="${request.route}"`;
      return {
        htmlString: `<!DOCTYPE html><html ${htmlAttString}><head>${headString}</head><body ${bodyAttString}>${layoutHtml}${footerString}</body></html>`,
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
        if (settings.debug.performance) {
          console.log(`${Math.round(timings.slice(-1)[0].duration * 10) / 10}ms: \t ${request.permalink}`);
          displayPerfTimings([...timings]);
        } else {
          console.log(request.req.path);
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
