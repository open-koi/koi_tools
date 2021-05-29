/**
 * Testing node requires redis and .env setup
 */

let knode = require("../dist/node");

test("Test loading", () => {
  expect(true).toBe(true);
})

/*
// These tests must be disabled when publishing as CI doesn't have Redis
let ktools = new knode.Node();
test("Test validate data false", async () => {
  jest.setTimeout(20000)
  const res = await ktools.validateData(39);
  expect(res).toBe(false);
})
*/
