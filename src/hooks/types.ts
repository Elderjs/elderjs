export type Hook =
  | 'customizeHooks'
  | 'bootstrap'
  | 'allRequests'
  | 'middleware'
  | 'request'
  | 'data'
  | 'shortcodes'
  | 'stacks'
  | 'head'
  | 'compileHtml'
  | 'html'
  | 'requestComplete'
  | 'error'
  | 'buildComplete';

export type HookInterface = {
  hook: Hook;
  props: Array<string>;
  mutable: Array<string>;
  use: string;
  location: string;
  context: string;
  experimental: boolean;
  advanced: boolean;
};

interface Run {
  (input: any): any | Promise<any>;
}
export type HookOptions = {
  hook: Hook;
  name: string;
  description: string;
  priority: Number;
  run: Run;
  $$meta?: {
    type: string;
    addedBy: string;
  };
};
