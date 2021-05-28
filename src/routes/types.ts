import type { HookOptions } from '../hooks/types';

interface Permalink {
  (input?: Object): string;
}

export type StateSlug = {
  slug: string;
  id: Number;
};

type MetaOptions = {
  type: string;
  addedBy: string;
  pattern?: RegExp;
  routeString?: string;
  keys?: string[];
};

type RequestObject = {
  slug: string;
};

// TODO: cleanup to remove ElderGuide.com specific things.
export type RouteOptions = {
  template?: string;
  templateComponent?: (string) => Object;
  layout?: string;
  layoutComponent?: (string) => Object;
  data?: Object | (() => Object);
  permalink: Permalink;
  all?: [RequestObject] | ((Object) => [RequestObject] | Promise<any>);
  $$meta?: MetaOptions;
  name: string;
  hooks?: Array<HookOptions>;
  dynamic?: boolean;
};

export type RoutesOptions = {
  [name: string]: RouteOptions;
};
