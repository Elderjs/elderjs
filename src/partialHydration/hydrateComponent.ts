import devalue from 'devalue';
import { Page } from '../utils';
import getUniqueId from '../utils/getUniqueId';
import { HydrateOptions } from '../utils/types';

export const IntersectionObserver = ({
  el,
  name,
  loaded,
  notLoaded,
  id,
  rootMargin = '200px',
  threshold = 0,
  timeout = 1000,
}) => {
  return `
  ${timeout > 0 ? `requestIdleCallback(function(){` : `window.addEventListener('load', function (event) {`}
        var observer${id} = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(${el});
              if (document.eg_${name}) {
                ${loaded}
              } else {
                document.eg_${name} = true;
                ${notLoaded}
              }
            }
          }
        }, {
          rootMargin: '${rootMargin}',
          threshold: ${threshold}
        });
        observer${id}.observe(${el});
      ${timeout > 0 ? `}, {timeout: ${timeout}});` : '});'}
    `;
};

export interface IHydrateComponent {
  innerHtml: string;
  componentName: string;
  hydrateOptions: HydrateOptions;
  page: Page;
  iife: string;
  clientSrcMjs: string;
  props: any;
}

export default function hydrateComponent({
  innerHtml,
  componentName,
  hydrateOptions,
  page,
  iife,
  clientSrcMjs,
  props,
}: IHydrateComponent): string {
  const id = getUniqueId();
  const lowerCaseComponent = componentName.toLowerCase();
  const uniqueComponentName = `${lowerCaseComponent}${id}`;
  const uniquePropsName = `${lowerCaseComponent}Props${id}`;

  // hydrateOptions.loading=none for server only rendered injected into html
  if (!hydrateOptions || hydrateOptions.loading === 'none') {
    // if a component isn't hydrated we don't need to wrap it in a unique div.
    return innerHtml;
  }

  // should we preload?
  if (hydrateOptions.preload) {
    page.headStack.push({
      source: componentName,
      priority: 50,
      string: `<link rel="preload" href="${clientSrcMjs}" as="script">`,
      // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
    });
  }

  // // should we write props to the page?
  const hasProps = Object.keys(props).length > 0;
  // if (hasProps) {
  //   page.perf.start(`page.hydrate.${componentName}`);
  //   page.hydrateStack.push({
  //     source: uniqueComponentName,
  //     string: `<script>var ${uniquePropsName} = ${devalue(props)};</script>`,
  //     priority: 100,
  //   });
  //   page.perf.end(`page.hydrate.${componentName}`);
  // }

  if (hasProps) {
    page.propsToHydrate.push([uniquePropsName, props]);
  }

  if (iife) {
    // iife -- working in IE. Users must import some polyfills.
    // -----------------
    page.hydrateStack.push({
      source: uniqueComponentName,
      string: `<script nomodule defer src="${iife}" onload="init${uniqueComponentName}()"></script>`,
      priority: 99,
    });

    page.hydrateStack.push({
      source: uniqueComponentName,
      priority: 98,
      string: `
        <script nomodule>
        function init${uniqueComponentName}(){
          new ___elderjs_${componentName}({
            target: document.getElementById('${uniqueComponentName}'),
            props:  ${hasProps ? `_$(${uniquePropsName})` : '{}'},
            hydrate: true,
          });
        }
        </script>`,
    });
  }

  page.hydrateStack.push({
    source: uniqueComponentName,
    priority: 30,
    string: `     
        <script type="module">
        function init${uniqueComponentName}(){
          import("${clientSrcMjs}").then((component)=>{
            new component.default({ 
              target: document.getElementById('${uniqueComponentName}'),
              props: ${hasProps ? `_$(${uniquePropsName})` : '{}'},
              hydrate: true
              });
          });
        }
        ${
          hydrateOptions.loading === 'eager'
            ? `init${uniqueComponentName}();`
            : `${IntersectionObserver({
                el: `document.getElementById('${uniqueComponentName}')`,
                name: lowerCaseComponent,
                loaded: `init${uniqueComponentName}();`,
                notLoaded: `init${uniqueComponentName}();`,
                rootMargin: hydrateOptions.rootMargin || '200px',
                threshold: hydrateOptions.threshold || 0,
                timeout: hydrateOptions.timeout <= 0 ? 0 : 1000,
                id,
              })}`
        }
        </script>`,
  });

  return `<div class="${componentName.toLowerCase()}-component" id="${uniqueComponentName}">${innerHtml}</div>`;
}
