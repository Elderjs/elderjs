import { inlinePreprocessedSvelteComponent, inlineSvelteComponent } from '../inlineSvelteComponent';

test('#inlinePreprocessedSvelteComponent', () => {
  const options = '{"loading":"lazy"}';
  expect(
    inlinePreprocessedSvelteComponent({
      name: 'Home',
      props: {
        welcomeText: 'Hello World',
      },
      options,
    }),
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="Home" data-ejs-props={JSON.stringify([object Object])} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div"})} />`,
  );
  expect(inlinePreprocessedSvelteComponent({})).toEqual(
    `<div class="ejs-component" data-ejs-component="" data-ejs-props={JSON.stringify([object Object])} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div"})} />`,
  );
});

test('#inlineSvelteComponent', () => {
  const options = {
    loading: 'lazy',
  };
  expect(
    inlineSvelteComponent({
      name: 'Home',
      props: {
        welcomeText: 'Hello World',
      },
      options,
    }),
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="Home" data-ejs-props="{&quot;welcomeText&quot;:&quot;Hello World&quot;}" data-ejs-options="{&quot;loading&quot;:&quot;lazy&quot;,&quot;element&quot;:&quot;div&quot;}"></div>`,
  );
  expect(inlineSvelteComponent({})).toEqual(
    `<div class="ejs-component" data-ejs-component="" data-ejs-props="{}" data-ejs-options="{&quot;loading&quot;:&quot;lazy&quot;,&quot;element&quot;:&quot;div&quot;}"></div>`,
  );
});
