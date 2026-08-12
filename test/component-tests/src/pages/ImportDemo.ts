import { Page, Import } from "@qloom/runtime";

/**
 * Exercises @Import: a context: stylesheet (resolves to /import-demo.css and
 * applies), a context: library (executes), an absolute URL (passes through),
 * and a classpath: asset (warns + skipped).
 */
@Import({
  stylesheet: [
    "context:/import-demo.css",
    "/import-demo.css",
    "data:text/css,x",
    "classpath:/nope.css",
    "asset:/unknown.css",
  ],
  library: ["context:/import-demo.js"],
})
export class ImportDemo extends Page {}
