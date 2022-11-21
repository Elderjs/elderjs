import svelteComponent from '../utils/svelteComponent';
import type { HydrateOptions } from '../utils/types';

export const replaceSpecialCharacters = (str) =>
  str
    .replace(/&quot;/gim, '"')
    .replace(/&lt;/gim, '<')
    .replace(/&gt;/gim, '>')
    .replace(/&#39;/gim, "'")
    .replace(/&#039;/gim, "'")
    .replace(/&amp;/gim, '&');

export default function mountComponentsInHtml({ page, html, isHydrated = false }): string {
  let outputHtml = html;
  // sometimes svelte adds a class to our inlining.
  const matches = outputHtml.matchAll(
    /<([^<>\s]+) class="ejs-component[^"]*?" data-ejs-component="([A-Za-z]+)" data-ejs-props="({[^"]*?})" data-ejs-options="({[^"]*?})"><\/\1>/gim,
  );

  for (const match of matches) {
    const hydrateComponentName = match[2];
    let hydrateComponentProps: any;
    let hydrateComponentOptions: HydrateOptions;

    try {
      hydrateComponentProps = JSON.parse(replaceSpecialCharacters(match[3]));
    } catch (e) {
      throw new Error(`Failed to JSON.parse props for ${hydrateComponentName} ${replaceSpecialCharacters(match[3])}`);
    }
    try {
      hydrateComponentOptions = JSON.parse(replaceSpecialCharacters(match[4]));
    } catch (e) {
      throw new Error(`Failed to JSON.parse props for ${hydrateComponentName} ${replaceSpecialCharacters(match[4])}`);
    }

    const hydratedHtml = svelteComponent(hydrateComponentName)({
      page,
      props: hydrateComponentProps,
      hydrateOptions: hydrateComponentOptions,
      isHydrated,
    });

    outputHtml = outputHtml.replace(match[0], hydratedHtml);
  }

  return outputHtml;
}
