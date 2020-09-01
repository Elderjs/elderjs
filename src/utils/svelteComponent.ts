import path from 'path';
import getUniqueId from './getUniqueId';
import IntersectionObserver from './IntersectionObserver';
import { ComponentPayload } from './types';

export const getComponentName = (str) => {
  let out = str.replace('.svelte', '').replace('.js', '');
  if (out.includes('/')) {
    out = out.split('/').pop();
  }
  return out;
};

export const replaceSpecialCharacters = (str) =>
  str
    .replace(/&quot;/gim, '"')
    .replace(/&lt;/gim, '<')
    .replace(/&gt;/gim, '>')
    .replace(/&#39;/gim, "'")
    .replace(/\\\\n/gim, '')
    .replace(/\\"/gim, '"')
    .replace(/&amp;/gim, '&');

const componentCache = {};

const svelteComponent = (componentName) => ({ page, props, hydrateOptions }: ComponentPayload): string => {
  const cleanComponentName = getComponentName(componentName);
  const id = getUniqueId();

  if (!componentCache[cleanComponentName]) {
    const clientComponents = page.settings.$$internal.hashedComponents;
    const ssrComponent = path.resolve(
      process.cwd(),
      `./${page.settings.locations.svelte.ssrComponents}${cleanComponentName}.js`,
    );
    let clientSvelteFolder = page.settings.locations.svelte.clientComponents.replace(
      page.settings.locations.public,
      '/',
    );
    if (clientSvelteFolder.indexOf('.') === 0) clientSvelteFolder = clientSvelteFolder.substring(1);

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const { render } = require(ssrComponent);
    componentCache[cleanComponentName] = {
      render,
      clientSrc: `${clientSvelteFolder}${clientComponents[cleanComponentName]}.js`,
    };
  }

  const { render, clientSrc } = componentCache[cleanComponentName];

  try {
    const { css, html: htmlOutput, head } = render({ ...props, link: page.helpers.permalinks });

    if (css && css.code && css.code.length > 0 && page.cssStack) {
      page.cssStack.push({ source: componentName, priority: 50, string: css.code });
    }

    if (head && page.headStack) {
      page.headStack.push({ source: componentName, priority: 50, string: head });
    }

    let finalHtmlOuput = htmlOutput;
    const matches = finalHtmlOuput.matchAll(
      /<div class="ejs-component" data-ejs-component="([A-Za-z]+)" data-ejs-props="({[^]*?})" data-ejs-options="({[^]*?})"><\/div>/gim,
    );

    for (const match of matches) {
      const hydrateComponentName = match[1];
      const hydrateComponentProps = JSON.parse(replaceSpecialCharacters(match[2]));
      const hydrateComponentOptions = JSON.parse(replaceSpecialCharacters(match[3]));

      console.log('svelteComponent.ts', hydrateComponentName, hydrateComponentProps, match[0]);

      if (hydrateOptions) {
        throw new Error(
          `Client side hydrated component includes client side hydrated sub component. This isn't supported.`,
        );
      }

      const hydratedHtml = svelteComponent(hydrateComponentName)({
        page,
        props: hydrateComponentProps,
        hydrateOptions: hydrateComponentOptions,
      });
      finalHtmlOuput = finalHtmlOuput.replace(match[0], hydratedHtml);
    }

    // hydrateOptions.loading=none for server only rendered injected into html somehow???
    if (!hydrateOptions || hydrateOptions.loading === 'none') {
      // if a component isn't hydrated we don't need to wrap it in a unique div.
      return finalHtmlOuput;
    }

    // hydrate a component

    // should we use the IntersectionObserver and / or adjust the distance?
    if (hydrateOptions.preload) {
      page.headStack.push({
        source: componentName,
        priority: 50,
        string: `<link rel="preload" href="${clientSrc}" as="script">`,
      });
    }

    const clientJs = `
    System.import('${clientSrc}').then(({ default: App }) => {
    new App({ target: document.getElementById('${cleanComponentName.toLowerCase()}-${id}'), hydrate: true, props: ${JSON.stringify(
      props,
    )} });
    });`;

    if (hydrateOptions.loading === 'eager') {
      // this is eager loaded. Still requires System.js to be defined.
      page.hydrateStack.push({
        source: componentName,
        priority: 50,
        string: clientJs,
      });
    } else {
      // we're lazy loading
      page.hydrateStack.push({
        source: componentName,
        priority: 50,
        string: `
        function init${cleanComponentName.toLowerCase()}${id}() {
          ${clientJs}
        }
        ${IntersectionObserver({
          el: `document.getElementById('${cleanComponentName.toLowerCase()}-${id}')`,
          name: `${cleanComponentName.toLowerCase()}`,
          loaded: `init${cleanComponentName.toLowerCase()}${id}();`,
          notLoaded: `init${cleanComponentName.toLowerCase()}${id}();`,
          rootMargin: hydrateOptions.rootMargin || '200px',
          threshold: hydrateOptions.threshold || 0,
          id,
        })}
      `,
      });
    }

    return `<div class="${cleanComponentName.toLowerCase()}" id="${cleanComponentName.toLowerCase()}-${id}">${finalHtmlOuput}</div>`;
  } catch (e) {
    console.log(e);
    page.errors.push(e);
  }
  return '';
};

export default svelteComponent;
