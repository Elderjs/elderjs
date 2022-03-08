import { escapeHtml } from '../utils/htmlParser';

type InputParamsInlineComponent = {
  name?: string;
  props?: any;
  options?: {
    loading?: string; // todo: enum, can't get it working: 'lazy', 'eager', 'none'
    element?: string; // default: 'div'
  };
};

export default function inlineComponent({ name, props = null, options = null }: InputParamsInlineComponent): string {
  return `<ejswrapper ejs-mount="${escapeHtml(JSON.stringify([name, props, options]))}"></ejswrapper>`;
}
