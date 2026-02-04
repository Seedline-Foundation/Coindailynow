#!/bin/bash

# Install Stable Diffusion WebUI on Contabo
# Self-hosted image generation API

cd /opt
mkdir stable-diffusion && cd stable-diffusion

# Install dependencies
apt update
apt install -y wget git python3 python3-venv libgl1 libglib2.0-0

# Clone Stable Diffusion WebUI (AUTOMATIC1111)
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui

# Install
./webui.sh --skip-torch-cuda-test --no-half --api --listen

# This will:
# 1. Download Stable Diffusion XL model (~7GB)
# 2. Start API server on port 7860
# 3. Enable REST API for your backend

# Test API
curl -X POST "http://localhost:7860/sdapi/v1/txt2img" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional crypto news featured image, Bitcoin chart, modern design",
    "steps": 20,
    "width": 1024,
    "height": 576
  }'
