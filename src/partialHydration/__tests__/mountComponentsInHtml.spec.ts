const page = {
  settings: {
    distDir: 'test',
    $$internal: {
      ssrComponents: {},
      hashedComponents: {},
    },
  },
};

describe('#mountComponentsInHtml', () => {
  let hydrated = [];
  const mockHydrate = (name) => ({ props, hydrateOptions }) =>
    hydrated.push(`${JSON.stringify({ name, props, hydrateOptions })}`);

  jest.mock('../../utils/svelteComponent.ts', () => mockHydrate);
  beforeAll(() => {});

  it('#replaceSpecialCharacters', () => {
    // eslint-disable-next-line global-require
    const { replaceSpecialCharacters } = require('../mountComponentsInHtml');
    expect(replaceSpecialCharacters('{&quot;nh_count&quot;:15966,&quot;classes&quot;:&quot;mt-3&quot;}')).toEqual(
      '{"nh_count":15966,"classes":"mt-3"}',
    );
    expect(replaceSpecialCharacters('&quot;&lt;&gt;&#39;&quot;\\n\\\\n\\"&amp;')).toEqual('"<>\'"\\n\\n"&');
    expect(replaceSpecialCharacters('abcd 1234 <&""&>')).toEqual('abcd 1234 <&""&>');
  });

  it('mounts a single component in HTML correctly', () => {
    hydrated = [];
    // eslint-disable-next-line global-require
    const mountComponentsInHtml = require('../mountComponentsInHtml');

    mountComponentsInHtml.default({
      page,
      html: `<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Datepicker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div></div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual(['{"name":"Datepicker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}']);
  });

  it('mounts multiple components within the same html correctly', () => {
    hydrated = [];
    // eslint-disable-next-line global-require
    const mountComponentsInHtml = require('../mountComponentsInHtml');

    mountComponentsInHtml.default({
      page,
      html: `<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Picker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div><div class="ejs-component" data-ejs-component="Picker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "eager" }"></div></div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual([
      '{"name":"Picker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}',
      '{"name":"Picker","props":{"a":"b"},"hydrateOptions":{"loading":"eager"}}',
    ]);
  });

  it('mounts 3 components within the same html correctly', () => {
    hydrated = [];
    // eslint-disable-next-line global-require
    const mountComponentsInHtml = require('../mountComponentsInHtml');

    mountComponentsInHtml.default({
      page,
      html: `<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Sicker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div><div class="ejs-component" data-ejs-component="Picker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "eager" }"></div><div class="ejs-component" data-ejs-component="Ricker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual([
      '{"name":"Sicker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}',
      '{"name":"Picker","props":{"a":"b"},"hydrateOptions":{"loading":"eager"}}',
      '{"name":"Ricker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}',
    ]);
  });

  it('Extracts from Alock, Block, Clock', () => {
    hydrated = [];
    // eslint-disable-next-line global-require
    const mountComponentsInHtml = require('../mountComponentsInHtml');

    mountComponentsInHtml.default({
      page,
      html: `<div class="problem">
      <div class="ejs-component" data-ejs-component="Clock" data-ejs-props="{}" data-ejs-options="{&quot;loading&quot;:&quot;eager&quot;,&quot;preload&quot;:true}"></div>
      <div class="ejs-component" data-ejs-component="Block" data-ejs-props="{}" data-ejs-options="{&quot;loading&quot;:&quot;lazy&quot;}"></div>
      <div class="ejs-component" data-ejs-component="Alock" data-ejs-props="{}" data-ejs-options="{&quot;loading&quot;:&quot;lazy&quot;}"></div>
      </div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual([
      '{"name":"Clock","props":{},"hydrateOptions":{"loading":"eager","preload":true}}',
      '{"name":"Block","props":{},"hydrateOptions":{"loading":"lazy"}}',
      '{"name":"Alock","props":{},"hydrateOptions":{"loading":"lazy"}}',
    ]);
  });
});
