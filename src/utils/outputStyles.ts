import Page from './Page.js';
import notProduction from './notProduction.js';

export default function outputStyles(page: Page): string {
  let svelteCssStrings = '';
  if (notProduction() && page.request.type !== 'build') {
    svelteCssStrings = page.svelteCss.reduce((out, cv) => `${out}<style>${cv.css}${cv.cssMap}</style>`, '');
    return `<style>${page.cssString}</style>${svelteCssStrings}`;
  }
  svelteCssStrings = page.svelteCss.reduce((out, cv) => `${out}${cv.css}`, '');
  return `<style>${page.cssString}${svelteCssStrings}</style>`;
}
