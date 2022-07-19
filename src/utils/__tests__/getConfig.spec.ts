// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path';
import { describe, test, vi, expect, beforeEach } from 'vitest';

import getConfig, { getElderConfig } from '../../utils/getConfig.js';
import normalizeSnapshot from '../normalizeSnapshot.js';

const defaultConfig = {
  debug: { build: false, hooks: false, performance: false, shortcodes: false, stacks: false },
  distDir: 'public',
  srcDir: 'src',
  rootDir: process.cwd(),
  build: {
    numberOfWorkers: -1,
    shuffleRequests: false,
  },
  server: {
    prefix: '',
  },
  shortcodes: {
    closePattern: '}}',
    openPattern: '{{',
  },
  hooks: {
    disable: [],
  },
  origin: '',
  plugins: {},
};

vi.mock('../validations.ts', () => ({
  getDefaultConfig: () => defaultConfig,
}));

vi.mock('cosmiconfig', () => {
  return {
    cosmiconfigSync: () => ({
      search: () => ({ config: defaultConfig }),
    }),
  };
});

describe('#getConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('it accepts custom initialization options', () => {
    test('gives back a custom context such as serverless', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'serverless', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server without a prefix', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'server', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a server.prefix without leading or trailing "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'server', server: { prefix: 'testing' }, rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a server.prefix with a trailing "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'server', server: { prefix: 'testing/' }, rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a server.prefix with a leading "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'server', server: { prefix: '/testing' }, rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a server.prefix with a leading and trailing "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });
      const { $$internal, ...r } = await getConfig({
        context: 'server',
        server: { prefix: '/testing/' },
        rootDir: 't',
      });

      const { reloadHash, watcher, ...internal } = $$internal;

      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a prefix without a leading or trailing "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });
      const { $$internal, ...r } = await getConfig({ context: 'server', prefix: 'testing', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;

      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a prefix with a leading "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'server', prefix: '/testing', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a prefix with a trailing "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'server', prefix: '/testing/', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets a server with a prefix with a leading and trailing "/"', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });
      const { $$internal, ...r } = await getConfig({ context: 'server', prefix: '/testing/', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });

    test('sets build with default', async () => {
      vi.mock('fs-extra', () => {
        return {
          default: {
            readJSONSync: () => ({ version: '1.2.3' }),
            ensureDirSync: () => '',
            existsSync: () => true,
            readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
          },
        };
      });

      const { $$internal, ...r } = await getConfig({ context: 'build', rootDir: 't' });
      const { reloadHash, watcher, ...internal } = $$internal;
      expect(normalizeSnapshot(r)).toMatchSnapshot();
      expect(normalizeSnapshot(internal)).toMatchSnapshot();
    });
  });
});

describe('#getElderConfig', () => {
  test('elder.config **', async () => {
    const config = await getElderConfig(path.resolve('./src/utils/__tests__/fixtures/'));

    expect(config).toEqual({ json: true, cjs: true, mjs: true, js: true, ts: true });
  });
});
