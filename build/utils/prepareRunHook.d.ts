declare function prepareRunHook({ hooks, allSupportedHooks, settings }: {
    hooks: any;
    allSupportedHooks: any;
    settings: any;
}): (hookName: any, props?: any) => Promise<any>;
export default prepareRunHook;
