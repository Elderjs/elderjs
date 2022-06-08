import type { RoutesObject } from '../routes/types';
import type { THooksArray } from '../hooks/types';
import type { ShortcodeDefs } from '../shortcodes/types';
import Page from './Page';
import { inlineSvelteComponent } from '../partialHydration/inlineSvelteComponent';
import prepareInlineShortcode from './prepareInlineShortcode';
import permalinks from './permalinks';

export type ServerOptions = {
  prefix: string;
  cacheRequests?: boolean;
  dataRoutes?: boolean | string;
  allRequestsRoute?: boolean | string;
};

type BuildOptions = {
  numberOfWorkers: number;
  shuffleRequests: boolean;
};

// type SvelteOptions = {
//   ssrComponents: string;
//   clientComponents: string;
// };

export interface SvelteComponentFiles {
  ssr: string | undefined;
  client: string | undefined;
  iife: string | undefined;
}

export interface FindSvelteComponent {
  (name: any, folder: any): SvelteComponentFiles;
}

type Internal = {
  hashedComponents?: {};
  ssrComponents: string;
  clientComponents: string;
  distElder: string;
  logPrefix: string;
  serverPrefix: string;
  findComponent: FindSvelteComponent;
  publicCssFile?: string;
};

type DebugOptions = {
  stacks: boolean;
  hooks: boolean;
  performance: boolean;
  build: boolean;
  automagic: boolean;
  shortcodes: boolean;
  props: boolean;
};

type PropOptions = {
  compress: boolean;
  replacementChars: string;
  hydration: 'html' | 'hybrid' | 'file';
};

export type InitializationOptions = {
  distDir?: string;
  srcDir?: string;
  rootDir?: string;
  origin?: string;
  prefix?: string;
  lang?: string;
  server?: ServerOptions;
  build?: BuildOptions;
  debug?: DebugOptions;
  plugins?: any;
  props?: PropOptions;
  hooks?: {
    disable?: string[];
  };
  shortcodes?: {
    openPattern?: string;
    closePattern?: string;
  };
  context?: string;
  worker?: boolean;
};

interface ISettingsOptionsBase {
  version: string;
  prefix: string;
  distDir: string;
  srcDir: string;
  rootDir: string;
  origin: string;
  lang: string;
  server: ServerOptions | false;
  build: BuildOptions | false;
  debug: DebugOptions;
  plugins?: any;
  props: PropOptions;
  hooks: {
    disable?: string[];
  };
  shortcodes: {
    openPattern: string;
    closePattern: string;
  };
  $$internal: Internal;
  context?: string;
  worker?: boolean;
  css: 'none' | 'file' | 'inline' | 'lazy';
}

export interface SettingsOptions extends ISettingsOptionsBase {
  [x: string]: unknown;
}

export type QueryOptions = {
  db?: any;
} & { [x: string]: unknown };

export type ReqDetails = {
  path?: string;
  query?: any;
  search?: string;
};

export type TRequestObject = {
  slug?: string;
  route: string;
  type: string;
  permalink: string;
  req?: ReqDetails;
} & {
  [x: string]: any | { [y: string]: any };
};

export type TServerLookupObject = {
  [name: string]: TRequestObject;
};

export interface Timing {
  name: string;
  duration: number;
}

export interface BuildResult {
  timings: Array<Timing[]>;
  errors: any[];
}

export type StackItem = {
  source: string;
  string: string;
  priority?: number;
};

export type Stack = Array<StackItem>;

interface Init {
  (input: any): any;
}

export type PluginOptions = {
  name: string;
  description: string;
  init: Init | any;
  routes?: RoutesObject;
  hooks: THooksArray;
  config?: Object;
  shortcodes?: ShortcodeDefs;
  minimumElderjsVersion?: string;
};

// eslint-disable-next-line no-undef
export type ExcludesFalse = <T>(x: T | false) => x is T;

export type HydrateOptions = {
  loading?: 'lazy' | 'eager' | 'none';
  preload?: boolean;
  noPrefetch?: boolean;
  threshold?: number;
  rootMargin?: string;
  element?: string;
};

export interface ComponentPayload {
  page: Page;
  props: any;
  hydrateOptions?: HydrateOptions;
}

export interface RollupDevOptions {
  splitComponents: boolean;
}

export interface RollupSettings {
  svelteConfig?: any;
  replacements?: Object;
  dev?: RollupDevOptions;
}

export type THelpers = {
  permalinks: ReturnType<typeof permalinks>;
  inlineSvelteComponent: typeof inlineSvelteComponent;
  shortcode: ReturnType<typeof prepareInlineShortcode>;
};

export type TUserHelpers = THelpers & {
  [x: string]: any | { [y: string]: any };
};

export type TErrors = (any | Error)[];
