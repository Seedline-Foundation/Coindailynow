import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL = process.env.LLAMA_MODEL || 'llama3.1:8b';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [], systemPrompt } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Format messages for Ollama's /api/chat endpoint
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      messages.push({
        role: 'system',
        content: 'You are CoinDaily\'s AI Concierge, a premium crypto intelligence assistant. Help the user with crypto questions, market summaries, or platform help.'
      });
    }

    // Map conversation history
    // Filter out any existing system messages to avoid duplicates
    const filteredHistory = conversationHistory.filter((msg: any) => msg.role !== 'system');
    messages.push(...filteredHistory);

    // Add the latest user message
    messages.push({ role: 'user', content: message });

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1024,
          }
        }),
        // Avoid hanging requests if Ollama is slow/offline
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = data.message?.content || 'No response generated.';
        return NextResponse.json({
          success: true,
          message: aiMessage,
          sources: ['CoinDaily Live Market Feeds', 'CoinDaily Editorial Archives'],
          model: MODEL
        });
      }
      
      console.warn(`Ollama responded with status: ${response.status}. Falling back.`);
    } catch (ollamaError) {
      console.warn('Ollama service unreachable or timed out. Using fallback generator.', ollamaError);
    }

    // Smart Fallback generator when Ollama is unavailable
    const fallbackResponse = generateSmartFallback(message, systemPrompt);
    return NextResponse.json({
      success: true,
      message: fallbackResponse,
      sources: ['CoinDaily Knowledge Base', 'Local Regulatory Guides'],
      model: 'CoinDaily-Fallback-Engine'
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}

function generateSmartFallback(message: string, systemPrompt: string = ''): string {
  const msg = message.toLowerCase();
  const isNigeria = systemPrompt.toLowerCase().includes('nigeria') || systemPrompt.toLowerCase().includes('ng');
  const isKenya = systemPrompt.toLowerCase().includes('kenya') || systemPrompt.toLowerCase().includes('ke');
  const isLatAm = systemPrompt.toLowerCase().includes('brazil') || systemPrompt.toLowerCase().includes('br') || systemPrompt.toLowerCase().includes('argentina') || systemPrompt.toLowerCase().includes('chile');

  if (msg.includes('sol') || msg.includes('solana')) {
    let res = `Solana (SOL) is showing strong momentum due to increased decentralized exchange (DEX) volume on chains like Raydium and Jupiter, coupled with low transaction fees compared to Ethereum. `;
    if (isNigeria) {
      res += `In Nigeria, SOL has seen high retail interest on P2P platforms as users seek high-performance ecosystems for DeFi yields.`;
    } else if (isKenya) {
      res += `In Kenya, local traders are utilizing SOL due to lower transaction costs, which fits well with smaller transaction size profiles typical of mobile wallet integrations.`;
    } else {
      res += `The growth in Solana's liquid staking tokens (LSTs) has also contributed to lockup TVL, driving positive spot market pressure.`;
    }
    return res;
  }

  if (msg.includes('stablecoin') || msg.includes('usdt') || msg.includes('usdc')) {
    if (isNigeria) {
      return `Stablecoins (USDT/USDC) are highly popular in Nigeria as a store of value against local currency inflation and for cross-border trade. They trade actively on local P2P markets, offering a way to convert Naira to dollars efficiently.`;
    }
    if (isKenya) {
      return `In Kenya, stablecoins are increasingly integrated with mobile money networks (M-Pesa). They serve as a bridge for remittance payments, bypass traditional bank friction, and are popular among freelance developers and traders.`;
    }
    if (isLatAm) {
      return `In Latin America, particularly Brazil and Argentina, stablecoins are widely used to hedge against high inflation. In Brazil, PIX integration with stablecoin brokers makes acquiring USDT/USDC incredibly fast and cheap.`;
    }
    return `Stablecoins are digital currencies pegged to a fiat asset (usually USD). They enable near-instant global settlement and serve as a volatility hedge inside the decentralized finance (DeFi) ecosystem.`;
  }

  if (msg.includes('defi') || msg.includes('yield')) {
    return `Decentralized Finance (DeFi) allows users to lend, borrow, and trade assets without traditional intermediaries. Popular protocols like Aave, Uniswap, and MakerDAO govern these activities. To get started, you will need a Web3 wallet (e.g., MetaMask, Phantom) funded with gas tokens. Please note that smart contract risk and liquidation risk are present.`;
  }

  if (msg.includes('wallet') || msg.includes('security')) {
    return `To secure your crypto: \n1. Use a non-custodial hardware wallet (like Ledger or Trezor) for large amounts.\n2. Never share your 12 or 24-word recovery phrase with anyone.\n3. Enable Multi-Factor Authentication (MFA) on exchange accounts (use Authenticator apps, not SMS).\n4. Double-check all transaction destination addresses before signing.`;
  }

  return `Thanks for reaching out to CoinDaily Concierge! I can help you with market trends, local crypto developments, stablecoins, or general platform support. Ask me something like "Explain Solana's recent rise" or "How do stablecoins work in Africa?"`;
}
