/**
 * Editorial policy flags — set via environment on the AI pipeline host.
 */
export const editorialPolicy = {
  /**
   * Block queueing until self-hosted editorial review passes (Ollama / DeepSeek R1).
   * Default: on in production unless explicitly disabled.
   */
  requireEditorialReview:
    process.env.REQUIRE_EDITORIAL_REVIEW !== 'false' &&
    (process.env.NODE_ENV === 'production' || process.env.REQUIRE_EDITORIAL_REVIEW === 'true'),

  /** Minimum quality score (0–100) from self-hosted reviewer. */
  editorialMinScore: parseInt(process.env.EDITORIAL_MIN_SCORE || '70', 10),

  /**
   * Optional Google Gemini pass — off by default (self-hosted only).
   * Set REQUIRE_GEMINI_EDITORIAL_REVIEW=true only if you add GEMINI_API_KEY.
   */
  requireGeminiReview: process.env.REQUIRE_GEMINI_EDITORIAL_REVIEW === 'true',

  /** @deprecated alias */
  geminiMinScore: parseInt(
    process.env.GEMINI_EDITORIAL_MIN_SCORE || process.env.EDITORIAL_MIN_SCORE || '70',
    10,
  ),

  /** Launch languages for QA sampling export. */
  launchQaLanguages: ['en', 'ha', 'yo', 'sw', 'zu'] as const,
};
