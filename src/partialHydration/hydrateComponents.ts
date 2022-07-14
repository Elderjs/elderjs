import fs from 'fs-extra';
import path from 'path';

import { Page } from '../utils/index.js';
import { walkAndCount, prepareSubstitutions, walkAndSubstitute } from './propCompression.js';
import windowsPathFix from '../utils/windowsPathFix.js';

const elderInitComponent = (prefix: string) => `
const prefix = '${prefix}';
const initComponent = (target, component) => {
  if(!!CustomEvent && target.id){
    const split = target.id.split('-ejs-');
    document.dispatchEvent(
      new CustomEvent('ejs', {
        detail: {
          category: 'elderjs',
          action: 'hydrate',
          target: target,
          label: split[0] || target.id
        }
      }),
    );
  }

  const propProm = ((typeof component.props === 'string') ? fetch(prefix+'/props/'+ component.props).then(p => p.json()).then(r => $ejs(r)) : new Promise((resolve) => resolve($ejs(component.props))));
  const compProm = import(prefix + '/svelte/components/' + component.component);

  Promise.all([compProm,propProm]).then(([comp,props])=>{
    new comp.default({ 
      target: target,
      props: props,
      hydrate: true
    });
  });
};
`;

const defaultElderHelpers = (decompressCode: string, prefix: string, generateLazy: boolean) => `
const $$ejs = (par,eager)=>{
  ${decompressCode}
  
  ${elderInitComponent(prefix)}
  ${
    generateLazy
      ? `window.ejsIO = ('IntersectionObserver' in window) ? new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        const selected = par[entry.target.id];
        initComponent(entry.target,selected)
      }
    });
  }, { rootMargin: "200px",threshold: 0}) : undefined;`
      : ''
  }
  Object.keys(par).forEach(k => {
    const el = document.getElementById(k);
    if (${generateLazy ? '!eager && window.ejsIO' : 'false'}) {
        window.ejsIO.observe(el);
    } else {
        initComponent(el,par[k]);
    }
  });
};
`;

export const howManyBytes = (str) => Buffer.from(str).length;

export const hashCode = (s) => {
  let h = 0;
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};

export default (page: Page) => {
  const relPrefix = windowsPathFix(`/${path.relative(page.settings.distDir, page.settings.$$internal.distElder)}`);
  let decompressCode = `const $ejs = function(_ejs){return _ejs};`;
  if (!page.settings.props.compress) {
    for (let dd = 0; dd < page.componentsToHydrate.length; dd += 1) {
      const component = page.componentsToHydrate[dd];
      component.prepared.propsString = component.props ? JSON.stringify(component.props) : '{}';
    }
  } else {
    page.perf.start('prepareProps');
    const counts = new Map();
    const substitutions = new Map();
    const initialValues = new Map();

    let initialPropLength = 0;
    let hydratedPropLength = 0;

    // collect duplicate values
    for (let i = 0; i < page.componentsToHydrate.length; i += 1) {
      walkAndCount(page.componentsToHydrate[i].props, counts);
      if (page.settings.debug.props) initialPropLength += JSON.stringify(page.componentsToHydrate[i].props).length;
    }

    prepareSubstitutions({
      counts,
      substitutions,
      initialValues,
      replacementChars: page.settings.props.replacementChars,
    });

    if (substitutions.size > 0) {
      decompressCode = `
      const $ejs = function(){
        const gt = function (_ejs) { return Object.prototype.toString.call(_ejs).slice(8, -1);};
        const ejs = new Map(${JSON.stringify(Array.from(initialValues))});
         return function(_ejs){
            if (ejs.has(_ejs)) return ejs.get(_ejs);
            if (Array.isArray(_ejs)) return _ejs.map((t) => $ejs(t));
            if (gt(_ejs) === "Object") {
            return Object.keys(_ejs).reduce(function (out, cv){
                const key = ejs.get(cv) || cv;
                out[key] = $ejs(_ejs[cv]);
                return out;
              }, {});
            }
            return _ejs;
        };
      }();
    `;
    }

    if (page.settings.debug.props) hydratedPropLength += decompressCode.length;

    for (let ii = 0; ii < page.componentsToHydrate.length; ii += 1) {
      const component = page.componentsToHydrate[ii];
      component.prepared.propsString = JSON.stringify(walkAndSubstitute(component.props || {}, substitutions));
      if (page.settings.debug.props) hydratedPropLength += component.prepared.propsString.length;
    }

    if (page.settings.debug.props) {
      console.log('propCompression', {
        initialPropLength,
        hydratedPropLength,
        reduction: 1 - hydratedPropLength / initialPropLength,
      });
    }
    page.perf.end('prepareProps');
  }

  let eagerString = '';
  let deferString = '';

  for (let p = 0; p < page.componentsToHydrate.length; p += 1) {
    const component = page.componentsToHydrate[p];

    // write a file or prepare the string for the html.

    if (component.prepared.propsString) {
      if (
        page.settings.props.hydration === 'file' ||
        (page.settings.props.hydration === 'hybrid' && howManyBytes(component.prepared.propsString) > 2000)
      ) {
        const propPath = path.resolve(
          page.settings.$$internal.distElder,
          `./props/ejs-${hashCode(component.prepared.propsString)}.json`,
        );

        if (!fs.existsSync(propPath)) {
          if (!fs.existsSync(path.resolve(page.settings.$$internal.distElder, `./props/`))) {
            fs.mkdirSync(path.resolve(page.settings.$$internal.distElder, `./props/`), { recursive: true });
          }

          // eslint-disable-next-line no-await-in-loop
          fs.writeFileSync(propPath, component.prepared.propsString);
        }

        component.prepared.clientPropsUrl = windowsPathFix(`/${path.relative(page.settings.distDir, propPath)}`);
      } else if (howManyBytes(component.prepared.propsString) > 10000) {
        // TODO: further test JSON.parse
        // https://stackoverflow.com/a/40558081/3577474
        component.prepared.clientPropsString = component.prepared.propsString;
      } else {
        component.prepared.clientPropsString = component.prepared.propsString;
      }
    }

    if (component.hydrateOptions.loading === 'eager') {
      eagerString += `'${component.name}' : { 'component' : '${component.client.replace(
        `${relPrefix}/svelte/components/`,
        '',
      )}', 'props' : ${
        component.prepared.clientPropsUrl
          ? `'${component.prepared.clientPropsUrl.replace(`${relPrefix}/props/`, '')}'`
          : component.prepared.clientPropsString
      }},`;
    } else {
      deferString += `'${component.name}' : { 'component' : '${component.client.replace(
        `${relPrefix}/svelte/components/`,
        '',
      )}', 'props' : ${
        component.prepared.clientPropsUrl
          ? `'${component.prepared.clientPropsUrl.replace(`${relPrefix}/props/`, '')}'`
          : component.prepared.clientPropsString
      }},`;
    }

    if (component.hydrateOptions.preload) {
      page.headStack.push({
        source: component.name,
        priority: 50,
        string: `<link rel="preload" href="${component.client}" as="script">`,
        // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
      });
      if (component.prepared.clientPropsUrl) {
        page.headStack.push({
          source: component.name,
          priority: 49,
          string: `<link rel="preload" href="${component.prepared.clientPropsUrl}" as="fetch">`,
          // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
        });
      }
    } else if (!component.hydrateOptions.noPrefetch) {
      page.headStack.push({
        source: component.name,
        priority: 50,
        string: `<link rel="prefetch" href="${component.client}" as="script">`,
        // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
      });
      if (component.prepared.clientPropsUrl) {
        page.headStack.push({
          source: component.name,
          priority: 49,
          string: `<link rel="prefetch" href="${component.prepared.clientPropsUrl}" as="fetch">`,
          // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
        });
      }
    }
  }

  if (page.componentsToHydrate.length > 0) {
    page.hydrateStack.push({
      source: 'hydrateComponents',
      priority: 30,
      string: `<script type="module">
            const requestIdleCallback = window.requestIdleCallback || ( cb => window.setTimeout(cb,1) );
      ${defaultElderHelpers(decompressCode, relPrefix, deferString.length > 0)}
      ${eagerString.length > 0 ? `$$ejs({${eagerString}},true)` : ''}${
        deferString.length > 0
          ? `
      requestIdleCallback(function(){
        $$ejs({${deferString}})}, {timeout: 1000});`
          : ''
      }</script>`,
    });
  }

  if (page.settings.$$internal.websocket && !page.settings.$$internal.production) {
    if (typeof page.settings.$$internal.websocket.wss.address() !== 'string') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      /// @ts-expect-error
      const port = page.settings.$$internal.websocket.wss.address().port;
      page.hydrateStack.push({
        source: 'hydrateComponents',
        priority: 1,
        string: `
        <script type="module">
        ${decompressCode}
        ${elderInitComponent(relPrefix)}

        const devComponents = {
        ${eagerString}
        ${deferString}
        };

        function swapComponents(file){
          console.log('swap', file);
          const componentName = file.split('.')[0];
          let targetComponent;
          let targetEl;
          
          Object.entries(devComponents).forEach(([el, component])=>{
            if(component.component.split(".")[0] === componentName && file !== component.component){
              targetEl = el;
              targetComponent = component;
            } 
          });

          if(targetComponent && targetEl){
            targetComponent.component = file;
            const el = document.getElementById(targetEl);
            while(el.firstChild){
              el.removeChild(el.firstChild);
            }
            if(window.ejsIO){
              window.ejsIO.unobserve(el);
            }

            initComponent(el, targetComponent);
          }
        }

        let currentCssId = "ejs-public-css";


        const ejsWs = new WebSocket("ws://localhost:${port}");
        ejsWs.onmessage = function (event) {
          const data = JSON.parse(event.data);
          if(data.type === 'reload'){
            console.log('reloading');
            ejsWs.send(\`reloading \${window.document.location}\`);
            location.reload();
            return false;
          } else if (data.type === 'componentChange'){
            swapComponents(data.file);
          } else if (data.type === 'publicCssChange'){
            const newCssId = "ejs-public-css-" + Date.now();
            const oldCssId = currentCssId;
            setTimeout(()=>{
              document.getElementById(oldCssId).remove();
            }, 150);

            const link = document.createElement("link");          
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = data.file;
            link.id = newCssId;
            document.head.appendChild(link);
          
            currentCssId = newCssId;
          } else if(data.type === 'otherCssFile'){
            const exists = document.querySelector('link[href=" + data.file + "]');
            if(exists){
              setTimeout(()=>{
                exists.remove();
              }, 150);
            } 
            const link = document.createElement("link");          
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = data.file + "?hash=" + Date.now();
            document.head.appendChild(link);
            console.log('added ' + data.file);
          } else {
            console.log('unknown elderjs event', event);
          }
        };
      </script>`,
      });
    }
  }
};

// remove svelte child
// while (temp0.firstChild) {
//   temp0.removeChild(temp0.firstChild);
// }

// remount component with decompressed props.

// remove style add updated stylesheet.
