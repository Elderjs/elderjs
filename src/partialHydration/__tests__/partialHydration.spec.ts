import partialHydration from '../partialHydration';

test('#partialHydration', async () => {
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} />',
      })
    ).code,
  ).toEqual(
    `<div class="needs-hydration" data-hydrate-component="DatePicker" data-hydrate-props={JSON.stringify({ a: "b" })} data-hydrate-options={JSON.stringify({"loading":"lazy"})} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ loading: "eager" }} />',
      })
    ).code,
  ).toEqual(
    `<div class="needs-hydration" data-hydrate-component="DatePicker" data-hydrate-props={JSON.stringify({ a: "b" })} data-hydrate-options={JSON.stringify({ loading: "eager" })} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content:
          '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ loading: "eager", rootMargin: "500px", threshold: 0 }} />',
      })
    ).code,
  ).toEqual(
    `<div class="needs-hydration" data-hydrate-component="DatePicker" data-hydrate-props={JSON.stringify({ a: "b" })} data-hydrate-options={JSON.stringify({ loading: "eager", rootMargin: "500px", threshold: 0 })} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client="string />',
      })
    ).code,
  ).toEqual(`<DatePicker hydrate-client="string />`);
});
