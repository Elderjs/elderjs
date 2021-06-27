import fs from 'fs-extra';
import path from 'path';

import { Page } from '../utils';
import hydrateComponent from './hydrateComponent';
import { walkAndCount, prepareSubstitutions, walkAndSubstitute } from './propCompression';
import windowsPathFix from '../utils/windowsPathFix';

export const howManyBytes = (str) => Buffer.from(str).length;

export const hashCode = (s) => {
  let h = 0;
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};

export default async (page: Page) => {
  let decompressCode = `<script>$ejs = function(_ejs){return _ejs}</script>`;
  if (!page.settings.props.compress) {
    for (let dd = 0; dd < page.componentsToHydrate.length; dd += 1) {
      const component = page.componentsToHydrate[dd];
      if (component.props) {
        component.prepared.propsString = JSON.stringify(component.props);
      }
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
      decompressCode = `<script>
      var $ejs = function(){
        var gt = function (_ejs) { return Object.prototype.toString.call(_ejs).slice(8, -1);};
        var ejs = new Map(${JSON.stringify(Array.from(initialValues))});
         return function(_ejs){
            if (ejs.has(_ejs)) return ejs.get(_ejs);
            if (Array.isArray(_ejs)) return _ejs.map((t) => $ejs(t));
            if (gt(_ejs) === "Object") {
            return Object.keys(_ejs).reduce(function (out, cv){
                var key = ejs.get(cv) || cv;
                out[key] = $ejs(_ejs[cv]);
                return out;
              }, {});
            }
            return _ejs;
        };
      }();
    </script>`;
    }

    if (page.settings.debug.props) hydratedPropLength += decompressCode.length;

    for (let ii = 0; ii < page.componentsToHydrate.length; ii += 1) {
      const component = page.componentsToHydrate[ii];
      // eslint-disable-next-line no-continue
      if (!component.props) continue; // skip components without props
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

  // always add decompress code even if it is just the basic return function.
  page.beforeHydrateStack.push({
    source: 'compressProps',
    string: decompressCode,
    priority: 100,
  });

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
          await fs.writeFile(propPath, `export default ${component.prepared.propsString};`);
        }

        component.prepared.clientPropsUrl = windowsPathFix(`/${path.relative(page.settings.distDir, propPath)}`);
      } else {
        component.prepared.clientPropsString = `JSON.parse(\`${component.prepared.propsString}\`)`;
      }
    }

    page.hydrateStack.push({
      source: component.name,
      priority: 30,
      string: hydrateComponent(component),
    });

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
    }
  }

  // add components to stack
};
