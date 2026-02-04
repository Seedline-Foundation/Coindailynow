#!/bin/bash

#===============================================================================
# CoinDaily Quick Fix Script
# Use this if the main setup fails or for quick repairs
#===============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

#===============================================================================
# QUICK FIXES
#===============================================================================

fix_docker() {
    log_info "Fixing Docker..."
    systemctl restart docker
    docker system prune -f
}

fix_nginx() {
    log_info "Fixing Nginx..."
    nginx -t && systemctl reload nginx
}

fix_services() {
    log_info "Restarting all services..."
    cd /opt/coindaily
    docker compose down
    docker compose up -d
}

fix_memory() {
    log_info "Clearing memory caches..."
    sync
    echo 3 > /proc/sys/vm/drop_caches
    docker system prune -f
}

fix_ollama_llama() {
    log_info "Restarting Llama service..."
    docker restart coindaily-ai-llama
    sleep 10
    curl -s http://localhost:11434/api/tags | jq
}

fix_ollama_deepseek() {
    log_info "Restarting DeepSeek service..."
    docker restart coindaily-ai-deepseek
    sleep 10
    curl -s http://localhost:11435/api/tags | jq
}

fix_translation() {
    log_info "Restarting Translation service..."
    docker restart coindaily-ai-translation
    sleep 5
    curl -s http://localhost:8080/health | jq
}

repull_models() {
    log_info "Re-pulling AI models..."
    docker exec coindaily-ai-llama ollama pull llama3.1:8b-instruct-q4_0
    docker exec coindaily-ai-deepseek ollama pull deepseek-r1:8b
}

check_resources() {
    echo "=== System Resources ==="
    echo "CPU Cores: $(nproc)"
    echo "Memory:"
    free -h
    echo ""
    echo "Disk:"
    df -h /
    echo ""
    echo "=== Docker Stats ==="
    docker stats --no-stream
}

check_logs() {
    SERVICE=${1:-""}
    if [ -z "$SERVICE" ]; then
        docker compose logs --tail=50 -f
    else
        docker logs --tail=50 -f coindaily-$SERVICE
    fi
}

#===============================================================================
# MAIN MENU
#===============================================================================

show_menu() {
    echo ""
    echo "=============================================="
    echo "   CoinDaily Quick Fix Menu"
    echo "=============================================="
    echo ""
    echo "  1) Fix Docker"
    echo "  2) Fix Nginx"
    echo "  3) Restart All Services"
    echo "  4) Clear Memory Cache"
    echo "  5) Fix Llama Service"
    echo "  6) Fix DeepSeek Service"
    echo "  7) Fix Translation Service"
    echo "  8) Re-pull AI Models"
    echo "  9) Check Resources"
    echo "  10) View Logs"
    echo "  0) Exit"
    echo ""
    read -p "Select option: " choice
    
    case $choice in
        1) fix_docker ;;
        2) fix_nginx ;;
        3) fix_services ;;
        4) fix_memory ;;
        5) fix_ollama_llama ;;
        6) fix_ollama_deepseek ;;
        7) fix_translation ;;
        8) repull_models ;;
        9) check_resources ;;
        10) 
            read -p "Service name (empty for all): " svc
            check_logs $svc
            ;;
        0) exit 0 ;;
        *) log_error "Invalid option" ;;
    esac
    
    show_menu
}

# Direct command support
if [ "$1" != "" ]; then
    case $1 in
        docker) fix_docker ;;
        nginx) fix_nginx ;;
        services) fix_services ;;
        memory) fix_memory ;;
        llama) fix_ollama_llama ;;
        deepseek) fix_ollama_deepseek ;;
        translation) fix_translation ;;
        models) repull_models ;;
        resources) check_resources ;;
        logs) check_logs $2 ;;
        *) echo "Usage: $0 {docker|nginx|services|memory|llama|deepseek|translation|models|resources|logs}" ;;
    esac
else
    show_menu
fi
