import glob from 'glob';
import path from 'path';
import { SvelteComponentFiles } from '../utils/types';
import windowsPathFix from '../utils/windowsPathFix';

export const removeHash = (pathWithHash) => {
  const parsed = path.parse(pathWithHash);
  const parts = parsed.name.split('.');
  if (parts.length > 1) {
    const out = pathWithHash.replace(`.${parts.pop()}`, '');
    return out;
  }
  return pathWithHash;
};

const prepareFindSvelteComponent = ({ ssrFolder, rootDir, srcDir, clientComponents: clientFolder, distDir }) => {
  const rootDirFixed = windowsPathFix(rootDir);
  const ssrComponents = glob.sync(`${ssrFolder}/**/*.js`).map(windowsPathFix);
  const clientComponents = glob
    .sync(`${clientFolder}/**/*.js`)
    .map((c) => windowsPathFix(`${path.sep}${path.relative(distDir, c)}`));

  const cache = new Map();

  const findComponent = (name, folder): SvelteComponentFiles => {
    const nameFixed = windowsPathFix(name);
    const cacheKey = JSON.stringify({ name, folder });
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    // abs path first
    if (nameFixed.includes(rootDirFixed)) {
      const rel = windowsPathFix(path.relative(path.join(rootDirFixed, srcDir.replace(rootDir, '')), name))
        .replace('.svelte', '.js')
        .toLowerCase();
      const parsed = path.parse(rel);
      const ssr = ssrComponents.find((c) => c.toLowerCase().endsWith(rel));
      const client = windowsPathFix(clientComponents.find((c) => removeHash(c).toLowerCase().endsWith(rel)));
      const iife = windowsPathFix(
        clientComponents
          .filter((c) => c.includes('iife'))
          .find((c) => removeHash(c).toLowerCase().endsWith(parsed.base)),
      );

      const out = { ssr, client, iife };
      cache.set(cacheKey, out);
      return out;
    }

    // component name and folder only
    const ssr = ssrComponents
      .filter((c) => c.includes(folder))
      .find((c) => path.parse(c).name.toLowerCase() === name.replace('.svelte', '').toLowerCase());
    const client = windowsPathFix(
      clientComponents
        .filter((c) => c.includes(folder))
        .find((c) => path.parse(removeHash(c)).name.toLowerCase() === name.replace('.svelte', '').toLowerCase()),
    );

    const iife = windowsPathFix(
      clientComponents
        .filter((c) => c.includes('iife'))
        .find((c) => removeHash(c.toLowerCase()).endsWith(`${name.toLowerCase().replace('.svelte', '')}.js`)),
    );

    const out = { ssr, client, iife };
    cache.set(cacheKey, out);
    return out;
  };
  return findComponent;
};

export default prepareFindSvelteComponent;
