const partialHydration = {
  markup: async ({ content /* , filename */ }) => {
    let input = content;
    // Note: this regex only supports self closing components.
    // Slots aren't supported for client hydration either.
    const matches = content.matchAll(/<([a-zA-Z]+)[^>]+hydrate-client={([^]*?})}[^/>]+\/>/gim);

    for (const match of matches) {
      const componentName = match[1];
      const dataObject = match[2];

      // check for hydrate options
      const re = /hydrate-options={([^]*?})}/gim;
      const hydrateOptionsResults = re.exec(match.input);

      let replacement = `<div class="needs-hydration" data-component="${componentName}"  data-hydrate={JSON.stringify(${dataObject})}`;
      if (hydrateOptionsResults && hydrateOptionsResults[1] && hydrateOptionsResults[1].length > 0) {
        replacement += ` data-options={JSON.stringify(${hydrateOptionsResults[1]})}`;
      } else {
        replacement += ` data-options="{ "lazy": true }"`;
      }
      replacement += ` />`;
      input = input.replace(match[0], replacement);
    }

    return { code: input };
  },
};

export default partialHydration;
