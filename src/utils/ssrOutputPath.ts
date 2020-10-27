import path from 'path';

const ssrOutputPath = (str) => {
  let name = '';
  const split = str.split(path.sep);
  if (split[0] === 'src') split.shift();
  if (!str.includes('node_modules')) {
    if (!str.includes('plugins')) {
      name = [split.shift(), split.pop()].join(path.sep);
    } else {
      name = split.join(path.sep);
    }
  } else {
    const last = split.pop();
    name = ['plugins', split.pop(), last].join(path.sep);
  }

  return name;
};
export default ssrOutputPath;
