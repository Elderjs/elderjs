import mountComponentsInHtml, { replaceSpecialCharacters } from '../mountComponentsInHtml.js';
import { escapeHtml } from '../inlineSvelteComponent';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

let hydrated = [];

vi.mock('../../utils/svelteComponent.ts', () => ({
  default:
    (name) =>
    ({ props, hydrateOptions }) =>
      hydrated.push(`${JSON.stringify({ name, props, hydrateOptions })}`),
}));

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
  hydrated = [];
  vi.mock('../../utils/svelteComponent.ts', () => ({
    default:
      (name) =>
      ({ props, hydrateOptions }) =>
        hydrated.push(`${JSON.stringify({ name, props, hydrateOptions })}`),
  }));
});

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
  it('#replaceSpecialCharacters', () => {
    // eslint-disable-next-line global-require
    expect(replaceSpecialCharacters('{&quot;nh_count&quot;:15966,&quot;classes&quot;:&quot;mt-3&quot;}')).toEqual(
      '{"nh_count":15966,"classes":"mt-3"}',
    );
    expect(replaceSpecialCharacters('&quot;&lt;&gt;&#39;&quot;\\n\\\\n\\"&amp;')).toEqual('"<>\'"\\n\\\\n\\"&');
    expect(replaceSpecialCharacters('abcd 1234 <&""&>')).toEqual('abcd 1234 <&""&>');
  });

  it('#replaceSpecialCharacters and escapeHtml should return same result', () => {
    // eslint-disable-next-line global-require
    // eslint-disable-next-line global-require

    const start = '{"prop":"This is a string with \\"escaped\\" quotes"}';
    const escaped = escapeHtml(start);
    const replaced = replaceSpecialCharacters(escaped);
    expect(start).toEqual(replaced);
  });

  it('#replaceSpecialCharacters and escapeHtml should return same result. #245', () => {
    // eslint-disable-next-line global-require
    // eslint-disable-next-line global-require

    const naughtyObjsOrStrings = [
      {
        type: 'auditAdvisory',
        data: {
          resolution: { id: 566, path: 'hoek', dev: false, optional: false, bundled: false },
          advisory: {
            findings: [{ version: '2.16.3', paths: ['hoek'], dev: false, optional: false, bundled: false }],
            id: 566,
            created: '2018-04-20T21:25:58.421Z',
            updated: '2019-02-14T16:00:33.922Z',
            deleted: null,
            title: 'Prototype Pollution',
            found_by: { name: 'HoLyVieR' },
            reported_by: { name: 'HoLyVieR' },
            module_name: 'hoek',
            cves: [],
            vulnerable_versions: '<= 4.2.0 || >= 5.0.0 < 5.0.3',
            patched_versions: '> 4.2.0 < 5.0.0 || >= 5.0.3',
            overview:
              'Versions of `hoek` prior to 4.2.1 and 5.0.3 are vulnerable to prototype pollution.\n\nThe `merge` function, and the `applyToDefaults` and `applyToDefaultsWithShallow` functions which leverage `merge` behind the scenes, are vulnerable to a prototype pollution attack when provided an _unvalidated_ payload created from a JSON string containing the `__proto__` property.\n\nThis can be demonstrated like so:\n\n```javascript\nvar Hoek = await import\'hoek\');\nvar malicious_payload = \'{"__proto__":{"oops":"It works !"}}\';\n\nvar a = {};\nconsole.log("Before : " + a.oops);\nHoek.merge({}, JSON.parse(malicious_payload));\nconsole.log("After : " + a.oops);\n```\n\nThis type of attack can be used to overwrite existing properties causing a potential denial of service.',
            recommendation: 'Update to version 4.2.1, 5.0.3 or later.',
            references: '',
            access: 'public',
            severity: 'moderate',
            cwe: 'CWE-471',
            metadata: { module_type: '', exploitability: 5, affected_components: '' },
            url: 'https://npmjs.com/advisories/566',
          },
        },
      },
      'OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5',
      'OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5',
      'TmFO',
      'SW5maW5pdHk=',
      'LUluZmluaXR5',
      'SU5G',
      'MSNJTkY=',
      'LTEjSU5E',
      'MSNRTkFO',
      'MSNTTkFO',
      'MSNJTkQ=',
      'MHgw',
      'MHhmZmZmZmZmZg==',
      'MHhmZmZmZmZmZmZmZmZmZmZm',
      'MHhhYmFkMWRlYQ==',
      'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5',
      'MSwwMDAuMDA=',
      'MSAwMDAuMDA=',
      'MScwMDAuMDA=',
      'MSwwMDAsMDAwLjAw',
      'MSAwMDAgMDAwLjAw',
      'MScwMDAnMDAwLjAw',
      'MS4wMDAsMDA=',
      'MSAwMDAsMDA=',
      'MScwMDAsMDA=',
      'MS4wMDAuMDAwLDAw',
      'MSAwMDAgMDAwLDAw',
      'MScwMDAnMDAwLDAw',
      'MDEwMDA=',
      'MDg=',
      'MDk=',
      'Mi4yMjUwNzM4NTg1MDcyMDExZS0zMDg=',
      'LC4vOydbXS09',
      'PD4/OiJ7fXxfKw==',
      'IUAjJCVeJiooKWB+',
      'AQIDBAUGBwgODxAREhMUFRYXGBkaGxwdHh9/',
      'woDCgcKCwoPChMKGwofCiMKJworCi8KMwo3CjsKPwpDCkcKSwpPClMKVwpbCl8KYwpnCmsKbwpzC',
      'ncKewp8=',
      'CwwgwoXCoOGagOKAgOKAgeKAguKAg+KAhOKAheKAhuKAh+KAiOKAieKAiuKAi+KAqOKAqeKAr+KB',
      'n+OAgA==',
      'wq3YgNiB2ILYg9iE2IXYnNud3I/hoI7igIvigIzigI3igI7igI/igKrigKvigKzigK3igK7igaDi',
      'gaHigaLigaPigaTigabigafigajiganigarigavigaziga3iga7iga/vu7/vv7nvv7rvv7vwkYK9',
      '8JuyoPCbsqHwm7Ki8Juyo/CdhbPwnYW08J2FtfCdhbbwnYW38J2FuPCdhbnwnYW686CAgfOggKDz',
      'oICh86CAovOggKPzoICk86CApfOggKbzoICn86CAqPOggKnzoICq86CAq/OggKzzoICt86CArvOg',
      'gK/zoICw86CAsfOggLLzoICz86CAtPOggLXzoIC286CAt/OggLjzoIC586CAuvOggLvzoIC886CA',
      'vfOggL7zoIC/86CBgPOggYHzoIGC86CBg/OggYTzoIGF86CBhvOggYfzoIGI86CBifOggYrzoIGL',
      '86CBjPOggY3zoIGO86CBj/OggZDzoIGR86CBkvOggZPzoIGU86CBlfOggZbzoIGX86CBmPOggZnz',
      'oIGa86CBm/OggZzzoIGd86CBnvOggZ/zoIGg86CBofOggaLzoIGj86CBpPOggaXzoIGm86CBp/Og',
      'gajzoIGp86CBqvOggavzoIGs86CBrfOgga7zoIGv86CBsPOggbHzoIGy86CBs/OggbTzoIG186CB',
      'tvOggbfzoIG486CBufOggbrzoIG786CBvPOggb3zoIG+86CBvw==',
      '77u/',
      '77++',
      'zqniiYjDp+KImuKIq8ucwrXiiaTiiaXDtw==',
      'w6XDn+KIgsaSwqnLmeKIhsuawqzigKbDpg==',
      'xZPiiJHCtMKu4oCgwqXCqMuGw7jPgOKAnOKAmA==',
      'wqHihKLCo8Ki4oiewqfCtuKAosKqwrrigJPiiaA=',
      'wrjLm8OH4peKxLHLnMOCwq/LmMK/',
      'w4XDjcOOw4/LncOTw5Tvo7/DksOaw4bimIM=',
      'xZLigJ7CtOKAsMuHw4HCqMuGw5jiiI/igJ3igJk=',
      'YOKBhOKCrOKAueKAuu+sge+sguKAocKwwrfigJrigJTCsQ==',
      '4oWb4oWc4oWd4oWe',
      'undefined',
      'undef',
      'null',
      'NULL',
      '(null)',
      'nil',
      'NIL',
      'true',
      'false',
      'True',
      'False',
      'TRUE',
      'FALSE',
      'None',
      'hasOwnProperty',
      '\\',
      '\\\\',
      '0',
      '1',
      '1.00',
      '$1.00',
      '1/2',
      '1E2',
      '1E02',
      '1E+02',
      '-1',
      '-1.00',
      '-$1.00',
      '-1/2',
      '-1E2',
      '-1E02',
      '-1E+02',
      '1/0',
      '0/0',
      '-2147483648/-1',
      '-9223372036854775808/-1',
      '-0',
      '-0.0',
      '+0',
      '+0.0',
      '0.00',
      '0..0',
      '.',
      '0.0.0',
      '0,00',
      '0,,0',
      ',',
      '0,0,0',
      '0.0/0',
      '1.0/0.0',
      '0.0/0.0',
      '1,0/0,0',
      '0,0/0,0',
      '--1',
      '-',
      '-.',
      '-,',
      '999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999',
      'NaN',
      'Infinity',
      '-Infinity',
      'INF',
      '1#INF',
      '-1#IND',
      '1#QNAN',
      '1#SNAN',
      '1#IND',
      '0x0',
      '0xffffffff',
      '0xffffffffffffffff',
      '0xabad1dea',
      '123456789012345678901234567890123456789',
      '1,000.00',
      '1 000.00',
      "1'000.00",
      '1,000,000.00',
      '1 000 000.00',
      "1'000'000.00",
      '1.000,00',
      '1 000,00',
      "1'000,00",
      '1.000.000,00',
      '1 000 000,00',
      "1'000'000,00",
      '01000',
      '08',
      '09',
      '2.2250738585072011e-308',
      ",./;'[]\\-=",
      '<>?:"{}|_+',
      '\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f',
      '',
      'Ｔｈｅ ｑｕｉｃｋ ｂｒｏｗｎ ｆｏｘ ｊｕｍｐｓ ｏｖｅｒ ｔｈｅ ｌａｚｙ ｄｏｇ',
      '𝐓𝐡𝐞 𝐪𝐮𝐢𝐜𝐤 𝐛𝐫𝐨𝐰𝐧 𝐟𝐨𝐱 𝐣𝐮𝐦𝐩𝐬 𝐨𝐯𝐞𝐫 𝐭𝐡𝐞 𝐥𝐚𝐳𝐲 𝐝𝐨𝐠',
      '𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌',
      '𝑻𝒉𝒆 𝒒𝒖𝒊𝒄𝒌 𝒃𝒓𝒐𝒘𝒏 𝒇𝒐𝒙 𝒋𝒖𝒎𝒑𝒔 𝒐𝒗𝒆𝒓 𝒕𝒉𝒆 𝒍𝒂𝒛𝒚 𝒅𝒐𝒈',
      '𝓣𝓱𝓮 𝓺𝓾𝓲𝓬𝓴 𝓫𝓻𝓸𝔀𝓷 𝓯𝓸𝔁 𝓳𝓾𝓶𝓹𝓼 𝓸𝓿𝓮𝓻 𝓽𝓱𝓮 𝓵𝓪𝔃𝔂 𝓭𝓸𝓰',
      '𝕋𝕙𝕖 𝕢𝕦𝕚𝕔𝕜 𝕓𝕣𝕠𝕨𝕟 𝕗𝕠𝕩 𝕛𝕦𝕞𝕡𝕤 𝕠𝕧𝕖𝕣 𝕥𝕙𝕖 𝕝𝕒𝕫𝕪 𝕕𝕠𝕘',
      '𝚃𝚑𝚎 𝚚𝚞𝚒𝚌𝚔 𝚋𝚛𝚘𝚠𝚗 𝚏𝚘𝚡 𝚓𝚞𝚖𝚙𝚜 𝚘𝚟𝚎𝚛 𝚝𝚑𝚎 𝚕𝚊𝚣𝚢 𝚍𝚘𝚐',
      '⒯⒣⒠ ⒬⒰⒤⒞⒦ ⒝⒭⒪⒲⒩ ⒡⒪⒳ ⒥⒰⒨⒫⒮ ⒪⒱⒠⒭ ⒯⒣⒠ ⒧⒜⒵⒴ ⒟⒪⒢',
      '<script>alert(123)</script>',
      '&lt;script&gt;alert(&#39;123&#39;);&lt;/script&gt;',
      '<img src=x onerror=alert(123) />',
      '<svg><script>123<1>alert(123)</script>',
      '"><script>alert(123)</script>',
      "'><script>alert(123)</script>",
      '><script>alert(123)</script>',
      '</script><script>alert(123)</script>',
      '< / script >< script >alert(123)< / script >',
      ' onfocus=JaVaSCript:alert(123) autofocus',
      '" onfocus=JaVaSCript:alert(123) autofocus',
      "' onfocus=JaVaSCript:alert(123) autofocus",
      '＜script＞alert(123)＜/script＞',
      '<sc<script>ript>alert(123)</sc</script>ript>',
      '--><script>alert(123)</script>',
      '";alert(123);t="',
      "';alert(123);t='",
      // eslint-disable-next-line no-script-url
      'JavaSCript:alert(123)',
      ';alert(123);',
      'src=JaVaSCript:prompt(132)',
      '"><script>alert(123);</script x="',
      "'><script>alert(123);</script x='",
      '><script>alert(123);</script x=',
      '" autofocus onkeyup="javascript:alert(123)',
      "' autofocus onkeyup='javascript:alert(123)",
      '<script\\x20type="text/javascript">javascript:alert(1);</script>',
      '<script\\x3Etype="text/javascript">javascript:alert(1);</script>',
      '<script\\x0Dtype="text/javascript">javascript:alert(1);</script>',
      '<script\\x09type="text/javascript">javascript:alert(1);</script>',
      '<script\\x0Ctype="text/javascript">javascript:alert(1);</script>',
      '<script\\x2Ftype="text/javascript">javascript:alert(1);</script>',
      '<script\\x0Atype="text/javascript">javascript:alert(1);</script>',
      'ABC<div style="x\\x3Aexpression(javascript:alert(1)">DEF',
      'ABC<div style="x:expression\\x5C(javascript:alert(1)">DEF',
      'ABC<div style="x:expression\\x00(javascript:alert(1)">DEF',
      'ABC<div style="x:exp\\x00ression(javascript:alert(1)">DEF',
      'ABC<div style="x:exp\\x5Cression(javascript:alert(1)">DEF',
      'ABC<div style="x:\\x0Aexpression(javascript:alert(1)">DEF',
      'ABC<div style="x:\\x09expression(javascript:alert(1)">DEF',
      'ABC<div style="x:\\xE3\\x80\\x80expression(javascript:alert(1)">',
      '-',
      '--',
      '--version',
      '--help',
      '$USER',
      '/dev/null; touch /tmp/blns.fail ; echo',
      '$(touch /tmp/blns.fail)',
      '@{[system "touch /tmp/blns.fail"]}',
      'eval("puts \'hello world\'")',
      'System("ls -al /")',
      'Kernel.exec("ls -al /")',
      'Kernel.exit(1)',
      "%x('ls -al /')",
      '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [ <!ELEMENT foo ANY ><!ENTITY xxe SYSTEM "file:///etc/passwd" >]><foo>&xxe;</foo>',
      '$HOME',
      "$ENV{'HOME'}",
      '%d',
      '%s%s%s%s%s',
      '{0}',
      '%*.*s',
      '%@',
      '%n',
      'File:///',
      '../../../../../../../../../../../etc/passwd%00',
      '../../../../../../../../../../../etc/hosts',
      '() { 0; }; touch /tmp/blns.shellshock1.fail;',
      '() { _; } >_[$($())] { touch /tmp/blns.shellshock2.fail; }',
      "<<< %s(un='%s') = %u",
      '+++ATH0',
      'CON',
      'PRN',
      'AUX',
      'CLOCK$',
      'NUL',
      'A:',
      'ZZ:',
      'COM1',
      'LPT1',
      'LPT2',
      'LPT3',
      'COM2',
      'COM3',
      'COM4',
      'DCC SEND STARTKEYLOGGER 0 0 0',
      'Scunthorpe General Hospital',
      'Penistone Community Church',
      'Lightwater Country Park',
      'Jimmy Clitheroe',
      'Horniman Museum',
      'shitake mushrooms',
      'RomansInSussex.co.uk',
      'http://www.cum.qc.ca/',
      'Craig Cockburn, Software Specialist',
      'Linda Callahan',
      'Dr. Herman I. Libshitz',
      'magna cum laude',
      'Super Bowl XXX',
      'medieval erection of parapets',
      'evaluate',
      'mocha',
      'expression',
      'Arsenal canal',
      'classic',
      'Tyson Gay',
      'Dick Van Dyke',
      'basement',
      "If you're reading this, you've been in a coma for almost 20 years now. We're trying a new technique. We don't know where this message will end up in your dream, but we hope it works. Please wake up, we miss you.",
      'Roses are \u001b[0;31mred\u001b[0m, violets are \u001b[0;34mblue. Hope you enjoy terminal hue',
      'But now...\u001b[20Cfor my greatest trick...\u001b[8m',
      'The quic\b\b\b\b\b\bk brown fo\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007\u0007x... [Beeeep]',
      'Powerلُلُصّبُلُلصّبُررً ॣ ॣh ॣ ॣ冗',
      '🏳0🌈️',
      '### No JSON flag' +
        '```' +
        `{
        "hello": "world" // This is a comment
      }` +
        '```' +
        '### `json` flag' +
        '```json' +
        `
      {
        "hello": "world" // This is a comment
      }
      ` +
        '```' +
        '### `jsonc` flag' +
        '```jsonc' +
        `{
        "hello": "world" // This is a comment
      }` +
        '```' +
        '### `json5` flag' +
        '```json5' +
        `{
        "hello": "world" // This is a comment
      }` +
        '```',
    ];

    for (const start of naughtyObjsOrStrings) {
      const escaped = escapeHtml(JSON.stringify(start));
      const replaced = JSON.parse(replaceSpecialCharacters(escaped));
      expect(start).toEqual(replaced);
    }
  });

  it('mounts a single component in HTML correctly', async () => {
    hydrated = [];
    // eslint-disable-next-line global-require

    await mountComponentsInHtml({
      page,
      html: `<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Datepicker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;lazy&quot; }"></div></div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual(['{"name":"Datepicker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}']);
  });

  it('mounts multiple components within the same html correctly', async () => {
    hydrated = [];
    // eslint-disable-next-line global-require

    await mountComponentsInHtml({
      page,
      html: `
      <div class="svelte-datepicker">
        <div class="ejs-component" data-ejs-component="Picker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;lazy&quot; }"></div>
        <div class="ejs-component" data-ejs-component="Picker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;eager&quot; }"></div>
      </div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual([
      '{"name":"Picker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}',
      '{"name":"Picker","props":{"a":"b"},"hydrateOptions":{"loading":"eager"}}',
    ]);
  });

  it('mounts 3 components within the same html correctly', async () => {
    hydrated = [];
    // eslint-disable-next-line global-require

    await mountComponentsInHtml({
      page,
      html: `<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Sicker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;lazy&quot; }"></div><div class="ejs-component" data-ejs-component="Picker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;eager&quot; }"></div><div class="ejs-component" data-ejs-component="Ricker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;lazy&quot; }"></div>`,
      hydrateOptions: undefined,
    });
    expect(hydrated).toEqual([
      '{"name":"Sicker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}',
      '{"name":"Picker","props":{"a":"b"},"hydrateOptions":{"loading":"eager"}}',
      '{"name":"Ricker","props":{"a":"b"},"hydrateOptions":{"loading":"lazy"}}',
    ]);
  });

  it('Extracts from Alock, Block, Clock', async () => {
    hydrated = [];
    // eslint-disable-next-line global-require

    await mountComponentsInHtml({
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

  // it('Performance test (#235)', async () => {
  //   const comp =
  //     '<p><div class="ejs-component" data-ejs-component="Sicker" data-ejs-props="{ &quot;a&quot;: &quot;b&quot; }" data-ejs-options="{ &quot;loading&quot;: &quot;lazy&quot; }"></div></p>\n';
  //   mountComponentsInHtml({
  //     page,
  //     html: comp.repeat(1000),
  //     hydrateOptions: undefined,
  //   });
  // });
});
