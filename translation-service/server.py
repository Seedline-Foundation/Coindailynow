"""
NLLB-200 Translation Microservice
Self-hosted translation API for African languages
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import torch
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NLLB-200 Translation Service")

# CORS for your Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration
# Options:
# - facebook/nllb-200-distilled-600M (smaller, faster, CPU-friendly)
# - facebook/nllb-200-1.3B (better quality)
# - facebook/nllb-200-3.3B (best quality, requires GPU)
MODEL_NAME = "facebook/nllb-200-distilled-600M"

# Language code mapping (NLLB uses special codes)
LANGUAGE_CODES = {
    "en": "eng_Latn",      # English
    "sw": "swh_Latn",      # Swahili
    "ha": "hau_Latn",      # Hausa
    "yo": "yor_Latn",      # Yoruba
    "ig": "ibo_Latn",      # Igbo
    "am": "amh_Ethi",      # Amharic
    "so": "som_Latn",      # Somali
    "zu": "zul_Latn",      # Zulu
    "xh": "xho_Latn",      # Xhosa
    "sn": "sna_Latn",      # Shona
    "rw": "kin_Latn",      # Kinyarwanda
    "lg": "lug_Latn",      # Luganda
    "om": "orm_Latn",      # Oromo
    "ti": "tir_Ethi",      # Tigrinya
    "wo": "wol_Latn",      # Wolof
    "fr": "fra_Latn",      # French (widely used in Africa)
    "ar": "arb_Arab",      # Arabic (North Africa)
    "pt": "por_Latn",      # Portuguese (Angola, Mozambique)
}

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str
    preserve_crypto_terms: bool = True

class BatchTranslationRequest(BaseModel):
    texts: List[str]
    source_lang: str = "en"
    target_langs: List[str]
    preserve_crypto_terms: bool = True

class TranslationResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str
    model_version: str

class BatchTranslationResponse(BaseModel):
    translations: dict  # {lang: translated_text}
    model_version: str

# Global model and tokenizer
model = None
tokenizer = None
translator = None

# Crypto terms to preserve (don't translate)
CRYPTO_TERMS = {
    "Bitcoin", "Ethereum", "BTC", "ETH", "DeFi", "NFT", "DAO", "dApp",
    "blockchain", "cryptocurrency", "crypto", "altcoin", "stablecoin",
    "mining", "staking", "yield farming", "liquidity pool", "DEX",
    "memecoin", "shitcoin", "HODL", "FUD", "FOMO", "whale",
    "Binance", "Coinbase", "MetaMask", "Uniswap", "Aave", "Compound",
    "Solana", "Cardano", "Polkadot", "Chainlink", "Polygon",
    "M-Pesa", "Luno", "Quidax", "BuyCoins", "Valr", "Ice3X"
}

@app.on_event("startup")
async def load_model():
    """Load model on startup"""
    global model, tokenizer, translator
    
    logger.info(f"Loading NLLB-200 model: {MODEL_NAME}")
    logger.info("This may take a few minutes on first run...")
    
    try:
        # Determine device
        device = 0 if torch.cuda.is_available() else -1
        device_name = "GPU" if device == 0 else "CPU"
        logger.info(f"Using device: {device_name}")
        
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        
        # Move to GPU if available
        if torch.cuda.is_available():
            model = model.to("cuda")
            logger.info(f"Model loaded on GPU: {torch.cuda.get_device_name(0)}")
        else:
            logger.info("Model loaded on CPU (slower)")
        
        # Create pipeline
        translator = pipeline(
            "translation",
            model=model,
            tokenizer=tokenizer,
            device=device,
            max_length=512
        )
        
        logger.info("✅ Model loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

def protect_crypto_terms(text: str) -> tuple[str, dict]:
    """Replace crypto terms with placeholders"""
    if not text:
        return text, {}
    
    protected_text = text
    replacements = {}
    
    for i, term in enumerate(CRYPTO_TERMS):
        if term.lower() in text.lower():
            placeholder = f"__CRYPTO_TERM_{i}__"
            # Case-insensitive replacement
            import re
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            protected_text = pattern.sub(placeholder, protected_text)
            replacements[placeholder] = term
    
    return protected_text, replacements

def restore_crypto_terms(text: str, replacements: dict) -> str:
    """Restore crypto terms from placeholders"""
    restored_text = text
    for placeholder, original in replacements.items():
        restored_text = restored_text.replace(placeholder, original)
    return restored_text

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "NLLB-200 Translation Service",
        "status": "ready" if model is not None else "loading",
        "model": MODEL_NAME,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "supported_languages": len(LANGUAGE_CODES)
    }

@app.get("/languages")
async def get_supported_languages():
    """Get supported language codes"""
    return {
        "languages": LANGUAGE_CODES,
        "total": len(LANGUAGE_CODES)
    }

@app.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """Translate single text"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        # Validate language codes
        if request.source_lang not in LANGUAGE_CODES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported source language: {request.source_lang}"
            )
        if request.target_lang not in LANGUAGE_CODES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported target language: {request.target_lang}"
            )
        
        # Get NLLB codes
        src_code = LANGUAGE_CODES[request.source_lang]
        tgt_code = LANGUAGE_CODES[request.target_lang]
        
        # Protect crypto terms if requested
        text_to_translate = request.text
        replacements = {}
        
        if request.preserve_crypto_terms:
            text_to_translate, replacements = protect_crypto_terms(request.text)
        
        # Perform translation
        logger.info(f"Translating: {request.source_lang} -> {request.target_lang}")
        
        result = translator(
            text_to_translate,
            src_lang=src_code,
            tgt_lang=tgt_code,
            max_length=512
        )
        
        translated_text = result[0]["translation_text"]
        
        # Restore crypto terms
        if request.preserve_crypto_terms:
            translated_text = restore_crypto_terms(translated_text, replacements)
        
        return TranslationResponse(
            translated_text=translated_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            model_version=MODEL_NAME
        )
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate/batch", response_model=BatchTranslationResponse)
async def translate_batch(request: BatchTranslationRequest):
    """Translate multiple texts to multiple languages"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        translations = {}
        
        for target_lang in request.target_langs:
            if target_lang not in LANGUAGE_CODES:
                logger.warning(f"Skipping unsupported language: {target_lang}")
                continue
            
            lang_translations = []
            
            for text in request.texts:
                # Protect crypto terms
                text_to_translate = text
                replacements = {}
                
                if request.preserve_crypto_terms:
                    text_to_translate, replacements = protect_crypto_terms(text)
                
                # Translate
                src_code = LANGUAGE_CODES[request.source_lang]
                tgt_code = LANGUAGE_CODES[target_lang]
                
                result = translator(
                    text_to_translate,
                    src_lang=src_code,
                    tgt_lang=tgt_code,
                    max_length=512
                )
                
                translated = result[0]["translation_text"]
                
                # Restore crypto terms
                if request.preserve_crypto_terms:
                    translated = restore_crypto_terms(translated, replacements)
                
                lang_translations.append(translated)
            
            translations[target_lang] = lang_translations
        
        return BatchTranslationResponse(
            translations=translations,
            model_version=MODEL_NAME
        )
        
    except Exception as e:
        logger.error(f"Batch translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model is not None else "initializing",
        "model_loaded": model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "supported_languages": len(LANGUAGE_CODES)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
