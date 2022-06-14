import glob from 'fast-glob';
import path from 'path';
import { SvelteComponentFiles } from '../utils/types.js';
import windowsPathFix from '../utils/windowsPathFix.js';

export const removeHash = (pathWithHash) => {
  const parsed = path.parse(pathWithHash);
  const parts = parsed.name.split('.');
  if (parts.length > 1) {
    const out = pathWithHash.replace(`.${parts.pop()}`, '');
    return out;
  }
  return pathWithHash;
};

// const relSrcDir = windowsPathFix(path.relative(rootDir, srcDir));
// const rootDirFixed = windowsPathFix(rootDir);
// const ssrComponents = glob.sync(`${ssrFolder}/**/*.js`).map(windowsPathFix);
// const clientComponents = glob
//   .sync(`${clientFolder}/**/*.js`)
//   .map((c) => windowsPathFix(`${path.sep}${path.relative(distDir, c)}`));

const prepareFindSvelteComponent = ({
  clientComponents,
  ssrComponents,
  rootDir,
  srcDir,
  production,
  distDir,
}: {
  clientComponents: string[];
  ssrComponents: string[];
  rootDir: string;
  srcDir: string;
  production: boolean;
  distDir: string;
}) => {
  const relSrcDir = windowsPathFix(path.relative(rootDir, srcDir));
  const rootDirFixed = windowsPathFix(rootDir);

  function relative(file: string | undefined): string {
    if (file) return `/${path.relative(distDir, file)}`;
    return '';
  }

  const cache = new Map();

  const findComponent = (name, folder): SvelteComponentFiles => {
    const nameFixed = windowsPathFix(name);

    let cacheKey;

    if (production) {
      cacheKey = JSON.stringify({ name, folder });
      if (cache.has(cacheKey)) return cache.get(cacheKey);
    }

    // abs path first
    if (nameFixed.includes(rootDirFixed)) {
      const rel = windowsPathFix(path.relative(path.join(rootDirFixed, relSrcDir), name))
        .replace('.svelte', '.js')
        .toLowerCase();

      const ssr = ssrComponents.find((c) => c.toLowerCase().includes(rel));
      const client = windowsPathFix(clientComponents.find((c) => removeHash(c).toLowerCase().endsWith(rel)));

      const out = { ssr, client: relative(client) };
      if (production) cache.set(cacheKey, out);
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

    const out = { ssr, client: relative(client) };
    if (production) cache.set(cacheKey, out);
    return out;
  };
  return findComponent;
};

export default prepareFindSvelteComponent;
