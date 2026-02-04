# NLLB-200 Self-Hosted Translation Service

Self-hosted translation API for 15+ African languages using Meta's NLLB-200 model.

## Features

- ✅ 200 languages supported (15+ African languages)
- ✅ Crypto term preservation (Bitcoin, DeFi, etc. stay untranslated)
- ✅ Batch translation support
- ✅ GPU acceleration (if available)
- ✅ REST API with OpenAPI docs
- ✅ Zero API costs after setup

## Quick Start

### 1. Install (One-time setup)

```powershell
cd translation-service
.\install.ps1
```

This will:
- Create Python virtual environment
- Install PyTorch (GPU/CPU)
- Download NLLB-200 model (~2.4GB)
- Install all dependencies

### 2. Start Server

```powershell
.\start.ps1
```

Server runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 3. Test API

```powershell
.\test-api.ps1
```

## Usage Examples

### From Your Node.js Backend

```typescript
// backend/src/services/translationService.ts

class NLLBTranslationService {
  private baseUrl = process.env.NLLB_API_URL || 'http://localhost:8000';

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
        preserve_crypto_terms: true
      })
    });

    const result = await response.json();
    return result.translated_text;
  }

  async batchTranslate(
    texts: string[],
    sourceLang: string,
    targetLangs: string[]
  ): Promise<Record<string, string[]>> {
    const response = await fetch(`${this.baseUrl}/translate/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts,
        source_lang: sourceLang,
        target_langs: targetLangs,
        preserve_crypto_terms: true
      })
    });

    const result = await response.json();
    return result.translations;
  }
}
```

### cURL Examples

**Single Translation:**
```bash
curl -X POST "http://localhost:8000/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bitcoin trading volume increased in Nigeria",
    "source_lang": "en",
    "target_lang": "ha",
    "preserve_crypto_terms": true
  }'
```

**Batch Translation:**
```bash
curl -X POST "http://localhost:8000/translate/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["DeFi is growing", "NFT marketplace launched"],
    "source_lang": "en",
    "target_langs": ["sw", "yo", "ig"],
    "preserve_crypto_terms": true
  }'
```

## Supported African Languages

| Code | Language      | Speakers  |
|------|---------------|-----------|
| `sw` | Swahili       | 200M+     |
| `ha` | Hausa         | 70M+      |
| `yo` | Yoruba        | 45M+      |
| `ig` | Igbo          | 30M+      |
| `am` | Amharic       | 57M+      |
| `so` | Somali        | 21M+      |
| `zu` | Zulu          | 12M+      |
| `xh` | Xhosa         | 8M+       |
| `sn` | Shona         | 14M+      |
| `rw` | Kinyarwanda   | 12M+      |
| `lg` | Luganda       | 10M+      |
| `om` | Oromo         | 37M+      |
| `ti` | Tigrinya      | 9M+       |
| `wo` | Wolof         | 12M+      |
| `fr` | French        | 300M+ (Africa) |

## Performance

**CPU (No GPU):**
- Single translation: ~5-10 seconds
- Batch (5 texts): ~30-50 seconds

**GPU (RTX 3060+):**
- Single translation: ~1-2 seconds
- Batch (5 texts): ~5-10 seconds

**Recommended for production:**
- Use GPU for < 2s translations
- Or use distilled model on CPU for moderate load

## Model Variants

Edit `server.py` line 47 to change model:

```python
# Faster, smaller (600M params) - Default
MODEL_NAME = "facebook/nllb-200-distilled-600M"

# Better quality (1.3B params)
MODEL_NAME = "facebook/nllb-200-1.3B"

# Best quality (3.3B params) - Requires 16GB+ GPU
MODEL_NAME = "facebook/nllb-200-3.3B"
```

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
npm install -g pm2
pm2 start "python server.py" --name translation-service
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

# Download model at build time
RUN python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; \
    AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); \
    AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M')"

EXPOSE 8000
CMD ["python", "server.py"]
```

Build & run:
```bash
docker build -t nllb-translation .
docker run -p 8000:8000 nllb-translation
```

### Option 3: Windows Service

Use NSSM (Non-Sucking Service Manager):
```powershell
nssm install NLLBTranslation "C:\path\to\venv\Scripts\python.exe" "C:\path\to\server.py"
nssm start NLLBTranslation
```

## Troubleshooting

**Model download fails:**
- Check internet connection
- Model will auto-download on first API call
- Manual download: Run install.ps1 again

**Out of memory:**
- Use smaller model (distilled-600M)
- Reduce max_length in server.py
- Close other applications

**Slow translations:**
- Check if GPU is being used (look for "Using device: GPU" in logs)
- If CPU-only, consider cloud GPU (RunPod, Vast.ai)
- Or use OpenAI/DeepL API as fallback

## Cost Comparison

**Self-hosted NLLB-200:**
- One-time setup: 30 minutes
- Ongoing cost: $0 (just electricity)
- Speed: 1-10s per translation

**OpenAI GPT-4 Translation:**
- Per translation: ~$0.02
- 1000 translations/day: $600/month

**Google Cloud Translation:**
- Per character: $0.00002
- 1000 articles/day: ~$100/month

**Self-hosting saves ~$500-600/month** at scale!

## Integration with Content Automation

Your automation service already calls translation. Just update the endpoint:

```typescript
// backend/src/services/contentAutomationService.ts
const TRANSLATION_API_URL = 'http://localhost:8000/translate';
```

The translation agent will automatically use your self-hosted service!
