import { dictionary as cmuDict } from 'cmu-pronouncing-dictionary';

// Mapping rules from ARPABET to IPA
const ARPA_TO_IPA: Record<string, string> = {
  // Vowels
  'AA': 'ɑ', 'AA0': 'ɑ', 'AA1': 'ˈɑ', 'AA2': 'ˌɑ',
  'AE': 'æ', 'AE0': 'æ', 'AE1': 'ˈæ', 'AE2': 'ˌæ',
  'AH': 'ʌ', 'AH0': 'ə', 'AH1': 'ˈʌ', 'AH2': 'ˌʌ',
  'AO': 'ɔ', 'AO0': 'ɔ', 'AO1': 'ˈɔ', 'AO2': 'ˌɔ',
  'AW': 'aʊ', 'AW0': 'aʊ', 'AW1': 'ˈaʊ', 'AW2': 'ˌaʊ',
  'AY': 'aɪ', 'AY0': 'aɪ', 'AY1': 'ˈaɪ', 'AY2': 'ˌaɪ',
  'EH': 'ɛ', 'EH0': 'ɛ', 'EH1': 'ˈɛ', 'EH2': 'ˌɛ',
  'ER': 'ɝ', 'ER0': 'ɚ', 'ER1': 'ˈɝ', 'ER2': 'ˌɝ',
  'EY': 'eɪ', 'EY0': 'eɪ', 'EY1': 'ˈeɪ', 'EY2': 'ˌeɪ',
  'IH': 'ɪ', 'IH0': 'ɪ', 'IH1': 'ˈɪ', 'IH2': 'ˌɪ',
  'IY': 'i', 'IY0': 'i', 'IY1': 'ˈi', 'IY2': 'ˌi',
  'OW': 'oʊ', 'OW0': 'oʊ', 'OW1': 'ˈoʊ', 'OW2': 'ˌoʊ',
  'OY': 'ɔɪ', 'OY0': 'ɔɪ', 'OY1': 'ˈɔɪ', 'OY2': 'ˌɔɪ',
  'UH': 'ʊ', 'UH0': 'ʊ', 'UH1': 'ˈʊ', 'UH2': 'ˌʊ',
  'UW': 'u', 'UW0': 'u', 'UW1': 'ˈu', 'UW2': 'ˌu',
  
  // Consonants
  'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð',
  'F': 'f', 'G': 'ɡ', 'HH': 'h', 'JH': 'dʒ',
  'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n',
  'NG': 'ŋ', 'P': 'p', 'R': 'ɹ', 'S': 's',
  'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v',
  'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'
};

export function arpaToIpa(arpaString: string): string {
  const phonemes = arpaString.split(' ');
  const ipa = phonemes.map(p => ARPA_TO_IPA[p] || p).join('');
  return ipa;
}

export function textToIpa(text: string): string {
  // Tokenize, lowercase, strip punctuation
  const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean);
  
  const ipaWords = words.map(word => {
    // some words might not be in the dictionary
    const arpa = cmuDict[word];
    if (arpa) {
      return arpaToIpa(arpa);
    }
    // Return original word if not found
    return word;
  });

  return `/${ipaWords.join(' ')}/`;
}

export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&#39;': "'",
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>'
  };
  return text.replace(/&#39;|&quot;|&amp;|&lt;|&gt;/g, match => entities[match] || match);
}

export function looksLikeEnglish(segments: { text: string }[]): boolean {
  if (segments.length === 0) return true;

  // Strip sound/music annotations before sampling — they are always non-language
  const cleaned = segments
    .slice(0, 10)
    .map(s => s.text
      .replace(/\u00a0/g, ' ')   // normalize non-breaking space (common in YouTube captions)
      .replace(/\[.*?\]/g, '')
      .replace(/♪/g, '')
      .trim()
    )
    .filter(t => t.length > 0);

  if (cleaned.length === 0) return true; // only annotations, can't tell — allow

  const sampleText = cleaned.join(' ');
  let englishCount = 0;

  for (let i = 0; i < sampleText.length; i++) {
    const code = sampleText.charCodeAt(i);
    const isAscii = code < 128;
    // Common English typographic characters that YouTube/npm package emits as Unicode:
    // smart quotes U+2018–U+201F, em-dash U+2014, en-dash U+2013, ellipsis U+2026
    const isEnglishTypography =
      (code >= 0x2018 && code <= 0x201f) ||
      code === 0x2014 ||
      code === 0x2013 ||
      code === 0x2026 ||
      code === 0x00a0; // non-breaking space

    if (isAscii || isEnglishTypography) englishCount++;
  }

  return sampleText.length === 0 || (englishCount / sampleText.length) > 0.75;
}
