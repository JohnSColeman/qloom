import { test } from "node:test";
import assert from "node:assert/strict";
import { collectComponentIds } from "../dist/collectComponentIds.js";
import { checkEventHandlers } from "../dist/checkEventHandlers.js";

test("collectComponentIds gathers every explicit t:id, deduped, in order", () => {
  const tml = `<div>
    <form t:type="form" t:id="loginForm">
      <input t:type="textfield" t:id="username"/>
      <input t:type="passwordfield" t:id="password"/>
    </form>
    <a t:type="eventlink" t:id="logout">out</a>
    <span t:id="loginForm"/>
  </div>`;
  assert.deepEqual(collectComponentIds(tml), ["loginForm", "username", "password", "logout"]);
});

test("a handler matching a real id passes", () => {
  const src = `class Signin { onSubmitFromLoginForm() {} }`;
  assert.deepEqual(checkEventHandlers("Signin", src, ["loginForm"]), []);
});

test("a capitalised id (RegisterForm) resolves", () => {
  const src = `class Signup { onValidateFromRegisterForm() {} }`;
  assert.deepEqual(checkEventHandlers("Signup", src, ["RegisterForm"]), []);
});

test("an id containing 'From' resolves", () => {
  const src = `class P { onChangeFromFromDate() {} }`;
  assert.deepEqual(checkEventHandlers("P", src, ["fromDate"]), []);
});

test("a casing mismatch is flagged with a did-you-mean", () => {
  const src = `class Signin { onSubmitFromLoginform() {} }`;
  const errors = checkEventHandlers("Signin", src, ["loginForm"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /will never fire/);
  assert.match(errors[0], /onSubmitFromLoginForm/);
  assert.match(errors[0], /"loginForm"/);
});

test("an unknown id lists the available components", () => {
  const src = `class Signin { onSubmitFromGhost() {} }`;
  const errors = checkEventHandlers("Signin", src, ["loginForm", "username"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not exist/);
  assert.match(errors[0], /"loginForm", "username"/);
});

test("plain on<Event> handlers (no From) are ignored", () => {
  const src = `class P { onSubmit() {} onActivate() {} onPassivate() {} }`;
  assert.deepEqual(checkEventHandlers("P", src, []), []);
});

test("handler names inside comments are ignored", () => {
  const src = `class P {
    // onSubmitFromGhost is not a real method
    /* onClickFromMissing either */
    onSubmitFromLoginForm() {}
  }`;
  assert.deepEqual(checkEventHandlers("P", src, ["loginForm"]), []);
});

test("@OnEvent with a valid component passes", () => {
  const src = `class P {
    @OnEvent({ value: EventConstants.SUCCESS, component: "startBookingForm" })
    begin() {}
  }`;
  assert.deepEqual(checkEventHandlers("P", src, ["startBookingForm"]), []);
});

test("@OnEvent component match is case-insensitive (mirrors runtime)", () => {
  const src = `class P { @OnEvent({ value: "success", component: "registerform" }) go() {} }`;
  assert.deepEqual(checkEventHandlers("P", src, ["RegisterForm"]), []);
});

test("@OnEvent with an unknown component is flagged", () => {
  const src = `class P { @OnEvent({ value: "success", component: "ghost" }) go() {} }`;
  const errors = checkEventHandlers("P", src, ["registerForm"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /@OnEvent/);
  assert.match(errors[0], /"ghost"/);
  assert.match(errors[0], /does not exist/);
});

test("@OnEvent without a component is ignored", () => {
  const src = `class P { @OnEvent({ value: "success" }) go() {} }`;
  assert.deepEqual(checkEventHandlers("P", src, []), []);
});
