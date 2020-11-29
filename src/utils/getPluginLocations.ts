/* eslint-disable no-param-reassign */
import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import { SettingsOptions } from '..';

export default function getPluginLocations(elderConfig: SettingsOptions) {
  const pluginNames = Object.keys(elderConfig.plugins);

  return pluginNames.reduce(
    (out, pluginName) => {
      const pluginPath = path.resolve(elderConfig.srcDir, `./plugins/${pluginName}`);
      const nmPluginPath = path.resolve(elderConfig.rootDir, `./node_modules/${pluginName}`);

      if (fs.existsSync(`${pluginPath}/index.js`)) {
        const svelteFiles = glob.sync(`${pluginPath}/*.svelte`);
        if (svelteFiles.length > 0) {
          out.paths.push(`${pluginPath}/`);
          out.files = out.files.concat(svelteFiles);
        }
      } else if (fs.existsSync(`${nmPluginPath}/package.json`)) {
        const svelteFiles = glob.sync(`${nmPluginPath}/*.svelte`);
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
