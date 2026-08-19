// readability.js
// Pure client-side readability/complexity scoring. No network calls.
// Exposed on window.CognitiveLoad so content.js can use it.

(function () {
  const VOWELS = /[aeiouy]+/g;

  // Rough syllable counter (English heuristic - not perfect, but consistent
  // and fast enough to run on every word on a page).
  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 0;
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const matches = word.match(VOWELS);
    return matches ? Math.max(matches.length, 1) : 1;
  }

  function splitSentences(text) {
    // Split on sentence-ending punctuation, keep it simple and fast.
    return text
      .split(/(?<=[.!?])\s+(?=[A-Z"'\u2018\u201C])/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  function splitWords(sentence) {
    return sentence.match(/[A-Za-z']+/g) || [];
  }

  // Flesch-Kincaid Grade Level formula.
  function fleschKincaidGrade(words, sentenceCount) {
    const wordCount = words.length;
    if (wordCount === 0 || sentenceCount === 0) return 0;
    const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
    return (
      0.39 * (wordCount / sentenceCount) +
      11.8 * (syllableCount / wordCount) -
      15.59
    );
  }

  const PASSIVE_MARKERS = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i;
  const HEDGE_JARGON = /\b(notwithstanding|heretofore|pursuant|aforementioned|utilize|facilitate|leverage|synerg\w*|paradigm|methodology|infrastructure)\b/i;

  // Score a single sentence. Returns a 0-100+ complexity score plus
  // a breakdown so the UI/tooltip can explain *why* it was flagged.
  function scoreSentence(sentence) {
    const words = splitWords(sentence);
    const wordCount = words.length;
    if (wordCount < 4) {
      return { score: 0, grade: 0, longWordRatio: 0, clauseCount: 0, passive: false, jargon: false, wordCount };
    }

    const grade = fleschKincaidGrade(words, 1);

    const longWords = words.filter((w) => countSyllables(w) >= 4);
    const longWordRatio = longWords.length / wordCount;

    const clauseCount = (sentence.match(/[,;:]/g) || []).length;

    const passive = PASSIVE_MARKERS.test(sentence);
    const jargon = HEDGE_JARGON.test(sentence);

    // Weighted composite score, roughly 0-100+.
    // Grade level and clause count only count *above* a normal baseline
    // (grade 8, 2 clauses) so ordinary well-written text doesn't trigger —
    // only sentences that are unusually dense relative to typical prose.
    let score = 0;
    score += Math.max(grade - 8, 0) * 6;
    score += longWordRatio * 40;
    score += Math.max(clauseCount - 2, 0) * 6;
    score += passive ? 8 : 0;
    score += jargon ? 12 : 0;

    return { score, grade, longWordRatio, clauseCount, passive, jargon, wordCount };
  }

  // Analyze a block of text, returning per-sentence results.
  function analyzeText(text) {
    const sentences = splitSentences(text);
    return sentences.map((sentence) => ({
      sentence,
      ...scoreSentence(sentence),
    }));
  }

  window.CognitiveLoad = {
    countSyllables,
    splitSentences,
    splitWords,
    fleschKincaidGrade,
    scoreSentence,
    analyzeText,
  };
})();