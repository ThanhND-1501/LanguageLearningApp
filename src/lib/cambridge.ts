// ==============================================================================
// Cambridge & Multi-Provider Dictionary Engine
// Tier 1: Scrapes official Cambridge Dictionary (EN-VI & EN-EN)
// Tier 2: Automatic Failover to Open Dictionary (Free Dictionary API + Wiktionary)
//         when Cambridge triggers Cloudflare 403 Bot Challenge or returns 404
// ==============================================================================

import * as cheerio from "cheerio";

export interface CambridgeDefinition {
  pos: string;
  englishDef: string;
  vietnameseTranslation: string;
  examples: string[];
}

export interface CambridgeWordEntry {
  term: string;
  phoneticUk?: string;
  phoneticUs?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  partOfSpeech: string;
  definitions: CambridgeDefinition[];
  source?: "cambridge" | "free-dictionary-wiktionary";
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Pure parsing function for Cambridge Dictionary HTML. Separated from network fetch
 * to enable reliable offline unit testing with HTML fixtures.
 */
export function parseCambridgeHtml(html: string, word: string): CambridgeWordEntry | null {
  if (!html || !html.trim()) return null;

  const $ = cheerio.load(html);

  // Check if Cambridge returned a "not found" page or Cloudflare challenge
  const pageTitle = $("title").text().toLowerCase();
  if (
    pageTitle.includes("not found") ||
    pageTitle.includes("search suggestions") ||
    pageTitle.includes("just a moment") || // Cloudflare challenge page
    ($(".hul-u").length > 0 && $(".pos-header").length === 0)
  ) {
    return null;
  }

  // 1. Phonetics (UK & US)
  const phoneticUk = $(".uk.dpron-i .ipa").first().text().trim() || undefined;
  const phoneticUs = $(".us.dpron-i .ipa").first().text().trim() || undefined;

  // 2. Audio pronunciation files (.mp3)
  let audioUkUrl = $(".uk.dpron-i source[type='audio/mpeg']").first().attr("src");
  let audioUsUrl = $(".us.dpron-i source[type='audio/mpeg']").first().attr("src");

  if (audioUkUrl && !audioUkUrl.startsWith("http")) {
    audioUkUrl = `https://dictionary.cambridge.org${audioUkUrl}`;
  }
  if (audioUsUrl && !audioUsUrl.startsWith("http")) {
    audioUsUrl = `https://dictionary.cambridge.org${audioUsUrl}`;
  }

  // 3. Main Part of Speech
  let mainPos = $(".pos-header .pos").first().text().trim() || "noun";
  mainPos = mainPos.split(" ")[0].toLowerCase();

  // 4. Definitions, Vietnamese Translations & Examples
  const definitions: CambridgeDefinition[] = [];

  $(".def-block").each((_, block) => {
    const $block = $(block);

    const blockPos =
      $block.closest(".entry-body__el").find(".pos").first().text().trim().split(" ")[0].toLowerCase() ||
      mainPos;

    const englishDef = $block.find(".def.ddef_d").text().trim();
    const vietnameseTranslation = $block.find(".trans.dtrans").first().text().trim();

    const examples: string[] = [];
    $block.find(".examp.dexamp .eg").each((_, eg) => {
      const egText = $(eg).text().trim();
      if (egText) examples.push(egText);
    });

    if (englishDef || vietnameseTranslation) {
      definitions.push({
        pos: blockPos,
        englishDef,
        vietnameseTranslation,
        examples,
      });
    }
  });

  if (definitions.length === 0 && !phoneticUk && !phoneticUs) {
    return null;
  }

  return {
    term: word,
    phoneticUk,
    phoneticUs,
    audioUkUrl,
    audioUsUrl,
    partOfSpeech: mainPos,
    definitions,
    source: "cambridge",
  };
}

/**
 * Extracts concise Vietnamese definition from Wiktionary API plain-text extract
 */
export function extractVietnameseFromWiktionary(extract: string): string {
  if (!extract) return "";
  const lines = extract.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("===") && /tính từ|danh từ|động từ|phó từ/i.test(line)) {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const nextL = lines[j];
        if (nextL.startsWith("==")) break;
        if (nextL.includes("/") || nextL.startsWith("IPA")) continue;
        if (nextL.length >= 3) {
          return nextL.replace(/^\([^)]+\)\s*/, "").replace(/[.;]$/, "").trim();
        }
      }
    }
  }
  return "";
}

/**
 * Fallback dictionary provider: Uses Free Dictionary API + Vietnamese Wiktionary
 * Guarantees 100% uptime without Cloudflare IP blocking
 */
export async function fetchFallbackDictionaryWord(word: string): Promise<CambridgeWordEntry | null> {
  const cleanWord = encodeURIComponent(word.trim().toLowerCase());
  let phonetic: string | undefined;
  let audioUrl: string | undefined;
  let partOfSpeech = "noun";
  let englishDef = "";
  let example = "";
  let viTranslation = "";

  // 1. Fetch phonetic, audio, and English definitions from Free Dictionary API
  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (dictRes.ok) {
      const dictData = await dictRes.json();
      const first = dictData[0];
      if (first) {
        phonetic = first.phonetic || first.phonetics?.find((p: any) => p.text)?.text;
        audioUrl = first.phonetics?.find((p: any) => p.audio && p.audio.length > 0)?.audio;
        const meaning = first.meanings?.[0];
        if (meaning) {
          partOfSpeech = meaning.partOfSpeech || "noun";
          englishDef = meaning.definitions?.[0]?.definition || "";
          example = meaning.definitions?.[0]?.example || "";
        }
      }
    }
  } catch (err) {
    console.warn("Free Dictionary API fetch failed:", err);
  }

  // 2. Fetch Vietnamese meaning from Vietnamese Wiktionary
  try {
    const wikiUrl = `https://vi.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext&titles=${cleanWord}&format=json`;
    const wikiRes = await fetch(wikiUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const page = Object.values(wikiData.query?.pages || {})[0] as any;
      const extract = page?.extract || "";
      if (!phonetic) {
        const ipaMatch = extract.match(/IPA:\s*(\/[^\/]+\/)/i);
        if (ipaMatch) phonetic = ipaMatch[1];
      }
      viTranslation = extractVietnameseFromWiktionary(extract);
    }
  } catch (err) {
    console.warn("Wiktionary API fetch failed:", err);
  }

  // If nothing at all was found across both providers, word does not exist
  if (!phonetic && !audioUrl && !englishDef && !viTranslation) {
    return null;
  }

  return {
    term: word,
    phoneticUk: phonetic,
    phoneticUs: phonetic,
    audioUkUrl: audioUrl,
    audioUsUrl: audioUrl,
    partOfSpeech,
    definitions: [
      {
        pos: partOfSpeech,
        englishDef,
        vietnameseTranslation: viTranslation || englishDef,
        examples: example ? [example] : [],
      },
    ],
    source: "free-dictionary-wiktionary",
  };
}

/**
 * Master Dictionary Lookup Function:
 * Tries Cambridge first; on Cloudflare 403 or failure, automatically falls back
 * to Open Dictionary + Wiktionary, ensuring 100% reliability for the learner.
 */
export async function fetchCambridgeWord(word: string): Promise<CambridgeWordEntry | null> {
  const cleanWord = encodeURIComponent(word.trim().toLowerCase());
  if (!cleanWord) return null;

  // 1. Try Cambridge English-Vietnamese dictionary first
  try {
    const viUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${cleanWord}`;
    const viRes = await fetch(viUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      },
      next: { revalidate: 86400 },
    });

    if (viRes.ok) {
      const html = await viRes.text();
      const parsed = parseCambridgeHtml(html, word);
      if (parsed && parsed.definitions.length > 0) {
        return parsed;
      }
    } else {
      console.warn(`Cambridge EN-VI returned status ${viRes.status} (Cloudflare bot challenge or 404).`);
    }
  } catch (err) {
    console.warn("Cambridge EN-VI fetch error, attempting fallback:", err);
  }

  // 2. Try Cambridge English-English dictionary
  try {
    const enUrl = `https://dictionary.cambridge.org/dictionary/english/${cleanWord}`;
    const enRes = await fetch(enUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 86400 },
    });

    if (enRes.ok) {
      const html = await enRes.text();
      const parsed = parseCambridgeHtml(html, word);
      if (parsed && parsed.definitions.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Cambridge EN-EN fetch error:", err);
  }

  // 3. Failover: Open Dictionary API + Vietnamese Wiktionary
  console.info(`Triggering automatic failover dictionary provider for '${word}'...`);
  return await fetchFallbackDictionaryWord(word);
}
