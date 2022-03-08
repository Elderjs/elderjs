import MagicString from 'magic-string';
import { renderComponent as defaultRenderComponent } from '../utils/svelteComponent';
import { parseTag } from '../utils/htmlParser';

export default function mountComponentsInHtml({
  page,
  html,
  isClient = false,
  renderComponent = defaultRenderComponent,
}): string {
  const s = new MagicString(html);
  let dirty = false;
  let hydration = 0;
  const matches = html.matchAll(/<([^<>\s]+) [^<>]*ejs-mount[^<>]*>(<\/\1>)?/gim);

  for (const match of matches) {
    let id;
    const [, , closeImmediately] = match;
    const tag = parseTag(html, match.index);
    const mounts = [];
    let otherAttr = '';
    for (const attr of tag.attrs) {
      if ('name' in attr && /^ejs-mount/.test(attr.name)) {
        mounts.push(JSON.parse(attr.value.value));
      } else {
        otherAttr += ` ${html.slice(attr.start, attr.end)}`;
      }
    }
    let element;
    let innerHtml = '';

    for (const [name, props, options] of mounts) {
      if (isClient && options?.loading !== 'none') {
        throw new Error(
          `Client side hydrated component is attempting to hydrate another sub component. This isn't supported. \n
               Debug: ${JSON.stringify(mounts)}
              `,
        );
      }
      const { ssr, client } = page.settings.$$internal.findComponent(name, 'components');
      if (!element && options?.element) {
        element = options.element;
      }
      if (!innerHtml && closeImmediately && ssr) {
        const result = renderComponent({ path: ssr, props });
        if (result.head) {
          page.headStack.push({ source: name, priority: 50, string: result.head });
        }
        if (result.css?.code && page.settings.css === 'inline' && options?.loading === 'none') {
          page.svelteCss.push({ css: result.css.code, cssMap: result.css.map });
        }
        innerHtml = mountComponentsInHtml({
          page,
          html: result.html,
          isClient: isClient || options?.loading !== 'none',
        });
      }
      if (options?.loading !== 'none') {
        if (id == null) {
          id = page.getUniqueId();
        }
        page.componentsToHydrate.push({
          name: `ejs${id}`,
          hydrateOptions: options,
          client,
          props: props && Object.keys(props).length > 0 ? props : false,
          prepared: {},
          id,
        });
        hydration += 1;
      }
    }

    let repl;
    if (!hydration && tag.name === 'ejswrapper' && !otherAttr) {
      repl = innerHtml;
    } else {
      const tagName = tag.name !== 'ejswrapper' ? tag.name : element || 'div';
      const closeTag = closeImmediately ? `</${tagName}>` : '';
      repl = `<${tagName}${otherAttr} ejs-id="${id}">${innerHtml}${closeTag}`;
    }
    s.overwrite(match.index, match.index + match[0].length, repl);
    dirty = true;
  }
  return dirty ? s.toString() : html;
}
