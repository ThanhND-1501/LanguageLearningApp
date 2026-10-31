import { describe, it, assert, beforeEach, afterEach } from "./test-helper";
import {
  hashPassword,
  registerLocalUser,
  loginLocalUser,
  loginDemoUser,
  logoutUser,
  getActiveUser,
  updateUserProfile,
  recordStudyActivity,
  getUserActivities,
  getUserPersonalStats,
  clearAuthStorageForTesting,
  DEMO_USER,
} from "../src/lib/auth";

describe("Authentication & Account Engine (auth.ts)", () => {
  beforeEach(() => {
    clearAuthStorageForTesting();
  });

  afterEach(() => {
    clearAuthStorageForTesting();
  });

  describe("Password Hashing", () => {
    it("should generate a consistent 64-character SHA-256 hex string", async () => {
      const hash1 = await hashPassword("mySecretPass123");
      const hash2 = await hashPassword("mySecretPass123");

      assert.strictEqual(hash1.length, 64);
      assert.strictEqual(hash1, hash2);
    });

    it("should produce different hashes for different passwords", async () => {
      const hash1 = await hashPassword("passA");
      const hash2 = await hashPassword("passB");
      assert.notStrictEqual(hash1, hash2);
    });
  });

  describe("User Registration", () => {
    it("should reject registration with empty name or invalid email", async () => {
      await assert.rejects(
        async () => registerLocalUser("", "user@test.com", "123456"),
        { message: "Vui lòng nhập tên hiển thị" }
      );

      await assert.rejects(
        async () => registerLocalUser("John", "invalidemail", "123456"),
        { message: "Địa chỉ email không hợp lệ" }
      );
    });

    it("should reject password shorter than 6 characters", async () => {
      await assert.rejects(
        async () => registerLocalUser("John", "john@test.com", "12345"),
        { message: "Mật khẩu phải chứa ít nhất 6 ký tự" }
      );
    });

    it("should successfully register a new user and set active session", async () => {
      const user = await registerLocalUser("Thanh Nguyen", "thanh@lingo.com", "secret123", "IELTS 7.5+");

      assert.ok(user.id.startsWith("user-"));
      assert.strictEqual(user.name, "Thanh Nguyen");
      assert.strictEqual(user.email, "thanh@lingo.com");
      assert.strictEqual(user.targetLevel, "IELTS 7.5+");
      assert.strictEqual(user.streakDays, 1);

      const active = getActiveUser();
      assert.ok(active !== null);
      assert.strictEqual(active?.email, "thanh@lingo.com");
    });

    it("should reject registration with already registered email", async () => {
      await registerLocalUser("User 1", "duplicate@test.com", "pass123456");

      await assert.rejects(
        async () => registerLocalUser("User 2", "duplicate@test.com", "differentpass"),
        { message: "Email này đã được đăng ký trên hệ thống." }
      );
    });
  });

  describe("User Login & Session", () => {
    it("should reject non-existent email", async () => {
      await assert.rejects(
        async () => loginLocalUser("unknown@test.com", "somepass"),
        { message: "Không tìm thấy tài khoản với email này." }
      );
    });

    it("should reject incorrect password", async () => {
      await registerLocalUser("Alice", "alice@test.com", "correctpassword");

      await assert.rejects(
        async () => loginLocalUser("alice@test.com", "wrongpassword"),
        { message: "Mật khẩu không chính xác." }
      );
    });

    it("should successfully authenticate with valid credentials", async () => {
      await registerLocalUser("Alice", "alice@test.com", "correctpassword", "C1");
      clearAuthStorageForTesting(); // Simulate new session without active user

      assert.strictEqual(getActiveUser(), null);

      // Now register Alice in stored accounts:
      await registerLocalUser("Alice", "alice@test.com", "correctpassword", "C1");
      logoutUser();

      const user = await loginLocalUser("alice@test.com", "correctpassword");
      assert.strictEqual(user.name, "Alice");
      assert.strictEqual(getActiveUser()?.email, "alice@test.com");
    });

    it("should allow instant 1-click Demo/Guest login and logout", async () => {
      const demo = loginDemoUser();
      assert.strictEqual(demo.email, DEMO_USER.email);
      assert.strictEqual(getActiveUser()?.email, DEMO_USER.email);

      await logoutUser();
      assert.strictEqual(getActiveUser(), null);
    });
  });

  describe("Profile Management & Activity Logging", () => {
    it("should update user profile settings", async () => {
      await registerLocalUser("Bob", "bob@test.com", "pass123456");
      const updated = await updateUserProfile({
        name: "Robert",
        targetLevel: "IELTS 7.5+",
        dailyGoalCards: 25,
      });

      assert.strictEqual(updated.name, "Robert");
      assert.strictEqual(updated.targetLevel, "IELTS 7.5+");
      assert.strictEqual(updated.dailyGoalCards, 25);
      assert.strictEqual(getActiveUser()?.name, "Robert");
    });

    it("should record study activities and retrieve them in reverse chronological order", async () => {
      const user = await registerLocalUser("Charlie", "charlie@test.com", "pass123456");

      recordStudyActivity({
        type: "cambridge_lookup",
        title: "Tra Cambridge: ubiquitous",
        description: "Bóc tách phát âm và câu ví dụ cho 'ubiquitous'",
        metadata: { term: "ubiquitous" },
      }, user.id);

      recordStudyActivity({
        type: "speech_practice",
        title: "Luyện phản xạ nói",
        description: "Đạt 88 điểm PronScore",
        metadata: { term: "ubiquitous", score: 88 },
      }, user.id);

      const activities = getUserActivities(user.id);
      assert.ok(activities.length >= 2);
      assert.strictEqual(activities[0].type, "speech_practice");
      assert.strictEqual(activities[1].type, "cambridge_lookup");
      assert.strictEqual(activities[0].metadata?.score, 88);
    });

    it("should compute personalized learning stats correctly", async () => {
      const user = await registerLocalUser("David", "david@test.com", "pass123456");

      recordStudyActivity({
        type: "speech_practice",
        title: "Luyện phát âm",
        description: "Test score",
        metadata: { score: 90 },
      }, user.id);

      // Fresh state: 0 words initially
      const initialStats = getUserPersonalStats(user.id);
      assert.strictEqual(initialStats.totalWords, 0);
      assert.strictEqual(initialStats.masteredWords, 0);
      assert.strictEqual(initialStats.totalSpeakingAttempts, 1);
      assert.strictEqual(initialStats.avgPronScore, 90);

      // Demo user has pre-enrolled words
      const demoStats = getUserPersonalStats(DEMO_USER.id);
      assert.ok(demoStats.totalWords > 0);
    });
  });
});

