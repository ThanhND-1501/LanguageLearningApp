import { describe, it, assert } from "./test-helper";
import { parseCambridgeHtml } from "../src/lib/cambridge";

const SAMPLE_CAMBRIDGE_EN_VI_HTML = `
<!DOCTYPE html>
<html>
<head><title>RESILIENT | Định nghĩa trong Từ điển tiếng Anh Cambridge</title></head>
<body>
  <div class="pos-header dpos-h">
    <div class="di-title"><span class="hw dhw">resilient</span></div>
    <span class="pos dpos">adjective</span>
    <span class="uk dpron-i">
      <span class="ipa dipa">/rɪˈzɪl.jənt/</span>
      <span class="daud">
        <audio id="audio1">
          <source type="audio/mpeg" src="/media/english/uk_pron/u/ukr/ukres/ukresil001.mp3" />
        </audio>
      </span>
    </span>
    <span class="us dpron-i">
      <span class="ipa dipa">/rɪˈzɪl.jənt/</span>
      <span class="daud">
        <audio id="audio2">
          <source type="audio/mpeg" src="/media/english/us_pron/r/res/resil/resilient.mp3" />
        </audio>
      </span>
    </span>
  </div>

  <div class="entry-body__el">
    <div class="def-block ddef_block">
      <div class="ddef_h">
        <div class="def ddef_d db">able to be happy, successful, etc. again after something difficult</div>
      </div>
      <span class="trans dtrans dtrans-se">kiên cường, mau phục hồi</span>
      <div class="examp dexamp">
        <span class="eg deg">Life is hard there, but the people are resilient.</span>
      </div>
      <div class="examp dexamp">
        <span class="eg deg">The US economy remains amazingly resilient.</span>
      </div>
    </div>
  </div>
</body>
</html>
`;

const NOT_FOUND_HTML = `
<!DOCTYPE html>
<html>
<head><title>Cambridge Dictionary | English Dictionary, Translations &amp; Thesaurus</title></head>
<body>
  <div class="hul-u">
    <p>No results found for xyznotarealword123.</p>
  </div>
</body>
</html>
`;

describe("Cambridge Dictionary Scraper & Parser (cambridge.ts)", () => {
  it("should extract IPA phonetics for UK and US", () => {
    const entry = parseCambridgeHtml(SAMPLE_CAMBRIDGE_EN_VI_HTML, "resilient");

    assert.ok(entry !== null);
    assert.strictEqual(entry.term, "resilient");
    assert.strictEqual(entry.phoneticUk, "/rɪˈzɪl.jənt/");
    assert.strictEqual(entry.phoneticUs, "/rɪˈzɪl.jənt/");
  });

  it("should format relative audio URLs to absolute Cambridge CDN URLs", () => {
    const entry = parseCambridgeHtml(SAMPLE_CAMBRIDGE_EN_VI_HTML, "resilient");

    assert.ok(entry !== null);
    assert.strictEqual(
      entry.audioUkUrl,
      "https://dictionary.cambridge.org/media/english/uk_pron/u/ukr/ukres/ukresil001.mp3"
    );
    assert.strictEqual(
      entry.audioUsUrl,
      "https://dictionary.cambridge.org/media/english/us_pron/r/res/resil/resilient.mp3"
    );
  });

  it("should parse part of speech correctly", () => {
    const entry = parseCambridgeHtml(SAMPLE_CAMBRIDGE_EN_VI_HTML, "resilient");

    assert.ok(entry !== null);
    assert.strictEqual(entry.partOfSpeech, "adjective");
  });

  it("should extract English definition, Vietnamese translation, and examples", () => {
    const entry = parseCambridgeHtml(SAMPLE_CAMBRIDGE_EN_VI_HTML, "resilient");

    assert.ok(entry !== null);
    assert.strictEqual(entry.definitions.length, 1);

    const def = entry.definitions[0];
    assert.ok(def.englishDef.includes("able to be happy"));
    assert.strictEqual(def.vietnameseTranslation, "kiên cường, mau phục hồi");
    assert.strictEqual(def.examples.length, 2);
    assert.strictEqual(def.examples[0], "Life is hard there, but the people are resilient.");
  });

  it("should return null when Cambridge returns a not-found page", () => {
    const entry = parseCambridgeHtml(NOT_FOUND_HTML, "xyznotarealword123");
    assert.strictEqual(entry, null);
  });

  it("should return null for empty HTML input", () => {
    const entry = parseCambridgeHtml("", "test");
    assert.strictEqual(entry, null);
  });
});
