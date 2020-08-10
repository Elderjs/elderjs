"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asyncForEach_1 = __importDefault(require("../asyncForEach"));
test('#asyncForEach', () => {
    expect(asyncForEach_1.default([], jest.fn())).toEqual([]);
});
