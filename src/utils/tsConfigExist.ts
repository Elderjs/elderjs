/* eslint-disable import/prefer-default-export */
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line consistent-return
export function tsConfigExist() {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  try {
    fs.statSync(tsConfigPath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
  }
}
