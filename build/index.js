"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
var validations_1 = require("./utils/validations");
Object.defineProperty(exports, "configSchema", { enumerable: true, get: function () { return validations_1.configSchema; } });
var Elder_1 = require("./Elder");
Object.defineProperty(exports, "Elder", { enumerable: true, get: function () { return Elder_1.Elder; } });
Object.defineProperty(exports, "getElderConfig", { enumerable: true, get: function () { return Elder_1.getElderConfig; } });
Object.defineProperty(exports, "build", { enumerable: true, get: function () { return Elder_1.build; } });
Object.defineProperty(exports, "partialHydration", { enumerable: true, get: function () { return Elder_1.partialHydration; } });
__exportStar(require("./utils/types"), exports);
__exportStar(require("./utils/index"), exports);
__exportStar(require("./routes/routes"), exports);
__exportStar(require("./hookInterface/types"), exports);
var hookInterface_1 = require("./hookInterface/hookInterface");
Object.defineProperty(exports, "hookInterface", { enumerable: true, get: function () { return hookInterface_1.hookInterface; } });
var hookEntityDefinitions_1 = require("./hookInterface/hookEntityDefinitions");
Object.defineProperty(exports, "hookEntityDefinitions", { enumerable: true, get: function () { return hookEntityDefinitions_1.hookEntityDefinitions; } });
