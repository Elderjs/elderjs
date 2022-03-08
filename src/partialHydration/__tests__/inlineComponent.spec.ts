import inlineComponent from '../inlineComponent';

test('#inlineComponent', () => {
  const options = {
    loading: 'lazy',
  };
  expect(
    inlineComponent({
      name: 'Home',
      props: {
        welcomeText: 'Hello World',
      },
      options,
    }),
  ).toMatchInlineSnapshot(
    `"<ejswrapper ejs-mount=\\"[&quot;Home&quot;,{&quot;welcomeText&quot;:&quot;Hello World&quot;},{&quot;loading&quot;:&quot;lazy&quot;}]\\"></ejswrapper>"`,
  );
  // FIXME: should it throw when name is null?
  expect(inlineComponent({})).toMatchInlineSnapshot(`"<ejswrapper ejs-mount=\\"[null,null,null]\\"></ejswrapper>"`);
});
