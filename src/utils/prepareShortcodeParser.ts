import ShortcodeParser from '@elderjs/shortcodes';
import { Page } from '../index.js';
import createReadOnlyProxy from './createReadOnlyProxy.js';
import { PerfPayload } from './perf.js';

function prepareShortcodeParser({
  shortcodes,
  helpers,
  data,
  settings,
  request,
  query,
  allRequests,
  cssStack,
  headStack,
  customJsStack,
  perf,
}: Pick<
  Page,
  | 'shortcodes'
  | 'helpers'
  | 'data'
  | 'settings'
  | 'request'
  | 'query'
  | 'allRequests'
  | 'cssStack'
  | 'cssStack'
  | 'headStack'
  | 'customJsStack'
> & { perf: PerfPayload }) {
  const { openPattern, closePattern } = settings.shortcodes;
  const shortcodeParser = ShortcodeParser({ openPattern, closePattern });

  shortcodes.forEach((shortcode) => {
    if (typeof shortcode.run !== 'function')
      throw new Error(`Shortcodes must have a run function. Problem code: ${JSON.stringify(shortcode)}`);
    if (typeof shortcode.shortcode !== 'string')
      throw new Error(
        `Shortcodes must have a shortcode property to define their usage. Problem code: ${JSON.stringify(shortcode)}`,
      );

    shortcodeParser.add(shortcode.shortcode, async (props, content) => {
      perf.start(shortcode.shortcode);

      const shortcodeResponse = await shortcode.run({
        perf,
        props,
        content,
        plugin: shortcode.plugin,
        data: createReadOnlyProxy(
          data,
          'data',
          `${shortcode.shortcode} defined by ${JSON.stringify(shortcode.$$meta)}`,
        ),
        request: createReadOnlyProxy(
          request,
          'request',
          `${shortcode.shortcode} defined by ${JSON.stringify(shortcode.$$meta)}`,
        ),
        query: createReadOnlyProxy(
          query,
          'query',
          `${shortcode.shortcode} defined by ${JSON.stringify(shortcode.$$meta)}`,
        ),
        helpers: createReadOnlyProxy(
          helpers,
          'helpers',
          `${shortcode.shortcode} defined by ${JSON.stringify(shortcode.$$meta)}`,
        ),
        settings: createReadOnlyProxy(
          settings,
          'settings',
          `${shortcode.shortcode} defined by ${JSON.stringify(shortcode.$$meta)}`,
        ),
        allRequests: createReadOnlyProxy(
          allRequests,
          'allRequests',
          `${shortcode.shortcode} defined by ${JSON.stringify(shortcode.$$meta)}`,
        ),
      });

      if (settings.debug.shortcodes) {
        console.log(`${shortcode.shortcode} returned`, shortcodeResponse);
      }

      if (typeof shortcodeResponse === 'object') {
        const { html, css, js, head } = shortcodeResponse;
        if (css) {
          cssStack.push({
            source: `${shortcode.shortcode} shortcode`,
            string: css,
          });
        }
        if (js) {
          customJsStack.push({
            source: `${shortcode.shortcode} shortcode`,
            string: js,
          });
        }
        if (head) {
          headStack.push({
            source: `${shortcode.shortcode} shortcode`,
            string: head,
          });
        }
        perf.end(shortcode.shortcode);
        return html || '';
      }

      perf.end(shortcode.shortcode);
      return shortcodeResponse || '';
    });
  });

  return shortcodeParser;
}

export default prepareShortcodeParser;
