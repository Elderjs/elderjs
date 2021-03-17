/* eslint-disable global-require */
import { ComponentPayload } from './types';
import mountComponentsInHtml from '../partialHydration/mountComponentsInHtml';
import hydrateComponent from '../partialHydration/hydrateComponent';

export const getComponentName = (str) => {
  let out = str.replace('.svelte', '').replace('.js', '');
  if (out.includes('/')) {
    out = out.split('/').pop();
  }
  return out;
};

const svelteComponent = (componentName: String, folder: String = 'components') => ({
  page,
  props,
  hydrateOptions,
}: ComponentPayload): string => {
  const { ssr, client, iife } = page.settings.$$internal.findComponent(componentName, folder);

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

    return hydrateComponent({
      page,
      iife,
      clientSrcMjs: client,
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
