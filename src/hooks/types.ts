export type HookOptions = {
  hook: string;
  name: string;
  description: string;
  priority: Number;
  run: Run;
  $$meta?: {
    type: string;
    addedBy: string;
  };
};

interface Run {
  (input: any): any | Promise<any>;
}
