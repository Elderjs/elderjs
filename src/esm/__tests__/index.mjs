import { build } from '../../../build/esm/index.mjs';

if (typeof build !== 'function') {
  throw 'build not exported to esm';
}
console.info('esm tests passed');
