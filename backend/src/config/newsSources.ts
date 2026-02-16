/**
 * Global News Sources Registry
 * 
 * All RSS feeds, API endpoints, and data sources that the AI content pipeline
 * scans for the latest news. Organised by category and region.
 *
 * RULES:
 * - Every source MUST have a `url` (the feed/API URL).
 * - `type` is either 'rss', 'api', or 'data'.
 * - `category` tags the source for filtering.
 * - `region` is an ISO-3166-1 alpha-2 country code or 'GLOBAL'.
 */

export interface NewsSource {
  name: string;
  url: string;
  type: 'rss' | 'api' | 'data';
  category: string;
  region: string;
}

// ============================================================================
// GLOBAL CRYPTO & TECH FEEDS (no region filter)
// ============================================================================

export const GLOBAL_FEEDS: NewsSource[] = [
  // ─── Crypto News ───
  { name: 'CoinDesk RSS', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', type: 'rss', category: 'Crypto', region: 'GLOBAL' },
  { name: 'CoinDesk Policy RSS', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml', type: 'rss', category: 'Regulatory', region: 'GLOBAL' },
  { name: 'The Block Policy RSS', url: 'https://www.theblock.co/rss/category/policy', type: 'rss', category: 'Regulatory', region: 'GLOBAL' },
  { name: 'Coin Center', url: 'https://www.coincenter.org/feed/', type: 'rss', category: 'Regulatory', region: 'GLOBAL' },
  { name: 'Decrypt Policy', url: 'https://decrypt.co/feed/category/policy', type: 'rss', category: 'Regulatory', region: 'GLOBAL' },

  // ─── DeFi Analytics APIs ───
  { name: 'DefiLlama', url: 'https://api.llama.fi/protocols', type: 'api', category: 'DeFi', region: 'GLOBAL' },
  { name: 'GeckoTerminal', url: 'https://api.geckoterminal.com/api/v2/networks/trending_pools', type: 'api', category: 'DeFi', region: 'GLOBAL' },
  { name: 'DexScreener', url: 'https://api.dexscreener.com/latest/dex/tokens/trending', type: 'api', category: 'DeFi', region: 'GLOBAL' },
  { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100', type: 'api', category: 'Market Data', region: 'GLOBAL' },

  // ─── Layer 1 Ecosystem Blogs ───
  { name: 'Ethereum Foundation Blog', url: 'https://blog.ethereum.org/feed.xml', type: 'rss', category: 'L1', region: 'GLOBAL' },
  { name: 'Polkadot Blog', url: 'https://polkadot.network/blog/rss', type: 'rss', category: 'L1', region: 'GLOBAL' },
  { name: 'Avalanche Blog', url: 'https://medium.com/feed/avalancheavax', type: 'rss', category: 'L1', region: 'GLOBAL' },

  // ─── General Tech ───
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss', category: 'Tech', region: 'GLOBAL' },
  { name: 'Gigaom', url: 'https://gigaom.com/feed/', type: 'rss', category: 'Tech', region: 'GLOBAL' },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', type: 'rss', category: 'Tech', region: 'GLOBAL' },
  { name: 'Techmeme', url: 'https://www.techmeme.com/feed.xml', type: 'rss', category: 'Tech', region: 'GLOBAL' },
  { name: 'Slashdot', url: 'http://rss.slashdot.org/Slashdot/slashdot', type: 'rss', category: 'Tech', region: 'GLOBAL' },
  { name: 'TechNewsTube', url: 'https://technewstube.com/feed/', type: 'rss', category: 'Tech', region: 'GLOBAL' },

  // ─── Regulatory (Official) ───
  { name: 'SEC Press Releases', url: 'https://www.sec.gov/news/press-release.xml', type: 'rss', category: 'Regulatory', region: 'US' },
];

// ============================================================================
// PER-COUNTRY FEEDS
// ============================================================================

export const COUNTRY_FEEDS: NewsSource[] = [
  // ─── United States ───
  { name: 'FRED API', url: 'https://fred.stlouisfed.org/docs/api/fred/', type: 'api', category: 'Finance', region: 'US' },

  // ─── United Kingdom ───
  { name: 'UK Parliament API', url: 'https://members-api.parliament.uk/api/', type: 'api', category: 'Policy', region: 'GB' },
  { name: 'The Register RSS', url: 'https://www.theregister.com/headlines.atom', type: 'rss', category: 'Tech', region: 'GB' },
  { name: 'BBC Tech RSS', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', type: 'rss', category: 'Tech', region: 'GB' },

  // ─── Canada ───
  { name: 'BetaKit RSS', url: 'https://betakit.com/feed/', type: 'rss', category: 'Tech', region: 'CA' },
  { name: 'Financial Post RSS', url: 'https://financialpost.com/feed', type: 'rss', category: 'Finance', region: 'CA' },

  // ─── Germany ───
  { name: 'DW News RSS', url: 'https://rss.dw.com/xml/rss-en-all', type: 'rss', category: 'General', region: 'DE' },
  { name: 'Heise Online RSS', url: 'https://www.heise.de/rss/heise-atom.xml', type: 'rss', category: 'Tech', region: 'DE' },
  { name: 'Handelsblatt RSS', url: 'https://www.handelsblatt.com/contentexport/feed/top-themen', type: 'rss', category: 'Finance', region: 'DE' },

  // ─── France ───
  { name: 'Les Echos RSS', url: 'https://services.lesechos.fr/rss/les-echos-tech-medias.xml', type: 'rss', category: 'Tech/Finance', region: 'FR' },
  { name: 'Le Monde Tech RSS', url: 'https://www.lemonde.fr/pixels/rss_full.xml', type: 'rss', category: 'Tech', region: 'FR' },

  // ─── Spain ───
  { name: 'Xataka RSS', url: 'https://feeds.weblogssl.com/xataka2', type: 'rss', category: 'Tech', region: 'ES' },
  { name: 'El Economista RSS', url: 'https://www.eleconomista.es/rss/rss-economia.php', type: 'rss', category: 'Finance', region: 'ES' },
  { name: 'Expansion RSS', url: 'https://e00-expansion.uecdn.es/rss/economia.xml', type: 'rss', category: 'Finance', region: 'ES' },

  // ─── Brazil ───
  { name: 'InfoMoney RSS', url: 'https://www.infomoney.com.br/feed/', type: 'rss', category: 'Finance/Crypto', region: 'BR' },
  { name: 'Tecnoblog RSS', url: 'https://tecnoblog.net/feed/', type: 'rss', category: 'Tech', region: 'BR' },

  // ─── St Lucia ───
  { name: 'St Lucia Times RSS', url: 'https://stluciatimes.com/feed/', type: 'rss', category: 'General', region: 'LC' },
  { name: 'Loop News St Lucia RSS', url: 'https://stlucia.loopnews.com/rss', type: 'rss', category: 'General', region: 'LC' },

  // ─── Vanuatu ───
  { name: 'Daily Post Vanuatu RSS', url: 'https://www.dailypost.vu/search/?f=rss', type: 'rss', category: 'General', region: 'VU' },
  { name: 'RNZ Pacific RSS', url: 'https://www.rnz.co.nz/rss/pacific.xml', type: 'rss', category: 'General', region: 'VU' },

  // ─── Chile ───
  { name: 'Diario Financiero RSS', url: 'https://www.df.cl/rss/feed.html', type: 'rss', category: 'Finance', region: 'CL' },
  { name: 'FayerWayer RSS', url: 'https://www.fayerwayer.com/feed/', type: 'rss', category: 'Tech', region: 'CL' },
  { name: 'Chócale RSS', url: 'https://chocale.cl/feed/', type: 'rss', category: 'Finance/Tech', region: 'CL' },

  // ─── Barbados ───
  { name: 'Barbados Today RSS', url: 'https://barbadostoday.bb/feed/', type: 'rss', category: 'General', region: 'BB' },
  { name: 'Nation News RSS', url: 'https://www.nationnews.com/feed/', type: 'rss', category: 'General', region: 'BB' },

  // ─── Paraguay ───
  { name: 'ABC Color RSS', url: 'https://www.abc.com.py/rss.xml', type: 'rss', category: 'General', region: 'PY' },
  { name: '5Días RSS', url: 'https://www.5dias.com.py/rss', type: 'rss', category: 'Finance', region: 'PY' },
  { name: 'MarketData PY RSS', url: 'https://marketdata.com.py/feed/', type: 'rss', category: 'Finance', region: 'PY' },

  // ─── Kenya ───
  { name: 'TechWeez RSS', url: 'https://techweez.com/feed/', type: 'rss', category: 'Tech', region: 'KE' },
  { name: 'BitcoinKE RSS', url: 'https://bitcoinke.io/feed/', type: 'rss', category: 'Crypto', region: 'KE' },

  // ─── Zambia ───
  { name: 'Lusaka Times RSS', url: 'https://www.lusakatimes.com/feed/', type: 'rss', category: 'General', region: 'ZM' },
  { name: 'TechTrends Zambia RSS', url: 'https://techtrends.co.zm/feed/', type: 'rss', category: 'Tech', region: 'ZM' },
  { name: 'Financial Insight ZM RSS', url: 'https://financialinsight.co.zm/feed/', type: 'rss', category: 'Finance', region: 'ZM' },

  // ─── South Africa ───
  { name: 'MyBroadband RSS', url: 'https://mybroadband.co.za/news/feed', type: 'rss', category: 'Tech', region: 'ZA' },
  { name: 'BusinessTech RSS', url: 'https://businesstech.co.za/news/feed/', type: 'rss', category: 'Tech/Finance', region: 'ZA' },
  { name: 'Moneyweb RSS', url: 'https://www.moneyweb.co.za/feed/', type: 'rss', category: 'Finance', region: 'ZA' },

  // ─── Tunisia ───
  { name: 'IlBoursa RSS', url: 'https://www.ilboursa.com/rss/flux.aspx', type: 'rss', category: 'Finance', region: 'TN' },
  { name: 'Webmanagercenter RSS', url: 'https://www.webmanagercenter.com/feed/', type: 'rss', category: 'Business', region: 'TN' },
  { name: 'THD Tunisia RSS', url: 'https://thd.tn/feed/', type: 'rss', category: 'Tech', region: 'TN' },

  // ─── Egypt ───
  { name: 'Enterprise Egypt RSS', url: 'https://enterprise.press/feed/', type: 'rss', category: 'Finance', region: 'EG' },
  { name: 'Daily News Egypt RSS', url: 'https://www.dailynewsegypt.com/feed/', type: 'rss', category: 'General', region: 'EG' },
  { name: 'MenaBytes RSS', url: 'https://menabytes.com/feed/', type: 'rss', category: 'Tech/Venture', region: 'EG' },

  // ─── Morocco ───
  { name: 'Morocco World News RSS', url: 'https://www.moroccoworldnews.com/feed/', type: 'rss', category: 'General', region: 'MA' },
  { name: 'Medias24 RSS', url: 'https://www.medias24.com/feed/', type: 'rss', category: 'Business', region: 'MA' },
  { name: 'LeBoursier RSS', url: 'https://www.leboursier.ma/feed', type: 'rss', category: 'Market Data', region: 'MA' },

  // ─── Mauritania ───
  { name: 'AMI RSS', url: 'https://ami.mr/fr/feed/', type: 'rss', category: 'Government', region: 'MR' },
  { name: 'SaharaMedias RSS', url: 'https://saharamedias.net/feed/', type: 'rss', category: 'General', region: 'MR' },
  { name: 'CRIDEM RSS', url: 'http://cridem.org/rss/rss_cridem.xml', type: 'rss', category: 'General', region: 'MR' },

  // ─── Venezuela ───
  { name: 'Banca y Negocios RSS', url: 'https://www.bancaynegocios.com/feed/', type: 'rss', category: 'Finance', region: 'VE' },
  { name: 'El Nacional RSS', url: 'https://www.el-nacional.com/feed/', type: 'rss', category: 'General', region: 'VE' },
  { name: 'Runrunes RSS', url: 'https://runrun.es/feed/', type: 'rss', category: 'General', region: 'VE' },

  // ─── Malaysia ───
  { name: 'The Edge Markets RSS', url: 'https://www.theedgemarkets.com/rss', type: 'rss', category: 'Finance', region: 'MY' },
  { name: 'SoyaCincau RSS', url: 'https://soyacincau.com/feed/', type: 'rss', category: 'Tech', region: 'MY' },

  // ─── Israel ───
  { name: 'Globes RSS', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx?FolderID=2971', type: 'rss', category: 'Finance', region: 'IL' },
  { name: 'Geektime RSS', url: 'https://www.geektime.com/feed/', type: 'rss', category: 'Tech', region: 'IL' },
  { name: 'Jerusalem Post RSS', url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', type: 'rss', category: 'General', region: 'IL' },

  // ─── UAE ───
  { name: 'Gulf News Business RSS', url: 'https://gulfnews.com/rss/business', type: 'rss', category: 'Finance', region: 'AE' },
  { name: 'WAM RSS', url: 'https://wam.ae/en/rss', type: 'rss', category: 'Government', region: 'AE' },
  { name: 'The National RSS', url: 'https://www.thenationalnews.com/rss', type: 'rss', category: 'General', region: 'AE' },

  // ─── Zimbabwe ───
  { name: 'Techzim RSS', url: 'https://www.techzim.co.zw/feed/', type: 'rss', category: 'Tech', region: 'ZW' },
  { name: 'The Herald Zimbabwe RSS', url: 'https://www.herald.co.zw/feed/', type: 'rss', category: 'General', region: 'ZW' },
  { name: 'ZimPriceCheck RSS', url: 'https://zimpricecheck.com/feed/', type: 'rss', category: 'Market Data', region: 'ZW' },

  // ─── Ghana ───
  { name: 'MyJoyOnline RSS', url: 'https://www.myjoyonline.com/feed/', type: 'rss', category: 'General', region: 'GH' },
  { name: 'B&FT Online RSS', url: 'https://thebftonline.com/feed/', type: 'rss', category: 'Business', region: 'GH' },
  { name: 'Mfidie RSS', url: 'https://mfidie.com/feed/', type: 'rss', category: 'Tech', region: 'GH' },

  // ─── Senegal ───
  { name: 'Seneweb RSS', url: 'https://www.seneweb.com/news/rss.php', type: 'rss', category: 'General', region: 'SN' },
  { name: 'Dakaractu RSS', url: 'https://www.dakaractu.com/xml/syndication.rss', type: 'rss', category: 'General', region: 'SN' },
  { name: 'SocialnetLink RSS', url: 'https://www.socialnetlink.org/feed/', type: 'rss', category: 'Tech', region: 'SN' },

  // ─── Trinidad & Tobago ───
  { name: 'Trinidad Express RSS', url: 'https://trinidadexpress.com/search/?f=rss', type: 'rss', category: 'General', region: 'TT' },
  { name: 'TechNewsTT RSS', url: 'https://technewstt.com/feed/', type: 'rss', category: 'Tech', region: 'TT' },
  { name: 'TT Newsday RSS', url: 'https://newsday.co.tt/feed/', type: 'rss', category: 'General', region: 'TT' },

  // ─── Panama ───
  { name: 'La Prensa RSS', url: 'https://www.prensa.com/rss/', type: 'rss', category: 'General', region: 'PA' },
  { name: 'Capital Financiero RSS', url: 'https://www.capital.com.pa/feed/', type: 'rss', category: 'Finance', region: 'PA' },
  { name: 'ANPanamá RSS', url: 'https://anpanama.com/rss.xml', type: 'rss', category: 'Business', region: 'PA' },

  // ─── Iran ───
  { name: 'Tehran Times RSS', url: 'https://www.tehrantimes.com/rss', type: 'rss', category: 'General', region: 'IR' },
  { name: 'Mehr News RSS', url: 'https://en.mehrnews.com/rss', type: 'rss', category: 'General', region: 'IR' },
  { name: 'Way2Pay RSS', url: 'https://way2pay.ir/feed/', type: 'rss', category: 'Fintech', region: 'IR' },
];

// ============================================================================
// COMBINED — all sources in one array for the pipeline
// ============================================================================

export const ALL_NEWS_SOURCES: NewsSource[] = [...GLOBAL_FEEDS, ...COUNTRY_FEEDS];

/**
 * Get all RSS feed URLs (the ones the pipeline should poll).
 */
export function getAllRSSFeedUrls(): string[] {
  return ALL_NEWS_SOURCES
    .filter(s => s.type === 'rss')
    .map(s => s.url);
}

/**
 * Get all API endpoint URLs.
 */
export function getAllApiEndpoints(): string[] {
  return ALL_NEWS_SOURCES
    .filter(s => s.type === 'api')
    .map(s => s.url);
}

/**
 * Get sources by country code.
 */
export function getSourcesByCountry(countryCode: string): NewsSource[] {
  return ALL_NEWS_SOURCES.filter(
    s => s.region === countryCode.toUpperCase() || s.region === 'GLOBAL'
  );
}

/**
 * Get sources by category.
 */
export function getSourcesByCategory(category: string): NewsSource[] {
  return ALL_NEWS_SOURCES.filter(
    s => s.category.toLowerCase().includes(category.toLowerCase())
  );
}
