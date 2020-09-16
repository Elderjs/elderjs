import type { StateSlug, RoutesOptions } from '../routes/types';
import type { HookOptions } from '../hookInterface/types';

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

type DebugOptions = {
  stacks: boolean;
  hooks: boolean;
  performance: boolean;
  build: boolean;
  automagic: boolean;
};

type PathOptions = {
  // assets: string;
  // public: string;
  // svelte: SvelteOptions;
  // systemJs: string;
  // intersectionObserverPoly: string;
  // srcFolder: string;
  // buildFolder: string;

  ssrComponents: string;
  clientComponents: string;
  distDir: string;
  srcDir: string;
  rootDir: string;
};

export type ConfigOptions = {
  distDir: string;
  srcDir: string;
  rootDir: string;

  server: ServerOptions;
  build: BuildOptions;
  paths: PathOptions;
  debug: DebugOptions;
  plugins?: any;
  hooks: {
    disable?: string[];
  };
  // typescript: boolean;
  worker: boolean;
  shortcodes: {
    openPattern: string;
    closePattern: string;
  };
};

type Internal = {
  hashedComponents: {};
};

export type SettingOptions = {
  server: boolean;
  build: boolean;
  $$internal: Internal;
};

export type QueryOptions = {
  db?: any;
};

export type ExternalHelperRequestOptions = {
  helpers: [];
  query: QueryOptions;
  settings: ConfigOptions & SettingOptions;
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

export interface ShortcodeDef {
  shortcode: string;
  run: (any) => ShortcodeResponse | Promise<ShortcodeResponse>;
  plugin?: any; // reference to the plugin closure scope.
  $$meta: {
    addedBy: string;
    type: string;
  };
}

export interface ShortcodeResponse {
  html?: string;
  css?: string;
  js?: string;
  head?: string;
}

export type ShortcodeDefs = Array<ShortcodeDef>;
