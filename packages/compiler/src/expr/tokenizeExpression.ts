import type { Token, TokenType } from "../types.js";

const KEYWORDS: Record<string, TokenType> = {
  null: "null",
  true: "true",
  false: "false",
  this: "this",
};

const isDigit = (c: string): boolean => c >= "0" && c <= "9";
const isIdStart = (c: string): boolean => /[A-Za-z_$À-￿]/.test(c);
const isIdPart = (c: string): boolean => isIdStart(c) || isDigit(c);

/** Tokenize a Tapestry property-expression string. */
export function tokenizeExpression(src: string): Token[] {
  const tokens: Token[] = [];
  const n = src.length;
  let i = 0;

  const push = (type: TokenType, value: string, pos: number): void => {
    tokens.push({ type, value, pos });
  };

  while (i < n) {
    const c = src[i]!;

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    const single: Record<string, TokenType> = {
      "(": "lparen", ")": "rparen", "[": "lbracket", "]": "rbracket",
      "{": "lbrace", "}": "rbrace", ",": "comma", ":": "colon", "!": "bang",
    };
    if (single[c]) {
      push(single[c]!, c, i);
      i++;
      continue;
    }

    if (c === "?" && src[i + 1] === ".") {
      push("safederef", "?.", i);
      i += 2;
      continue;
    }

    if (c === ".") {
      if (src[i + 1] === ".") {
        push("range", "..", i);
        i += 2;
        continue;
      }
      if (isDigit(src[i + 1] ?? "")) {
        let j = i + 1;
        while (j < n && isDigit(src[j]!)) j++;
        push("decimal", src.slice(i, j), i);
        i = j;
        continue;
      }
      push("deref", ".", i);
      i++;
      continue;
    }

    if (c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== "'") j++;
      if (j >= n) throw new Error(`unterminated string literal`);
      push("string", src.slice(i + 1, j), i);
      i = j + 1;
      continue;
    }

    // Signed leading-dot decimal: SIGN '.' DIGIT+ (e.g. "-.5", "+.5").
    if ((c === "+" || c === "-") && src[i + 1] === "." && isDigit(src[i + 2] ?? "")) {
      let j = i + 2;
      while (j < n && isDigit(src[j]!)) j++;
      push("decimal", src.slice(i, j), i);
      i = j;
      continue;
    }

    // Number, with an optional leading sign (there is no binary +/- in the grammar).
    const signed = (c === "+" || c === "-") && isDigit(src[i + 1] ?? "");
    if (isDigit(c) || signed) {
      let j = signed ? i + 1 : i;
      while (j < n && isDigit(src[j]!)) j++;
      // Decimal only when the dot is not part of a range ("1..10") and digits follow.
      if (src[j] === "." && src[j + 1] !== "." && isDigit(src[j + 1] ?? "")) {
        j++;
        while (j < n && isDigit(src[j]!)) j++;
        push("decimal", src.slice(i, j), i);
      } else {
        push("integer", src.slice(i, j), i);
      }
      i = j;
      continue;
    }

    if (isIdStart(c)) {
      let j = i;
      while (j < n && isIdPart(src[j]!)) j++;
      const word = src.slice(i, j);
      push(KEYWORDS[word.toLowerCase()] ?? "identifier", word, i);
      i = j;
      continue;
    }

    throw new Error(`unexpected character '${c}' at ${i}`);
  }

  push("eof", "", n);
  return tokens;
}
