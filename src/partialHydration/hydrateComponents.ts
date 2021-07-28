import fs from 'fs-extra';
import path from 'path';

import { Page } from '../utils';
import { walkAndCount, prepareSubstitutions, walkAndSubstitute } from './propCompression';
import windowsPathFix from '../utils/windowsPathFix';

const defaultElderHelpers = (decompressCode, prefix, generateLazy) => `
const $$ejs = (par,eager)=>{
  ${decompressCode}
  const prefix = '${prefix}';
  const initComponent = (target, component) => {
    const decompressedProps = component.propProm.then(p => $ejs(p.default));
    Promise.all([component.compProm,decompressedProps]).then(([comp,props])=>{
      new comp.default({ 
        target: target,
        props: props,
        hydrate: true
      });
    });
  }
  ${
    generateLazy
      ? `const IO = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        const selected = par[entry.target.id];
        initComponent(entry.target,selected)
      }
    });
  });`
      : ''
  }
  Object.keys(par).forEach((k) => {

    par[k].propProm = ((typeof par[k].props === 'string') ? import(prefix+'/props/'+ par[k].props) : new Promise((resolve) => resolve({ default : par[k].props })))
    par[k].compProm = import(prefix + '/svelte/components/' + par[k].component)

    const el = document.getElementById(k);
    if (${generateLazy ? '!eager' : 'false'}) {
        IO.observe(el);
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
      component.prepared.propsString = JSON.stringify(walkAndSubstitute(component.props, substitutions));
      if (page.settings.debug.props) hydratedPropLength += component.prepared.propsString.length;
    }

    if (page.settings.debug.props) {
      console.log('propCompression', {
        initialPropLength,
        hydratedPropLength,
        reduction: 1 - hydratedPropLength / initialPropLength,
      });
    }
    page.perf.stop('prepareProps');
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
          `./props/ejs-${hashCode(component.prepared.propsString)}.js`,
        );

        if (!fs.existsSync(propPath)) {
          if (!fs.existsSync(path.resolve(page.settings.$$internal.distElder, `./props/`))) {
            fs.mkdirSync(path.resolve(page.settings.$$internal.distElder, `./props/`), { recursive: true });
          }

          // eslint-disable-next-line no-await-in-loop
          fs.writeFileSync(propPath, `export default ${component.prepared.propsString};`);
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
          string: `<link rel="preload" href="${component.prepared.clientPropsUrl}" as="script">`,
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
          string: `<link rel="prefetch" href="${component.prepared.clientPropsUrl}" as="script">`,
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

  // add components to stack
};
