/**
 * Regional priority configuration for CoinDaily content curation and market analysis.
 * Covers Africa, Latin America (LatAm), and the Caribbean.
 */
export const TARGET_REGIONS_PRIORITY = {
  AFRICA: {
    NIGERIA: { weight: 0.40, fiat: 'NGN', exchanges: ['Quidax', 'Binance Africa'], bank: 'CBN', paymentSystems: ['Bank Transfer', 'Flutterwave'] },
    KENYA: { weight: 0.20, fiat: 'KES', exchanges: ['Binance', 'LocalBitcoins'], paymentSystems: ['M-Pesa'] },
    SOUTH_AFRICA: { weight: 0.20, fiat: 'ZAR', exchanges: ['Luno', 'VALR'], regulator: 'FSCA', paymentSystems: ['EFT'] },
    GHANA: { weight: 0.10, fiat: 'GHS', exchanges: ['Binance'], bank: 'BoG', paymentSystems: ['MTN MoMo'] },
    EGYPT: { weight: 0.10, fiat: 'EGP', exchanges: ['Binance'], status: 'restricted', bank: 'CBE' }
  },
  LATAM: {
    BRAZIL: { weight: 0.40, fiat: 'BRL', exchanges: ['Mercado Bitcoin', 'Binance'], bank: 'BCB', paymentSystems: ['Pix'] },
    ARGENTINA: { weight: 0.25, fiat: 'ARS', exchanges: ['Lemon Cash', 'Ripio'], inflationHedge: true, paymentSystems: ['Mercado Pago'] },
    EL_SALVADOR: { weight: 0.15, fiat: 'USD', exchanges: ['Chivo Wallet', 'Bitfinex'], status: 'legal_tender', regulator: 'SSF' },
    COLOMBIA: { weight: 0.10, fiat: 'COP', exchanges: ['Bitso', 'Binance'], paymentSystems: ['PSE'] },
    MEXICO: { weight: 0.10, fiat: 'MXN', exchanges: ['Bitso'], bank: 'Banxico', paymentSystems: ['SPEI'] }
  },
  CARIBBEAN: {
    ECCU: { weight: 0.35, fiat: 'XCD', exchanges: ['WiPay'], bank: 'ECCB', status: 'DCash_CBDC', paymentSystems: ['DCash'] },
    JAMAICA: { weight: 0.30, fiat: 'JMD', exchanges: ['WiPay'], bank: 'BOJ', status: 'JamDex_CBDC', paymentSystems: ['JamDex'] },
    TRINIDAD_TOBAGO: { weight: 0.20, fiat: 'TTD', exchanges: ['WiPay'], paymentSystems: ['WiPay'] },
    BAHAMAS: { weight: 0.15, fiat: 'BSD', exchanges: ['Island Pay'], bank: 'CBOB', status: 'SandDollar_CBDC', paymentSystems: ['Sand Dollar'] }
  }
};
