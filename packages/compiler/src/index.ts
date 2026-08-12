/**
 * @qloom/compiler — offline `.tml` → render-program compiler, plus the
 * OpenAPI → TypeScript client generator (both build-time).
 */
export type {
  CompileOptions,
  CompileResult,
  SchemaVersion,
  GraphqlSource,
  GraphqlGenerateOptions,
  GraphqlGenerateResult,
} from "./types.js";
export { TemplateCompileError } from "./TemplateCompileError.js";
export { compileTemplate } from "./compileTemplate.js";
export { collectComponentIds } from "./collectComponentIds.js";
export { parseProperties } from "./parseProperties.js";
export { checkEventHandlers } from "./checkEventHandlers.js";
export { generateApiClient } from "./generateApiClient.js";
export { generateGraphqlClient } from "./generateGraphqlClient.js";
export { tokenizeExpression } from "./expr/tokenizeExpression.js";
export { parseExpression } from "./expr/parseExpression.js";
export { emitExpression } from "./expr/emitExpression.js";
export { emitConduit } from "./expr/emitConduit.js";
