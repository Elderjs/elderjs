import { inlinePreprocessedSvelteComponent, escapeHtml, inlineSvelteComponent } from '../inlineSvelteComponent';

test('#escapeHtml', () => {
  expect(escapeHtml('')).toEqual('');
  expect(escapeHtml(`<html>'Tom'&amp;"Jerry"</html>`)).toEqual(
    '&lt;html&gt;&#039;Tom&#039;&amp;amp;&quot;Jerry&quot;&lt;/html&gt;',
  );
});

test('#inlinePreprocessedSvelteComponent', () => {
  const options = '{"loading":"lazy"}';
  expect(
    inlinePreprocessedSvelteComponent({
      name: 'Home',
      props: '{welcomeText: "Hello World"}',
      options,
    }),
  ).toMatchInlineSnapshot(
    `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"Home\\" data-ejs-props={JSON.stringify({welcomeText: \\"Hello World\\"})} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{\\"loading\\":\\"lazy\\"}})} />"`,
  );
  expect(inlinePreprocessedSvelteComponent({})).toMatchInlineSnapshot(
    `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"\\" data-ejs-props={JSON.stringify()} data-ejs-options={JSON.stringify({\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"})} />"`,
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
  ).toMatchInlineSnapshot(
    `"<div class=\\"ejs-component\\" data-ejs-component=\\"Home\\" data-ejs-props=\\"{&quot;welcomeText&quot;:&quot;Hello World&quot;}\\" data-ejs-options=\\"{&quot;loading&quot;:&quot;lazy&quot;,&quot;element&quot;:&quot;div&quot;}\\"></div>"`,
  );
  expect(inlineSvelteComponent({})).toMatchInlineSnapshot(
    `"<div class=\\"ejs-component\\" data-ejs-component=\\"\\" data-ejs-props=\\"{}\\" data-ejs-options=\\"{&quot;loading&quot;:&quot;lazy&quot;,&quot;element&quot;:&quot;div&quot;}\\"></div>"`,
  );
});
