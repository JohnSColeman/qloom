import { Component, Parameter } from "@qloom/runtime";

/** Renders its body when `test` is false. Tapestry: `Unless`. */
export class Unless extends Component {
  @Parameter({ required: true }) test!: boolean;

  setupRender(): boolean {
    return !this.test;
  }
}
