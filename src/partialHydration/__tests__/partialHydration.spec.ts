import partialHydration, { partialHydrationClient } from '../partialHydration';

describe('#partialHydration', () => {
  it('replaces as expected', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options={JSON.stringify({\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"})} />"`,
    );
  });

  it('allow numbers in the tag name', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker2 hydrate-client={{ a: "b" }} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"DatePicker2\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options={JSON.stringify({\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"})} />"`,
    );
  });

  it('explicit lazy', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "c" }} hydrate-options={{ "loading": "lazy" }}/>',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"c\\" })} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"loading\\": \\"lazy\\" }})} />"`,
    );
  });

  it('explicit timeout', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "c" }} hydrate-options={{ "timeout": 2000 }}/>',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"c\\" })} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"timeout\\": 2000 }})} />"`,
    );
  });

  it('eager', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ "loading": "eager" }} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"loading\\": \\"eager\\" }})} />"`,
    );
  });
  it('eager, root margin, threshold', async () => {
    expect(
      (
        await partialHydration.markup({
          content:
            '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ "loading": "eager", "rootMargin": "500px", "threshold": 0 }} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"loading\\": \\"eager\\", \\"rootMargin\\": \\"500px\\", \\"threshold\\": 0 }})} />"`,
    );
  });
  it('open string', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client="string />',
        })
      ).code,
    ).toMatchInlineSnapshot(`"<DatePicker hydrate-client=\\"string />"`);
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
          content: `<Clock hydrate-client={{}} hydrate-options={{ "loading": "eager", "preload": true }} /><Block hydrate-client={{}} hydrate-options={{ "loading": "lazy" }} /><Alock hydrate-client={{}} hydrate-options={{ "loading": "lazy" }} />`,
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"Clock\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"loading\\": \\"eager\\", \\"preload\\": true }})} /><ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"Block\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"loading\\": \\"lazy\\" }})} /><ejswrapper class=\\"ejs-component\\" data-ejs-component=\\"Alock\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({...{\\"loading\\":\\"lazy\\",\\"element\\":\\"div\\"}, ...{ \\"loading\\": \\"lazy\\" }})} />"`,
    );
  });
});

describe('partialHydrationClient', () => {
  it('replaces as expected', async () => {
    expect(
      (
        await partialHydrationClient.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} />',
        })
      ).code,
    ).toMatchInlineSnapshot(`"<DatePicker {...{ a: \\"b\\" }}/>"`);
  });
});
