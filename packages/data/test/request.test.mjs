import { test } from "node:test";
import assert from "node:assert/strict";
import { Data } from "../dist/Data.js";
import { ApiError } from "../dist/ApiError.js";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
const textResponse = (text, status = 200) =>
  new Response(text, { status, headers: { "content-type": "text/plain" } });
const emptyResponse = (status = 200) => new Response(null, { status });

// config is static and persists across tests — each test sets fetch fully.
function withFetch(fn) {
  Data.configureData({ baseUrl: "", fetch: async (url, init) => fn(String(url), init), headers: () => ({}) });
}

// --- happy path (regression) ---------------------------------------------

test("2xx JSON body is parsed and returned", async () => {
  withFetch(() => jsonResponse({ id: 7, name: "Ada" }));
  const result = await Data.request("GET", "/user/7");
  assert.deepEqual(result, { id: 7, name: "Ada" });
});

test("2xx empty body returns undefined", async () => {
  withFetch(() => emptyResponse(204));
  const result = await Data.request("DELETE", "/user/7");
  assert.equal(result, undefined);
});

// --- the fix: error body is preserved -------------------------------------

test("non-2xx with a JSON error body attaches the parsed body", async () => {
  withFetch(() => jsonResponse({ message: "Invalid credentials" }, 401));
  await assert.rejects(
    () => Data.request("POST", "/login"),
    (e) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 401);
      assert.deepEqual(e.body, { message: "Invalid credentials" });
      // the human message hint surfaces the server's message
      assert.match(e.message, /Invalid credentials/);
      return true;
    },
  );
});

test("non-2xx with a plain-text error body attaches the raw text", async () => {
  withFetch(() => textResponse("Service Unavailable", 503));
  await assert.rejects(
    () => Data.request("GET", "/health"),
    (e) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 503);
      assert.equal(e.body, "Service Unavailable");
      assert.match(e.message, /Service Unavailable/);
      return true;
    },
  );
});

test("non-2xx with an empty body still throws ApiError with the status", async () => {
  withFetch(() => emptyResponse(500));
  await assert.rejects(
    () => Data.request("GET", "/boom"),
    (e) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 500);
      assert.equal(e.body, undefined);
      return true;
    },
  );
});

test("error body's message/error/detail/title are used for the hint", async () => {
  withFetch(() => jsonResponse({ error: "nope" }, 400));
  await assert.rejects(
    () => Data.request("GET", "/x"),
    (e) => {
      assert.match(e.message, /nope/);
      return true;
    },
  );
  assert.equal(ApiError.messageOf({ detail: "bad" }), "bad");
  assert.equal(ApiError.messageOf({ title: "t" }), "t");
  assert.equal(ApiError.messageOf("raw"), "raw");
  assert.equal(ApiError.messageOf({}), undefined);
  assert.equal(ApiError.messageOf(null), undefined);
});

// --- the fix: a non-JSON 2xx is an ApiError, not a raw SyntaxError ---------

test("2xx with a non-JSON body throws ApiError (not SyntaxError)", async () => {
  withFetch(() => textResponse("<html>oops</html>", 200));
  await assert.rejects(
    () => Data.request("GET", "/page"),
    (e) => {
      assert.ok(e instanceof ApiError, `expected ApiError, got ${e?.name}`);
      assert.ok(!(e instanceof SyntaxError));
      assert.equal(e.status, 200);
      assert.equal(e.body, "<html>oops</html>");
      assert.match(e.message, /non-JSON/);
      return true;
    },
  );
});
