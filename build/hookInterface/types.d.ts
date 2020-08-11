export declare type Hook = 'customizeHooks' | 'bootstrap' | 'allRequests' | 'middleware' | 'modifyCustomProps' | 'request' | 'data' | 'stacks' | 'head' | 'html' | 'requestComplete' | 'error' | 'buildComplete';
export declare type HookInterface = {
    hook: Hook;
    props: Array<string>;
    mutable: Array<string>;
    use: string;
    location: string;
    context: string;
    experimental: boolean;
    advanced: boolean;
};
export declare type HookOptions = {
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
interface Run {
    (input: any): any | Promise<any>;
}
export {};
