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
      `"<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options=\\"\\"><DatePicker {...({ a: \\"b\\" })}/></div>"`,
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
      `"{#if ({ \\"loading\\": \\"lazy\\" }).loading === 'none'}<DatePicker {...({ a: \\"c\\" })}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"c\\" })} data-ejs-options={JSON.stringify({ \\"loading\\": \\"lazy\\" })}><DatePicker {...({ a: \\"c\\" })}/></div>{/if}"`,
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
      `"{#if ({ \\"timeout\\": 2000 }).loading === 'none'}<DatePicker {...({ a: \\"c\\" })}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"c\\" })} data-ejs-options={JSON.stringify({ \\"timeout\\": 2000 })}><DatePicker {...({ a: \\"c\\" })}/></div>{/if}"`,
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
      `"{#if ({ \\"loading\\": \\"eager\\" }).loading === 'none'}<DatePicker {...({ a: \\"b\\" })}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options={JSON.stringify({ \\"loading\\": \\"eager\\" })}><DatePicker {...({ a: \\"b\\" })}/></div>{/if}"`,
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
      `"{#if ({ \\"loading\\": \\"eager\\", \\"rootMargin\\": \\"500px\\", \\"threshold\\": 0 }).loading === 'none'}<DatePicker {...({ a: \\"b\\" })}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props={JSON.stringify({ a: \\"b\\" })} data-ejs-options={JSON.stringify({ \\"loading\\": \\"eager\\", \\"rootMargin\\": \\"500px\\", \\"threshold\\": 0 })}><DatePicker {...({ a: \\"b\\" })}/></div>{/if}"`,
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
      `"{#if ({ \\"loading\\": \\"eager\\", \\"preload\\": true }).loading === 'none'}<Clock {...({})}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"Clock\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({ \\"loading\\": \\"eager\\", \\"preload\\": true })}><Clock {...({})}/></div>{/if}{#if ({ \\"loading\\": \\"lazy\\" }).loading === 'none'}<Block {...({})}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"Block\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({ \\"loading\\": \\"lazy\\" })}><Block {...({})}/></div>{/if}{#if ({ \\"loading\\": \\"lazy\\" }).loading === 'none'}<Alock {...({})}/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"Alock\\" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({ \\"loading\\": \\"lazy\\" })}><Alock {...({})}/></div>{/if}"`,
    );
  });

  it('options as identifier', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client hydrate-options={foo} />',
        })
      ).code,
    ).toMatchInlineSnapshot(
      `"{#if (foo).loading === 'none'}<DatePicker/>{:else}<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props=\\"\\" data-ejs-options={JSON.stringify(foo)}><DatePicker/></div>{/if}"`,
    );
  });

  it('ssr props', async () => {
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

  it('ssr props no name', async () => {
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

  it('ssr props spread', async () => {
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
      `"<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props=\\"\\" data-ejs-options=\\"\\" style:--foo=\\"bar\\"><DatePicker/></div>"`,
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
      `"<div class=\\"ejs-component\\" data-ejs-component=\\"DatePicker\\" data-ejs-props=\\"\\" data-ejs-options=\\"\\" style:--foo={bar}><DatePicker/></div>"`,
    );
  });
});
