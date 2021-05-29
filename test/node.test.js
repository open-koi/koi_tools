/**
 * Testing node requires redis and .env setup
 */

let knode = require("../dist/node");
let ktools = new knode.Node();

test("Test loading", () => {
  expect(true).toBe(true);
})

test("Test validate data false", async () => {
  jest.setTimeout(20000)
  const res = await ktools.validateData(39);
  expect(res).toBe(false);
})
