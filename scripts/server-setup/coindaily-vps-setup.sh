#!/bin/bash

#===============================================================================
# CoinDaily VPS Setup Script
# Server: 16 cores, 64GB RAM, 300GB NVMe
# Purpose: Optimized AI News Platform with Self-Hosted Models
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

#===============================================================================
# CONFIGURATION - MODIFY THESE AS NEEDED
#===============================================================================

# Domains
DOMAIN_MAIN="coindailynow.com"
DOMAIN_AI="ai.coindailynow.com"

# Directories
WEB_ROOT="/var/www"
OPT_DIR="/opt/coindaily"
MODELS_DIR="/opt/coindaily/models"
BACKUP_DIR="/backup"

# Memory allocation (64GB total)
# Reserve 8GB for system, allocate rest to services
LLAMA_MEMORY="12G"
DEEPSEEK_MEMORY="10G"
SDXL_MEMORY="14G"
NLLB_MEMORY="4G"
EMBEDDINGS_MEMORY="2G"
REDIS_MEMORY="4gb"
POSTGRES_MEMORY="4G"
ELASTICSEARCH_MEMORY="4g"

# CPU allocation (16 cores)
LLAMA_CPUS="4"
DEEPSEEK_CPUS="4"
SDXL_CPUS="4"
NLLB_CPUS="2"
EMBEDDINGS_CPUS="1"

# Passwords (CHANGE THESE!)
GRAFANA_PASSWORD="CoinDaily2026!"
POSTGRES_PASSWORD="CoinDaily_DB_2026!"
REDIS_PASSWORD="CoinDaily_Redis_2026!"

#===============================================================================
# PHASE 1: CLEANUP OLD INSTALLATION
#===============================================================================

phase1_cleanup() {
    log_step "PHASE 1: Cleaning up old installation..."
    
    # Stop any running containers
    log_info "Stopping all Docker containers..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    # Remove old Docker volumes (except critical data)
    log_info "Removing old Docker volumes..."
    docker volume prune -f 2>/dev/null || true
    
    # Clean up /opt directory
    log_info "Removing old /opt contents..."
    rm -rf /opt/containerd 2>/dev/null || true
    rm -rf /opt/lm-studio 2>/dev/null || true
    rm -rf /opt/nllb-translation 2>/dev/null || true
    rm -rf /opt/coindaily 2>/dev/null || true
    
    # Clean Docker system
    log_info "Cleaning Docker system..."
    docker system prune -af --volumes 2>/dev/null || true
    
    # Clean apt cache
    apt-get clean
    apt-get autoremove -y
    
    log_info "Cleanup complete!"
}

#===============================================================================
# PHASE 2: SYSTEM OPTIMIZATION
#===============================================================================

phase2_optimize_system() {
    log_step "PHASE 2: Optimizing system for 16 cores, 64GB RAM, 300GB NVMe..."
    
    # Update system
    log_info "Updating system packages..."
    apt-get update && apt-get upgrade -y
    
    # Install essential packages
    log_info "Installing essential packages..."
    apt-get install -y \
        curl \
        wget \
        git \
        htop \
        iotop \
        iftop \
        net-tools \
        vim \
        nano \
        unzip \
        zip \
        build-essential \
        ca-certificates \
        gnupg \
        lsb-release \
        software-properties-common \
        apt-transport-https \
        ufw \
        fail2ban \
        nginx \
        certbot \
        python3-certbot-nginx \
        jq \
        bc \
        ncdu
    
    # Optimize kernel parameters for high-performance server
    log_info "Optimizing kernel parameters..."
    cat > /etc/sysctl.d/99-coindaily-optimize.conf << 'EOF'
# Network Performance
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.rmem_default = 16777216
net.core.wmem_default = 16777216
net.core.optmem_max = 40960
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.core.netdev_max_backlog = 50000
net.ipv4.tcp_max_syn_backlog = 30000
net.ipv4.tcp_max_tw_buckets = 2000000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 6
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_syncookies = 1

# File System Performance
fs.file-max = 2097152
fs.nr_open = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512

# Memory Management
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
vm.vfs_cache_pressure = 50
vm.overcommit_memory = 1
vm.max_map_count = 262144

# Connection handling
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
EOF
    
    sysctl -p /etc/sysctl.d/99-coindaily-optimize.conf
    
    # Optimize limits
    log_info "Setting system limits..."
    cat > /etc/security/limits.d/99-coindaily.conf << 'EOF'
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 1048576
* hard nproc 1048576
* soft memlock unlimited
* hard memlock unlimited
root soft nofile 1048576
root hard nofile 1048576
EOF
    
    # Enable CPU performance mode
    log_info "Setting CPU to performance mode..."
    apt-get install -y cpufrequtils || true
    echo 'GOVERNOR="performance"' > /etc/default/cpufrequtils
    systemctl restart cpufrequtils 2>/dev/null || true
    
    # For newer systems, use cpupower
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        echo "performance" > "$cpu" 2>/dev/null || true
    done
    
    # Disable transparent huge pages (better for databases)
    log_info "Configuring transparent huge pages..."
    echo never > /sys/kernel/mm/transparent_hugepage/enabled 2>/dev/null || true
    echo never > /sys/kernel/mm/transparent_hugepage/defrag 2>/dev/null || true
    
    # Add to rc.local for persistence
    cat > /etc/rc.local << 'EOF'
#!/bin/bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
exit 0
EOF
    chmod +x /etc/rc.local
    
    # Configure swap (small, just for emergencies - 4GB)
    log_info "Configuring swap..."
    if [ ! -f /swapfile ]; then
        fallocate -l 4G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    
    log_info "System optimization complete!"
}

#===============================================================================
# PHASE 3: INSTALL DOCKER
#===============================================================================

phase3_install_docker() {
    log_step "PHASE 3: Installing Docker and Docker Compose..."
    
    # Remove old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install Docker
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    
    # Configure Docker daemon for optimization
    log_info "Configuring Docker daemon..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "5"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ],
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 1048576,
            "Soft": 1048576
        }
    },
    "max-concurrent-downloads": 10,
    "max-concurrent-uploads": 10,
    "default-shm-size": "1G",
    "live-restore": true,
    "userland-proxy": false
}
EOF
    
    # Restart Docker
    systemctl daemon-reload
    systemctl restart docker
    systemctl enable docker
    
    # Install Docker Compose
    log_info "Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
    
    # Verify
    docker --version
    docker compose version
    
    log_info "Docker installation complete!"
}

#===============================================================================
# PHASE 4: CREATE DIRECTORY STRUCTURE
#===============================================================================

phase4_create_directories() {
    log_step "PHASE 4: Creating directory structure..."
    
    # Main directories
    mkdir -p $OPT_DIR/{docker,models,config,logs,backups,scripts}
    mkdir -p $OPT_DIR/docker/{nllb,sdxl,embeddings}
    mkdir -p $OPT_DIR/models/{llama,deepseek,nllb,sdxl,embeddings}
    mkdir -p $OPT_DIR/monitoring/{prometheus,grafana/dashboards}
    mkdir -p $BACKUP_DIR/{daily,weekly,models}
    
    # Set permissions
    chmod -R 755 $OPT_DIR
    
    log_info "Directories created!"
}

#===============================================================================
# PHASE 5: CREATE DOCKER SERVICES
#===============================================================================

phase5_create_docker_files() {
    log_step "PHASE 5: Creating Docker configuration files..."
    
    # Create NLLB Translation Dockerfile
    log_info "Creating NLLB Translation service..."
    cat > $OPT_DIR/docker/nllb/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    transformers==4.36.0 \
    sentencepiece==0.1.99 \
    torch==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu \
    pydantic==2.5.0 \
    redis==5.0.1

COPY nllb-service.py .

EXPOSE 8080

CMD ["uvicorn", "nllb-service:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
EOF

    # Create NLLB service file
    cat > $OPT_DIR/docker/nllb/nllb-service.py << 'EOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import os
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NLLB Translation Service", version="1.0.0")

# Model configuration
MODEL_NAME = os.getenv("MODEL_NAME", "facebook/nllb-200-distilled-600M")
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "512"))
NUM_BEAMS = int(os.getenv("NUM_BEAMS", "4"))

# Load model
logger.info(f"Loading model: {MODEL_NAME}")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
logger.info("Model loaded successfully!")

# African language codes for NLLB
AFRICAN_LANGUAGES = {
    "hausa": "hau_Latn",
    "yoruba": "yor_Latn", 
    "igbo": "ibo_Latn",
    "swahili": "swh_Latn",
    "amharic": "amh_Ethi",
    "zulu": "zul_Latn",
    "xhosa": "xho_Latn",
    "afrikaans": "afr_Latn",
    "somali": "som_Latn",
    "oromo": "orm_Latn",
    "tigrinya": "tir_Ethi",
    "wolof": "wol_Latn",
    "lingala": "lin_Latn",
    "shona": "sna_Latn",
    "twi": "twi_Latn",
    "english": "eng_Latn",
    "french": "fra_Latn",
    "arabic": "arb_Arab",
    "portuguese": "por_Latn"
}

# Crypto terms to preserve
CRYPTO_TERMS = [
    "Bitcoin", "BTC", "Ethereum", "ETH", "USDT", "USDC", "BNB", "XRP", "Solana", "SOL",
    "DeFi", "NFT", "Web3", "blockchain", "crypto", "memecoin", "altcoin", "stablecoin",
    "HODL", "FOMO", "FUD", "whale", "airdrop", "staking", "yield", "liquidity",
    "Binance", "Coinbase", "Luno", "Quidax", "Valr", "M-Pesa", "BONK", "PEPE", "DOGE", "SHIB"
]

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "eng_Latn"
    target_lang: str = "hau_Latn"
    max_length: int = 512
    num_beams: int = 4
    preserve_crypto_terms: bool = True

class BatchTranslationRequest(BaseModel):
    texts: list[str]
    source_lang: str = "eng_Latn"
    target_lang: str = "hau_Latn"
    preserve_crypto_terms: bool = True

class TranslationResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str
    processing_time_ms: float

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "supported_languages": list(AFRICAN_LANGUAGES.keys())
    }

@app.get("/languages")
async def get_languages():
    return AFRICAN_LANGUAGES

def preserve_terms(text: str, terms: list) -> tuple[str, dict]:
    """Replace crypto terms with placeholders"""
    replacements = {}
    for i, term in enumerate(terms):
        if term in text:
            placeholder = f"__CRYPTO_{i}__"
            text = text.replace(term, placeholder)
            replacements[placeholder] = term
    return text, replacements

def restore_terms(text: str, replacements: dict) -> str:
    """Restore crypto terms from placeholders"""
    for placeholder, term in replacements.items():
        text = text.replace(placeholder, term)
    return text

@app.post("/translate", response_model=TranslationResponse)
async def translate(req: TranslationRequest):
    start_time = time.time()
    
    try:
        text = req.text
        replacements = {}
        
        # Preserve crypto terms if requested
        if req.preserve_crypto_terms:
            text, replacements = preserve_terms(text, CRYPTO_TERMS)
        
        # Tokenize
        inputs = tokenizer(text, return_tensors="pt", src_lang=req.source_lang)
        
        # Generate translation
        translated_tokens = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.lang_code_to_id[req.target_lang],
            max_length=req.max_length,
            num_beams=req.num_beams,
            early_stopping=True
        )
        
        # Decode
        translation = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
        
        # Restore crypto terms
        if req.preserve_crypto_terms:
            translation = restore_terms(translation, replacements)
        
        processing_time = (time.time() - start_time) * 1000
        
        return TranslationResponse(
            translated_text=translation,
            source_lang=req.source_lang,
            target_lang=req.target_lang,
            processing_time_ms=round(processing_time, 2)
        )
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate/batch")
async def translate_batch(req: BatchTranslationRequest):
    start_time = time.time()
    results = []
    
    for text in req.texts:
        single_req = TranslationRequest(
            text=text,
            source_lang=req.source_lang,
            target_lang=req.target_lang,
            preserve_crypto_terms=req.preserve_crypto_terms
        )
        result = await translate(single_req)
        results.append(result.translated_text)
    
    return {
        "translations": results,
        "count": len(results),
        "total_time_ms": round((time.time() - start_time) * 1000, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
EOF

    # Create BGE Embeddings Dockerfile
    log_info "Creating BGE Embeddings service..."
    cat > $OPT_DIR/docker/embeddings/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    sentence-transformers==2.2.2 \
    torch==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu \
    numpy \
    pydantic==2.5.0

COPY embeddings-service.py .

EXPOSE 8081

CMD ["uvicorn", "embeddings-service:app", "--host", "0.0.0.0", "--port", "8081", "--workers", "2"]
EOF

    # Create Embeddings service file
    cat > $OPT_DIR/docker/embeddings/embeddings-service.py << 'EOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BGE Embeddings Service", version="1.0.0")

MODEL_NAME = os.getenv("MODEL_NAME", "BAAI/bge-small-en-v1.5")

logger.info(f"Loading embedding model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)
logger.info("Model loaded!")

class EmbeddingRequest(BaseModel):
    texts: list[str]
    normalize: bool = True

class EmbeddingResponse(BaseModel):
    embeddings: list[list[float]]
    dimension: int
    count: int

@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_NAME, "dimension": model.get_sentence_embedding_dimension()}

@app.post("/embed", response_model=EmbeddingResponse)
async def embed(req: EmbeddingRequest):
    try:
        embeddings = model.encode(req.texts, normalize_embeddings=req.normalize)
        return EmbeddingResponse(
            embeddings=embeddings.tolist(),
            dimension=embeddings.shape[1],
            count=len(req.texts)
        )
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity")
async def similarity(texts: list[str]):
    if len(texts) != 2:
        raise HTTPException(status_code=400, detail="Exactly 2 texts required")
    
    embeddings = model.encode(texts, normalize_embeddings=True)
    similarity = np.dot(embeddings[0], embeddings[1])
    return {"similarity": float(similarity)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
EOF

    # Create SDXL Image Generation Dockerfile
    log_info "Creating SDXL Image Generation service..."
    cat > $OPT_DIR/docker/sdxl/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    diffusers==0.24.0 \
    transformers==4.36.0 \
    accelerate==0.25.0 \
    safetensors==0.4.1 \
    torch==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu \
    pillow==10.1.0 \
    pydantic==2.5.0

# For OpenVINO optimization (Intel CPUs)
RUN pip install --no-cache-dir openvino==2023.2.0 optimum[openvino]==1.14.0 || true

COPY sdxl-service.py .

EXPOSE 7860

CMD ["uvicorn", "sdxl-service:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
EOF

    # Create SDXL service file
    cat > $OPT_DIR/docker/sdxl/sdxl-service.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
import torch
import os
import io
import base64
import time
import logging
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SDXL Image Generation Service", version="1.0.0")

# Model configuration
MODEL_ID = os.getenv("MODEL_ID", "stabilityai/stable-diffusion-xl-base-1.0")
USE_OPENVINO = os.getenv("USE_OPENVINO", "false").lower() == "true"

# Load model
logger.info(f"Loading SDXL model: {MODEL_ID}")
logger.info("This may take several minutes on first run...")

try:
    if USE_OPENVINO:
        from optimum.intel import OVStableDiffusionXLPipeline
        pipe = OVStableDiffusionXLPipeline.from_pretrained(
            MODEL_ID,
            export=True,
            compile=False
        )
        pipe.compile()
        logger.info("SDXL loaded with OpenVINO optimization")
    else:
        pipe = StableDiffusionXLPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float32,
            use_safetensors=True,
            variant="fp16" if torch.cuda.is_available() else None
        )
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        logger.info("SDXL loaded with CPU backend")
except Exception as e:
    logger.error(f"Failed to load SDXL: {e}")
    pipe = None

# Default negative prompt for crypto/news images
DEFAULT_NEGATIVE = "blurry, low quality, distorted, watermark, text overlay, signature, username, low resolution, bad anatomy, poorly drawn, ugly, deformed, noisy, grainy"

class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = DEFAULT_NEGATIVE
    width: int = 1024
    height: int = 1024
    steps: int = 25
    guidance_scale: float = 7.5
    seed: int = -1

class ImageResponse(BaseModel):
    image_base64: str
    width: int
    height: int
    processing_time_seconds: float
    seed: int

@app.get("/health")
async def health():
    return {
        "status": "healthy" if pipe else "model_not_loaded",
        "model": MODEL_ID,
        "openvino": USE_OPENVINO
    }

@app.get("/sdapi/v1/sd-models")
async def get_models():
    """Compatibility endpoint for Automatic1111 API"""
    return [{"title": MODEL_ID, "model_name": "sdxl-base-1.0"}]

@app.post("/generate", response_model=ImageResponse)
async def generate_image(req: ImageRequest):
    if not pipe:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        # Set seed for reproducibility
        seed = req.seed if req.seed >= 0 else int(time.time()) % 2**32
        generator = torch.Generator().manual_seed(seed)
        
        # Generate image
        result = pipe(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance_scale,
            generator=generator
        )
        
        image = result.images[0]
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        processing_time = time.time() - start_time
        logger.info(f"Generated image in {processing_time:.2f}s")
        
        return ImageResponse(
            image_base64=image_base64,
            width=req.width,
            height=req.height,
            processing_time_seconds=round(processing_time, 2),
            seed=seed
        )
        
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sdapi/v1/txt2img")
async def txt2img_compat(req: dict):
    """Compatibility endpoint for Automatic1111 API"""
    image_req = ImageRequest(
        prompt=req.get("prompt", ""),
        negative_prompt=req.get("negative_prompt", DEFAULT_NEGATIVE),
        width=req.get("width", 1024),
        height=req.get("height", 1024),
        steps=req.get("steps", 25),
        guidance_scale=req.get("cfg_scale", 7.5),
        seed=req.get("seed", -1)
    )
    result = await generate_image(image_req)
    return {"images": [result.image_base64], "parameters": req}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
EOF

    # Create Prometheus configuration
    log_info "Creating Prometheus configuration..."
    cat > $OPT_DIR/monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files: []

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # AI Models - Ollama Llama (Article Writing)
  - job_name: 'ollama-llama'
    static_configs:
      - targets: ['coindaily-ai-llama:11434']
    metrics_path: /metrics

  # AI Models - Ollama DeepSeek (Review/Reasoning)
  - job_name: 'ollama-deepseek'
    static_configs:
      - targets: ['coindaily-ai-deepseek:11434']
    metrics_path: /metrics

  # AI Models - NLLB Translation (15 African Languages)
  - job_name: 'nllb-translation'
    static_configs:
      - targets: ['coindaily-ai-translation:8080']
    metrics_path: /metrics

  # AI Models - SDXL Image Generation
  - job_name: 'sdxl-image'
    static_configs:
      - targets: ['coindaily-ai-image:7860']
    metrics_path: /metrics

  # AI Models - BGE Embeddings (Semantic Search/RAG)
  - job_name: 'embeddings'
    static_configs:
      - targets: ['coindaily-ai-embeddings:8081']
    metrics_path: /metrics

  # Redis (Cache & Queue)
  - job_name: 'redis'
    static_configs:
      - targets: ['coindaily-redis:6379']

  # Nginx Web Server
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  # System Metrics (CPU, RAM, Disk)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # Elasticsearch (Search & Logs - NOT metrics)
  - job_name: 'elasticsearch'
    static_configs:
      - targets: ['coindaily-elasticsearch:9200']
    metrics_path: /_prometheus/metrics
EOF

    log_info "Docker configuration files created!"
}

#===============================================================================
# PHASE 6: CREATE MAIN DOCKER COMPOSE
#===============================================================================

phase6_create_docker_compose() {
    log_step "PHASE 6: Creating optimized Docker Compose file..."
    
    cat > $OPT_DIR/docker-compose.yml << EOF
version: '3.8'

services:
  #=============================================================================
  # AI MODELS
  #=============================================================================
  
  # Llama 3.1 8B - Article Writing (12GB RAM, 4 CPUs)
  ollama-llama:
    image: ollama/ollama:latest
    container_name: coindaily-ai-llama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama-llama-models:/root/.ollama
    environment:
      - OLLAMA_MODELS=/root/.ollama/models
      - OLLAMA_NUM_PARALLEL=4
      - OLLAMA_MAX_LOADED_MODELS=2
      - OLLAMA_FLASH_ATTENTION=1
      - GGML_AVX2=1
      - GGML_AVX512=1
    deploy:
      resources:
        limits:
          cpus: '${LLAMA_CPUS}'
          memory: ${LLAMA_MEMORY}
        reservations:
          memory: 8G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - ai-network

  # DeepSeek-R1 8B - Review & Reasoning (10GB RAM, 4 CPUs)
  ollama-deepseek:
    image: ollama/ollama:latest
    container_name: coindaily-ai-deepseek
    restart: unless-stopped
    ports:
      - "11435:11434"
    volumes:
      - ollama-deepseek-models:/root/.ollama
    environment:
      - OLLAMA_MODELS=/root/.ollama/models
      - OLLAMA_NUM_PARALLEL=2
      - OLLAMA_MAX_LOADED_MODELS=1
      - OLLAMA_FLASH_ATTENTION=1
      - GGML_AVX2=1
      - GGML_AVX512=1
    deploy:
      resources:
        limits:
          cpus: '${DEEPSEEK_CPUS}'
          memory: ${DEEPSEEK_MEMORY}
        reservations:
          memory: 6G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - ai-network

  # NLLB-200 Translation (4GB RAM, 2 CPUs)
  nllb-translation:
    build:
      context: ./docker/nllb
      dockerfile: Dockerfile
    image: coindaily-nllb:latest
    container_name: coindaily-ai-translation
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - nllb-models:/models
      - nllb-cache:/root/.cache/huggingface
    environment:
      - MODEL_NAME=facebook/nllb-200-distilled-600M
      - BATCH_SIZE=16
      - MAX_LENGTH=512
      - NUM_BEAMS=4
      - DEVICE=cpu
      - WORKERS=4
    deploy:
      resources:
        limits:
          cpus: '${NLLB_CPUS}'
          memory: ${NLLB_MEMORY}
        reservations:
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
    networks:
      - ai-network

  # BGE Embeddings - Semantic Search/RAG (2GB RAM, 1 CPU)
  # Converts text to vectors for similarity search in Elasticsearch
  bge-embeddings:
    build:
      context: ./docker/embeddings
      dockerfile: Dockerfile
    image: coindaily-embeddings:latest
    container_name: coindaily-ai-embeddings
    restart: unless-stopped
    ports:
      - "8081:8081"
    volumes:
      - embeddings-models:/models
      - embeddings-cache:/root/.cache
    environment:
      - MODEL_NAME=BAAI/bge-small-en-v1.5
      - BATCH_SIZE=32
    deploy:
      resources:
        limits:
          cpus: '${EMBEDDINGS_CPUS}'
          memory: ${EMBEDDINGS_MEMORY}
        reservations:
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ai-network

  # SDXL with OpenVINO - Image Generation (14GB RAM, 4 CPUs)
  sdxl-image:
    build:
      context: ./docker/sdxl
      dockerfile: Dockerfile
    image: coindaily-sdxl:latest
    container_name: coindaily-ai-image
    restart: unless-stopped
    ports:
      - "7860:7860"
    volumes:
      - sdxl-models:/root/.cache/huggingface
      - sdxl-outputs:/app/outputs
    environment:
      - MODEL_ID=stabilityai/stable-diffusion-xl-base-1.0
      - USE_OPENVINO=false
      - DEFAULT_WIDTH=1024
      - DEFAULT_HEIGHT=1024
      - DEFAULT_STEPS=25
    deploy:
      resources:
        limits:
          cpus: '${SDXL_CPUS}'
          memory: ${SDXL_MEMORY}
        reservations:
          memory: 10G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7860/health"]
      interval: 60s
      timeout: 30s
      retries: 3
      start_period: 300s
    networks:
      - ai-network

  #=============================================================================
  # DATABASES
  #=============================================================================

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: coindaily-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./config/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_DB=coindaily
      - POSTGRES_USER=coindaily
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8
    deploy:
      resources:
        limits:
          memory: ${POSTGRES_MEMORY}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coindaily"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ai-network

  # Redis (Queue & Cache)
  redis:
    image: redis:7-alpine
    container_name: coindaily-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: >
      redis-server 
      --appendonly yes 
      --maxmemory ${REDIS_MEMORY}
      --maxmemory-policy allkeys-lru
      --tcp-backlog 511
      --timeout 0
      --tcp-keepalive 300
      --save 900 1
      --save 300 10
      --save 60 10000
    deploy:
      resources:
        limits:
          memory: 5G
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - ai-network

  # Elasticsearch (Search & Logs)
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: coindaily-elasticsearch
    restart: unless-stopped
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms${ELASTICSEARCH_MEMORY} -Xmx${ELASTICSEARCH_MEMORY}"
      - bootstrap.memory_lock=true
      - cluster.routing.allocation.disk.threshold_enabled=true
      - cluster.routing.allocation.disk.watermark.low=85%
      - cluster.routing.allocation.disk.watermark.high=90%
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    deploy:
      resources:
        limits:
          memory: 6G
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -q '\"status\":\"green\"\\|\"status\":\"yellow\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - ai-network

  #=============================================================================
  # MONITORING
  #=============================================================================

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: coindaily-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    networks:
      - ai-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: coindaily-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://grafana.${DOMAIN_MAIN}
      # Allow embedding in admin dashboard (no separate login needed)
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
      - GF_SECURITY_ALLOW_EMBEDDING=true
      - GF_SECURITY_COOKIE_SAMESITE=none
      # Disable X-Frame-Options for iframe embedding
      - GF_SECURITY_X_FRAME_OPTIONS=
    depends_on:
      - prometheus
    networks:
      - ai-network

  # Node Exporter (System Metrics)
  node-exporter:
    image: prom/node-exporter:latest
    container_name: coindaily-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - ai-network

#=============================================================================
# NETWORKS
#=============================================================================
networks:
  ai-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

#=============================================================================
# VOLUMES
#=============================================================================
volumes:
  ollama-llama-models:
    driver: local
  ollama-deepseek-models:
    driver: local
  nllb-models:
    driver: local
  nllb-cache:
    driver: local
  sdxl-models:
    driver: local
  sdxl-outputs:
    driver: local
  embeddings-models:
    driver: local
  embeddings-cache:
    driver: local
  postgres-data:
    driver: local
  redis-data:
    driver: local
  elasticsearch-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
EOF

    log_info "Docker Compose file created!"
}

#===============================================================================
# PHASE 7: CREATE ENVIRONMENT FILE
#===============================================================================

phase7_create_env_file() {
    log_step "PHASE 7: Creating environment configuration..."
    
    cat > $OPT_DIR/.env << EOF
#===============================================================================
# CoinDaily Environment Configuration
# Server: 16 cores, 64GB RAM, 300GB NVMe
#===============================================================================

# Domain Configuration
DOMAIN_MAIN=${DOMAIN_MAIN}
DOMAIN_AI=${DOMAIN_AI}

# AI Model Endpoints
LLAMA_API_ENDPOINT=http://localhost:11434
DEEPSEEK_API_ENDPOINT=http://localhost:11435
NLLB_API_ENDPOINT=http://localhost:8080
SDXL_API_ENDPOINT=http://localhost:7860
EMBEDDING_API_ENDPOINT=http://localhost:8081

# Database
DATABASE_URL=postgresql://coindaily:${POSTGRES_PASSWORD}@localhost:5432/coindaily
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Monitoring
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}

# Memory Allocation
LLAMA_MEMORY=${LLAMA_MEMORY}
DEEPSEEK_MEMORY=${DEEPSEEK_MEMORY}
SDXL_MEMORY=${SDXL_MEMORY}
NLLB_MEMORY=${NLLB_MEMORY}
EMBEDDINGS_MEMORY=${EMBEDDINGS_MEMORY}
POSTGRES_MEMORY=${POSTGRES_MEMORY}
REDIS_MEMORY=${REDIS_MEMORY}
ELASTICSEARCH_MEMORY=${ELASTICSEARCH_MEMORY}

# CPU Allocation
LLAMA_CPUS=${LLAMA_CPUS}
DEEPSEEK_CPUS=${DEEPSEEK_CPUS}
SDXL_CPUS=${SDXL_CPUS}
NLLB_CPUS=${NLLB_CPUS}
EMBEDDINGS_CPUS=${EMBEDDINGS_CPUS}

# Performance
OLLAMA_NUM_PARALLEL=4
OLLAMA_MAX_LOADED_MODELS=2
CACHE_TTL_ARTICLES=3600
CACHE_TTL_MARKET=30
CACHE_TTL_AI=7200

# AI Processing Schedule (Cron)
AI_SCHEDULE_INTERVAL=3600

# Fallback (disabled - all local)
ENABLE_FALLBACK=false
OPENAI_API_KEY=
HUGGINGFACE_API_KEY=
EOF

    chmod 600 $OPT_DIR/.env
    log_info "Environment file created!"
}

#===============================================================================
# PHASE 8: CONFIGURE NGINX
#===============================================================================

phase8_configure_nginx() {
    log_step "PHASE 8: Configuring Nginx for optimal performance..."
    
    # Backup existing nginx config
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true
    
    # Create optimized nginx.conf
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 50m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 32k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Timeouts
    client_header_timeout 3m;
    client_body_timeout 3m;
    send_timeout 3m;
    
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=ai:10m rate=5r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    # Upstream for AI services
    upstream ai_llama {
        server 127.0.0.1:11434;
        keepalive 32;
    }
    
    upstream ai_deepseek {
        server 127.0.0.1:11435;
        keepalive 32;
    }
    
    upstream ai_translation {
        server 127.0.0.1:8080;
        keepalive 32;
    }

    # Include site configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

    # Create CoinDaily site configuration
    cat > /etc/nginx/sites-available/coindaily << 'EOF'
# Main CoinDaily Site
server {
    listen 80;
    server_name coindailynow.com www.coindailynow.com;
    
    root /var/www/Coindailynow;
    index index.html index.htm index.php;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate limiting
    limit_req zone=general burst=20 nodelay;
    limit_conn conn_limit 50;
    
    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|woff|woff2|ttf|svg|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Main location
    location / {
        try_files $uri $uri/ /index.html =404;
    }
    
    # API Proxy (if you have a backend)
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}

# Token Landing Page
server {
    listen 80;
    server_name token.coindailynow.com;
    
    root /var/www/token-landing;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# AI Services (Internal Only - Protected)
server {
    listen 80;
    server_name ai.coindailynow.com;
    
    # Allow only internal IPs
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;
    
    # Rate limit AI endpoints
    limit_req zone=ai burst=10 nodelay;
    
    location /llama/ {
        proxy_pass http://ai_llama/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }
    
    location /deepseek/ {
        proxy_pass http://ai_deepseek/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 300s;
    }
    
    location /translate/ {
        proxy_pass http://ai_translation/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 120s;
    }
    
    location /health {
        return 200 'AI Gateway OK';
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable sites
    ln -sf /etc/nginx/sites-available/coindaily /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # Test and reload
    nginx -t
    systemctl reload nginx
    
    log_info "Nginx configured!"
}

#===============================================================================
# PHASE 9: CONFIGURE FIREWALL
#===============================================================================

phase9_configure_firewall() {
    log_step "PHASE 9: Configuring firewall..."
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # SSH
    ufw allow 22/tcp comment 'SSH'
    
    # HTTP/HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Monitoring (restrict to internal)
    # ufw allow from 10.0.0.0/8 to any port 3001 comment 'Grafana'
    # ufw allow from 10.0.0.0/8 to any port 9090 comment 'Prometheus'
    
    # Enable firewall
    ufw --force enable
    
    # Show status
    ufw status verbose
    
    log_info "Firewall configured!"
}

#===============================================================================
# PHASE 10: CONFIGURE FAIL2BAN
#===============================================================================

phase10_configure_fail2ban() {
    log_step "PHASE 10: Configuring Fail2ban..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log_info "Fail2ban configured!"
}

#===============================================================================
# PHASE 11: CREATE CRON JOBS
#===============================================================================

phase11_create_cron_jobs() {
    log_step "PHASE 11: Creating scheduled tasks..."
    
    # Create AI processing script
    cat > $OPT_DIR/scripts/ai-hourly-job.sh << 'EOF'
#!/bin/bash
# CoinDaily AI Hourly Processing Job
# Runs AI models for news processing

LOG_FILE="/opt/coindaily/logs/ai-processing-$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting hourly AI processing..."

# Check if services are healthy
LLAMA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags)
DEEPSEEK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11435/api/tags)
NLLB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)

if [ "$LLAMA_STATUS" != "200" ]; then
    log "ERROR: Llama service not responding (status: $LLAMA_STATUS)"
fi

if [ "$DEEPSEEK_STATUS" != "200" ]; then
    log "ERROR: DeepSeek service not responding (status: $DEEPSEEK_STATUS)"
fi

if [ "$NLLB_STATUS" != "200" ]; then
    log "ERROR: NLLB Translation service not responding (status: $NLLB_STATUS)"
fi

# Trigger news processing via API (adjust endpoint as needed)
# curl -X POST http://localhost:3000/api/ai/process-news

log "Hourly AI processing complete"
EOF

    chmod +x $OPT_DIR/scripts/ai-hourly-job.sh

    # Create real-time data fetch script (runs before AI processing)
    cat > $OPT_DIR/scripts/realtime-data-fetch.sh << 'REALTIMEOF'
#!/bin/bash
#===============================================================================
# CoinDaily Real-time Data Fetcher
# Fetches fresh trending data from multiple sources before AI processing
#===============================================================================

LOG_FILE="/opt/coindaily/logs/realtime-data-$(date +%Y%m%d).log"
METRICS_FILE="/opt/coindaily/metrics/realtime_data.prom"
CACHE_DIR="/opt/coindaily/cache"

mkdir -p $CACHE_DIR

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

update_metric() {
    echo "$1 $2" >> $METRICS_FILE.tmp
}

> $METRICS_FILE.tmp
log "=== Starting Real-time Data Fetch ==="

# 1. Fetch Twitter/X trends
log "Fetching Twitter trends..."
TWITTER_START=$(date +%s)
curl -s -X POST http://localhost:4000/api/data/fetch-twitter-trends \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY:-coindaily_internal_2026}" \
    --max-time 30 > $CACHE_DIR/twitter_trends.json 2>/dev/null || echo '{"error":true}' > $CACHE_DIR/twitter_trends.json
update_metric "twitter_last_fetch_timestamp" "$(date +%s)"
update_metric "twitter_fetch_duration_seconds" "$(($(date +%s) - TWITTER_START))"
log "Twitter fetch complete"

# 2. Fetch Reddit crypto data
log "Fetching Reddit data..."
REDDIT_START=$(date +%s)
curl -s -X POST http://localhost:4000/api/data/fetch-reddit-trends \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY:-coindaily_internal_2026}" \
    -d '{"subreddits":["cryptocurrency","CryptoMoonShots","memecoins"]}' \
    --max-time 30 > $CACHE_DIR/reddit_trends.json 2>/dev/null || echo '{"error":true}' > $CACHE_DIR/reddit_trends.json
update_metric "reddit_last_fetch_timestamp" "$(date +%s)"
update_metric "reddit_fetch_duration_seconds" "$(($(date +%s) - REDDIT_START))"
log "Reddit fetch complete"

# 3. Fetch NewsAPI crypto news
log "Fetching NewsAPI..."
NEWSAPI_START=$(date +%s)
curl -s -X POST http://localhost:4000/api/data/fetch-newsapi \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY:-coindaily_internal_2026}" \
    -d '{"query":"cryptocurrency bitcoin ethereum memecoin"}' \
    --max-time 30 > $CACHE_DIR/newsapi_data.json 2>/dev/null || echo '{"error":true}' > $CACHE_DIR/newsapi_data.json
update_metric "newsapi_last_fetch_timestamp" "$(date +%s)"
update_metric "newsapi_fetch_duration_seconds" "$(($(date +%s) - NEWSAPI_START))"
log "NewsAPI fetch complete"

# 4. Fetch CryptoPanic
log "Fetching CryptoPanic..."
CRYPTOPANIC_START=$(date +%s)
curl -s -X POST http://localhost:4000/api/data/fetch-cryptopanic \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY:-coindaily_internal_2026}" \
    -d '{"filter":"hot"}' \
    --max-time 30 > $CACHE_DIR/cryptopanic_data.json 2>/dev/null || echo '{"error":true}' > $CACHE_DIR/cryptopanic_data.json
update_metric "cryptopanic_last_fetch_timestamp" "$(date +%s)"
update_metric "cryptopanic_fetch_duration_seconds" "$(($(date +%s) - CRYPTOPANIC_START))"
log "CryptoPanic fetch complete"

# 5. Fetch CoinGecko market data
log "Fetching CoinGecko market data..."
COINGECKO_START=$(date +%s)
curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100" \
    --max-time 30 > $CACHE_DIR/coingecko_markets.json 2>/dev/null || echo '[]' > $CACHE_DIR/coingecko_markets.json
update_metric "coingecko_last_fetch_timestamp" "$(date +%s)"
log "CoinGecko fetch complete"

# 6. Fetch memecoin data
log "Fetching memecoin data..."
curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=volume_desc&per_page=50" \
    --max-time 30 > $CACHE_DIR/memecoins.json 2>/dev/null || echo '[]' > $CACHE_DIR/memecoins.json
update_metric "memecoin_last_fetch_timestamp" "$(date +%s)"
log "Memecoin fetch complete"

# Finalize metrics
update_metric "realtime_last_complete_fetch_timestamp" "$(date +%s)"
mv $METRICS_FILE.tmp $METRICS_FILE 2>/dev/null || true

log "=== Real-time Data Fetch Complete ==="

# Notify AI pipeline
curl -s -X POST http://localhost:4000/api/ai/trigger-content-generation \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY:-coindaily_internal_2026}" \
    -d '{"source":"realtime_data_fetch","timestamp":"'"$(date -Iseconds)"'"}' \
    --max-time 10 2>/dev/null || log "WARN: Could not notify AI pipeline"

exit 0
REALTIMEOF

    chmod +x $OPT_DIR/scripts/realtime-data-fetch.sh

    # Create backup script
    cat > $OPT_DIR/scripts/backup-daily.sh << 'EOF'
#!/bin/bash
# Daily backup script

BACKUP_DIR="/backup/daily"
DATE=$(date +%Y%m%d)
LOG_FILE="/opt/coindaily/logs/backup-$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting daily backup..."

# Backup PostgreSQL
docker exec coindaily-postgres pg_dump -U coindaily coindaily | gzip > $BACKUP_DIR/postgres-$DATE.sql.gz
log "PostgreSQL backup complete"

# Backup Redis
docker exec coindaily-redis redis-cli BGSAVE
sleep 5
docker cp coindaily-redis:/data/dump.rdb $BACKUP_DIR/redis-$DATE.rdb
log "Redis backup complete"

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
log "Old backups cleaned"

log "Daily backup complete"
EOF

    chmod +x $OPT_DIR/scripts/backup-daily.sh

    # Create system monitor script
    cat > $OPT_DIR/scripts/system-monitor.sh << 'EOF'
#!/bin/bash
# System monitoring script - runs every 5 minutes

LOG_FILE="/opt/coindaily/logs/system-monitor.log"
ALERT_THRESHOLD_CPU=90
ALERT_THRESHOLD_MEM=90
ALERT_THRESHOLD_DISK=85

# Get metrics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

# Log metrics
echo "[$(date '+%Y-%m-%d %H:%M:%S')] CPU: ${CPU_USAGE}% | MEM: ${MEM_USAGE}% | DISK: ${DISK_USAGE}%" >> $LOG_FILE

# Check thresholds
if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: High CPU usage: ${CPU_USAGE}%" >> $LOG_FILE
fi

if [ "$MEM_USAGE" -gt "$ALERT_THRESHOLD_MEM" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: High memory usage: ${MEM_USAGE}%" >> $LOG_FILE
fi

if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: High disk usage: ${DISK_USAGE}%" >> $LOG_FILE
fi
EOF

    chmod +x $OPT_DIR/scripts/system-monitor.sh

    # Create log rotation config
    cat > /etc/logrotate.d/coindaily << 'EOF'
/opt/coindaily/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
EOF

    # Install crontab
    (crontab -l 2>/dev/null | grep -v coindaily; cat << 'EOF'
# CoinDaily Scheduled Tasks

# Real-time data fetch - every 15 minutes (feeds AI with fresh data)
*/15 * * * * /opt/coindaily/scripts/realtime-data-fetch.sh

# AI content processing - every hour at :05 (after data fetch)
5 * * * * /opt/coindaily/scripts/ai-hourly-job.sh

# Daily backup - 2 AM
0 2 * * * /opt/coindaily/scripts/backup-daily.sh

# System monitoring - every 5 minutes
*/5 * * * * /opt/coindaily/scripts/system-monitor.sh

# Docker cleanup - weekly (Sunday 3 AM)
0 3 * * 0 docker system prune -af --volumes 2>/dev/null

# Log rotation - daily at midnight
0 0 * * * /usr/sbin/logrotate /etc/logrotate.d/coindaily

# Clear old cache files - daily at 4 AM
0 4 * * * find /opt/coindaily/cache -type f -mtime +1 -delete 2>/dev/null
EOF
) | crontab -
    
    log_info "Cron jobs configured!"
}

#===============================================================================
# PHASE 12: CREATE POSTGRES INIT SQL
#===============================================================================

phase12_create_postgres_init() {
    log_step "PHASE 12: Creating PostgreSQL initialization..."
    
    mkdir -p $OPT_DIR/config/postgres
    
    cat > $OPT_DIR/config/postgres/init.sql << 'EOF'
-- CoinDaily Database Initialization
-- Optimized for AI News Platform

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS auth;

-- Articles table
CREATE TABLE IF NOT EXISTS content.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    seo_description VARCHAR(160),
    keywords TEXT[],
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    is_premium BOOLEAN DEFAULT FALSE,
    author_id UUID,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(100),
    seo_score INTEGER,
    readability_score INTEGER,
    word_count INTEGER,
    reading_time_minutes INTEGER,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_articles_status ON content.articles(status);
CREATE INDEX idx_articles_published ON content.articles(published_at DESC);
CREATE INDEX idx_articles_category ON content.articles(category);
CREATE INDEX idx_articles_slug ON content.articles(slug);
CREATE INDEX idx_articles_premium ON content.articles(is_premium);
CREATE INDEX idx_articles_search ON content.articles USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Translations table
CREATE TABLE IF NOT EXISTS content.translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES content.articles(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    seo_description VARCHAR(160),
    translation_quality_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, language_code)
);

CREATE INDEX idx_translations_article ON content.translations(article_id);
CREATE INDEX idx_translations_lang ON content.translations(language_code);

-- AI Tasks table
CREATE TABLE IF NOT EXISTS ai.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(100) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB,
    status VARCHAR(50) DEFAULT 'queued',
    priority VARCHAR(20) DEFAULT 'normal',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    processing_time_ms INTEGER,
    error_message TEXT,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_tasks_status ON ai.tasks(status);
CREATE INDEX idx_ai_tasks_type ON ai.tasks(task_type);
CREATE INDEX idx_ai_tasks_scheduled ON ai.tasks(scheduled_at);

-- Market Data table
CREATE TABLE IF NOT EXISTS analytics.market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(20, 8),
    volume_24h DECIMAL(30, 8),
    market_cap DECIMAL(30, 8),
    price_change_24h DECIMAL(10, 4),
    price_change_7d DECIMAL(10, 4),
    source VARCHAR(50),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_data_symbol ON analytics.market_data(symbol);
CREATE INDEX idx_market_data_time ON analytics.market_data(recorded_at DESC);

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '64MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';
ALTER SYSTEM SET max_worker_processes = 8;
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET max_parallel_maintenance_workers = 4;

-- Grant permissions
GRANT ALL ON SCHEMA content TO coindaily;
GRANT ALL ON SCHEMA ai TO coindaily;
GRANT ALL ON SCHEMA analytics TO coindaily;
GRANT ALL ON SCHEMA auth TO coindaily;
GRANT ALL ON ALL TABLES IN SCHEMA content TO coindaily;
GRANT ALL ON ALL TABLES IN SCHEMA ai TO coindaily;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO coindaily;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO coindaily;
EOF

    log_info "PostgreSQL init script created!"
}

#===============================================================================
# PHASE 13: START SERVICES
#===============================================================================

phase13_start_services() {
    log_step "PHASE 13: Starting all services..."
    
    cd $OPT_DIR
    
    # Build custom images
    log_info "Building custom Docker images..."
    docker compose build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to initialize (this may take a few minutes)..."
    sleep 30
    
    # Check service status
    docker compose ps
    
    log_info "Services started!"
}

#===============================================================================
# PHASE 14: PULL AI MODELS
#===============================================================================

phase14_pull_models() {
    log_step "PHASE 14: Pulling AI models (this will take 30-60 minutes)..."
    
    # Wait for Ollama to be ready
    log_info "Waiting for Ollama services to be ready..."
    sleep 60
    
    # Pull Llama 3.1 8B (4-bit quantized)
    log_info "Pulling Llama 3.1 8B model (4.5GB)..."
    docker exec coindaily-ai-llama ollama pull llama3.1:8b-instruct-q4_0 || {
        log_warn "Failed to pull llama3.1, trying alternative..."
        docker exec coindaily-ai-llama ollama pull llama3.1:8b
    }
    
    # Pull DeepSeek-R1
    log_info "Pulling DeepSeek-R1 8B model (5GB)..."
    docker exec coindaily-ai-deepseek ollama pull deepseek-r1:8b || {
        log_warn "Failed to pull deepseek-r1:8b, trying deepseek-coder..."
        docker exec coindaily-ai-deepseek ollama pull deepseek-coder:6.7b
    }
    
    log_info "AI models pulled! NLLB and Embeddings models will download on first use."
}

#===============================================================================
# PHASE 15: VERIFY INSTALLATION
#===============================================================================

phase15_verify() {
    log_step "PHASE 15: Verifying installation..."
    
    echo ""
    echo "=============================================="
    echo "SERVICE STATUS CHECK"
    echo "=============================================="
    
    # Check each service
    services=(
        "Llama (11434)|http://localhost:11434/api/tags"
        "DeepSeek (11435)|http://localhost:11435/api/tags"
        "NLLB (8080)|http://localhost:8080/health"
        "SDXL Image (7860)|http://localhost:7860/health"
        "Embeddings (8081)|http://localhost:8081/health"
        "PostgreSQL (5432)|localhost:5432"
        "Redis (6379)|localhost:6379"
        "Elasticsearch (9200)|http://localhost:9200"
        "Prometheus (9090)|http://localhost:9090"
        "Grafana (3001)|http://localhost:3001"
    )
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d'|' -f1)
        endpoint=$(echo $service | cut -d'|' -f2)
        
        if [[ $endpoint == http* ]]; then
            status=$(curl -s -o /dev/null -w "%{http_code}" $endpoint 2>/dev/null || echo "000")
            if [ "$status" == "200" ]; then
                echo -e "${GREEN}✓${NC} $name: Running"
            else
                echo -e "${RED}✗${NC} $name: Not responding (status: $status)"
            fi
        else
            host=$(echo $endpoint | cut -d':' -f1)
            port=$(echo $endpoint | cut -d':' -f2)
            if nc -z $host $port 2>/dev/null; then
                echo -e "${GREEN}✓${NC} $name: Running"
            else
                echo -e "${RED}✗${NC} $name: Not responding"
            fi
        fi
    done
    
    echo ""
    echo "=============================================="
    echo "DISK USAGE"
    echo "=============================================="
    df -h /
    
    echo ""
    echo "=============================================="
    echo "MEMORY USAGE"
    echo "=============================================="
    free -h
    
    echo ""
    echo "=============================================="
    echo "DOCKER CONTAINERS"
    echo "=============================================="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    log_info "Verification complete!"
}

#===============================================================================
# PHASE 16: CREATE MANAGEMENT SCRIPTS
#===============================================================================

phase16_create_management_scripts() {
    log_step "PHASE 16: Creating management scripts..."
    
    # Start script
    cat > $OPT_DIR/start.sh << 'EOF'
#!/bin/bash
cd /opt/coindaily
docker compose up -d
echo "CoinDaily services started!"
docker compose ps
EOF
    chmod +x $OPT_DIR/start.sh
    
    # Stop script
    cat > $OPT_DIR/stop.sh << 'EOF'
#!/bin/bash
cd /opt/coindaily
docker compose down
echo "CoinDaily services stopped!"
EOF
    chmod +x $OPT_DIR/stop.sh
    
    # Restart script
    cat > $OPT_DIR/restart.sh << 'EOF'
#!/bin/bash
cd /opt/coindaily
docker compose restart
echo "CoinDaily services restarted!"
docker compose ps
EOF
    chmod +x $OPT_DIR/restart.sh
    
    # Status script
    cat > $OPT_DIR/status.sh << 'EOF'
#!/bin/bash
echo "=== CoinDaily Service Status ==="
cd /opt/coindaily
docker compose ps

echo ""
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "=== System Resources ==="
echo "CPU: $(nproc) cores"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
EOF
    chmod +x $OPT_DIR/status.sh
    
    # Logs script
    cat > $OPT_DIR/logs.sh << 'EOF'
#!/bin/bash
SERVICE=${1:-""}
cd /opt/coindaily

if [ -z "$SERVICE" ]; then
    docker compose logs -f --tail=100
else
    docker compose logs -f --tail=100 $SERVICE
fi
EOF
    chmod +x $OPT_DIR/logs.sh
    
    # Test AI script
    cat > $OPT_DIR/test-ai.sh << 'EOF'
#!/bin/bash
echo "=== Testing AI Services ==="

echo ""
echo "1. Testing Llama (Article Generation)..."
curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b-instruct-q4_0",
  "prompt": "Write a one-sentence headline about Bitcoin reaching $100k",
  "stream": false
}' | jq -r '.response // "Error: No response"' 2>/dev/null || echo "Llama service not responding"

echo ""
echo "2. Testing DeepSeek (Review Agent)..."
curl -s http://localhost:11435/api/generate -d '{
  "model": "deepseek-r1:8b",
  "prompt": "Is this newsworthy: Bitcoin hits all-time high. Answer YES or NO with brief reason.",
  "stream": false
}' | jq -r '.response // "Error: No response"' 2>/dev/null || echo "DeepSeek service not responding"

echo ""
echo "3. Testing NLLB (Translation to Hausa)..."
curl -s -X POST http://localhost:8080/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bitcoin price surges to new highs",
    "source_lang": "eng_Latn",
    "target_lang": "hau_Latn"
  }' | jq -r '.translated_text // "Error: No response"' 2>/dev/null || echo "NLLB service not responding"

echo ""
echo "4. Testing SDXL (Image Generation - this takes ~60s on CPU)..."
echo "   Generating a test image..."
SDXL_RESULT=$(curl -s -X POST http://localhost:7860/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Bitcoin cryptocurrency logo, professional, golden, 3D render",
    "width": 512,
    "height": 512,
    "steps": 15
  }' 2>/dev/null)
if echo "$SDXL_RESULT" | jq -e '.image_base64' > /dev/null 2>&1; then
    TIME=$(echo "$SDXL_RESULT" | jq -r '.processing_time_seconds')
    echo "   ✓ Image generated successfully in ${TIME}s"
else
    echo "   SDXL service not responding or still loading model"
fi

echo ""
echo "5. Testing BGE Embeddings (Semantic Search/RAG)..."
curl -s -X POST http://localhost:8081/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Bitcoin news article about African adoption"]}' | jq -r '"Embedding dimension: " + (.dimension | tostring) + " (vectors for similarity search)"' 2>/dev/null || echo "Embeddings service not responding"

echo ""
echo "=== AI Tests Complete ==="
echo ""
echo "Service Roles:"
echo "  • Llama 3.1     → Writes articles and generates headlines"
echo "  • DeepSeek-R1   → Reviews content, SEO analysis, fact-checking"
echo "  • NLLB          → Translates to 15 African languages"
echo "  • SDXL          → Generates images for articles"
echo "  • Embeddings    → Powers semantic search (stored in Elasticsearch)"
echo ""
echo "Monitoring:"
echo "  • Prometheus    → Collects metrics from all services"
echo "  • Grafana       → Visualizes metrics dashboards"
echo "  • Elasticsearch → Stores search indexes & logs (NOT metrics)"
EOF
    chmod +x $OPT_DIR/test-ai.sh

    log_info "Management scripts created!"
}

#===============================================================================
# PHASE 17: FINAL SUMMARY
#===============================================================================

phase17_summary() {
    log_step "PHASE 17: Setup Complete!"
    
    echo ""
    echo "=============================================="
    echo "   CoinDaily VPS Setup Complete!"
    echo "=============================================="
    echo ""
    echo "Server Specs:"
    echo "  • CPU: 16 cores"
    echo "  • RAM: 64GB"
    echo "  • Storage: 300GB NVMe"
    echo ""
    echo "AI Services Running:"
    echo "  • Llama 3.1 8B      → localhost:11434 (Article Writing)"
    echo "  • DeepSeek-R1 8B    → localhost:11435 (Review/Reasoning)"
    echo "  • NLLB Translation  → localhost:8080  (15 African Languages)"
    echo "  • SDXL Image Gen    → localhost:7860  (AI Image Generation)"
    echo "  • BGE Embeddings    → localhost:8081  (Semantic Search/RAG)"
    echo ""
    echo "Infrastructure:"
    echo "  • PostgreSQL        → localhost:5432  (Database)"
    echo "  • Redis             → localhost:6379  (Cache/Queue)"
    echo "  • Elasticsearch     → localhost:9200  (Search & Logs)"
    echo ""
    echo "Monitoring:"
    echo "  • Prometheus        → localhost:9090  (Metrics Collection)"
    echo "  • Grafana           → localhost:3001  (Dashboards)"
    echo ""
    echo "Websites:"
    echo "  • Main:  /var/www/Coindailynow"
    echo "  • Token: /var/www/token-landing"
    echo ""
    echo "Management Commands:"
    echo "  • Start:   /opt/coindaily/start.sh"
    echo "  • Stop:    /opt/coindaily/stop.sh"
    echo "  • Restart: /opt/coindaily/restart.sh"
    echo "  • Status:  /opt/coindaily/status.sh"
    echo "  • Logs:    /opt/coindaily/logs.sh [service]"
    echo "  • Test AI: /opt/coindaily/test-ai.sh"
    echo ""
    echo "Scheduled Tasks:"
    echo "  • AI Processing: Every hour"
    echo "  • Backups: Daily at 2 AM"
    echo "  • System Monitor: Every 5 minutes"
    echo ""
    echo "Credentials (CHANGE THESE!):"
    echo "  • Grafana: admin / ${GRAFANA_PASSWORD}"
    echo "  • PostgreSQL: coindaily / ${POSTGRES_PASSWORD}"
    echo ""
    echo "Next Steps:"
    echo "  1. Run: /opt/coindaily/test-ai.sh"
    echo "  2. Access Grafana: http://YOUR_IP:3001"
    echo "  3. Configure SSL: certbot --nginx -d coindailynow.com"
    echo "  4. Update your application to use the new endpoints"
    echo ""
    echo "=============================================="
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "   CoinDaily VPS Setup Script"
    echo "   16 cores | 64GB RAM | 300GB NVMe"
    echo "=============================================="
    echo ""
    
    # Confirm before proceeding
    read -p "This will clean up /opt and set up the AI platform. Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    
    # Run all phases
    phase1_cleanup
    phase2_optimize_system
    phase3_install_docker
    phase4_create_directories
    phase5_create_docker_files
    phase6_create_docker_compose
    phase7_create_env_file
    phase8_configure_nginx
    phase9_configure_firewall
    phase10_configure_fail2ban
    phase11_create_cron_jobs
    phase12_create_postgres_init
    phase13_start_services
    phase14_pull_models
    phase15_verify
    phase16_create_management_scripts
    phase17_summary
}

# Run main function
main "$@"
