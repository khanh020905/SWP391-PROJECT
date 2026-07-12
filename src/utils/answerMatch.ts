// Matches a user's typed answer against an IELTS answer key.
//
// Cambridge answer-key notation:
//   - "(...)" marks optional parts:  "answer(ing) (the) phone" accepts
//     "answer phone", "answering phone", "answer the phone", "answering the phone"
//   - "/" separates alternatives:    "after 11(:00)/eleven (o'clock)"
//   - "[or]" separates alternatives: "22(nd) October [or] October 22(nd)"
//   - "+" joins multi-blank answers: "Friday + Sunday" means one question number
//     with two blanks; every part is required, in either order
//
// Everything else is strict on purpose — IELTS requires exact spelling,
// so "national holiday" does NOT match the key "national holidays".

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

/** Expand every "(...)" group into its included and omitted variants. */
function expandOptionalParens(text: string): string[] {
  const open = text.indexOf("(")
  if (open === -1) return [text]
  const close = text.indexOf(")", open)
  if (close === -1) return [text]
  const before = text.slice(0, open)
  const inner = text.slice(open + 1, close)
  const after = text.slice(close + 1)
  return [
    ...expandOptionalParens(before + inner + after),
    ...expandOptionalParens(before + after),
  ]
}

/**
 * A "/" in a key can alternate the whole phrase OR a single word —
 * "after 11(:00)/eleven (o'clock)" means "after [11 | 11:00 | eleven | eleven o'clock]".
 * Expand the word-level reading: each "a/b" token branches per word.
 */
function expandWordLevelSlashes(text: string): string[] {
  let phrases = [""]
  for (const token of text.split(/\s+/)) {
    const choices = token.includes("/") ? token.split("/").filter(Boolean) : [token]
    if (choices.length === 0) continue
    phrases = phrases.flatMap((p) => choices.map((c) => (p ? `${p} ${c}` : c)))
    if (phrases.length > 64) return [] // runaway key — fall back to phrase-level reading
  }
  return phrases
}

/** All normalized strings a key like "answer(ing) (the) phone" accepts. */
export function expandAnswerKey(answerKey: string): string[] {
  const variants = new Set<string>()
  const addExpanded = (alt: string) => {
    for (const v of expandOptionalParens(alt)) {
      const n = normalize(v)
      if (n) variants.add(n)
    }
  }
  for (const phrase of answerKey.split(/\[or\]/i)) {
    // Phrase-level reading: "/" separates complete alternatives
    for (const alt of phrase.split("/")) addExpanded(alt)
    // Word-level reading: "/" alternates a single word inside the phrase
    if (phrase.includes("/")) {
      for (const alt of expandWordLevelSlashes(phrase)) addExpanded(alt)
    }
  }
  return [...variants]
}

/**
 * Multi-blank key like "Friday + Sunday": the user's answer must supply every
 * part, each matching a distinct key part, in any order.
 */
function matchesMultiPartKey(userAnswer: string, keyParts: string[]): boolean {
  // Split the user's answer with the first separator that yields the right part count
  let userParts: string[] | null = null
  for (const sep of [/\s*\+\s*/, /\s*&\s*/, /\s*,\s*/, /\s+and\s+/i]) {
    const parts = userAnswer.split(sep).map((p) => p.trim()).filter(Boolean)
    if (parts.length === keyParts.length) { userParts = parts; break }
  }
  if (!userParts) return false

  const used = new Array(keyParts.length).fill(false)
  const assign = (i: number): boolean => {
    if (i === userParts!.length) return true
    for (let k = 0; k < keyParts.length; k++) {
      if (!used[k] && matchesAnswerKey(userParts![i], keyParts[k])) {
        used[k] = true
        if (assign(i + 1)) return true
        used[k] = false
      }
    }
    return false
  }
  return assign(0)
}

/** Case/whitespace-insensitive check of a typed answer against an answer key. */
export function matchesAnswerKey(
  userAnswer: string | undefined | null,
  answerKey: string | undefined | null
): boolean {
  if (!userAnswer || !answerKey) return false

  const multiParts = answerKey.split("+").map((p) => p.trim()).filter(Boolean)
  if (multiParts.length > 1) return matchesMultiPartKey(userAnswer, multiParts)

  // Strip parens the user typed themselves (e.g. copying the key's notation)
  const user = normalize(userAnswer.replace(/[()]/g, ""))
  if (!user) return false

  // Multi-select keys like "A,C" (choose-TWO questions). The UI distributes one
  // letter per question number, so a single letter scores if it's in the key set;
  // a comma-joined selection must equal the whole set, order-insensitive.
  // Restricted to single-letter parts so number keys like "1,000" stay exact.
  const keyParts = answerKey.split(",").map((p) => normalize(p)).filter(Boolean)
  if (keyParts.length > 1 && keyParts.every((p) => /^[a-z]$/.test(p))) {
    const userParts = user.split(",").map((p) => p.trim()).filter(Boolean)
    if (userParts.length > 1) {
      return [...userParts].sort().join(",") === [...keyParts].sort().join(",")
    }
    return keyParts.includes(user)
  }

  return expandAnswerKey(answerKey).includes(user)
}
