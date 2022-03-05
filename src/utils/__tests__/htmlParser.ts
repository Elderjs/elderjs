/* eslint-disable no-param-reassign */
import { escapeHtml, unescapeHtml, parseTag } from '../htmlParser';

const cases = [['&amp;&#039;&quot;', `&'"`]];

describe('escapeHtml/unescapeHtml', () => {
  for (const [left, right] of cases) {
    test(`${left} ${right}`, () => {
      expect(escapeHtml(right)).toEqual(left);
      expect(unescapeHtml(left)).toEqual(right);
    });
  }
});

test('#escapeHtml', () => {
  expect(escapeHtml('')).toEqual('');
  expect(escapeHtml(`<html>'Tom'&amp;"Jerry"</html>`)).toEqual(
    '&lt;html&gt;&#039;Tom&#039;&amp;amp;&quot;Jerry&quot;&lt;/html&gt;',
  );
});

test('#unescapeHtml', () => {
  expect(unescapeHtml('{&quot;nh_count&quot;:15966,&quot;classes&quot;:&quot;mt-3&quot;}')).toEqual(
    '{"nh_count":15966,"classes":"mt-3"}',
  );
  expect(unescapeHtml('&quot;&lt;&gt;&#39;&quot;\\n\\\\n\\"&amp;')).toEqual('"<>\'"\\n\\n"&');
  expect(unescapeHtml('abcd 1234 <&""&>')).toEqual('abcd 1234 <&""&>');
});

describe('#parseTag', () => {
  test('basic tag', () => {
    expect(parseTag(`<div class="foo">`, 0)).toMatchSnapshot();
  });
  test('basic self closed tag', () => {
    expect(parseTag(`<div class="foo"/>`, 0)).toMatchSnapshot();
  });
  test('svelte value', () => {
    expect(parseTag(`<MyComponent class="foo" hydrate-client={props}>`, 0)).toMatchSnapshot();
  });
});
