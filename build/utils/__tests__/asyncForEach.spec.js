"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asyncForEach_1 = __importDefault(require("../asyncForEach"));
test('#asyncForEach', () => {
    const cb = (item, i, arr) => console.log(`${item}, ${i}, ${arr}`);
    asyncForEach_1.default(['one', 'two', 'three'], cb);
    // TODO: expect jest.fn to be called n times
    // expect(asyncForEach([], cb).toBe([]);
});
