import path from 'path';

import getUniqueId from './getUniqueId';

/* NOTE: If a svelte component is called after the CSS or head array have been called in the layout, the scripts/styles will not be displayed */
import IntersectionObserver from './IntersectionObserver';
// const getHashedSvelteComponents = require('./getHashedSvelteComponents');

const getComponentName = (str) => {
  str = str.replace('.svelte', '').replace('.js', '');
  if (str.includes('/')) {
    str = str.split('/').pop();
  }
  return str;
};

const svelteComponent = (componentName) => ({ page, props, hydrate = 0 }) => {
  const cleanComponentName = getComponentName(componentName);

  const id = getUniqueId();

  const clientComponents = page.settings.$$internal.hashedComponents;

  const ssrCompontent = path.resolve(
    process.cwd(),
    `./${page.settings.locations.svelte.ssrComponents}${cleanComponentName}.js`,
  );

  let clientSvelteFolder = page.settings.locations.svelte.clientComponents.replace(page.settings.locations.public, '/');
  if (clientSvelteFolder.indexOf('.') === 0) clientSvelteFolder = clientSvelteFolder.substring(1);
  const clientComponent = `${clientSvelteFolder}${clientComponents[cleanComponentName]}.js`;

  const { render } = require(ssrCompontent);

  try {
    let { css, html: htmlOutput, head } = render({ ...props, link: page.helpers.permalinks });

    if (css && css.code && css.code.length > 0) {
      page.cssStack && page.cssStack.push({ source: componentName, priority: 50, string: css.code });
    }

    if (head) {
      page.headStack && page.headStack.push({ source: componentName, priority: 50, string: head });
    }

    if (hydrate) {
      page.hydrateStack.push({
        source: componentName,
        priority: 50,
        string: `
        function init${cleanComponentName.toLowerCase()}${id}() {
          System.import('${clientComponent}').then(({ default: App }) => {
            new App({ target: document.getElementById('${cleanComponentName.toLowerCase()}-${id}'), hydrate: true, props: ${JSON.stringify(
          props,
        )} });
          });
        }
        ${IntersectionObserver({
          el: `document.getElementById('${cleanComponentName.toLowerCase()}-${id}')`,
          name: `${cleanComponentName.toLowerCase()}`,
          loaded: `init${cleanComponentName.toLowerCase()}${id}();`,
          notLoaded: `init${cleanComponentName.toLowerCase()}${id}();`,
        })}
      `,
      });
    }

    const matches = htmlOutput.matchAll(
      /<div class="needs-hydration" data-component="([A-Za-z]+)" data-data="({.*})"><\/div>/gim,
    );

    for (const match of matches) {
      const hydrateComponentName = match[1];

      let data = match[2]
        .replace(/&quot;/gim, '"')
        .replace(/&lt;/gim, '<')
        .replace(/&gt;/gim, '>')
        .replace(/&#39;/gim, "'")
        .replace(/\\\\n/gim, '')
        .replace(/\\"/gim, '"')
        .replace(/&amp;/gim, '&');
      // console.log(data);
      data = JSON.parse(data);
      if (hydrate > 1) {
        throw new Error(
          `Client side hydrated component includes client side hydrated sub component. This isn't supported.`,
        );
      }

      const hydratedHtml = svelteComponent(hydrateComponentName)({ page, props: data, hydrate: hydrate + 1 });
      htmlOutput = htmlOutput.replace(match[0], hydratedHtml);
    }

    return `<span class="${cleanComponentName.toLowerCase()}-component" id="${cleanComponentName.toLowerCase()}-${id}">${htmlOutput}</span>`;
  } catch (e) {
    console.log(e);
    page.errors.push(e);
  }
};

export default svelteComponent;
