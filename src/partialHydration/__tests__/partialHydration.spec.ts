import partialHydration from '../partialHydration';

test('#partialHydration', async () => {
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} />',
      })
    ).code,
  ).toEqual(
    `<div class="needs-hydration" data-component="DatePicker"  data-hydrate={JSON.stringify({ a: "b" })} data-options="{ "lazy": true }" />`,
  );
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client="string />',
      })
    ).code,
  ).toEqual(`<DatePicker hydrate-client="string />`);
});
