export interface ShortcodeResponse {
  html?: string;
  css?: string;
  js?: string;
  head?: string;
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

export type ShortcodeDefs = Array<ShortcodeDef>;
