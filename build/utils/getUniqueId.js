"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generate_1 = __importDefault(require("nanoid/non-secure/generate"));
/**
 * Used to generate a 10 digit unique ID
 *
 * @returns {String}
 */
const getUniqueId = () => {
    return generate_1.default('bcdfgjklmnpqrstvwxyzVCDFGJKLMNQRSTVWXYZ', 10);
};
exports.default = getUniqueId;
