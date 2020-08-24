import partialHydration from '../partialHydration';

test('#partialHydration', async () => {
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} />',
      })
    ).code,
  ).toEqual(
    `<div class="needs-hydration" data-hydrate-component="DatePicker"  data-hydrate-props={JSON.stringify({ a: "b" })} data-hydrate-options="{ "loading": "lazy" }" />`,
  );
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client="string />',
      })
    ).code,
  ).toEqual(`<DatePicker hydrate-client="string />`);
});
