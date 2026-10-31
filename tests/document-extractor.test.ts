import { describe, it, assert } from "./test-helper";
import {
  extractTextFromDocumentBuffer,
  extractVocabularyFromDocument,
} from "../src/lib/document-extractor";

describe("Document-to-Flashcards Extraction Engine (document-extractor.ts)", () => {
  describe("Textual Document Buffer Parsing", () => {
    it("should extract text from plain text and markdown buffers", async () => {
      const sampleText = "The resilient economy recovered quickly. Smartphone usage is ubiquitous.";
      const buffer = Buffer.from(sampleText, "utf-8");

      const result = await extractTextFromDocumentBuffer(buffer, "text/plain", "economics.txt");
      assert.strictEqual(result.isTextual, true);
      assert.strictEqual(result.text, sampleText);

      const mdResult = await extractTextFromDocumentBuffer(buffer, "text/markdown", "notes.md");
      assert.strictEqual(mdResult.isTextual, true);
      assert.strictEqual(mdResult.text, sampleText);
    });

    it("should identify non-textual files like images as requiring multimodal AI", async () => {
      const dummyImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG signature
      const result = await extractTextFromDocumentBuffer(
        dummyImageBuffer,
        "image/png",
        "diagram.png"
      );
      assert.strictEqual(result.isTextual, false);
      assert.strictEqual(result.text, "");
    });
  });

  describe("Vocabulary Extraction Service", () => {
    it("should extract structured flashcards from text document buffer", async () => {
      const sampleText = `
        In modern society, researchers must collaborate to develop innovative, sustainable solutions.
        Maintaining an articulate perspective is essential for academic success.
        Smartphones have become ubiquitous across all demographics.
      `;
      const buffer = Buffer.from(sampleText, "utf-8");

      const result = await extractVocabularyFromDocument({
        fileName: "sustainable_development.txt",
        mimeType: "text/plain",
        buffer,
        level: "B2-C1",
        count: 5,
        deckTitle: "Kinh tế & Bền vững",
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.suggestedDeckTitle, "Kinh tế & Bền vững");
      assert.ok(result.cards.length >= 3);

      const firstCard = result.cards[0];
      assert.ok(firstCard.term);
      assert.ok(firstCard.phonetic);
      assert.ok(firstCard.partOfSpeech);
      assert.ok(firstCard.definition);
      assert.ok(firstCard.exampleSentence);
      assert.ok(firstCard.exampleTranslation);
      assert.ok(Array.isArray(firstCard.synonyms));
      assert.ok(firstCard.speakingPrompt);
    });

    it("should provide fallback extraction for images and documents gracefully", async () => {
      const dummyBuffer = Buffer.from("dummy image content");
      const result = await extractVocabularyFromDocument({
        fileName: "handout_scan.png",
        mimeType: "image/png",
        buffer: dummyBuffer,
        level: "C1",
        count: 4,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.cards.length, 4);
      assert.ok(result.fileType.includes("Hình ảnh"));
    });
  });
});

