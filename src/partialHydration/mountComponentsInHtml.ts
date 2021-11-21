import svelteComponent from '../utils/svelteComponent';

export const replaceSpecialCharacters = (str) =>
  str
    .replace(/\\\\n/gim, '\\n')
    .replace(/&quot;/gim, '"')
    .replace(/&lt;/gim, '<')
    .replace(/&gt;/gim, '>')
    .replace(/&#39;/gim, "'")
    .replace(/\\"/gim, '"')
    .replace(/&amp;/gim, '&');

export default function mountComponentsInHtml({ page, html, hydrateOptions }): string {
  let outputHtml = html;
  // sometimes svelte adds a class to our inlining.
  const matches = outputHtml.matchAll(
    /<(\S+) class="ejs-component[^]*?" data-ejs-component="([A-Za-z]+)" data-ejs-props="({[^]*?})" data-ejs-options="({[^]*?})"><\/\1>/gim,
  );

  for (const match of matches) {
    const hydrateComponentName = match[2];
    let hydrateComponentProps;
    let hydrateComponentOptions;

    try {
      hydrateComponentProps = JSON.parse(replaceSpecialCharacters(match[3]));
    } catch (e) {
      throw new Error(`Failed to JSON.parse props for ${hydrateComponentName} ${match[3]}`);
    }
    try {
      hydrateComponentOptions = JSON.parse(replaceSpecialCharacters(match[4]));
    } catch (e) {
      throw new Error(`Failed to JSON.parse props for ${hydrateComponentName} ${match[4]}`);
    }

    if (hydrateOptions) {
      throw new Error(
        `Client side hydrated component is attempting to hydrate another sub component "${hydrateComponentName}." This isn't supported. \n
             Debug: ${JSON.stringify({
               hydrateOptions,
               hydrateComponentName,
               hydrateComponentProps,
               hydrateComponentOptions,
             })}
            `,
      );
    }

    const hydratedHtml = svelteComponent(hydrateComponentName)({
      page,
      props: hydrateComponentProps,
      hydrateOptions: hydrateComponentOptions,
    });

    outputHtml = outputHtml.replace(match[1], hydratedHtml);
  }

  return outputHtml;
}
