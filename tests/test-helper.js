const test = require("node:test");
const assert = require("node:assert");

module.exports = {
  test,
  describe: test.describe,
  it: test.it,
  before: test.before,
  after: test.after,
  beforeEach: test.beforeEach,
  afterEach: test.afterEach,
  assert,
};
