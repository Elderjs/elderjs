import MagicString from 'magic-string';
import { parseTag } from '../utils/htmlParser';

const stringifyExpression = (s) => (s ? `{JSON.stringify(${s})}` : '""');

const createReplacementString = (content, tag) => {
  let options = '';
  let clientProps = '';
  let styleProps = '';
  let stylePropsRaw = '';
  let serverProps = '';
  for (const attr of tag.attrs) {
    if (/^hydrate-client$/i.test(attr.name)) {
      if (attr.value) {
        clientProps = content.slice(attr.value.exp.start, attr.value.exp.end);
      }
    } else if (/^hydrate-options$/i.test(attr.name)) {
      options = content.slice(attr.value.exp.start, attr.value.exp.end);
    } else if (/^--/i.test(attr.name)) {
      stylePropsRaw += ` ${content.slice(attr.start, attr.end)}`;
      styleProps += ` style:${attr.name}=${content.slice(attr.value.start, attr.value.end)}`;
    } else {
      serverProps += ` ${content.slice(attr.start, attr.end)}`;
    }
  }
  const spreadClientProps = clientProps ? ` {...(${clientProps})}` : '';
  // FIXME: it should be possible to merge three attributes into one
  // FIXME: use hydrateOptions.element instead of 'div'
  const wrapper =
    `<div class="ejs-component" data-ejs-component="${tag.name}"` +
    ` data-ejs-props=${stringifyExpression(clientProps)}` +
    ` data-ejs-options=${stringifyExpression(options)}` +
    `${styleProps}>` +
    `<${tag.name}${spreadClientProps}${serverProps}/></div>`;
  if (!options) {
    return wrapper;
  }
  return (
    `{#if (${options}).loading === 'none'}<${tag.name}${spreadClientProps}${stylePropsRaw}${serverProps}/>` +
    `{:else}${wrapper}{/if}`
  );
};

export const preprocessSvelteContent = (content) => {
  // Note: this regex only supports self closing components.
  // Slots aren't supported for client hydration either.
  let dirty = false;
  const hydrateableComponentPattern = /<([a-zA-Z]+)[^>]+hydrate-client/gim;
  const s = new MagicString(content);
  for (const match of content.matchAll(hydrateableComponentPattern)) {
    const tag = parseTag(content, match.index);
    if (!tag.selfClosed) {
      throw new Error(
        `Elder.js only supports self-closing syntax on hydrated components. This means <Foo /> not <Foo></Foo> or <Foo>Something</Foo>. Offending component: ${content.slice(
          tag.start,
          tag.end,
        )}. Slots and child components aren't supported during hydration as it would result in huge HTML payloads. If you need this functionality try wrapping the offending component in a parent component without slots or child components and hydrate the parent component.`,
      );
    }
    const repl = createReplacementString(content, tag);
    s.overwrite(tag.start, tag.end, repl);
    dirty = true;
  }
  return dirty ? s.toString() : content;
};

const partialHydration = {
  markup: async ({ content }) => {
    return { code: preprocessSvelteContent(content) };
  },
};

export default partialHydration;
