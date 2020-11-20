import glob from 'glob';
import path from 'path';
import { SvelteComponentFiles } from '../utils/types';

const windowsPathFix = (filePath: string | undefined): string | undefined => {
  if (typeof filePath === 'string') {
    return filePath.replace(/\\/gm, '/');
  }
  return undefined;
};

export const removeHash = (pathWithHash) => {
  const parsed = path.parse(pathWithHash);
  const parts = parsed.name.split('.');
  if (parts.length > 1) {
    const out = pathWithHash.replace(`.${parts.pop()}`, '');
    return out;
  }
  return pathWithHash;
};

const prepareFindSvelteComponent = ({ ssrFolder, rootDir, clientFolder, distDir }) => {
  const ssrComponents = glob.sync(`${ssrFolder}/**/*.js`);
  const clientComponents = glob.sync(`${clientFolder}/**/*.js`).map((c) => `/${path.relative(distDir, c)}`);

  const cache = new Map();

  const findComponent = (name, folder): SvelteComponentFiles => {
    const cacheKey = JSON.stringify({ name, folder });
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    // abs path first
    if (name.includes(rootDir)) {
      const rel = path.relative(path.resolve(rootDir, './src'), name).replace('.svelte', '.js');
      const parsed = path.parse(rel);
      const ssr = ssrComponents.find((c) => c.endsWith(rel));
      const client = windowsPathFix(clientComponents.find((c) => removeHash(c).endsWith(rel)));
      const iife = windowsPathFix(
        clientComponents.filter((c) => c.includes('iife')).find((c) => removeHash(c).endsWith(parsed.base)),
      );

      const out = { ssr, client, iife };
      cache.set(cacheKey, out);
      return out;
    }

    // component name and folder only
    const ssr = ssrComponents
      .filter((c) => c.includes(folder))
      .find((c) => path.parse(c).name === name.replace('.svelte', ''));
    const client = windowsPathFix(
      clientComponents
        .filter((c) => c.includes(folder))
        .find((c) => path.parse(removeHash(c)).name === name.replace('.svelte', '')),
    );

    const iife = windowsPathFix(
      clientComponents.filter((c) => c.includes('iife')).find((c) => removeHash(c).endsWith(`${name}.js`)),
    );

    const out = { ssr, client, iife };
    cache.set(cacheKey, out);
    return out;
  };
  return findComponent;
};

export default prepareFindSvelteComponent;
