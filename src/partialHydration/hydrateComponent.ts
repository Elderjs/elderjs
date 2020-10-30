import devalue from 'devalue';
import getUniqueId from '../utils/getUniqueId';

export const IntersectionObserver = ({ el, name, loaded, notLoaded, id, rootMargin = '200px', threshold = 0 }) => {
  return `
      window.addEventListener('load', function (event) {
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
      });
    `;
};

export default function hydrateComponent({
  innerHtml,
  componentName,
  hydrateOptions,
  page,
  iife,
  clientSrcMjs,
  props,
}): string {
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

  const hasProps = Object.keys(props).length > 0;

  if (hasProps) {
    page.hydrateStack.push({
      source: uniqueComponentName,
      string: `<script>var ${uniquePropsName} = ${devalue(props)};</script>`,
      priority: 100,
    });
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
            props:  ${hasProps ? `${uniquePropsName}` : '{}'},
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
              props: ${hasProps ? `${uniquePropsName}` : '{}'},
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
                id,
              })}`
        }
        </script>`,
  });

  return `<div class="${componentName.toLowerCase()}-component" id="${uniqueComponentName}">${innerHtml}</div>`;
}
