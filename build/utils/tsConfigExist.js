"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsConfigExist = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function tsConfigExist() {
    const tsConfigPath = path_1.default.join(process.cwd(), 'tsconfig.json');
    try {
        fs_1.default.statSync(tsConfigPath);
        return true;
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        }
    }
}
exports.tsConfigExist = tsConfigExist;
