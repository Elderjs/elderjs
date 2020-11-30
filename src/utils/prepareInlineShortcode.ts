/* eslint-disable no-param-reassign */
const prepareInlineShortcode = ({ settings }) => ({ name, props = {}, content = '' }) => {
  const { openPattern, closePattern } = settings.shortcodes;
  const openNoEscape = openPattern.replace('\\', '');
  const closeNoEscape = closePattern.replace('\\', '');

  if (!name) throw new Error(`helpers.shortcode requires a name prop`);
  let shortcode = `${openNoEscape}${name}`;

  shortcode += Object.entries(props).reduce((out, [key, val]) => {
    if (typeof val === 'object' || Array.isArray(val)) {
      out += ` ${key}='${JSON.stringify(val)}'`;
    } else {
      out += ` ${key}='${val}'`;
    }

    return out;
  }, '');

  if (!content) {
    // self closing
    shortcode += `/${closeNoEscape}`;
  } else {
    // close the open shortcode.
    shortcode += closeNoEscape;

    // add content
    shortcode += content;

    // close the shortcode.
    shortcode += `${openNoEscape}/${name}${closeNoEscape}`;
  }

  return shortcode;
};

export default prepareInlineShortcode;
