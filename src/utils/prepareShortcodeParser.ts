const ShortcodeParser = require('@elderjs/shortcodes');
const { ShortcodeResponse } = require('./types');

function prepareShortcodeParser({
  shortcodes,
  helpers,
  data,
  settings,
  request,
  query,
  cssStack,
  headStack,
  customJsStack,
}) {
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
      // todo, async?

      console.log(shortcode.shortcode, props, content);

      // plugin?
      const { html, css, js, head } = await shortcode.run({
        props,
        content,
        data,
        request,
        query,
        helpers,
      });

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
      return html;
    });
  });

  return shortcodeParser;
}

export default prepareShortcodeParser;
