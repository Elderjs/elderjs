import type { StateSlug, RoutesOptions } from '../routes/types';
import type { HookOptions } from '../hooks/types';
import type { ShortcodeDefs } from '../shortcodes/types';

type ServerOptions = {
  prefix: string;
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

export type SettingsOptions = {
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
  legacy: boolean;
  css: 'none' | 'file' | 'inline' | 'lazy';
};

export type QueryOptions = {
  db?: any;
};

export type ExternalHelperRequestOptions = {
  helpers: [];
  query: QueryOptions;
  settings: SettingsOptions;
};

export type RequestOptions = {
  slug: string;
  random: number;
  state: StateSlug;
  uid: string;
  route: string;
  type: string;
  permalink: string;
};

export type RequestsOptions = {
  [name: string]: RequestOptions;
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
  priority: number;
};

export type Stack = Array<StackItem>;

interface Init {
  (input: any): any;
}

export type PluginOptions = {
  name: string;
  description: string;
  init: Init | any;
  routes?: RoutesOptions;
  hooks: Array<HookOptions>;
  config?: Object;
  shortcodes?: ShortcodeDefs;
};

// eslint-disable-next-line no-undef
export type ExcludesFalse = <T>(x: T | false) => x is T;

export type HydrateOptions = {
  loading: string;
  preload: boolean;
  rootMargin: string;
  threshold: number;
};

export interface ComponentPayload {
  page: any;
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
