import { Page, Property, Validate } from "@qloom/runtime";

export class ValidationDemo extends Page {
  @Property @Validate("required,minlength=3,maxlength=15") username = "";
  @Property @Validate("required,email") email = "";
  @Property @Validate("required,minlength=6,maxlength=12") password = "";
  @Property @Validate("required,minlength=6,maxlength=12") verify = "";
  @Property @Validate("required") bio = "";
  @Property done = "";

  onValidateFromForm(): string | void {
    if (this.password !== this.verify) return "Passwords are not the same";
  }

  onSubmitFromForm(): void {
    this.done = "ok";
  }
}
