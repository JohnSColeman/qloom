import { test } from "node:test";
import assert from "node:assert/strict";
import { Either } from "../dist/Either.js";

test("right folds to onRight; left folds to onLeft", () => {
  assert.equal(Either.right(5).fold(() => "L", (r) => `R${r}`), "R5");
  assert.equal(Either.left("boom").fold((l) => `L${l}`, () => "R"), "Lboom");
});

test("map transforms Right, passes Left through", () => {
  assert.equal(Either.right(2).map((r) => r * 10).getOrElse(0), 20);
  assert.equal(Either.left("e").map((r) => r * 10).isLeft, true);
});

test("mapLeft transforms Left, passes Right through", () => {
  assert.equal(Either.left("e").mapLeft((l) => l + "!").fold((l) => l, () => "R"), "e!");
  assert.equal(Either.right(1).mapLeft((l) => l + "!").isRight, true);
});

test("flatMap chains and short-circuits on Left", () => {
  const ok = Either.right(3).flatMap((r) => Either.right(r + 1));
  assert.equal(ok.getOrElse(0), 4);
  const shorted = Either.left("e").flatMap(() => Either.right(1));
  assert.equal(shorted.isLeft, true);
});

test("getOrElse returns Right value or fallback", () => {
  assert.equal(Either.right(9).getOrElse(0), 9);
  assert.equal(Either.left("e").getOrElse(0), 0);
});

test("isLeft / isRight", () => {
  assert.equal(Either.right(1).isRight, true);
  assert.equal(Either.right(1).isLeft, false);
  assert.equal(Either.left(1).isLeft, true);
});
