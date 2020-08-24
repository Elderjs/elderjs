const partialHydration = {
  markup: async ({ content /* , filename */ }) => {
    let input = content;
    // Note: this regex only supports self closing components.
    // Slots aren't supported for client hydration either.
    const matches = content.matchAll(/<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]+\/>/gim);

    for (const match of matches) {
      const [wholeMatch, componentName, componentProps] = match;

      // check for hydrate options
      const re = /hydrate-options={([^]*?})}/gim;
      const hydrateOptionsResults = re.exec(match.input);

      let replacement = `<div class="needs-hydration" data-hydrate-component="${componentName}"  data-hydrate-props={JSON.stringify(${componentProps})}`;
      if (hydrateOptionsResults && hydrateOptionsResults[1] && hydrateOptionsResults[1].length > 0) {
        replacement += ` data-hydrate-options={JSON.stringify(${hydrateOptionsResults[1]})}`;
      } else {
        replacement += ` data-hydrate-options="{ "loading": "lazy" }"`;
      }
      replacement += ` />`;
      input = input.replace(wholeMatch, replacement);
    }

    return { code: input };
  },
};

export default partialHydration;
