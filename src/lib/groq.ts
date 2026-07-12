let groqKeyIndex = 0;

export function getFreeGroqKeys(): string[] {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
  ].filter(Boolean) as string[];
}

export function getPaymentGroqKey(): string | undefined {
  return process.env.GROQ_API_KEY_PAYMENT;
}

export function getGroqKeys(): string[] {
  const freeKeys = getFreeGroqKeys();
  const paymentKey = getPaymentGroqKey();
  
  if (freeKeys.length === 0) {
    return paymentKey ? [paymentKey] : [];
  }

  // Start with a round-robin free key, then the rest of the free keys
  const orderedKeys = [];
  const startIdx = groqKeyIndex % freeKeys.length;
  for (let i = 0; i < freeKeys.length; i++) {
    orderedKeys.push(freeKeys[(startIdx + i) % freeKeys.length]);
  }
  groqKeyIndex = (groqKeyIndex + 1) % freeKeys.length;

  // Append payment key as the final fallback
  if (paymentKey) {
    orderedKeys.push(paymentKey);
  }

  return orderedKeys;
}
