const defaultHydrationOptions = {
  loading: 'lazy',
};

export function inlinePreprocessedSvelteComponent({ name = '', props = {}, options = '' }) {
  const hydrationOptions = options.length > 0 ? options : JSON.stringify(defaultHydrationOptions);

  const replacementAttrs = {
    class: '"ejs-component"',
    'data-ejs-component': `"${name}"`,
    'data-ejs-props': `{JSON.stringify(${props})}`,
    'data-ejs-options': `{JSON.stringify(${hydrationOptions})}`,
  };
  const replacementAttrsString = Object.entries(replacementAttrs).reduce(
    (out, [key, value]) => `${out} ${key}=${value}`,
    '',
  );
  return `<div${replacementAttrsString} />`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function inlineSvelteComponent({ name = '', props = {}, options = {} }) {
  const hydrationOptions = Object.keys(options).length > 0 ? options : defaultHydrationOptions;

  const replacementAttrs = {
    class: '"ejs-component"',
    'data-ejs-component': `"${name}"`,
    'data-ejs-props': `"${escapeHtml(JSON.stringify(props))}"`,
    'data-ejs-options': `"${escapeHtml(JSON.stringify(hydrationOptions))}"`,
  };
  const replacementAttrsString = Object.entries(replacementAttrs).reduce(
    (out, [key, value]) => `${out} ${key}=${value}`,
    '',
  );

  return `<div${replacementAttrsString}></div>`;
}

// TODO: Filip can we test these?
