import Page from './Page.js';
import { inlineSvelteComponent } from '../partialHydration/inlineSvelteComponent.js';
import prepareInlineShortcode from './prepareInlineShortcode.js';
import permalinks from './permalinks.js';
import EventEmitter from 'events';
import { WebSocketServer } from 'ws';
import { WSData } from '../core/getWebsocket.js';

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
}

export interface FindSvelteComponent {
  (name: any, folder: any): SvelteComponentFiles;
}

type Internal = {
  ssrComponents: string;
  clientComponents: string;
  distElder: string;
  logPrefix: string;
  serverPrefix: string;
  findComponent?: FindSvelteComponent;

  production: boolean;
  files: {
    client: string[];
    server: string[];
    routes: string[];
    hooks: string;
    all: string[];
    shortcodes: string;
    publicCssFile: string;
  };
  watcher: EventEmitter;
  websocket?: {
    wss: WebSocketServer;
    send: (data: WSData) => void;
  };

  status: 'bootstrapped' | 'errored' | 'bootstrapping';
};

export type DebugOptions = {
  stacks: boolean;
  hooks: boolean;
  performance: boolean;
  build: boolean;
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
  css?: 'inline' | 'lazy' | 'file';
};

export interface UserOptions {
  css: 'none' | 'file' | 'inline' | 'lazy';
  plugins?: {
    [key: string]: any;
  };
  props: PropOptions;
  hooks: {
    disable?: string[];
  };
  debug: DebugOptions;
  server: ServerOptions;
  build: BuildOptions;
  lang: string;
  prefix?: string;
  distDir: string;
  srcDir: string;
  rootDir: string;
  origin: string;
  shortcodes: {
    openPattern: string;
    closePattern: string;
  };
}

interface ISettingsOptionsBase extends UserOptions {
  version: string;

  prefix: string;

  $$internal: Internal;
  context?: string;
  worker?: boolean;
}

export interface SettingsOptions extends ISettingsOptionsBase {
  [x: string]: any;
}

export type QueryOptions = {
  db?: any;
} & { [x: string]: any };

export type ReqDetails = {
  path?: string;
  query?: any;
  search?: string;
};

export type RequestObject = {
  slug?: string;
  route: string;
  type: string;
  permalink?: string;
  req?: ReqDetails;
  source?: string;
} & {
  [x: string]: any | { [y: string]: any };
};

export type ServerLookupObject = {
  [name: string]: RequestObject;
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
  replacements?: Record<string, unknown>;
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

export type AllRequests = RequestObject[];
