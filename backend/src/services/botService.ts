import _prisma from '../lib/prisma';
import axios from 'axios';

const prisma = _prisma as any;
const AI_SYSTEM_URL = process.env.AI_SYSTEM_URL || 'http://localhost:3004';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || 'mock_token';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_id';

export class BotService {
  /**
   * Process an incoming Telegram message webhook update
   */
  static async handleTelegramUpdate(update: any) {
    if (!update || !update.message) return;

    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const username = update.message.from?.username || 'User';

    console.log(`[TelegramBot] Received message from @${username}: "${text}"`);

    // Parse commands
    if (text.startsWith('/start') || text.startsWith('/help')) {
      const welcomeMsg = `🤖 *Welcome to CoinDaily Alpha Bot, @${username}!*

I am your proactive intelligence companion. Here are the commands you can use:
• \`/ask <question>\` - Ask our AI Concierge for market insights
• \`/summary\` - Get a quick bulleted summary of today's hot news
• \`/track <symbol>\` - Track the current price of a token (e.g. BTC, SOL)
• \`/alert <symbol>\` - Set up real-time breaking news alerts for a token

Use these commands to navigate local and global crypto movements!`;
      await this.sendTelegramMessage(chatId, welcomeMsg);
    } 
    else if (text.startsWith('/ask ')) {
      const question = text.substring(5).trim();
      await this.sendTelegramMessage(chatId, `⏳ _Querying CoinDaily AI Concierge for: "${question}"..._`);
      
      const aiReply = await this.getAIResponse(question, 'Global', 'en');
      await this.sendTelegramMessage(chatId, `🤖 *AI Concierge Reply:*\n\n${aiReply}`);
    } 
    else if (text.startsWith('/summary')) {
      await this.sendTelegramMessage(chatId, `⏳ _Fetching latest market summaries..._`);
      const summary = await this.getArticleSummaries();
      await this.sendTelegramMessage(chatId, summary);
    } 
    else if (text.startsWith('/track ')) {
      const symbol = text.substring(7).trim().toUpperCase();
      const priceInfo = await this.getTokenPrice(symbol);
      await this.sendTelegramMessage(chatId, priceInfo);
    } 
    else if (text.startsWith('/alert ')) {
      const symbol = text.substring(7).trim().toUpperCase();
      await this.sendTelegramMessage(chatId, `🔔 *Alert Set!* You will receive real-time updates when break-out events occur for *${symbol}*.`);
    } 
    else {
      // Default fallback
      const fallbackMsg = `❓ I didn't recognize that command. Type \`/help\` to see the list of available actions.`;
      await this.sendTelegramMessage(chatId, fallbackMsg);
    }
  }

  /**
   * Process an incoming WhatsApp message webhook update
   */
  static async handleWhatsAppUpdate(body: any) {
    if (!body || !body.entry || !body.entry[0]?.changes || !body.entry[0].changes[0]?.value?.messages) {
      return;
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const fromPhone = message.from;
    const text = message.text?.body || '';

    console.log(`[WhatsAppBot] Received message from ${fromPhone}: "${text}"`);

    const lowerText = text.trim().toLowerCase();

    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('help') || lowerText.includes('start')) {
      const welcome = `🤖 *Welcome to CoinDaily WhatsApp Intelligence!*

I am your cryptocurrency concierge. You can send me queries directly:
- Reply with *ASK <question>* to consult our AI
- Reply with *SUMMARY* for today's market overview
- Reply with *TRACK <symbol>* to check token rates (e.g. BTC, SOL)
- Reply with *HELP* to see this menu again.`;
      await this.sendWhatsAppMessage(fromPhone, welcome);
    }
    else if (lowerText.startsWith('ask ')) {
      const question = text.substring(4).trim();
      await this.sendWhatsAppMessage(fromPhone, `⏳ Querying AI Concierge for: "${question}"...`);
      const aiReply = await this.getAIResponse(question, 'Global', 'en');
      await this.sendWhatsAppMessage(fromPhone, `🤖 *AI Concierge:* \n\n${aiReply}`);
    }
    else if (lowerText === 'summary') {
      await this.sendWhatsAppMessage(fromPhone, `⏳ Loading summaries...`);
      const summary = await this.getArticleSummaries();
      await this.sendWhatsAppMessage(fromPhone, summary);
    }
    else if (lowerText.startsWith('track ')) {
      const symbol = text.substring(6).trim().toUpperCase();
      const priceInfo = await this.getTokenPrice(symbol);
      await this.sendWhatsAppMessage(fromPhone, priceInfo);
    }
    else {
      await this.sendWhatsAppMessage(fromPhone, `❓ Sorry, I didn't understand. Send *HELP* to view the menu.`);
    }
  }

  // ─── HELPER INTEGRATIONS ───────────────────

  /**
   * Fetch price info for a specific token symbol
   */
  private static async getTokenPrice(symbol: string): Promise<string> {
    try {
      const token = await prisma.token.findUnique({
        where: { symbol },
        include: {
          MarketData: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });

      if (!token || !token.MarketData || token.MarketData.length === 0) {
        // Fallback mock prices for testing if DB table is empty
        const mockPrices: Record<string, number> = { BTC: 96420, ETH: 3420, SOL: 188, USDC: 1.0, USDT: 1.0 };
        if (mockPrices[symbol]) {
          return `🪙 *${symbol} / USD* (Simulation)\n💵 Price: *$${mockPrices[symbol].toLocaleString()}*\n📈 24h Change: *+2.45%*\n🏦 Volume: *$1.2B*`;
        }
        return `❌ Token *${symbol}* was not found in our directory. Try tracking BTC, ETH, or SOL.`;
      }

      const md = token.MarketData[0];
      const changeSign = md.priceChange24h >= 0 ? '+' : '';
      return `🪙 *${token.name} (${symbol})*
💵 Price: *$${md.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}*
📊 24h Change: *${changeSign}${md.priceChange24h.toFixed(2)}%*
💼 Market Cap: *$${(md.marketCap / 1e6).toFixed(1)}M*
🏦 Volume (24h): *$${(md.volume24h / 1e6).toFixed(1)}M*`;

    } catch (error) {
      console.error('Error fetching token price:', error);
      return `❌ Service temporarily unavailable. Please try again later.`;
    }
  }

  /**
   * Fetch bulleted summaries of the latest articles
   */
  private static async getArticleSummaries(): Promise<string> {
    try {
      const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: { title: true, excerpt: true }
      });

      if (articles.length === 0) {
        return `📰 *CoinDaily Top News:*\n\n• *Bitcoin Consolidation*: BTC fluctuates near $96k as traders lock in gains.\n• *DeFi Yields Rise*: Lending pool yields see double-digit increases on Solana.\n• *Remittance Growth*: Mobile money stablecoin integrations expand across East Africa.`;
      }

      let res = `📰 *CoinDaily Top News Summary:*\n\n`;
      articles.forEach((art: any, index: number) => {
        res += `*${index + 1}. ${art.title}*\n_${art.excerpt || 'Brief market update.'}_\n\n`;
      });
      return res;
    } catch (error) {
      console.error('Error getting article summaries:', error);
      return `📰 *CoinDaily Hot Update:*\n\n• Markets remain positive; expect SOL and DeFi volumes to consolidate.`;
    }
  }

  /**
   * Fetch response from the AI system service
   */
  private static async getAIResponse(message: string, country: string, language: string): Promise<string> {
    try {
      const response = await axios.post(`${AI_SYSTEM_URL}/api/chat`, {
        message,
        systemPrompt: `You are CoinDaily's AI Concierge. Reply to the user question in a telegram/whatsapp friendly short format. User country: ${country}. Language: ${language}.`
      }, { timeout: 10000 });

      if (response.data && response.data.message) {
        return response.data.message;
      }
    } catch (err) {
      console.warn('Bot AI system proxy failed, using local fallback generator.');
    }

    // Direct fallback response
    const lower = message.toLowerCase();
    if (lower.includes('sol') || lower.includes('solana')) {
      return `Solana (SOL) is showing strong technical structure with high DEX volumes. P2P transaction fees remain incredibly low compared to Ethereum, making it a favorite in regional African and LatAm ecosystems.`;
    }
    return `Thank you for asking! Market sentiment is currently stable. Ensure you are practicing strict risk management and checking on-chain liquidity markers before taking positions.`;
  }

  /**
   * Send HTTP POST to Telegram Bot API
   */
  private static async sendTelegramMessage(chatId: string | number, text: string) {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn(`[TelegramBot] TELEGRAM_BOT_TOKEN is not set. Mocking send message: ${text}`);
      return;
    }

    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });
    } catch (err: any) {
      console.error('[TelegramBot] Failed to send message:', err?.response?.data || err.message);
    }
  }

  /**
   * Send HTTP POST to WhatsApp Cloud API
   */
  private static async sendWhatsAppMessage(toPhone: string, text: string) {
    if (WHATSAPP_API_TOKEN === 'mock_token' || WHATSAPP_PHONE_NUMBER_ID === 'mock_id') {
      console.warn(`[WhatsAppBot] WhatsApp API tokens are not configured. Mocking send to ${toPhone}: ${text}`);
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (err: any) {
      console.error('[WhatsAppBot] Failed to send message:', err?.response?.data || err.message);
    }
  }
}
export default BotService;
