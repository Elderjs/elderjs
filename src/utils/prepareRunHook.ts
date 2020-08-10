import createReadOnlyProxy from './createReadOnlyProxy';

// TODO: How do we get types to the user when they are writing plugins, etc?
function prepareRunHook({ hooks, allSupportedHooks, settings }) {
  return async function processHook(hookName, props: any = {}) {
    if (props.perf) props.perf.start(`hook.${hookName}`);

    // do we have a contract for the hook
    const hookDefinition = allSupportedHooks.find((h) => h.hook === hookName);
    if (!hookDefinition) {
      throw new Error(`Hook ${hookName} not defined in hookInterface or via plugins.`);
    }

    const customPropKeys = [];
    const hookProps = hookDefinition.props.reduce((out, cv) => {
      if (Object.hasOwnProperty.call(props, cv)) {
        if (!hookDefinition.mutable.includes(cv)) {
          out[cv] = createReadOnlyProxy(props[cv], cv, hookName);
        } else {
          out[cv] = props[cv];
        }
      } else if (typeof props.customProps === 'object' && props.customProps[cv]) {
        if (!hookDefinition.mutable.includes(cv)) {
          out[cv] = createReadOnlyProxy(props.customProps[cv], cv, hookName);
        } else {
          out[cv] = props.customProps[cv];
        }
        customPropKeys.push(cv);
      } else {
        console.error(
          `Hook named '${hookName}' cannot be run because prop ${cv} is not in scope to pass to the hook. Hook contract broken.`,
        );
      }

      return out;
    }, {});

    const theseHooks = hooks.filter((h) => h.hook === hookName);
    if (theseHooks && Array.isArray(theseHooks) && theseHooks.length > 0) {
      // lower priority is more important.
      const hookList = theseHooks.sort((a, b) => a.priority - b.priority);

      if (settings && settings.debug && settings.debug.hooks) {
        console.log(`Hooks registered on ${hookName}:`, hookList);
      }

      const hookOutput = {};

      // loop through the hooks, updating the output and the props in order
      for (const hook of hookList) {
        if (props.perf) props.perf.start(`hook.${hookName}.${hook.name}`);
        let hookResponse = await hook.run(hookProps);

        if (!hookResponse) hookResponse = {};

        if (settings && settings.debug && settings.debug.hooks) {
          console.log(`${hook.name} ran on ${hookName} and returned`, hookResponse);
        }

        Object.keys(hookResponse).forEach((key) => {
          if (hookDefinition.mutable && hookDefinition.mutable.includes(key)) {
            hookOutput[key] = hookResponse[key];
            hookProps[key] = hookResponse[key];
          } else {
            console.error(
              `Received attempted mutation on "${hookName}" from "${hook.name}" on the object "${key}". ${key} is not mutable on this hook `,
              hook.$$meta,
            );
          }
        });
        if (props.perf) props.perf.end(`hook.${hookName}.${hook.name}`);
      }

      // this actually mutates the props.
      if (
        Object.keys(hookOutput).length > 0 &&
        Array.isArray(hookDefinition.mutable) &&
        hookDefinition.mutable.length > 0
      ) {
        hookDefinition.mutable.forEach((key) => {
          if ({}.hasOwnProperty.call(hookOutput, key)) {
            if (customPropKeys.includes(key)) {
              props.customProps[key] = hookOutput[key];
            } else {
              props[key] = hookOutput[key];
            }
          }
        });
      }

      if (settings && settings.debug && settings.debug.hooks) console.log(`${hookName} finished`);

      if (props.perf) props.perf.end(`hook.${hookName}`);
      return hookOutput;
    }
    if (settings && settings.debug && settings.debug.hooks) {
      console.log(`${hookName} finished without executing any hooks`);
    }

    if (props.perf) props.perf.end(`hook.${hookName}`);
    return props;
  };
}

export default prepareRunHook;
