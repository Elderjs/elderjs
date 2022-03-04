import { HydrateOptions } from '../utils/types';
import { escapeHtml } from '../utils/htmlParser';

const defaultHydrationOptions: HydrateOptions = {
  loading: 'lazy',
  element: 'div',
};

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
  const hydrationOptions =
    options.length > 0 ? { ...defaultHydrationOptions, ...JSON.parse(options) } : defaultHydrationOptions;
  const hydrationOptionsString = JSON.stringify(hydrationOptions);

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
  return `<${hydrationOptions.element}${replacementAttrsString} />`;
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
