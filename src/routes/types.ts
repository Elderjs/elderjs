// import { Interface } from 'readline';
import type { HookOptions } from '../hookInterface/types';

export type RouteOptions = {
  template?: string;
  templateComponent?: (string) => Object;
  layout?: string | ((string) => Object);
  data?: Object | (() => Object);
  permalink: Permalink | any;
  parent?: string;
  breadcrumbLabel?: string | (() => string);
  all?: [string] | ((Object) => [string] | Promise<any>);
  sitemap?: SiteMap;
  lastUpdate?: any;
  hooks?: Array<HookOptions>;
  criticalCssRequests?: Array<CriticalCssRequest>;
  $$meta?: MetaOptions;
};

export type RoutesOptions = {
  [name: string]: RouteOptions;
};

type CriticalCssRequest = {
  slug: string;
  random?: number;
  state?: StateSlug;
};

export type StateSlug = {
  slug: string;
  id: Number;
};

type SiteMap = {
  priority: number;
  changefreq: string;
};

type MetaOptions = {
  type: string;
  addedBy: string;
};

interface Permalink {
  (input?: Object): string;
}
