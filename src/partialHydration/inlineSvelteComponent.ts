const defaultHydrationOptions = {
  loading: 'lazy',
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type InputParamsInlinePreprocessedSvelteComponent = {
  name?: string;
  props?: any;
  options?: string;
};

export function inlinePreprocessedSvelteComponent({
  name = '',
  props = {},
  options = '',
}: InputParamsInlinePreprocessedSvelteComponent): string {
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

type InputParamsInlineSvelteComponent = {
  name?: string;
  props?: any;
  options?: {
    loading?: string; // todo: enum, can't get it working: 'lazy', 'eager', 'none'
  };
};

export function inlineSvelteComponent({
  name = '',
  props = {},
  options = {},
}: InputParamsInlineSvelteComponent): string {
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
