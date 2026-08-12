import { Component, Parameter } from "@qloom/runtime";

/**
 * A custom component with its own template (`Panel.tml`), one `@Parameter`, and
 * a `<t:body/>` — proving component-with-template + parameter binding + body
 * rendering under the M2 render-phase engine.
 */
export class Panel extends Component {
  @Parameter({ required: true }) heading!: string;
}
