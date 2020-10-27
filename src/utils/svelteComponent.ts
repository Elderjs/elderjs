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
    .replace(/\\\\n/gim, '\\n')
    .replace(/&quot;/gim, '"')
    .replace(/&lt;/gim, '<')
    .replace(/&gt;/gim, '>')
    .replace(/&#39;/gim, "'")
    .replace(/\\"/gim, '"')
    .replace(/&amp;/gim, '&');

const componentCache = {};

const notProduction = String(process.env.NODE_ENV).toLowerCase() !== 'production';

const svelteComponent = (componentName: String, ssrFolder: String = 'components') => ({
  page,
  props,
  hydrateOptions,
}: ComponentPayload): string => {
  const cleanComponentName = getComponentName(componentName);
  const id = getUniqueId();

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

    if (css && css.length > 0 && page.cssStack) {
      css.forEach((c) => {
        page.cssStack.push({ source: componentName, priority: 50, string: c });
      });
    }

    if (cssMap && cssMap.length > 0 && page.cssStack && notProduction) {
      cssMap.forEach((c) => {
        page.cssStack.push({ source: componentName, priority: 1, string: c });
      });
    }

    if (head && page.headStack) {
      page.headStack.push({ source: componentName, priority: 50, string: head });
    }

    let finalHtmlOuput = htmlOutput;

    // sometimes svelte adds a class to our inlining.
    const matches = finalHtmlOuput.matchAll(
      /<div class="ejs-component[^]*?" data-ejs-component="([A-Za-z]+)" data-ejs-props="({[^]*?})" data-ejs-options="({[^]*?})"><\/div>/gim,
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
          `Client side hydrated component "${componentName}" includes client side hydrated sub component "${hydrateComponentName}." This isn't supported. \n
           Debug: ${JSON.stringify({
             componentName,
             hydrateOptions,
             hydrateComponentName,
             hydrateComponentProps,
             hydrateComponentOptions,
           })}
          `,
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

    const uniqueComponentName = `${cleanComponentName.toLowerCase()}${id}`;

    // should we preload?
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
        priority: 100,
      });
    }

    if (iife) {
      // iife -- working in IE. Users must import some polyfills.
      // -----------------
      page.hydrateStack.push({
        source: componentName,
        string: `<script nomodule defer src="${iife}" onload="init${uniqueComponentName}()"></script>`,
        priority: 99,
      });

      page.hydrateStack.push({
        source: componentName,
        priority: 98,
        string: `
      <script nomodule>
      function init${uniqueComponentName}(){
        new ___elderjs_${componentName}({
          target: document.getElementById('${uniqueComponentName}'),
          props:  ${hasProps ? `${cleanComponentName.toLowerCase()}Props${id}` : '{}'},
          hydrate: true,
        });
      }
      </script>`,
      });
    }

    page.hydrateStack.push({
      source: componentName,
      priority: 30,
      string: `     
      <script type="module">
      function init${uniqueComponentName}(){
        import("${clientSrcMjs}").then((component)=>{
          new component.default({ 
            target: document.getElementById('${uniqueComponentName}'),
            props: ${hasProps ? `${cleanComponentName.toLowerCase()}Props${id}` : '{}'},
            hydrate: true
            });
        });
      }
      ${
        hydrateOptions.loading === 'eager'
          ? `init${uniqueComponentName}();`
          : `${IntersectionObserver({
              el: `document.getElementById('${uniqueComponentName}')`,
              name: `${cleanComponentName.toLowerCase()}`,
              loaded: `init${uniqueComponentName}();`,
              notLoaded: `init${uniqueComponentName}();`,
              rootMargin: hydrateOptions.rootMargin || '200px',
              threshold: hydrateOptions.threshold || 0,
              id,
            })}`
      }
      </script>`,
    });

    return `<div class="${cleanComponentName.toLowerCase()}" id="${uniqueComponentName}">${finalHtmlOuput}</div>`;
  } catch (e) {
    console.log(e);
    page.errors.push(e);
  }
  return '';
};

export default svelteComponent;
