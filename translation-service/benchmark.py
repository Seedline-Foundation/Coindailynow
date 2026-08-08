import time
import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add parent directory to path so we can import server
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import functions to test from server
from server import protect_crypto_terms, restore_crypto_terms

class MockTokenizer:
    def __init__(self):
        self.src_lang = None

    def __call__(self, text, return_tensors="pt", padding=True, truncation=True, max_length=512):
        return {
            "input_ids": MagicMock(),
            "attention_mask": MagicMock()
        }

    def convert_tokens_to_ids(self, lang):
        return 12345

    def batch_decode(self, generated_tokens, skip_special_tokens=True):
        return generated_tokens

class MockModelParameters:
    def __init__(self):
        self.device = "cpu"

class MockModel:
    def __init__(self):
        self.calls_count = 0

    def parameters(self):
        return [MockModelParameters()]

    def generate(self, **kwargs):
        self.calls_count += 1
        # Simulating time spent on generation
        time.sleep(0.05)  # 50ms simulation
        return ["translated_text"] * kwargs.get("batch_size", 1)

def run_sequential_benchmark(texts, src_code, tgt_code, translate_func):
    start_time = time.time()
    results = []
    for text in texts:
        text_to_translate, replacements = protect_crypto_terms(text)
        translated = translate_func(text_to_translate, src_code, tgt_code)
        translated = restore_crypto_terms(translated, replacements)
        results.append(translated)
    duration = time.time() - start_time
    return results, duration

def run_batched_benchmark(texts, src_code, tgt_code, translate_func, chunk_size=16):
    start_time = time.time()
    if not texts:
        return [], 0.0

    texts_to_translate = []
    replacements_list = []

    for text in texts:
        text_to_translate, replacements = protect_crypto_terms(text)
        texts_to_translate.append(text_to_translate)
        replacements_list.append(replacements)

    translated_batch = []
    for i in range(0, len(texts_to_translate), chunk_size):
        chunk = texts_to_translate[i:i + chunk_size]
        translated_chunk = translate_func(chunk, src_code, tgt_code)
        translated_batch.extend(translated_chunk)

    results = []
    for translated, replacements in zip(translated_batch, replacements_list):
        translated = restore_crypto_terms(translated, replacements)
        results.append(translated)

    duration = time.time() - start_time
    return results, duration

def test_performance_and_correctness():
    # Setup mocks
    import server
    server.tokenizer = MockTokenizer()
    mock_model = MockModel()
    server.model = mock_model

    # We override translate_text to handle single text or batch of texts
    def translate_text_mocked(text, src_lang, tgt_lang):
        server.tokenizer.src_lang = src_lang
        is_str = isinstance(text, str)
        texts = [text] if is_str else text

        inputs = server.tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512)
        forced_bos_token_id = server.tokenizer.convert_tokens_to_ids(tgt_lang)

        generated = server.model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=512,
            num_beams=5,
            early_stopping=True,
            batch_size=len(texts)
        )

        # Let's make mock translation return a suffix to simulate translation
        translated_results = [f"translated_{t}" for t in texts]

        if is_str:
            return translated_results[0]
        return translated_results

    texts = [
        "Bitcoin price is soaring",
        "Ethereum smart contracts are powerful",
        "DeFi and stablecoins are changing finance",
        "M-Pesa allows easy mobile transactions",
        "NFT standard is ERC-721",
        "Staking on Uniswap is profitable",
        "Avoid FUD and FOMO in crypto markets",
        "Many startups are building in Web3"
    ]

    print("--- Running Sequential Translation Simulation ---")
    mock_model.calls_count = 0
    seq_results, seq_time = run_sequential_benchmark(texts, "eng_Latn", "swh_Latn", translate_text_mocked)
    seq_calls = mock_model.calls_count
    print(f"Sequential Duration: {seq_time:.6f}s")
    print(f"Sequential Model Calls: {seq_calls}")

    print("\n--- Running Batched Translation Simulation ---")
    mock_model.calls_count = 0
    batch_results, batch_time = run_batched_benchmark(texts, "eng_Latn", "swh_Latn", translate_text_mocked)
    batch_calls = mock_model.calls_count
    print(f"Batched Duration: {batch_time:.6f}s")
    print(f"Batched Model Calls: {batch_calls}")

    print("\n--- Results Verification ---")
    print("Sequential results length:", len(seq_results))
    print("Batched results length:", len(batch_results))

    # Check correctness
    assert len(seq_results) == len(batch_results), "Result lengths do not match!"
    for s, b in zip(seq_results, batch_results):
        assert s == b, f"Mismatch: {s} != {b}"
    print("✅ Correctness check passed! Translations are identical.")

    # Check efficiency
    assert batch_calls < seq_calls, f"Batched calls ({batch_calls}) should be less than sequential calls ({seq_calls})"
    speedup = (seq_time / batch_time) if batch_time > 0 else float('inf')
    print(f"✅ Efficiency check passed! Model calls reduced from {seq_calls} to {batch_calls}.")
    print(f"🚀 Simulated speedup: {speedup:.2f}x faster")

if __name__ == "__main__":
    test_performance_and_correctness()
