/**
 * @deprecated CoinDaily uses self-hosted models. This module re-exports the Ollama reviewer.
 * Enable cloud Gemini only with REQUIRE_GEMINI_EDITORIAL_REVIEW=true + GEMINI_API_KEY.
 */
export {
  runSelfHostedEditorialReview,
  runSelfHostedEditorialReview as runGeminiEditorialReview,
  type EditorialReviewInput as GeminiReviewInput,
  type EditorialReviewResult as GeminiReviewResult,
} from './selfHostedEditorialReview';
