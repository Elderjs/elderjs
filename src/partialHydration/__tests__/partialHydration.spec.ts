import partialHydration from '../partialHydration';

describe('#partialHydration', () => {
  it('replaces as expected', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",{ a: \\"b\\" },])}></ejswrapper>"`,
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
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",{ a: \\"c\\" },{ \\"loading\\": \\"lazy\\" }])}></ejswrapper>"`,
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
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",{ a: \\"c\\" },{ \\"timeout\\": 2000 }])}></ejswrapper>"`,
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
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",{ a: \\"b\\" },{ \\"loading\\": \\"eager\\" }])}></ejswrapper>"`,
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
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",{ a: \\"b\\" },{ \\"loading\\": \\"eager\\", \\"rootMargin\\": \\"500px\\", \\"threshold\\": 0 }])}></ejswrapper>"`,
    );
  });
  it('open string', async () => {
    await expect(async () => {
      await partialHydration.markup({
        content: '<DatePicker hydrate-client="string />',
      });
    }).rejects.toThrow();
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
      `"<ejswrapper ejs-mount={JSON.stringify([\\"Clock\\",{},{ \\"loading\\": \\"eager\\", \\"preload\\": true }])}></ejswrapper><ejswrapper ejs-mount={JSON.stringify([\\"Block\\",{},{ \\"loading\\": \\"lazy\\" }])}></ejswrapper><ejswrapper ejs-mount={JSON.stringify([\\"Alock\\",{},{ \\"loading\\": \\"lazy\\" }])}></ejswrapper>"`,
    );
  });

  it('options as identifier', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client hydrate-options={foo} />',
        })
      ).code,
    ).toMatchInlineSnapshot(`"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",,foo])}></ejswrapper>"`);
  });

  it.skip('ssr props', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client foo={bar} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props=\\"\\" data-ejs-options=\\"\\"><DatePicker foo={bar}/></div>"`,
    );
  });

  it.skip('ssr props expression in string', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client foo="123/{"bar"}/456" />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"{#if ({}).loading === 'none'}<DatePicker {...({})}    foo={bar}/>{#else}<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({})}><DatePicker    foo={bar}/></div>{/if}"`,
    );
  });

  it.skip('ssr props no name', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client {foo} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props=\\"\\" data-ejs-options=\\"\\"><DatePicker {foo}/></div>"`,
    );
  });

  it.skip('ssr props spread', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client {...foo} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props=\\"\\" data-ejs-options=\\"\\"><DatePicker {...foo}/></div>"`,
    );
  });

  it('style props', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client --foo="bar" />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",,])} style:--foo=\\"bar\\"></ejswrapper>"`,
    );
  });

  it('style props with expression', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client --foo={bar} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"<ejswrapper ejs-mount={JSON.stringify([\\"DatePicker\\",,])} style:--foo={bar}></ejswrapper>"`,
    );
  });
});
