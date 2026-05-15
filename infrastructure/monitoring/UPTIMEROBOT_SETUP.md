# UptimeRobot Setup — CoinDaily Africa

Free tier: 50 monitors, 5-minute intervals.

## Quick Setup (5 minutes)

1. Go to https://uptimerobot.com and sign up (free)
2. Add these 5 monitors:

| Monitor Name | URL | Type | Interval |
|---|---|---|---|
| CoinDaily Frontend | `https://coindaily.online` | HTTP(s) | 5 min |
| CoinDaily API Health | `https://api.coindaily.online/health` | HTTP(s) - keyword "healthy" | 5 min |
| CoinDaily Admin | `https://jet.coindaily.online` | HTTP(s) | 5 min |
| CoinDaily Press | `https://press.coindaily.online` | HTTP(s) | 5 min |
| CoinDaily AI | `https://ai.coindaily.online` | HTTP(s) | 5 min |

3. Configure alerts:
   - **Email**: your founder email
   - **Telegram**: Create bot via @BotFather → add API token + chat ID
   - **SMS** (Pro plan): optional, add phone number

4. Create a status page:
   - Dashboard → My Settings → Status Pages → Create
   - Custom domain: `status.coindaily.online`
   - Select all 5 monitors
   - Set brand colors: `#f97316` (orange)

## API Health Endpoint Response

The `/health` endpoint returns:

```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "up", "latency": 5 },
    "redis": { "status": "up", "latency": 2 },
    "elasticsearch": { "status": "up" }
  },
  "uptime": "2d 14h 32m",
  "version": "1.0.0"
}
```

- `200` = healthy or degraded (DB up, Redis down)
- `503` = unhealthy (DB down)

UptimeRobot keyword monitor should check for `"healthy"` in response body.

## Complementary: Upptime (GitHub-hosted)

We also run Upptime at `github.com/[org]/upptime` for:
- Public status page with incident history
- GitHub Issues created on downtime
- Historical uptime percentage badges for README

Both systems run independently — UptimeRobot for real-time SMS/Telegram alerts, Upptime for public-facing status page and history.
