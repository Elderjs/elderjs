function createReadOnlyProxy<T>(obj: T, objName: string, location: string): T {
  if (typeof obj !== 'object' && !Array.isArray(obj)) return obj;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /// @ts-ignore
  return new Proxy(obj, {
    set() {
      console.log(
        `Object ${objName} is not mutable from ${location}. Check the error below for the hook/plugin that is attempting to mutate properties outside of the rules in hookInterface.ts or in other restricted areas.`,
      );
      return false;
    },
  });
}

export default createReadOnlyProxy;
