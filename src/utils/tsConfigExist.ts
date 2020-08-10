import path from 'path';
import fs from 'fs';

// eslint-disable-next-line import/prefer-default-export
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
