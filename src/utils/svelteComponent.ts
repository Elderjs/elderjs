/* eslint-disable global-require */
import { ComponentPayload } from './types';
import mountComponentsInHtml from '../partialHydration/mountComponentsInHtml';
import getUniqueId from './getUniqueId';

export const getComponentName = (str) => {
  let out = str.replace('.svelte', '').replace('.js', '');
  if (out.includes('/')) {
    out = out.split('/').pop();
  }
  return out;
};

const svelteComponent =
  (componentName: String, folder: String = 'components') =>
  ({ page, props, hydrateOptions, isHydrated = false }: ComponentPayload): string => {
    const { ssr, client } = page.settings.$$internal.findComponent(componentName, folder);

    const cleanComponentName = getComponentName(componentName);

    // eslint-disable-next-line import/no-dynamic-require
    const ssrReq = require(ssr);

    const { render, _css: css, _cssMap: cssMap } = ssrReq.default || ssrReq;

    try {
      const { html: htmlOutput, head } = render(props);

      if (page.settings.css === 'inline') {
        if (css && css.length > 0 && page.svelteCss && !hydrateOptions) {
          page.svelteCss.push({ css, cssMap });
        }
      }

      if (head && page.headStack) {
        page.headStack.push({ source: cleanComponentName, priority: 50, string: head });
      }

      const innerHtml = mountComponentsInHtml({
        html: htmlOutput,
        page,
        isHydrated: isHydrated || (hydrateOptions && hydrateOptions.loading !== 'none'),
      });

      // hydrateOptions.loading=none for server only rendered injected into html
      if (isHydrated || !hydrateOptions || hydrateOptions.loading === 'none') {
        // if parent component is hydrated or
        // if a component isn't hydrated we don't need to wrap it in a unique div.
        return innerHtml;
      }

      const id = getUniqueId();
      const lowerCaseComponent = componentName.toLowerCase();
      const uniqueComponentName = `${lowerCaseComponent}-ejs-${id}`;

      page.componentsToHydrate.push({
        name: uniqueComponentName,
        hydrateOptions,
        client,
        props: Object.keys(props).length > 0 ? props : false,
        prepared: {},
        id,
      });

      return `<${
        hydrateOptions.element
      } class="${cleanComponentName.toLowerCase()}-component" id="${uniqueComponentName}">${innerHtml}</${
        hydrateOptions.element
      }>`;
    } catch (e) {
      // console.log(e);
      page.errors.push(e);
    }
    return '';
  };

export default svelteComponent;
