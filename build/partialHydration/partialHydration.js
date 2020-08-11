"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const partialHydration = {
    markup: async ({ content /* , filename */ }) => {
        // there are limitations to this regex. Like you can't have an object {key:{key:val}} as a prop.
        const matches = content.matchAll(/<([a-zA-Z]+)\s+hydrate-client={([^]*?})}/gim);
        matches.forEach((match) => {
            const componentName = match[1];
            const dataObject = match[2];
            const replacement = `<div class="needs-hydration" data-component="${componentName}"  data-data={JSON.stringify(${dataObject})}`;
            content = content.replace(match[0], replacement);
        });
        return { code: content };
    },
};
exports.default = partialHydration;
