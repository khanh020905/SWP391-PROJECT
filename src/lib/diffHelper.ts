export interface DiffToken {
  word: string;
  status: 'correct' | 'incorrect' | 'missing';
}

/**
 * Compares a user's translation with the model answer at a word level.
 * Uses a Longest Common Subsequence (LCS) dynamic programming algorithm
 * to accurately identify correct, incorrect (extra/wrong), and missing words.
 */
export function compareSentences(userInput: string, modelAnswer: string): DiffToken[] {
  // Normalize punctuation and casing for comparing words, but preserve original text in output
  const normalize = (w: string) => {
    if (!w) return "";
    return w
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?""'']/g, "")
      .trim();
  };

  const userWords = userInput.trim().split(/\s+/).filter(Boolean);
  const modelWords = modelAnswer.trim().split(/\s+/).filter(Boolean);

  const n = userWords.length;
  const m = modelWords.length;

  // DP table to find Longest Common Subsequence (LCS)
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (normalize(userWords[i - 1]) === normalize(modelWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const tokens: DiffToken[] = [];
  let i = n;
  let j = m;

  // Backtrack to construct the diff list
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(userWords[i - 1]) === normalize(modelWords[j - 1])) {
      // The word matches
      tokens.unshift({
        word: userWords[i - 1],
        status: 'correct'
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // The word exists in the model answer but was missed by the user
      tokens.unshift({
        word: modelWords[j - 1],
        status: 'missing'
      });
      j--;
    } else {
      // The word was entered by the user but doesn't exist in the model answer at this position
      tokens.unshift({
        word: userWords[i - 1],
        status: 'incorrect'
      });
      i--;
    }
  }

  return tokens;
}
