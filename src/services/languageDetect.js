'use strict';

/**
 * Detects a document's primary language from its text by counting very
 * common function words, which differ sharply between languages. Returns an
 * ISO 639-1 code only when the evidence is clear; otherwise null, so the
 * caller leaves /Lang for a person to set instead of guessing. A wrong
 * language is worse than none: screen readers would mispronounce every word.
 *
 * Words shared by several of these languages ("de", "que", "la", "en") are
 * left out on purpose, so each hit points at one language.
 */
const STOPWORDS = {
  en: ['the', 'and', 'of', 'to', 'is', 'that', 'for', 'with', 'this', 'are', 'was', 'be',
    'have', 'from', 'which', 'or', 'by', 'not', 'it', 'you', 'your', 'will', 'can', 'on', 'at'],
  fr: ['le', 'les', 'des', 'est', 'et', 'une', 'dans', 'pour', 'pas', 'sur', 'qui', 'avec',
    'sont', 'cette', 'aux', 'du', 'au', 'nous', 'vous', 'être', 'ce'],
  es: ['el', 'los', 'las', 'del', 'y', 'es', 'más', 'pero', 'sus', 'también', 'muy', 'hay',
    'cuando', 'sobre', 'entre', 'todo', 'ya', 'ha', 'fue'],
  de: ['der', 'die', 'und', 'das', 'ist', 'nicht', 'mit', 'ein', 'eine', 'den', 'dem', 'zu',
    'von', 'für', 'auf', 'sich', 'auch', 'werden', 'wird', 'sind'],
  it: ['il', 'che', 'di', 'della', 'sono', 'per', 'non', 'gli', 'delle', 'degli', 'nel',
    'alla', 'anche', 'questo', 'è', 'più'],
  pt: ['os', 'não', 'uma', 'do', 'dos', 'das', 'com', 'em', 'ao', 'são', 'também', 'pelo',
    'pela', 'seu', 'sua'],
  nl: ['het', 'een', 'van', 'dat', 'niet', 'zijn', 'wordt', 'worden', 'ook', 'bij', 'voor',
    'aan', 'met', 'naar', 'deze'],
};

const LOOKUP = new Map();
for (const [lang, words] of Object.entries(STOPWORDS)) {
  for (const word of words) {
    LOOKUP.set(word, lang);
  }
}

// Clear evidence: enough hits overall, and a decisive lead over the runner-up.
const MIN_HITS = 12;
const MIN_LEAD = 3;

function detectLanguage(text) {
  if (!text) {
    return null;
  }
  const counts = {};
  const words = text.toLowerCase().match(/\p{L}+/gu) || [];
  for (const word of words) {
    const lang = LOOKUP.get(word);
    if (lang) {
      counts[lang] = (counts[lang] || 0) + 1;
    }
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    return null;
  }
  const [[best, hits], second] = ranked;
  if (hits < MIN_HITS || hits < (second ? second[1] : 0) * MIN_LEAD) {
    return null;
  }
  return best;
}

module.exports = { detectLanguage };
