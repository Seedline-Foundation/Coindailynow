#!/bin/bash
# ============================================
# CoinDaily Admin IP Whitelist Management
# ============================================
# Usage:
#   ./manage-whitelist.sh add <ip> <name>
#   ./manage-whitelist.sh remove <ip>
#   ./manage-whitelist.sh list
#   ./manage-whitelist.sh test <ip>

NGINX_CONF="/etc/nginx/sites-available/jet.coindaily.online.conf"
WHITELIST_LOG="/var/log/coindaily/ip-whitelist.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_action() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $WHITELIST_LOG
}

add_ip() {
    local IP=$1
    local NAME=$2
    
    if [[ ! $IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && [[ ! $IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$ ]]; then
        echo -e "${RED}Invalid IP address format${NC}"
        exit 1
    fi
    
    # Check if IP already exists
    if grep -q "$IP" $NGINX_CONF; then
        echo -e "${YELLOW}IP $IP already whitelisted${NC}"
        exit 0
    fi
    
    # Add IP to whitelist
    sed -i "/# ADD YOUR IPs BELOW:/a\\    $IP       1;  # $NAME - Added $(date '+%Y-%m-%d')" $NGINX_CONF
    
    # Test nginx config
    nginx -t 2>/dev/null
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        echo -e "${GREEN}✓ IP $IP ($NAME) added to whitelist${NC}"
        log_action "ADDED: $IP ($NAME) by $(whoami)"
    else
        echo -e "${RED}Nginx config error. Rolling back...${NC}"
        sed -i "/$IP/d" $NGINX_CONF
        exit 1
    fi
}

remove_ip() {
    local IP=$1
    
    if ! grep -q "$IP" $NGINX_CONF; then
        echo -e "${YELLOW}IP $IP not found in whitelist${NC}"
        exit 0
    fi
    
    # Get name for logging
    local NAME=$(grep "$IP" $NGINX_CONF | grep -oP '#\s*\K[^-]+' | head -1)
    
    # Remove IP from whitelist
    sed -i "/$IP/d" $NGINX_CONF
    
    # Test nginx config
    nginx -t 2>/dev/null
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        echo -e "${GREEN}✓ IP $IP removed from whitelist${NC}"
        log_action "REMOVED: $IP ($NAME) by $(whoami)"
    else
        echo -e "${RED}Nginx config error after removal${NC}"
        exit 1
    fi
}

list_ips() {
    echo -e "${GREEN}Whitelisted IPs for jet.coindaily.online:${NC}"
    echo "========================================"
    grep -E "^\s+[0-9]" $NGINX_CONF | grep -v "default" | while read line; do
        IP=$(echo $line | awk '{print $1}')
        COMMENT=$(echo $line | grep -oP '#\s*\K.*' || echo "No description")
        echo "  $IP - $COMMENT"
    done
    echo "========================================"
}

test_ip() {
    local IP=$1
    
    if grep -q "$IP.*1;" $NGINX_CONF; then
        echo -e "${GREEN}✓ IP $IP is WHITELISTED${NC}"
    else
        echo -e "${RED}✗ IP $IP is NOT whitelisted (will be blocked)${NC}"
    fi
}

case "$1" in
    add)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 add <ip> <name>"
            exit 1
        fi
        add_ip "$2" "$3"
        ;;
    remove)
        if [ -z "$2" ]; then
            echo "Usage: $0 remove <ip>"
            exit 1
        fi
        remove_ip "$2"
        ;;
    list)
        list_ips
        ;;
    test)
        if [ -z "$2" ]; then
            echo "Usage: $0 test <ip>"
            exit 1
        fi
        test_ip "$2"
        ;;
    *)
        echo "CoinDaily Admin IP Whitelist Manager"
        echo ""
        echo "Usage:"
        echo "  $0 add <ip> <name>   - Add IP to whitelist"
        echo "  $0 remove <ip>       - Remove IP from whitelist"
        echo "  $0 list              - List all whitelisted IPs"
        echo "  $0 test <ip>         - Test if IP is whitelisted"
        echo ""
        echo "Examples:"
        echo "  $0 add 123.45.67.89 'CEO Home'"
        echo "  $0 add 10.0.0.0/24 'Office VPN'"
        echo "  $0 remove 123.45.67.89"
        ;;
esac
