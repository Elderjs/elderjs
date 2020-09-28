import path from 'path';
import devalue from 'devalue';
import getUniqueId from './getUniqueId';
import IntersectionObserver from './IntersectionObserver';
import { ComponentPayload } from './types';

export const getClientSvelteFolder = (page) => {
  return page.settings.$$internal.clientComponents.replace(page.settings.distDir, '').replace(/\\/gm, '/'); // windows fix.
};

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

  console.log(page.settings.$$internal.hashedComponents);

  if (!componentCache[cleanComponentName]) {
    const clientComponents = page.settings.$$internal.hashedComponents;
    const ssrComponent = path.resolve(page.settings.$$internal.ssrComponents, `./${cleanComponentName}.js`);
    const clientSvelteFolder = getClientSvelteFolder(page);

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const { render } = require(ssrComponent);
    componentCache[cleanComponentName] = {
      render,
      client: `${clientSvelteFolder}/${clientComponents[cleanComponentName]}.js`,
    };
  }

  const { render, client } = componentCache[cleanComponentName];

  try {
    const { css, html: htmlOutput, head } = render(props);

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
      let hydrateComponentProps;
      let hydrateComponentOptions;

      try {
        hydrateComponentProps = JSON.parse(replaceSpecialCharacters(match[2]));
      } catch (e) {
        throw new Error(`Failed to JSON.parse props for ${componentName} ${match[2]}`);
      }
      try {
        hydrateComponentOptions = JSON.parse(replaceSpecialCharacters(match[3]));
      } catch (e) {
        throw new Error(`Failed to JSON.parse props for ${componentName} ${match[3]}`);
      }

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

    // should we preload?
    if (hydrateOptions.preload) {
      page.headStack.push({
        source: componentName,
        priority: 50,
        string: `<link rel="preload" href="${client}" as="script">`,
      });
    }

    const componentTarget = `${cleanComponentName.toLowerCase()}${id}`;

    let clientJs;
    // legacy uses System.js
    if (page.settings.legacy) {
      clientJs = `
      System.import('${client}').then((${componentTarget}) => {
        new ${componentTarget}.default({ target: document.getElementById('${componentTarget}'), hydrate: true, props: ${devalue(
        props,
      )} });
      });`;
    } else {
      clientJs = `
      import("${client}").then((${componentTarget} )=>{
        new ${componentTarget}.default({ target: document.getElementById('${componentTarget}'), hydrate: true, props: ${devalue(
        props,
      )} });
      }).catch((e)=>{
        console.error('Error loading ${client}', e);
      });`;
    }

    if (hydrateOptions.loading === 'eager') {
      // this is eager loaded.
      page.hydrateStack.push({
        source: componentName,
        priority: 50,
        string: clientJs,
      });
    } else {
      // we're lazy loading
      // we use the IntersectionObserver and adjust the distance
      page.hydrateStack.push({
        source: componentName,
        priority: 50,
        string: `
        function init${componentTarget}() {
          ${clientJs}
        }
        ${IntersectionObserver({
          el: `document.getElementById('${componentTarget}')`,
          name: `${cleanComponentName.toLowerCase()}`,
          loaded: `init${componentTarget}();`,
          notLoaded: `init${componentTarget}();`,
          rootMargin: hydrateOptions.rootMargin || '200px',
          threshold: hydrateOptions.threshold || 0,
          id,
        })}
      `,
      });
    }

    return `<div class="${cleanComponentName.toLowerCase()}" id="${componentTarget}">${finalHtmlOuput}</div>`;
  } catch (e) {
    console.log(e);
    page.errors.push(e);
  }
  return '';
};

export default svelteComponent;
