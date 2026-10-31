// ==============================================================================
// Cambridge Dictionary Web Scraper & Parser Engine
// Extracts IPA phonetics, Native MP3 audio, Parts of Speech, Definitions,
// Vietnamese translations, and Example sentences directly from Cambridge Dictionary
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
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Pure parsing function using Cheerio. Separated from network fetch to enable
 * reliable unit testing with HTML fixtures and offline test execution.
 */
export function parseCambridgeHtml(html: string, word: string): CambridgeWordEntry | null {
  if (!html || !html.trim()) return null;

  const $ = cheerio.load(html);

  // Check if Cambridge returned a "not found" page or search suggestion page
  const pageTitle = $("title").text().toLowerCase();
  if (
    pageTitle.includes("not found") ||
    pageTitle.includes("search suggestions") ||
    $(".hul-u").length > 0 && $(".pos-header").length === 0
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
  // Clean up if multiple (e.g., "noun [ C ]" -> "noun")
  mainPos = mainPos.split(" ")[0].toLowerCase();

  // 4. Definitions, Vietnamese Translations & Examples
  const definitions: CambridgeDefinition[] = [];

  $(".def-block").each((_, block) => {
    const $block = $(block);

    // Find the part of speech for this specific block if available
    const blockPos =
      $block.closest(".entry-body__el").find(".pos").first().text().trim().split(" ")[0].toLowerCase() ||
      mainPos;

    // English explanation
    const englishDef = $block.find(".def.ddef_d").text().trim();

    // Vietnamese translation (if available in english-vietnamese dictionary)
    const vietnameseTranslation = $block.find(".trans.dtrans").first().text().trim();

    // Contextual examples
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
  };
}

/**
 * Fetches and extracts Cambridge Dictionary data for a given word.
 * Prefers the official English-Vietnamese dictionary; falls back to English-English if not found.
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
      next: { revalidate: 86400 }, // Cache on server for 24 hours
    });

    if (viRes.ok) {
      const html = await viRes.text();
      const parsed = parseCambridgeHtml(html, word);
      if (parsed && parsed.definitions.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Cambridge EN-VI fetch error, trying English-English fallback:", err);
  }

  // 2. Fallback to Cambridge English-English dictionary
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
      return parseCambridgeHtml(html, word);
    }
  } catch (err) {
    console.error("Cambridge EN-EN fetch error:", err);
  }

  return null;
}
