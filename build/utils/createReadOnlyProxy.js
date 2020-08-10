"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createReadOnlyProxy(obj, objName, location) {
    // proxies only work on objects/arrays.
    try {
        if (typeof obj !== 'object' && !Array.isArray(obj))
            return obj;
        return new Proxy(obj, {
            set() {
                console.log(`Object ${objName} is not mutable from ${location}. Check the error below for the hook/plugin that is attempting to mutate properties outside of the rules in hookInterface.ts or in other restricted areas.`);
                return false;
            },
        });
    }
    catch (e) {
        return obj;
    }
}
exports.default = createReadOnlyProxy;
