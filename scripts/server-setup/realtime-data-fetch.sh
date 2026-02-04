#!/bin/bash
#===============================================================================
# CoinDaily Real-time Data Fetcher
# Fetches fresh trending data from multiple sources before AI processing
# This script runs before each AI content generation cycle
#===============================================================================

set -e

LOG_FILE="/opt/coindaily/logs/realtime-data-$(date +%Y%m%d).log"
METRICS_FILE="/opt/coindaily/metrics/realtime_data.prom"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

update_metric() {
    echo "$1 $2" >> $METRICS_FILE.tmp
}

# Start with fresh metrics
> $METRICS_FILE.tmp

log "=== Starting Real-time Data Fetch ==="

#-------------------------------------------------------------------------------
# 1. TWITTER/X TRENDING DATA
#-------------------------------------------------------------------------------
log "Fetching Twitter/X trends..."
TWITTER_START=$(date +%s)

# Use the backend API to fetch Twitter trends
TWITTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/data/fetch-twitter-trends \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY}" \
    --max-time 30 2>/dev/null || echo '{"error": true}')

TWITTER_END=$(date +%s)
TWITTER_DURATION=$((TWITTER_END - TWITTER_START))

if echo "$TWITTER_RESPONSE" | grep -q '"error"'; then
    log "ERROR: Twitter fetch failed"
    update_metric "twitter_fetch_success" "0"
else
    TWITTER_TOPICS=$(echo "$TWITTER_RESPONSE" | jq -r '.count // 0')
    log "SUCCESS: Fetched $TWITTER_TOPICS Twitter trending topics in ${TWITTER_DURATION}s"
    update_metric "twitter_fetch_success" "1"
    update_metric "twitter_topics_count" "$TWITTER_TOPICS"
fi
update_metric "twitter_last_fetch_timestamp" "$(date +%s)"
update_metric "twitter_fetch_duration_seconds" "$TWITTER_DURATION"

#-------------------------------------------------------------------------------
# 2. REDDIT CRYPTO DATA
#-------------------------------------------------------------------------------
log "Fetching Reddit crypto discussions..."
REDDIT_START=$(date +%s)

# Subreddits: cryptocurrency, CryptoMoonShots, memecoins, SatoshiStreetBets
REDDIT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/data/fetch-reddit-trends \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY}" \
    -d '{"subreddits": ["cryptocurrency", "CryptoMoonShots", "memecoins", "SatoshiStreetBets"]}' \
    --max-time 30 2>/dev/null || echo '{"error": true}')

REDDIT_END=$(date +%s)
REDDIT_DURATION=$((REDDIT_END - REDDIT_START))

if echo "$REDDIT_RESPONSE" | grep -q '"error"'; then
    log "ERROR: Reddit fetch failed"
    update_metric "reddit_fetch_success" "0"
else
    REDDIT_POSTS=$(echo "$REDDIT_RESPONSE" | jq -r '.count // 0')
    log "SUCCESS: Fetched $REDDIT_POSTS Reddit posts in ${REDDIT_DURATION}s"
    update_metric "reddit_fetch_success" "1"
    update_metric "reddit_posts_count" "$REDDIT_POSTS"
fi
update_metric "reddit_last_fetch_timestamp" "$(date +%s)"
update_metric "reddit_fetch_duration_seconds" "$REDDIT_DURATION"

#-------------------------------------------------------------------------------
# 3. NEWSAPI CRYPTO NEWS
#-------------------------------------------------------------------------------
log "Fetching NewsAPI crypto news..."
NEWSAPI_START=$(date +%s)

NEWSAPI_RESPONSE=$(curl -s -X POST http://localhost:4000/api/data/fetch-newsapi \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY}" \
    -d '{"query": "cryptocurrency OR bitcoin OR ethereum OR memecoin OR crypto", "sortBy": "publishedAt"}' \
    --max-time 30 2>/dev/null || echo '{"error": true}')

NEWSAPI_END=$(date +%s)
NEWSAPI_DURATION=$((NEWSAPI_END - NEWSAPI_START))

if echo "$NEWSAPI_RESPONSE" | grep -q '"error"'; then
    log "ERROR: NewsAPI fetch failed"
    update_metric "newsapi_fetch_success" "0"
else
    NEWSAPI_ARTICLES=$(echo "$NEWSAPI_RESPONSE" | jq -r '.count // 0')
    log "SUCCESS: Fetched $NEWSAPI_ARTICLES news articles in ${NEWSAPI_DURATION}s"
    update_metric "newsapi_fetch_success" "1"
    update_metric "newsapi_articles_count" "$NEWSAPI_ARTICLES"
fi
update_metric "newsapi_last_fetch_timestamp" "$(date +%s)"
update_metric "newsapi_fetch_duration_seconds" "$NEWSAPI_DURATION"

#-------------------------------------------------------------------------------
# 4. CRYPTOPANIC AGGREGATED NEWS
#-------------------------------------------------------------------------------
log "Fetching CryptoPanic aggregated news..."
CRYPTOPANIC_START=$(date +%s)

CRYPTOPANIC_RESPONSE=$(curl -s -X POST http://localhost:4000/api/data/fetch-cryptopanic \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY}" \
    -d '{"filter": "hot", "region": "africa"}' \
    --max-time 30 2>/dev/null || echo '{"error": true}')

CRYPTOPANIC_END=$(date +%s)
CRYPTOPANIC_DURATION=$((CRYPTOPANIC_END - CRYPTOPANIC_START))

if echo "$CRYPTOPANIC_RESPONSE" | grep -q '"error"'; then
    log "ERROR: CryptoPanic fetch failed"
    update_metric "cryptopanic_fetch_success" "0"
else
    CRYPTOPANIC_NEWS=$(echo "$CRYPTOPANIC_RESPONSE" | jq -r '.count // 0')
    log "SUCCESS: Fetched $CRYPTOPANIC_NEWS CryptoPanic news in ${CRYPTOPANIC_DURATION}s"
    update_metric "cryptopanic_fetch_success" "1"
    update_metric "cryptopanic_news_count" "$CRYPTOPANIC_NEWS"
fi
update_metric "cryptopanic_last_fetch_timestamp" "$(date +%s)"
update_metric "cryptopanic_fetch_duration_seconds" "$CRYPTOPANIC_DURATION"

#-------------------------------------------------------------------------------
# 5. AFRICAN EXCHANGE DATA (Luno, Quidax, etc.)
#-------------------------------------------------------------------------------
log "Fetching African exchange data..."
AFRICA_START=$(date +%s)

AFRICA_RESPONSE=$(curl -s -X POST http://localhost:4000/api/data/fetch-african-exchanges \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY}" \
    -d '{"exchanges": ["luno", "quidax", "valr", "ice3x", "binance_africa"]}' \
    --max-time 30 2>/dev/null || echo '{"error": true}')

AFRICA_END=$(date +%s)
AFRICA_DURATION=$((AFRICA_END - AFRICA_START))

if echo "$AFRICA_RESPONSE" | grep -q '"error"'; then
    log "ERROR: African exchange fetch failed"
    update_metric "africa_exchange_fetch_success" "0"
else
    log "SUCCESS: Fetched African exchange data in ${AFRICA_DURATION}s"
    update_metric "africa_exchange_fetch_success" "1"
fi
update_metric "africa_exchange_last_fetch_timestamp" "$(date +%s)"
update_metric "africa_exchange_fetch_duration_seconds" "$AFRICA_DURATION"

#-------------------------------------------------------------------------------
# 6. COINGECKO MARKET DATA
#-------------------------------------------------------------------------------
log "Fetching CoinGecko market data..."
COINGECKO_START=$(date +%s)

COINGECKO_RESPONSE=$(curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false" \
    --max-time 30 2>/dev/null || echo '[]')

COINGECKO_END=$(date +%s)
COINGECKO_DURATION=$((COINGECKO_END - COINGECKO_START))

COINS_COUNT=$(echo "$COINGECKO_RESPONSE" | jq -r 'length // 0')
if [ "$COINS_COUNT" -gt 0 ]; then
    log "SUCCESS: Fetched $COINS_COUNT coins from CoinGecko in ${COINGECKO_DURATION}s"
    update_metric "coingecko_fetch_success" "1"
    update_metric "coingecko_coins_count" "$COINS_COUNT"
    
    # Cache the data for AI models
    echo "$COINGECKO_RESPONSE" > /opt/coindaily/cache/coingecko_latest.json
else
    log "ERROR: CoinGecko fetch failed"
    update_metric "coingecko_fetch_success" "0"
fi
update_metric "coingecko_last_fetch_timestamp" "$(date +%s)"
update_metric "coingecko_fetch_duration_seconds" "$COINGECKO_DURATION"

#-------------------------------------------------------------------------------
# 7. MEMECOIN SPECIFIC DATA
#-------------------------------------------------------------------------------
log "Fetching memecoin trending data..."
MEMECOIN_START=$(date +%s)

# Get memecoins from CoinGecko
MEME_RESPONSE=$(curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=volume_desc&per_page=50&page=1" \
    --max-time 30 2>/dev/null || echo '[]')

MEMECOIN_END=$(date +%s)
MEMECOIN_DURATION=$((MEMECOIN_END - MEMECOIN_START))

MEME_COUNT=$(echo "$MEME_RESPONSE" | jq -r 'length // 0')
if [ "$MEME_COUNT" -gt 0 ]; then
    log "SUCCESS: Fetched $MEME_COUNT memecoins in ${MEMECOIN_DURATION}s"
    update_metric "memecoin_fetch_success" "1"
    update_metric "memecoin_count" "$MEME_COUNT"
    
    # Cache for AI models
    echo "$MEME_RESPONSE" > /opt/coindaily/cache/memecoins_latest.json
else
    log "ERROR: Memecoin fetch failed"
    update_metric "memecoin_fetch_success" "0"
fi
update_metric "memecoin_last_fetch_timestamp" "$(date +%s)"
update_metric "memecoin_fetch_duration_seconds" "$MEMECOIN_DURATION"

#-------------------------------------------------------------------------------
# FINALIZE METRICS
#-------------------------------------------------------------------------------

# Add total fetch time
TOTAL_DURATION=$((TWITTER_DURATION + REDDIT_DURATION + NEWSAPI_DURATION + CRYPTOPANIC_DURATION + AFRICA_DURATION + COINGECKO_DURATION + MEMECOIN_DURATION))
update_metric "realtime_total_fetch_duration_seconds" "$TOTAL_DURATION"
update_metric "realtime_last_complete_fetch_timestamp" "$(date +%s)"

# Atomic move to final metrics file
mv $METRICS_FILE.tmp $METRICS_FILE

log "=== Real-time Data Fetch Complete ==="
log "Total duration: ${TOTAL_DURATION}s"

#-------------------------------------------------------------------------------
# NOTIFY AI PIPELINE
#-------------------------------------------------------------------------------
log "Notifying AI pipeline of fresh data..."

curl -s -X POST http://localhost:4000/api/ai/trigger-content-generation \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: ${INTERNAL_API_KEY}" \
    -d '{
        "source": "realtime_data_fetch",
        "timestamp": "'$(date -Iseconds)'",
        "dataFreshness": {
            "twitter": true,
            "reddit": true,
            "newsapi": true,
            "cryptopanic": true,
            "coingecko": true,
            "memecoins": true
        }
    }' --max-time 10 2>/dev/null || log "WARN: Could not notify AI pipeline"

log "Script completed successfully"
exit 0
