import { describe, it, assert, beforeEach, afterEach } from "./test-helper";
import {
  parseCambridgeHtml,
  extractVietnameseFromWiktionary,
  fetchFallbackDictionaryWord,
  fetchCambridgeWord,
} from "../src/lib/cambridge";
import { GET } from "../src/app/api/dictionary/lookup/route";

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

const CLOUDFLARE_CHALLENGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Just a moment...</title></head>
<body>
  <div id="cf-turnstile-wrapper">Please complete security challenge to proceed to dictionary.cambridge.org</div>
</body>
</html>
`;

const SAMPLE_WIKTIONARY_EXTRACT = `
=== Từ nguyên ===
Từ tiếng Latinh resiliens.

=== Tính từ ===
(thuộc) kiên cường, có khả năng phục hồi nhanh chóng.
Vật liệu có tính đàn hồi cao.

=== Danh từ ===
Sự phục hồi.
`;

describe("Cambridge Dictionary Scraper & Parser (cambridge.ts)", () => {
  it("should extract IPA phonetics for UK and US", () => {
    const entry = parseCambridgeHtml(SAMPLE_CAMBRIDGE_EN_VI_HTML, "resilient");

    assert.ok(entry !== null);
    assert.strictEqual(entry.term, "resilient");
    assert.strictEqual(entry.phoneticUk, "/rɪˈzɪl.jənt/");
    assert.strictEqual(entry.phoneticUs, "/rɪˈzɪl.jənt/");
    assert.strictEqual(entry.source, "cambridge");
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

  it("should return null when Cambridge triggers Cloudflare challenge (403 HTML)", () => {
    const entry = parseCambridgeHtml(CLOUDFLARE_CHALLENGE_HTML, "resilient");
    assert.strictEqual(entry, null);
  });

  it("should return null for empty HTML input", () => {
    const entry = parseCambridgeHtml("", "test");
    assert.strictEqual(entry, null);
  });
});

describe("Wiktionary Vietnamese Extractor (cambridge.ts)", () => {
  it("should extract clean Vietnamese definition and remove parenthetical qualifiers", () => {
    const viText = extractVietnameseFromWiktionary(SAMPLE_WIKTIONARY_EXTRACT);
    assert.strictEqual(viText, "kiên cường, có khả năng phục hồi nhanh chóng");
  });

  it("should return empty string on invalid or blank extract", () => {
    assert.strictEqual(extractVietnameseFromWiktionary(""), "");
    assert.strictEqual(extractVietnameseFromWiktionary("Chỉ có một dòng không hợp lệ"), "");
  });
});

describe("Multi-Tier Failover & 404 Resolution Engine (cambridge.ts)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should auto-failover to Free Dictionary + Wiktionary when Cambridge blocks with 403", async () => {
    // Simulate: Cambridge returns HTTP 403 Forbidden (Cloudflare Challenge)
    // and Free Dictionary + Wiktionary respond successfully
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("dictionary.cambridge.org")) {
        return new Response(CLOUDFLARE_CHALLENGE_HTML, {
          status: 403,
          statusText: "Forbidden",
          headers: { "content-type": "text/html" },
        });
      }

      if (url.includes("api.dictionaryapi.dev")) {
        const mockApiResponse = [
          {
            word: "resilient",
            phonetic: "/rɪˈzɪl.jənt/",
            phonetics: [
              {
                text: "/rɪˈzɪl.jənt/",
                audio: "https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3",
              },
            ],
            meanings: [
              {
                partOfSpeech: "adjective",
                definitions: [
                  {
                    definition: "Able to withstand or recover quickly from difficult conditions.",
                    example: "Babies are generally far more resilient than new parents realize.",
                  },
                ],
              },
            ],
          },
        ];
        return new Response(JSON.stringify(mockApiResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.includes("vi.wiktionary.org")) {
        const mockWikiResponse = {
          query: {
            pages: {
              "12345": {
                extract: SAMPLE_WIKTIONARY_EXTRACT,
              },
            },
          },
        };
        return new Response(JSON.stringify(mockWikiResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response("Not found", { status: 404 });
    }) as any;

    const result = await fetchCambridgeWord("resilient");

    assert.ok(result !== null);
    assert.strictEqual(result.term, "resilient");
    assert.strictEqual(result.source, "free-dictionary-wiktionary");
    assert.strictEqual(result.phoneticUs, "/rɪˈzɪl.jənt/");
    assert.strictEqual(
      result.audioUsUrl,
      "https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3"
    );
    assert.strictEqual(result.partOfSpeech, "adjective");
    assert.strictEqual(
      result.definitions[0].vietnameseTranslation,
      "kiên cường, có khả năng phục hồi nhanh chóng"
    );
    assert.ok(result.definitions[0].englishDef.includes("recover quickly"));
  });

  it("should return null when word does not exist in any dictionary provider", async () => {
    globalThis.fetch = (async () => {
      return new Response("Not Found", { status: 404 });
    }) as any;

    const result = await fetchCambridgeWord("thisisnotarealword998877");
    assert.strictEqual(result, null);
  });
});

describe("Dictionary API Route Handler (/api/dictionary/lookup)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return 400 Bad Request when 'word' query param is missing", async () => {
    const request = new Request("http://localhost:3000/api/dictionary/lookup");
    const response = await GET(request);

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes("Tham số 'word'"));
  });

  it("should return 200 with dictionary entry when word is found", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("dictionary.cambridge.org/dictionary/english-vietnamese")) {
        return new Response(SAMPLE_CAMBRIDGE_EN_VI_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }
      return new Response("Not found", { status: 404 });
    }) as any;

    const request = new Request("http://localhost:3000/api/dictionary/lookup?word=resilient");
    const response = await GET(request);

    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.term, "resilient");
    assert.strictEqual(body.data.partOfSpeech, "adjective");
    assert.strictEqual(body.data.definitions[0].vietnameseTranslation, "kiên cường, mau phục hồi");
  });

  it("should return 404 when word cannot be found anywhere", async () => {
    globalThis.fetch = (async () => {
      return new Response("Not Found", { status: 404 });
    }) as any;

    const request = new Request("http://localhost:3000/api/dictionary/lookup?word=gibberishxyz");
    const response = await GET(request);

    assert.strictEqual(response.status, 404);
    const body = await response.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes("Không tìm thấy từ"));
  });
});
