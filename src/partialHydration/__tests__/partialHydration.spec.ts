import partialHydration from '../partialHydration';

test('#partialHydration', async () => {
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} />',
      })
    ).code,
  ).toEqual(`<div class="needs-hydration" data-component="DatePicker"  data-data={JSON.stringify({ a: "b" })} />`);
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client="string />',
      })
    ).code,
  ).toEqual(`<DatePicker hydrate-client="string />`);
});
