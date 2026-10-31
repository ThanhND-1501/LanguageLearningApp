import { describe, it, assert } from "./test-helper";
import { simulatePronAssessment } from "../src/lib/azure-speech";

describe("Azure Speech Assessment & Simulator (azure-speech.ts)", () => {
  it("should generate comprehensive scores within 0-100 bounds", () => {
    const reference = "Children are remarkably resilient to changes.";
    const transcript = "Children are remarkably resilient to changes.";

    const result = simulatePronAssessment(reference, transcript);

    assert.ok(result.pronScore >= 0 && result.pronScore <= 100);
    assert.ok(result.accuracyScore >= 0 && result.accuracyScore <= 100);
    assert.ok(result.fluencyScore >= 0 && result.fluencyScore <= 100);
    assert.ok(result.completenessScore >= 0 && result.completenessScore <= 100);
    assert.ok(result.prosodyScore >= 0 && result.prosodyScore <= 100);
  });

  it("should provide word-level scores matching the target words count", () => {
    const reference = "touch base soon";
    const transcript = "touch base soon";

    const result = simulatePronAssessment(reference, transcript);

    assert.strictEqual(result.wordScores.length, 3);
    assert.strictEqual(result.wordScores[0].word, "touch");
    assert.strictEqual(result.wordScores[1].word, "base");
    assert.strictEqual(result.wordScores[2].word, "soon");
  });

  it("should penalize score when words are missing from spoken transcript", () => {
    const reference = "children are remarkably resilient to changes";
    const transcript = "children are"; // missed 4 words

    const result = simulatePronAssessment(reference, transcript);

    assert.ok(result.completenessScore < 50);
  });
});
