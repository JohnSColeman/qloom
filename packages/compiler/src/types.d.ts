/** Types for @qloom/compiler — the offline `.tml` → render-program compiler. */

/** A recognized Tapestry template schema version (from the `xmlns:t` URI). */
export type SchemaVersion = "5.0" | "5.1" | "5.3" | "5.4";

export interface CompileOptions {
  name: string;
  /**
   * Default Tapestry template schema version, applied when a `.tml` omits its
   * `xmlns:t` declaration. A template that *does* declare a recognized `xmlns:t`
   * URI always wins over this. Governs which `t:` directives are legal (ported
   * from Tapestry's SaxTemplateParser version gates). Default: `"5.4"`.
   */
  schemaVersion?: SchemaVersion;
}

export interface CompileResult {
  code: string;
  diagnostics: string[];
}

/** Expression-language token kinds (Tapestry PEL). */
export type TokenType =
  | "identifier"
  | "integer"
  | "decimal"
  | "string"
  | "null"
  | "true"
  | "false"
  | "this"
  | "deref" // .
  | "safederef" // ?.
  | "range" // ..
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "lbrace"
  | "rbrace"
  | "comma"
  | "colon"
  | "bang"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

/** One `.graphql` file passed to the GraphQL client generator. */
export interface GraphqlSource {
  file: string;
  sdl: string;
}

/** Options for {@link generateGraphqlClient}. */
export interface GraphqlGenerateOptions {
  /** Custom-scalar name → TS type; unmapped custom scalars become `unknown`. */
  scalars?: Record<string, string>;
}

/** Result of {@link generateGraphqlClient}: the module source + build warnings. */
export interface GraphqlGenerateResult {
  code: string;
  warnings: string[];
}

/** Mutable collector threaded through the GraphQL type mappers. */
export interface GraphqlTypeRegistry {
  /** Enum name → `export type` declaration. */
  enums: Map<string, string>;
  /** Input-object name → `export interface` declaration. */
  inputs: Map<string, string>;
  /** Custom-scalar name → TS type. */
  scalars: Record<string, string>;
  /** Accumulated build warnings (deduped at emit). */
  warnings: string[];
}

/** Parsed property-expression AST node (Tapestry PEL). */
export type ExprNode =
  | { kind: "literal"; value: string | number | boolean | null }
  | { kind: "this" }
  | { kind: "prop"; object: ExprNode | null; name: string; safe: boolean }
  | { kind: "invoke"; object: ExprNode | null; name: string; args: ExprNode[]; safe: boolean }
  | { kind: "list"; items: ExprNode[] }
  | { kind: "map"; entries: Array<{ key: ExprNode; value: ExprNode }> }
  | { kind: "range"; from: ExprNode; to: ExprNode }
  | { kind: "not"; operand: ExprNode };
