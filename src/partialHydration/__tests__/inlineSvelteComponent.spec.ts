import { inlinePreprocessedSvelteComponent, escapeHtml, inlineSvelteComponent } from '../inlineSvelteComponent';

test('#escapeHtml', () => {
  expect(escapeHtml('')).toEqual('');
  expect(escapeHtml(`<html>'Tom'&amp;"Jerry"</html>`)).toEqual(
    '&lt;html&gt;&#039;Tom&#039;&amp;amp;&quot;Jerry&quot;&lt;/html&gt;',
  );
});

test('#inlinePreprocessedSvelteComponent', () => {
  const options = 'loading=lazy';
  expect(
    inlinePreprocessedSvelteComponent({
      name: 'Home',
      props: {
        welcomeText: 'Hello World',
      },
      options,
    }),
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="Home" data-ejs-props={JSON.stringify([object Object])} data-ejs-options={JSON.stringify(${options})} />`,
  );
  expect(inlinePreprocessedSvelteComponent({})).toEqual(
    `<div class="ejs-component" data-ejs-component="" data-ejs-props={JSON.stringify([object Object])} data-ejs-options={JSON.stringify({"loading":"lazy"})} />`,
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
    `<div class="ejs-component" data-ejs-component="Home" data-ejs-props="{&quot;welcomeText&quot;:&quot;Hello World&quot;}" data-ejs-options="{&quot;loading&quot;:&quot;lazy&quot;}"></div>`,
  );
  expect(inlineSvelteComponent({})).toEqual(
    `<div class="ejs-component" data-ejs-component="" data-ejs-props="{}" data-ejs-options="{&quot;loading&quot;:&quot;lazy&quot;}"></div>`,
  );
});
