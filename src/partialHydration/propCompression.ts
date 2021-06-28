const reserved =
  /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;

export const isPrimitive = (thing: any) => Object(thing) !== thing;

export const getType = (thing: any) => Object.prototype.toString.call(thing).slice(8, -1);

const objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');

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

  switch (getType(thing)) {
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
