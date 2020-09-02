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

const partialHydration = {
  markup: async ({ content }) => {
    // Note: this regex only supports self closing components.
    // Slots aren't supported for client hydration either.
    const hydrateableComponentPattern = /<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]+\/>/gim;
    const matches = [...content.matchAll(hydrateableComponentPattern)];

    const output = matches.reduce((out, match) => {
      const [wholeMatch, name, props] = match;
      const replacement = createReplacementString({ input: match.input, name, props });
      return out.replace(wholeMatch, replacement);
    }, content);

    return { code: output };
  },
};

export default partialHydration;
