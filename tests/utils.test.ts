import { describe, it, assert } from "./test-helper";
import { formatRelativeDate, getScoreBadgeColor, cn } from "../src/lib/utils";

describe("Utility Functions (utils.ts)", () => {
  describe("cn (tailwind merge)", () => {
    it("should merge classes and resolve conflicts", () => {
      const result = cn("px-2 py-1", "bg-red-500", "px-4");
      assert.strictEqual(result, "py-1 bg-red-500 px-4");
    });
  });

  describe("formatRelativeDate", () => {
    it("should return 'Đến hạn ngay bây giờ' for current or immediate due date", () => {
      const nowIso = new Date().toISOString();
      const result = formatRelativeDate(nowIso);
      assert.strictEqual(result, "Đến hạn ngay bây giờ");
    });

    it("should return 'Quá hạn X giờ' for cards overdue by several hours", () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
      const result = formatRelativeDate(fiveHoursAgo);
      assert.strictEqual(result, "Quá hạn 5 giờ");
    });

    it("should return 'Quá hạn X ngày' for cards overdue by days", () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const result = formatRelativeDate(twoDaysAgo);
      assert.strictEqual(result, "Quá hạn 2 ngày");
    });

    it("should return 'Sau X phút' for cards due within the hour", () => {
      const inThirtyMins = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const result = formatRelativeDate(inThirtyMins);
      assert.strictEqual(result, "Sau 30 phút");
    });

    it("should return 'Ngày mai' for cards due 1 day ahead", () => {
      const tomorrow = new Date(Date.now() + 25 * 3600 * 1000).toISOString();
      const result = formatRelativeDate(tomorrow);
      assert.strictEqual(result, "Ngày mai");
    });
  });

  describe("getScoreBadgeColor", () => {
    it("should return emerald badge for score >= 80", () => {
      const badge = getScoreBadgeColor(85);
      assert.ok(badge.bg.includes("emerald"));
      assert.ok(badge.text.includes("emerald"));
      assert.strictEqual(badge.label, "Xuất sắc (Native-like)");
    });

    it("should return amber badge for score between 60 and 79", () => {
      const badge = getScoreBadgeColor(72);
      assert.ok(badge.bg.includes("amber"));
      assert.ok(badge.text.includes("amber"));
      assert.strictEqual(badge.label, "Khá (Understandable)");
    });

    it("should return rose badge for score < 60", () => {
      const badge = getScoreBadgeColor(55);
      assert.ok(badge.bg.includes("rose"));
      assert.ok(badge.text.includes("rose"));
      assert.strictEqual(badge.label, "Cần cải thiện");
    });
  });
});
