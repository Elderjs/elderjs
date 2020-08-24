import type { StateSlug, RoutesOptions } from '../routes/types';
import type { HookOptions } from '../hookInterface/types';

export type ConfigOptions = {
  server: ServerOptions;
  build: BuildOptions;
  locations: LocationOptions;
  debug: DebugOptions;
  plugins?: any;
  hooks: {
    disable?: string[];
  };
  typescript: boolean;
  worker: boolean;
};

type ServerOptions = {
  prefix: string;
};

type BuildOptions = {
  numberOfWorkers: number;
  shuffleRequests: boolean;
};

type LocationOptions = {
  assets: string;
  public: string;
  svelte: SvelteOptions;
  systemJs: string;
  intersectionObserverPoly: string;
  srcFolder: string;
  buildFolder: string;
};

type SvelteOptions = {
  ssrComponents: string;
  clientComponents: string;
};

type DebugOptions = {
  stacks: boolean;
  hooks: boolean;
  performance: boolean;
  build: boolean;
  automagic: boolean;
};

export type SettingOptions = {
  server: boolean;
  build: boolean;
  $$internal: Internal;
};

type Internal = {
  hashedComponents: {};
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
export interface BuildResult {
  timings: Array<Timing[]>;
  errors: any[];
}

export interface Timing {
  name: string;
  duration: number;
}

export type Stack = Array<StackItem>;

export type StackItem = {
  source: string;
  string: string;
  priority: number;
};

export type PluginOptions = {
  name: string;
  description: string;
  init: Init | any;
  routes?: RoutesOptions;
  hooks: Array<HookOptions>;
  config?: Object;
};

interface Init {
  (input: any): any;
}

export type ExcludesFalse = <T>(x: T | false) => x is T;

export type HydrateOptions = {
  lazy: boolean;
  preload: boolean;
  rootMargin: string;
  threshold: number;
  inline: boolean;
};
