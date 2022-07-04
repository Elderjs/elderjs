import { ComponentPayload } from '../utils/types.js';
import mountComponentsInHtml from './mountComponentsInHtml.js';
import getUniqueId from '../utils/getUniqueId.js';

export const getComponentName = (str: string) => {
  let out = str.replace('.svelte', '').replace('.js', '');
  if (out.includes('/')) {
    out = out.split('/').pop();
  }
  return out;
};

const svelteComponent =
  (componentName: string, folder = 'components') =>
  async ({ page, props, hydrateOptions }: ComponentPayload): Promise<string> => {
    const { ssr, client } = page.settings.$$internal.findComponent(componentName, folder);
    const cleanComponentName = getComponentName(componentName);

    try {
      const ssrReq = await import(ssr);

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

        const innerHtml = await mountComponentsInHtml({
          html: htmlOutput,
          page,
          hydrateOptions,
        });

        // hydrateOptions.loading=none for server only rendered injected into html
        if (!hydrateOptions || hydrateOptions.loading === 'none') {
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

        const componentHtml = `<${
          hydrateOptions.element
        } class="${cleanComponentName.toLowerCase()}-component" id="${uniqueComponentName}">${innerHtml}</${
          hydrateOptions.element
        }>`;

        return componentHtml;
      } catch (e) {
        console.log(e);
        page.errors.push(e);
      }
      return '';
    } catch (e) {
      console.error(`Couldn't find the component for ${componentName} in ${folder}`);
    }
  };

export default svelteComponent;
