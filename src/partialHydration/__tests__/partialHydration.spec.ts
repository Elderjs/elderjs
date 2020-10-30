import partialHydration from '../partialHydration';

describe('#partialHydration', () => {
  it('replaces as expected', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} />',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({"loading":"lazy"})} />`,
    );
  });

  it('explicit lazy', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "c" }} hydrate-options={{ loading: "lazy" }}/>',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "c" })} data-ejs-options={JSON.stringify({ loading: "lazy" })} />`,
    );
  });
  it('eager', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ loading: "eager" }} />',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({ loading: "eager" })} />`,
    );
  });
  it('eager, root margin, threshold', async () => {
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
  });
  it('open string', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client="string />',
        })
      ).code,
    ).toEqual(`<DatePicker hydrate-client="string />`);
  });
  it('text within component', async () => {
    await expect(async () => {
      await partialHydration.markup({
        content: `<Clock hydrate-client={{}}>Test</Clock>`,
      });
    }).rejects.toThrow();
  });
  it('open bracket after hydrate-client', async () => {
    await expect(async () => {
      await partialHydration.markup({
        content: `<Map hydrate-client={{}} ></Map>`,
      });
    }).rejects.toThrow();
  });
  it('non self closing', async () => {
    await expect(async () => {
      await partialHydration.markup({
        content: `<Map hydrate-client={{}}></Map>`,
      });
    }).rejects.toThrow();
  });
  it('wrapped poorly', async () => {
    await expect(async () => {
      await partialHydration.markup({
        content: `<Clock hydrate-client={{}} /><Clock hydrate-client={{}}>Test</Clock>`,
      });
    }).rejects.not.toContain('<Clock hydrate-client={{}} />');
  });

  it('replaces Ablock, Block, and Clock', async () => {
    expect(
      (
        await partialHydration.markup({
          content: `<Clock hydrate-client={{}} hydrate-options={{ loading: 'eager', preload: true }} /><Block hydrate-client={{}} hydrate-options={{ loading: 'lazy' }} /><Alock hydrate-client={{}} hydrate-options={{ loading: 'lazy' }} />`,
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="Clock" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({ loading: 'eager', preload: true })} /><div class="ejs-component" data-ejs-component="Block" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({ loading: 'lazy' })} /><div class="ejs-component" data-ejs-component="Alock" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({ loading: 'lazy' })} />`,
    );
  });
});
