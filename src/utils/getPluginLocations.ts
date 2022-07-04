import glob from 'fast-glob';
import { resolve } from 'path';
import fs from 'fs-extra';
import { SettingsOptions } from '../utils/types.js';

export default function getPluginLocations(elderConfig: Pick<SettingsOptions, 'srcDir' | 'plugins' | 'rootDir'>) {
  const pluginNames = Object.keys(elderConfig.plugins);

  return pluginNames.reduce(
    (out, pluginName) => {
      const pluginPath = resolve(elderConfig.srcDir, `./plugins/${pluginName}`);
      const nmPluginPath = resolve(elderConfig.rootDir, `./node_modules/${pluginName}`);

      if (fs.existsSync(`${pluginPath}/index.js`)) {
        const svelteFiles = glob.sync(`${pluginPath}/*/*.svelte`);

        if (svelteFiles.length > 0) {
          out.paths.push(`${pluginPath}/`);
          out.files = out.files.concat(svelteFiles);
        }
      } else if (fs.existsSync(`${nmPluginPath}/package.json`)) {
        const svelteFiles = glob.sync(`${nmPluginPath}/*/*.svelte`);

        if (svelteFiles.length > 0) {
          out.paths.push(`${nmPluginPath}/`);
          out.files = out.files.concat(svelteFiles);
        }
      }
      return out;
    },
    { paths: [], files: [] },
  );
}
