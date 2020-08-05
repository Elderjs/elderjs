"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Capitalizes the first letter in a string.
 *
 * @param {*} string
 * @returns
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.default = capitalizeFirstLetter;
