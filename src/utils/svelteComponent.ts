import path from 'path';

import { ComponentPayload } from './types';
import mountComponentsInHtml from '../partialHydration/mountComponentsInHtml';
import hydrateComponent from '../partialHydration/hydrateComponent';

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

const componentCache = {};

const svelteComponent = (componentName: String, ssrFolder: String = 'components') => ({
  page,
  props,
  hydrateOptions,
}: ComponentPayload): string => {
  const cleanComponentName = getComponentName(componentName);

  if (!componentCache[cleanComponentName]) {
    const clientComponents = page.settings.$$internal.hashedComponents;
    const ssrComponent = path.resolve(
      page.settings.$$internal.ssrComponents,
      `./${ssrFolder}/${cleanComponentName}.js`,
    );
    const clientSvelteFolder = getClientSvelteFolder(page);

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const { render, _css, _cssMap } = require(ssrComponent);

    componentCache[cleanComponentName] = {
      render,
      clientSrcMjs: `${clientSvelteFolder}/${clientComponents[cleanComponentName].mjs}.mjs`,
      iife: clientComponents[cleanComponentName].iife
        ? `${clientSvelteFolder}/${clientComponents[cleanComponentName].iife}.js`
        : false,
      css: _css,
      cssMap: _cssMap,
    };
  }

  const { render, clientSrcMjs, iife, css, cssMap } = componentCache[cleanComponentName];

  try {
    const { html: htmlOutput, head } = render(props);

    if (css && css.length > 0 && page.svelteCss) {
      page.svelteCss.push({ css, cssMap });
    }

    if (head && page.headStack) {
      page.headStack.push({ source: cleanComponentName, priority: 50, string: head });
    }

    return hydrateComponent({
      page,
      iife,
      clientSrcMjs,
      innerHtml: mountComponentsInHtml({ html: htmlOutput, page, hydrateOptions }),
      hydrateOptions,
      componentName: cleanComponentName,
      props,
    });
  } catch (e) {
    // console.log(e);
    page.errors.push(e);
  }
  return '';
};

export default svelteComponent;
