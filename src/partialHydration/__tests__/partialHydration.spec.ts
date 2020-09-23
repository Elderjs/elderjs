import partialHydration from '../partialHydration';

test('#partialHydration', async () => {
  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} />',
      })
    ).code,
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({"loading":"lazy"})} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }}/>',
      })
    ).code,
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({"loading":"lazy"})} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ loading: "eager" }} />',
      })
    ).code,
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({ loading: "eager" })} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content:
          '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ loading: "eager", rootMargin: "500px", threshold: 0 }} />',
      })
    ).code,
  ).toEqual(
    `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({ loading: "eager", rootMargin: "500px", threshold: 0 })} />`,
  );

  expect(
    (
      await partialHydration.markup({
        content: '<DatePicker hydrate-client="string />',
      })
    ).code,
  ).toEqual(`<DatePicker hydrate-client="string />`);

  await expect(async () => {
    await partialHydration.markup({
      content: `<Clock hydrate-client={{}}>Test</Clock>`,
    });
  }).rejects.toThrow();

  await expect(async () => {
    await partialHydration.markup({
      content: `<Map hydrate-client={{}} ></Map>`,
    });
  }).rejects.toThrow();

  await expect(async () => {
    await partialHydration.markup({
      content: `<Map hydrate-client={{}}></Map>`,
    });
  }).rejects.toThrow();

  await expect(async () => {
    await partialHydration.markup({
      content: `<Clock hydrate-client={{}} /><Clock hydrate-client={{}}>Test</Clock>`,
    });
  }).rejects.not.toContain('<Clock hydrate-client={{}} />');
});
