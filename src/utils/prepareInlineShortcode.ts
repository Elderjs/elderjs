const prepareInlineShortcode = ({ settings }) => ({ name, props = {}, content = '' }) => {
  const { openPattern, closePattern } = settings.shortcodes;
  if (!name) throw new Error(`helpers.shortcode requires a name prop`);
  let shortcode = `${openPattern}${name}`;

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
    shortcode += `/${closePattern}`;
  } else {
    // close the open shortcode.
    shortcode += closePattern;

    // add content
    shortcode += content;

    // close the shortcode.
    shortcode += `${openPattern}/${name}${closePattern}`;
  }

  return shortcode;
};

export default prepareInlineShortcode;
