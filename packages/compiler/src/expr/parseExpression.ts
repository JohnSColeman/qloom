import { tokenizeExpression } from "./tokenizeExpression.js";
import type { ExprNode, Token, TokenType } from "../types.js";

/** Parse a Tapestry property-expression string into an AST. */
export function parseExpression(src: string): ExprNode {
  const tokens = tokenizeExpression(src);
  let i = 0;

  const peek = (): Token => tokens[i]!;
  const at = (type: TokenType): boolean => peek().type === type;
  const next = (): Token => tokens[i++]!;
  const eat = (type: TokenType): Token => {
    if (!at(type)) throw new Error(`expected ${type} but found '${peek().value || peek().type}'`);
    return next();
  };

  const parseArgs = (): ExprNode[] => {
    eat("lparen");
    const args: ExprNode[] = [];
    if (!at("rparen")) {
      args.push(parseExpr());
      while (at("comma")) {
        next();
        args.push(parseExpr());
      }
    }
    eat("rparen");
    return args;
  };

  const parseList = (): ExprNode => {
    eat("lbracket");
    const items: ExprNode[] = [];
    if (!at("rbracket")) {
      items.push(parseExpr());
      while (at("comma")) {
        next();
        items.push(parseExpr());
      }
    }
    eat("rbracket");
    return { kind: "list", items };
  };

  const parseMap = (): ExprNode => {
    eat("lbrace");
    const entries: Array<{ key: ExprNode; value: ExprNode }> = [];
    if (!at("rbrace")) {
      const entry = (): void => {
        const key = parseChain();
        eat("colon");
        entries.push({ key, value: parseExpr() });
      };
      entry();
      while (at("comma")) {
        next();
        entry();
      }
    }
    eat("rbrace");
    return { kind: "map", entries };
  };

  // A primary: keyword, constant, list, map, or the head of a property chain.
  const parsePrimary = (): ExprNode => {
    const t = peek();
    switch (t.type) {
      case "null":
        next();
        return { kind: "literal", value: null };
      case "true":
        next();
        return { kind: "literal", value: true };
      case "false":
        next();
        return { kind: "literal", value: false };
      case "this":
        next();
        return { kind: "this" };
      case "integer":
        next();
        return { kind: "literal", value: parseInt(t.value, 10) };
      case "decimal":
        next();
        return { kind: "literal", value: parseFloat(t.value) };
      case "string":
        next();
        return { kind: "literal", value: t.value };
      case "lbracket":
        return parseList();
      case "lbrace":
        return parseMap();
      case "identifier": {
        next();
        if (at("lparen")) return { kind: "invoke", object: null, name: t.value, args: parseArgs(), safe: false };
        return { kind: "prop", object: null, name: t.value, safe: false };
      }
      default:
        throw new Error(`unexpected token '${t.value || t.type}'`);
    }
  };

  // A property chain: primary (('.' | '?.') term)*
  function parseChain(): ExprNode {
    let node = parsePrimary();
    while (at("deref") || at("safederef")) {
      const safe = at("safederef");
      next();
      const id = eat("identifier");
      node = at("lparen")
        ? { kind: "invoke", object: node, name: id.value, args: parseArgs(), safe }
        : { kind: "prop", object: node, name: id.value, safe };
    }
    return node;
  }

  const parseUnary = (): ExprNode => {
    if (at("bang")) {
      next();
      return { kind: "not", operand: parseUnary() };
    }
    return parseChain();
  };

  // The top-level expression, which may be a range of two operands.
  function parseExpr(): ExprNode {
    const left = parseUnary();
    if (at("range")) {
      next();
      return { kind: "range", from: left, to: parseUnary() };
    }
    return left;
  }

  const result = parseExpr();
  if (!at("eof")) throw new Error(`expected end of expression but found '${peek().value || peek().type}'`);
  return result;
}
