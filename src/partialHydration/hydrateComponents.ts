import fs from 'fs-extra';
import path from 'path';

import { Page } from '../utils';
import hydrateComponent from './hydrateComponent';

const reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;

const isPrimitive = (thing: any) => Object(thing) !== thing;

const getType = (thing: any) => Object.prototype.toString.call(thing).slice(8, -1);

const objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');

export const howManyBytes = (str) => Buffer.from(str).length;

export const walkAndCount = (thing, counts: Map<string, number>) => {
  if (typeof thing === 'function') {
    throw new Error(`Cannot stringify a function`);
  }

  if (counts.has(thing)) {
    counts.set(thing, counts.get(thing) + 1);
    return;
  }

  // eslint-disable-next-line consistent-return
  if (isPrimitive(thing)) return counts.set(thing, 1);

  const type = getType(thing);

  switch (type) {
    case 'Number':
    case 'String':
    case 'Boolean':
    case 'Array':
      thing.forEach((t) => walkAndCount(t, counts));
      break;
    default:
      // eslint-disable-next-line no-case-declarations
      const proto = Object.getPrototypeOf(thing);
      if (
        proto !== Object.prototype &&
        proto !== null &&
        Object.getOwnPropertyNames(proto).sort().join('\0') !== objectProtoOwnPropertyNames
      ) {
        throw new Error(`Cannot stringify objects with augmented prototypes`);
      }

      if (Object.getOwnPropertySymbols(thing).length > 0) {
        throw new Error(`Cannot stringify objects with symbolic keys`);
      }

      Object.keys(thing).forEach((key) => {
        walkAndCount(thing[key], counts);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        walkAndCount(key, counts);
      });
  }
};

export const getName = (num: number, counts: Map<string, number>, replacementChars: string) => {
  let name = '';
  const { length } = replacementChars;
  do {
    name = replacementChars[num % length] + name;
    // eslint-disable-next-line no-bitwise
    num = ~~(num / length) - 1;
  } while (num >= 0);

  if (counts.has(name)) name = `${name}_`;

  return reserved.test(name) ? `${name}_` : name;
};

interface IPrepareSubsitutions {
  counts: Map<string, number>;
  substitutions: Map<string, string>;
  initialValues: Map<string, string>;
  replacementChars: string;
}

export const prepareSubstitutions = ({
  counts,
  substitutions,
  initialValues,
  replacementChars,
}: IPrepareSubsitutions) => {
  Array.from(counts)
    .filter((entry) => entry[1] > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach((entry, i) => {
      const name = getName(i, counts, replacementChars);
      substitutions.set(entry[0], name);
      initialValues.set(name, entry[0]);
    });
};

export const walkAndSubstitute = (thing, substitutions: Map<string, string>) => {
  if (substitutions.has(thing)) return substitutions.get(thing);
  if (Array.isArray(thing)) return thing.map((t) => walkAndSubstitute(t, substitutions));
  if (getType(thing) === 'Object') {
    return Object.keys(thing).reduce((out, cv) => {
      const key = substitutions.get(cv) || cv;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      out[key] = walkAndSubstitute(thing[cv], substitutions);
      return out;
    }, {});
  }
  return thing;
};

const hashCode = (s) => {
  let h = 0;
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};

export default async (page: Page) => {
  let decompressCode = `<script>$ejs = function(_ejs){return _t}</script>`;
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
    page.perf.end('prepareProps');
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
        component.prepared.clientPropsUrl = `/${path.relative(page.settings.distDir, propPath)}`;
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

// page.hydrateStack.push({
//   source: component.name,
//   string: `<script>
// var ${component.name} = ${};
// </script>`,
//   priority: 100,
// });

// // should we preload?
// if (hydrateOptions.preload) {
//   page.headStack.push({
//     source: componentName,
//     priority: 50,
//     string: `<link rel="preload" href="${clientSrcMjs}" as="script">`,
//     // string: `<link rel="modulepreload" href="${clientSrcMjs}">`, <-- can be an option for Chrome if browsers don't like this.
//   });
// }
