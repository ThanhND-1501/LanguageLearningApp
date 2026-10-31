const test = require("node:test");
const assert = require("node:assert");

// Ensure globalThis.localStorage is available in Node.js test environment
if (typeof globalThis !== "undefined" && !globalThis.localStorage) {
  class MemoryStorage {
    constructor() {
      this.items = new Map();
    }
    get length() {
      return this.items.size;
    }
    clear() {
      this.items.clear();
    }
    getItem(key) {
      return this.items.has(key) ? this.items.get(key) : null;
    }
    key(index) {
      return Array.from(this.items.keys())[index] || null;
    }
    removeItem(key) {
      this.items.delete(key);
    }
    setItem(key, value) {
      this.items.set(key, String(value));
    }
  }
  globalThis.localStorage = new MemoryStorage();
}

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
