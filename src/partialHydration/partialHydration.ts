// const partialHydration = {
//   markup: async ({ content /* , filename */ }) => {
//     let input = content;
//     // Note: this regex only supports self closing components.
//     // Slots aren't supported for client hydration either.
//     const matches = content.matchAll(/<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]+\/>/gim);

//     for (const match of matches) {
//       const [wholeMatch, componentName, componentProps] = match;

//       // check for hydrate options
//       const re = /hydrate-options={([^]*?})}/gim;
//       const hydrateOptionsResults = re.exec(match.input);

//       let replacement = `<div class="needs-hydration" data-hydrate-component="${componentName}"  data-hydrate-props={JSON.stringify(${componentProps})}`;
//       if (hydrateOptionsResults && hydrateOptionsResults[1] && hydrateOptionsResults[1].length > 0) {
//         replacement += ` data-hydrate-options={JSON.stringify(${hydrateOptionsResults[1]})}`;
//       } else {
//         replacement += ` data-hydrate-options={JSON.stringify({ "loading": "lazy" })}`;
//       }
//       replacement += ` />`;
//       input = input.replace(wholeMatch, replacement);
//     }

//     return { code: input };
//   },
// };

const extractHydrateOptions = (htmlString) => {
  const hydrateOptionsPattern = /hydrate-options={([^]*?})}/gim;

  const optionsMatch = hydrateOptionsPattern.exec(htmlString);
  if (optionsMatch) {
    return optionsMatch[1];
  }
  return JSON.stringify({
    loading: 'lazy',
  });
};

const createReplacementString = ({ input, componentName, componentProps }) => {
  const hydrateOptions = extractHydrateOptions(input);
  const replacementAttrs = {
    class: '"needs-hydration"',
    'data-hydrate-component': `"${componentName}"`,
    'data-hydrate-props': `{JSON.stringify(${componentProps})}`,
    'data-hydrate-options': `{JSON.stringify(${hydrateOptions})}`,
  };
  const replacementAttrsString = Object.entries(replacementAttrs).reduce(
    (out, [name, value]) => `${out} ${name}=${value}`,
    '',
  );
  return `<div${replacementAttrsString} />`;
};

const partialHydration = {
  markup: async ({ content /* , filename */ }) => {
    // Note: this regex only supports self closing components.
    // Slots aren't supported for client hydration either.
    const hydrateableComponentPattern = /<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]+\/>/gim;
    const matches = [...content.matchAll(hydrateableComponentPattern)];

    const output = matches.reduce((out, match) => {
      const [wholeMatch, componentName, componentProps] = match;
      const replacement = createReplacementString({ input: match.input, componentName, componentProps });
      return out.replace(wholeMatch, replacement);
    }, content);

    return { code: output };
  },
};

export default partialHydration;
