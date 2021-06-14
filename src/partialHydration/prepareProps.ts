import { Page } from '../utils';

const reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;

const isPrimitive = (thing: any) => Object(thing) !== thing;

const getType = (thing: any) => Object.prototype.toString.call(thing).slice(8, -1);

const objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');

const walkAndCount = (thing, counts: Map<string, number>) => {
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

const getName = (num: number, counts: Map<string, number>, replacementChars: string) => {
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

const prepareSubstitutions = ({ counts, substitutions, initialValues, replacementChars }: IPrepareSubsitutions) => {
  Array.from(counts)
    .filter((entry) => entry[1] > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach((entry, i) => {
      const name = getName(i, counts, replacementChars);
      substitutions.set(entry[0], name);
      initialValues.set(name, entry[0]);
    });
};

const walkAndSubstitute = (thing, substitutions: Map<string, string>) => {
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

const createDic = (values: [string, string][]) => {
  const out = {};
  for (let i = 0; i < values.length; i += 1) {
    // eslint-disable-next-line prefer-destructuring
    out[values[i][0]] = values[i][1];
  }
  return out;
};

export default (page: Page) => {
  let decompressCode = `<script>$ejs = function(_){return _t}</script>`;
  if (page.settings.props.compress) {
    page.perf.start('prepareProps');
    const counts = new Map();
    const substitutions = new Map();
    const initialValues = new Map();

    let initialPropLength = 0;
    let hydratedPropLength = 0;

    // count each one.
    let i = 0;
    for (; i < page.propsToHydrate.length; i += 1) {
      walkAndCount(page.propsToHydrate[i][1], counts);
      if (page.settings.debug.props) initialPropLength += JSON.stringify(page.propsToHydrate[i][1]).length;
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
        var gt = function (_) { return Object.prototype.toString.call(_).slice(8, -1);};
        var ejs = ${JSON.stringify(createDic(Array.from(initialValues)))};
         return function(_){
            if (ejs[_]) return ejs[_];
            if (Array.isArray(_)) return _.map((t) => $ejs(t));
            if (gt(_) === "Object") {
            return Object.keys(_).reduce(function (out, cv){
                var key = ejs[cv] || cv;
                out[key] = $ejs(_[cv]);
                return out;
              }, {});
            }
            return _;
        };
      }();
    </script>`;
    }

    if (page.settings.debug.props) hydratedPropLength += decompressCode.length;

    let ii = 0;
    for (; ii < page.propsToHydrate.length; ii += 1) {
      const substitution = JSON.stringify(walkAndSubstitute(page.propsToHydrate[ii][1], substitutions));
      if (page.settings.debug.props) hydratedPropLength += substitution.length;
      page.hydrateStack.push({
        source: page.propsToHydrate[ii][0],
        string: `<script>
      var ${page.propsToHydrate[ii][0]} = ${substitution};
      </script>`,
        priority: 100,
      });
    }

    if (page.settings.debug.props) {
      console.log('propCompression', {
        initialPropLength,
        hydratedPropLength,
        reduction: 1 - hydratedPropLength / initialPropLength,
      });
    }

    page.perf.end('prepareProps');
  } else {
    let dd = 0;
    for (; dd < page.propsToHydrate.length; dd += 1) {
      page.hydrateStack.push({
        source: page.propsToHydrate[dd][0],
        string: `<script>
        var ${page.propsToHydrate[dd][0]} = ${JSON.stringify(page.propsToHydrate[dd][1])};
        </script>`,
        priority: 100,
      });
    }
  }

  // always add decompress code even if it is just the basic return function.

  page.beforeHydrateStack.push({
    source: 'compressProps',
    string: decompressCode,
    priority: 100,
  });
};
