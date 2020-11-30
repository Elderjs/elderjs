import { inlinePreprocessedSvelteComponent } from './inlineSvelteComponent';

const extractHydrateOptions = (htmlString) => {
  const hydrateOptionsPattern = /hydrate-options={([^]*?})}/gim;

  const optionsMatch = hydrateOptionsPattern.exec(htmlString);
  if (optionsMatch) {
    return optionsMatch[1];
  }
  return '';
};

const createReplacementString = ({ input, name, props }) => {
  const options = extractHydrateOptions(input);
  return inlinePreprocessedSvelteComponent({ name, props, options });
};

export const preprocessSvelteContent = (content) => {
  // Note: this regex only supports self closing components.
  // Slots aren't supported for client hydration either.
  const hydrateableComponentPattern = /<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]*\/>/gim;
  const matches = [...content.matchAll(hydrateableComponentPattern)];

  const output = matches.reduce((out, match) => {
    const [wholeMatch, name, props] = match;
    const replacement = createReplacementString({ input: wholeMatch, name, props });
    return out.replace(wholeMatch, replacement);
  }, content);

  const wrappingComponentPattern = /<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]*>[^>]*<\/([a-zA-Z]+)>/gim;
  // <Map hydrate-client={{}} ></Map>
  // <Map hydrate-client={{}}></Map>
  // <Map hydrate-client={{}}>Foo</Map>

  const wrappedComponents = [...output.matchAll(wrappingComponentPattern)];

  if (wrappedComponents && wrappedComponents.length > 0) {
    throw new Error(
      `Elder.js only supports self-closing syntax on hydrated components. This means <Foo /> not <Foo></Foo> or <Foo>Something</Foo>. Offending component: ${wrappedComponents[0][0]}. Slots and child components aren't supported during hydration as it would result in huge HTML payloads. If you need this functionality try wrapping the offending component in a parent component without slots or child components and hydrate the parent component.`,
    );
  }
  return output;
};

const partialHydration = {
  markup: async ({ content }) => {
    return { code: preprocessSvelteContent(content) };
  },
};

export default partialHydration;
