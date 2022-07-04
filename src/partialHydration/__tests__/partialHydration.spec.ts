import partialHydration from '../partialHydration.js';
import { describe, it, expect } from 'vitest';

describe('#partialHydration', () => {
  it('replaces as expected', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} />',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div"})} />`,
    );
  });

  it('explicit lazy', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "c" }} hydrate-options={{ "loading": "lazy" }}/>',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "c" })} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div"})} />`,
    );
  });

  it('explicit timeout', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "c" }} hydrate-options={{ "timeout": 2000 }}/>',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "c" })} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div","timeout":2000})} />`,
    );
  });

  it('eager', async () => {
    expect(
      (
        await partialHydration.markup({
          content: '<DatePicker hydrate-client={{ a: "b" }} hydrate-options={{ "loading": "eager" }} />',
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({"loading":"eager","element":"div"})} />`,
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
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="DatePicker" data-ejs-props={JSON.stringify({ a: "b" })} data-ejs-options={JSON.stringify({"loading":"eager","element":"div","rootMargin":"500px","threshold":0})} />`,
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
    try {
      await partialHydration.markup({
        content: `<Clock hydrate-client={{}} /><Clock hydrate-client={{}}>Test</Clock>`,
      });
    } catch (e) {
      expect(e.message).toBe(
        `Elder.js only supports self-closing syntax on hydrated components. This means <Foo /> not <Foo></Foo> or <Foo>Something</Foo>. Offending component: <Clock hydrate-client={{}}>Test</Clock>. Slots and child components aren't supported during hydration as it would result in huge HTML payloads. If you need this functionality try wrapping the offending component in a parent component without slots or child components and hydrate the parent component.`,
      );
    }
  });

  it('replaces Ablock, Block, and Clock', async () => {
    expect(
      (
        await partialHydration.markup({
          content: `<Clock hydrate-client={{}} hydrate-options={{ "loading": "eager", "preload": true }} /><Block hydrate-client={{}} hydrate-options={{ "loading": "lazy" }} /><Alock hydrate-client={{}} hydrate-options={{ "loading": "lazy" }} />`,
        })
      ).code,
    ).toEqual(
      `<div class="ejs-component" data-ejs-component="Clock" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({"loading":"eager","element":"div","preload":true})} /><div class="ejs-component" data-ejs-component="Block" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div"})} /><div class="ejs-component" data-ejs-component="Alock" data-ejs-props={JSON.stringify({})} data-ejs-options={JSON.stringify({"loading":"lazy","element":"div"})} />`,
    );
  });
});
