// import { Interface } from 'readline';
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
};

type SiteMap = {
  priority: number;
  changefreq: string;
};

type CriticalCssRequest = {
  slug: string;
  random?: number;
  state?: StateSlug;
};

type RequestObject = {
  slug: string;
};

export type RouteOptions = {
  template?: string;
  templateComponent?: (string) => Object;
  layout?: string;
  layoutComponent?: (string) => Object;
  data?: Object | (() => Object);
  permalink: Permalink | any;
  parent?: string;
  breadcrumbLabel?: string | (() => string);
  all?: [RequestObject] | ((Object) => [RequestObject] | Promise<any>);
  sitemap?: SiteMap;
  lastUpdate?: any;
  hooks?: Array<HookOptions>;
  criticalCssRequests?: Array<CriticalCssRequest>;
  $$meta?: MetaOptions;
};

export type RoutesOptions = {
  [name: string]: RouteOptions;
};
