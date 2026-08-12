import { Page, Property } from "@qloom/runtime";

/**
 * A multi-step wizard driven by `<t:block>` + `<t:delegate>` — the pattern the
 * hotel-booking `Book` page uses (`<t:delegate to="step"/>`). The two named
 * blocks are hoisted onto the instance by the compiled template; `step` returns
 * whichever the current state calls for. Each step's EventLink refreshes the
 * enclosing Zone, so advancing/going back re-renders the delegate in place.
 */
export class Wizard extends Page {
  @Property atStepTwo = false;

  // Block fields assigned by the compiled template (hoisted `<t:block t:id>`).
  declare stepOne: (writer: unknown) => void;
  declare stepTwo: (writer: unknown) => void;

  get step(): (writer: unknown) => void {
    return this.atStepTwo ? this.stepTwo : this.stepOne;
  }

  onNext(): void {
    this.atStepTwo = true;
  }
  onBack(): void {
    this.atStepTwo = false;
  }
}
