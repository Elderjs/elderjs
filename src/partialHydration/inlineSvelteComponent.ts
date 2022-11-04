import { HydrateOptions } from '../utils/types';

const defaultHydrationOptions: HydrateOptions = {
  loading: 'lazy',
  element: 'div',
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
  props?: string;
  options?: string;
};

export function inlinePreprocessedSvelteComponent({
  name = '',
  props = '',
  options = '',
}: InputParamsInlinePreprocessedSvelteComponent): string {
  // FIXME: don't output default options into the component to reduce file size.
  const hydrationOptionsString =
    options.length > 0
      ? `{...${JSON.stringify(defaultHydrationOptions)}, ...${options}}`
      : JSON.stringify(defaultHydrationOptions);

  const replacementAttrs = {
    class: '"ejs-component"',
    'data-ejs-component': `"${name}"`,
    'data-ejs-props': `{JSON.stringify(${props})}`,
    'data-ejs-options': `{JSON.stringify(${hydrationOptionsString})}`,
  };
  const replacementAttrsString = Object.entries(replacementAttrs).reduce(
    (out, [key, value]) => `${out} ${key}=${value}`,
    '',
  );
  return `<ejswrapper${replacementAttrsString} />`;
}

type InputParamsInlineSvelteComponent = {
  name?: string;
  props?: any;
  options?: {
    loading?: string; // todo: enum, can't get it working: 'lazy', 'eager', 'none'
    element?: string; // default: 'div'
  };
};

export function inlineSvelteComponent({
  name = '',
  props = {},
  options = {},
}: InputParamsInlineSvelteComponent): string {
  const hydrationOptions =
    Object.keys(options).length > 0 ? { ...defaultHydrationOptions, ...options } : defaultHydrationOptions;

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

  return `<${hydrationOptions.element}${replacementAttrsString}></${hydrationOptions.element}>`;
}
