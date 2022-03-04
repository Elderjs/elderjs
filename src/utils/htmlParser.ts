import {parseExpressionAt} from "acorn";

type Node = {
  start: number;
  end: number;
}

type TagNode = Node & {
  name: string;
  attrs: Array<AttrNode|ExpressionNode>;
  selfClosed: boolean;
  start: number;
  end: number;
}

type AttrNode = Node & {
  name: string;
  value?: AttrValueNode;
}

type AttrValueNode = Node & {
  value?: string;
  raw?: string;
}

type ExpressionNode = Node & {
  exp: any;
  spread: boolean;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const unescapeHtml = (str) =>
  str
    .replace(/\\\\n/gim, '\\n')
    .replace(/&quot;/gim, '"')
    .replace(/&lt;/gim, '<')
    .replace(/&gt;/gim, '>')
    .replace(/&#0?39;/gim, "'")
    .replace(/\\"/gim, '"')
    .replace(/&amp;/gim, '&');

export function parseExpression(content: string, index: number): ExpressionNode {
  const rx = /{\s*(\.\.\.)?/y;
  rx.lastIndex = index;
  const [prefix,, hasSpread] = rx.exec(content);
  const exp = parseExpressionAt(content, index + prefix.length);
  const rxEnd = /\s*}/y;
  rxEnd.lastIndex = exp.end;
  rxEnd.exec(content);
  return {
    start: index,
    end: rxEnd.lastIndex,
    exp,
    spread: Boolean(hasSpread)
  };
}

export function parseAttrValue(content: string, index: number): AttrValueNode | ExpressionNode {
  let raw;
  let rx;
  if (content[index] === "'") {
    rx = /'([^']*)'/y;
    rx.lastIndex = index;
    raw = content.match(rx)[1];
  } else if (content[index] === '"') {
    rx = /"([^"]*)"/y;
    rx.lastIndex = index;
    raw = content.match(rx)[1];
  } else if (content[index] === "{") {
    return parseExpression(content, index);
  } else {
    rx = /[^\s"'=<>\/\x7f-\x9f]+/y;
    rx.lastIndex = index;
    raw = content.match(rx)[0];
  }
  return {
    value: unescapeHtml(raw),
    raw,
    start: index,
    end: rx.lastIndex
  };
}

export function parseTag(content: string, index: number): TagNode {
  const rx = /<([\w-:]+)/y;
  rx.lastIndex = index;
  const match = content.match(rx);
  const attrs = parseAttrs(content, rx.lastIndex);
  const rxEnd = /\s*(\/?)>/y;
  if (attrs.length) {
    rxEnd.lastIndex = attrs[attrs.length - 1].end;
  } else {
    rxEnd.lastIndex = rx.lastIndex;
  }
  const matchEnd = content.match(rxEnd);
  return {
    name: match[1],
    attrs,
    selfClosed: Boolean(matchEnd[1]),
    start: index,
    end: rxEnd.lastIndex
  };
}

export function parseAttrs(content: string, index: number): Array<AttrNode|ExpressionNode> {
  const rx = /(\s+)(?:([\w-:]+)(\s*=\s*)?|{)/y;
  rx.lastIndex = index;
  const result = [];
  let match;
  while ((match = rx.exec(content))) {
    const [, prefix, name, hasValue] = match;
    if (!name) {
      // expression
      const node = parseExpression(content, match.index + prefix.length);
      result.push(node);
      rx.lastIndex = node.end;
      continue;
    }
    const value = hasValue ? parseAttrValue(content, rx.lastIndex) : null;
    result.push({
      start: match.index,
      end: value ? value.end : rx.lastIndex,
      name,
      value
    });
    if (value) {
      rx.lastIndex = value.end;
    }
  }
  return result;
}

