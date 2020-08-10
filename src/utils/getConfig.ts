import { cosmiconfigSync } from 'cosmiconfig';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import fs from 'fs';
import { ConfigOptions } from './types';
import { getDefaultConfig } from './validations';
import { tsConfigExist } from './tsConfigExist';

function getConfig(context?: string): ConfigOptions {
  const explorerSync = cosmiconfigSync('elder');
  const explorerSearch: any = explorerSync.search();
  if (!explorerSearch.config) console.error(`Unable to find your elder.this.settings.js file. Setting defaults.`);
  const { config: loadedConfig, filePath: configPath } = explorerSearch;

  const defaultConfig = getDefaultConfig();
  const config: ConfigOptions = defaultsDeep(loadedConfig, defaultConfig);

  if (config.debug.automagic && (!context || context !== 'build')) {
    console.log(
      `debug.automagic:: Your elder.config.js has debug.automagic = true. We call this chatty mode, but it is designed to show you the things we're doing automatically so you're aware. To turn it off set debug.automagic = 'false'`,
    );
  }

  if (!config.typescript) {
    config.typescript = tsConfigExist();
  }

  if (config.typescript) {
    if (config.locations.buildFolder === '') {
      try {
        const tsConfigLocation = path.resolve(process.cwd(), './tsconfig.json');
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigLocation, { encoding: 'utf-8' }));

        if (tsConfig.compilerOptions.outDir) {
          if (!tsConfig.compilerOptions.outDir.includes('/')) {
            config.locations.buildFolder = `./${tsConfig.compilerOptions.outDir}/`;
            if (config.debug.automagic && (!context || context !== 'build')) {
              console.log(
                `debug.automagic:: Automatically setting your location.buildFolder = "${config.locations.buildFolder} 'in your elder.config.js file as we detected it from your tsconfig.json`,
              );
            }
          } else if (config.debug.automagic && (!context || context !== 'build')) {
            console.log(
              `debug.automagic:: Unable to automatically set your build folder from your tsconfig. Please add it to your elder.config.js. We saw ${tsConfig.compilerOptions.outDir} and didn't know how to parse it as we're still typescript newbies. Want to help us? We'd love a PR to make this more robust.`,
            );
          }
        }
      } catch (e) {
        if (config.debug.automagic && (!context || context !== 'build')) {
          console.log(
            `debug.automagic:: Tried to read ./tsconfig.json to set srcDirectory in your elder.config.js file, but something went wrong. This often happens if there is a // in your file to comment out a setting. If you are using typescript and are building to a separate folder please define where your javascript files can be found  by defining 'locations.buildFolder'. Here is the error: `,
            e,
          );
        }
      }
    }
  }

  return config;
}

export { getConfig };
