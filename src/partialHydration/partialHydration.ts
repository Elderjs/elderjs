import MagicString from 'magic-string';
import { parseTag } from '../utils/htmlParser';
import { inlinePreprocessedSvelteComponent } from './inlineSvelteComponent';

const extractHydrateOptions = (htmlString) => {
  const hydrateOptionsPattern = /hydrate-options={([^]*?})}/gim;

  const optionsMatch = hydrateOptionsPattern.exec(htmlString);
  if (optionsMatch) {
    return optionsMatch[1];
  }
  return '';
};

const createReplacementString = (content, tag) => {
  let options = '{}';
  let clientProps = '{}';
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
  
  return `{#if (${options}).loading === 'none'}<${tag.name} {...(${clientProps})} ${stylePropsRaw} ${serverProps}/>` +
    `{:else}<div class="ejs-component" data-ejs-component="${tag.name}" ` + 
    `data-ejs-props={JSON.stringify(${clientProps})} ` +
    `data-ejs-options={JSON.stringify(${options})} ` +
    `${styleProps}>` +
    `<${tag.name} {...(${clientProps})} ${serverProps}/></div>{/if}`
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
      throw new Error("Hydratable component must be a self-closing tag");
    }
    s.overwrite(tag.start, tag.end, createReplacementString(content, tag));
    dirty = true;
  }

  const wrappingComponentPattern = /<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]*>[^>]*<\/([a-zA-Z]+)>/gim;
  // <Map hydrate-client={{}} ></Map>
  // <Map hydrate-client={{}}></Map>
  // <Map hydrate-client={{}}>Foo</Map>

  const wrappedComponents = [...content.matchAll(wrappingComponentPattern)];

  if (wrappedComponents && wrappedComponents.length > 0) {
    throw new Error(
      `Elder.js only supports self-closing syntax on hydrated components. This means <Foo /> not <Foo></Foo> or <Foo>Something</Foo>. Offending component: ${wrappedComponents[0][0]}. Slots and child components aren't supported during hydration as it would result in huge HTML payloads. If you need this functionality try wrapping the offending component in a parent component without slots or child components and hydrate the parent component.`,
    );
  }
  return dirty ? s.toString() : content;
};

const partialHydration = {
  markup: async ({ content }) => {
    return { code: preprocessSvelteContent(content) };
  },
};

export default partialHydration;
