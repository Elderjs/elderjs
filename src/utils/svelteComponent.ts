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
      clientSrcSystem: `${clientSvelteFolder}/${clientComponents[cleanComponentName].system}.js`,
      clientSrcMjs: `${clientSvelteFolder}/${clientComponents[cleanComponentName].mjs}.mjs`,
      iife: `${clientSvelteFolder}/${clientComponents[cleanComponentName].iife}.js`,
    };
  }

  const { render, clientSrcSystem, clientSrcMjs, iife } = componentCache[cleanComponentName];

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

    if (hydrateOptions.preload) {
      page.headStack.push({
        source: componentName,
        priority: 50,
        string: `<link rel="preload" href="${clientSrcMjs}" as="script">`,
        // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
      });
    }

    const hasProps = Object.keys(props).length > 0;

    if (hasProps) {
      page.hydrateStack.push({
        source: componentName,
        string: `<script>var ${cleanComponentName.toLowerCase()}Props${id} = ${devalue(props)};</script>`,
        priority: 1,
      });
    }

    page.hydrateStack.push({
      source: componentName,
      string: `<script nomodule src="${iife}"></script>`,
      priority: 99,
    });

    page.hydrateStack.push({
      source: componentName,
      priority: 98,
      string: `
      <script nomodule>
      function init${cleanComponentName.toLowerCase()}${id}(){
        new ___elderjs_${componentName}({ 
          target: document.getElementById('${cleanComponentName.toLowerCase()}-${id}'), 
          props:  ${hasProps ? `${cleanComponentName.toLowerCase()}Props${id}` : '{}'},
          hydrate: true,
        });
      }
      </script>`,
    });

    page.hydrateStack.push({
      source: componentName,
      priority: 30,
      string: `     
      <!-- loads ESM for module with a dynamic import -->
      <script type="module">
      function init${cleanComponentName.toLowerCase()}${id}(){
        import("${clientSrcMjs}").then((component)=>{
          new component.default({ 
            target: document.getElementById('${cleanComponentName.toLowerCase()}-${id}'),
            props: ${hasProps ? `${cleanComponentName.toLowerCase()}Props${id}` : '{}'},
            hydrate: true
            });
        });
      }
      </script>`,
    });

    if (hydrateOptions.loading === 'eager') {
      // this is eager loaded. Still requires System.js to be defined.
      page.hydrateStack.push({
        source: componentName,
        priority: 1,
        string: `<script>init${cleanComponentName.toLowerCase()}${id}();</script>`,
      });
    } else {
      // we're lazy loading
      page.hydrateStack.push({
        source: componentName,
        priority: 1,
        string: `<script>
        ${IntersectionObserver({
          el: `document.getElementById('${cleanComponentName.toLowerCase()}-${id}')`,
          name: `${cleanComponentName.toLowerCase()}`,
          loaded: `init${cleanComponentName.toLowerCase()}${id}();`,
          notLoaded: `init${cleanComponentName.toLowerCase()}${id}();`,
          rootMargin: hydrateOptions.rootMargin || '200px',
          threshold: hydrateOptions.threshold || 0,
          id,
        })}
        </script>
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
