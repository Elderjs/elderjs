import path from 'path';
import fs from 'fs';

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
