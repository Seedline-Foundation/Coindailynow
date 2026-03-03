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
  { name: 'Financial Tribune RSS', url: 'https://financialtribune.com/rss', type: 'rss', category: 'Finance', region: 'IR' },
  { name: 'IRNA RSS', url: 'https://en.irna.ir/rss', type: 'rss', category: 'General', region: 'IR' },
];

// ============================================================================
// ADDITIONAL RSS FEEDS — expanded coverage per country
// ============================================================================

export const ADDITIONAL_FEEDS: NewsSource[] = [
  // ─── Canada (expanded) ───
  { name: 'MobileSyrup RSS', url: 'https://mobilesyrup.com/feed/', type: 'rss', category: 'Tech', region: 'CA' },
  { name: 'Globe and Mail RSS', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/', type: 'rss', category: 'Finance', region: 'CA' },
  { name: 'CBC Business RSS', url: 'https://www.cbc.ca/cmlink/rss-business', type: 'rss', category: 'Finance', region: 'CA' },

  // ─── Germany (expanded) ───
  { name: 't3n RSS', url: 'https://t3n.de/rss.xml', type: 'rss', category: 'Tech', region: 'DE' },
  { name: 'FAZ Tech RSS', url: 'https://www.faz.net/rss/aktuell/technik-motor/', type: 'rss', category: 'Tech', region: 'DE' },

  // ─── France (expanded) ───
  { name: 'Journal du Net RSS', url: 'https://www.journaldunet.com/rss/', type: 'rss', category: 'Tech', region: 'FR' },
  { name: 'FrenchWeb RSS', url: 'https://www.frenchweb.fr/feed', type: 'rss', category: 'Tech', region: 'FR' },
  { name: 'La Tribune RSS', url: 'https://www.latribune.fr/rss/rubriques/economie.html', type: 'rss', category: 'Finance', region: 'FR' },

  // ─── Spain (expanded) ───
  { name: 'Cinco Días RSS', url: 'https://cincodias.elpais.com/rss/cincodias/portada.xml', type: 'rss', category: 'Finance', region: 'ES' },
  { name: 'Genbeta RSS', url: 'https://feeds.weblogssl.com/genbeta', type: 'rss', category: 'Tech', region: 'ES' },

  // ─── Brazil (expanded) ───
  { name: 'Canaltech RSS', url: 'https://canaltech.com.br/rss/', type: 'rss', category: 'Tech', region: 'BR' },
  { name: 'Exame RSS', url: 'https://exame.com/feed/', type: 'rss', category: 'Finance', region: 'BR' },
  { name: 'Valor Econômico RSS', url: 'https://valor.globo.com/rss/', type: 'rss', category: 'Finance', region: 'BR' },

  // ─── St Lucia (expanded) ───
  { name: 'The Voice St Lucia RSS', url: 'https://thevoiceslu.com/feed/', type: 'rss', category: 'General', region: 'LC' },
  { name: 'Caribbean Tech News RSS', url: 'https://www.caribbeantechnews.com/feed/', type: 'rss', category: 'Tech', region: 'LC' },

  // ─── Vanuatu (expanded) ───
  { name: 'Islands Business RSS', url: 'https://islandsbusiness.com/feed/', type: 'rss', category: 'Business', region: 'VU' },
  { name: 'VBTC RSS', url: 'https://vbtc.vu/feed/', type: 'rss', category: 'General', region: 'VU' },

  // ─── Chile (expanded) ───
  { name: 'BioBioChile RSS', url: 'https://www.biobiochile.cl/rss/economia.xml', type: 'rss', category: 'Finance', region: 'CL' },
  { name: 'Emol Economía RSS', url: 'https://www.emol.com/rss/economia.xml', type: 'rss', category: 'Finance', region: 'CL' },
  { name: 'La Tercera RSS', url: 'https://www.latercera.com/arc/outboundfeeds/rss/category/pulso/', type: 'rss', category: 'Finance', region: 'CL' },

  // ─── Barbados (expanded) ───
  { name: 'Loop News Barbados RSS', url: 'https://www.loopnewsbarbados.com/rss', type: 'rss', category: 'General', region: 'BB' },
  { name: 'TechBeach RSS', url: 'https://www.techbeach.net/feed/', type: 'rss', category: 'Tech', region: 'BB' },

  // ─── Paraguay (expanded) ───
  { name: 'Ultima Hora RSS', url: 'https://www.ultimahora.com/rss/', type: 'rss', category: 'General', region: 'PY' },
  { name: 'La Nación PY RSS', url: 'https://www.lanacion.com.py/feed/', type: 'rss', category: 'General', region: 'PY' },

  // ─── Kenya (expanded) ───
  { name: 'Business Daily Africa RSS', url: 'https://www.businessdailyafrica.com/rss', type: 'rss', category: 'Finance', region: 'KE' },
  { name: 'Nation Africa RSS', url: 'https://www.nation.africa/kenya/rss', type: 'rss', category: 'General', region: 'KE' },
  { name: 'TechCabal RSS', url: 'https://techcabal.com/feed/', type: 'rss', category: 'Tech', region: 'KE' },
  { name: 'The Star Kenya RSS', url: 'https://www.the-star.co.ke/rss/', type: 'rss', category: 'General', region: 'KE' },

  // ─── Zambia (expanded) ───
  { name: 'Diggers News RSS', url: 'https://diggers.news/feed/', type: 'rss', category: 'General', region: 'ZM' },
  { name: 'Zambian Business Times RSS', url: 'https://zambianbusinesstimes.com/feed/', type: 'rss', category: 'Finance', region: 'ZM' },

  // ─── South Africa (expanded) ───
  { name: 'Fin24 RSS', url: 'https://www.news24.com/fin24/rss', type: 'rss', category: 'Finance', region: 'ZA' },
  { name: 'TechCentral RSS', url: 'https://techcentral.co.za/feed/', type: 'rss', category: 'Tech', region: 'ZA' },
  { name: 'Daily Maverick RSS', url: 'https://www.dailymaverick.co.za/feed/', type: 'rss', category: 'General', region: 'ZA' },

  // ─── Tunisia (expanded) ───
  { name: 'TAP Tunisia RSS', url: 'https://www.tap.info.tn/en/feed', type: 'rss', category: 'Government', region: 'TN' },
  { name: 'Kapitalis RSS', url: 'https://kapitalis.com/feed/', type: 'rss', category: 'General', region: 'TN' },

  // ─── Egypt (expanded) ───
  { name: 'Ahram Online RSS', url: 'https://english.ahram.org.eg/rss/all-news.aspx', type: 'rss', category: 'General', region: 'EG' },
  { name: 'Egypt Independent RSS', url: 'https://www.egyptindependent.com/feed/', type: 'rss', category: 'General', region: 'EG' },

  // ─── Morocco (expanded) ───
  { name: 'Hespress RSS', url: 'https://www.hespress.com/feed', type: 'rss', category: 'General', region: 'MA' },
  { name: 'Le Matin RSS', url: 'https://lematin.ma/feed/', type: 'rss', category: 'General', region: 'MA' },

  // ─── Mauritania (expanded) ───
  { name: 'Essahraa RSS', url: 'https://essahraa.net/feed/', type: 'rss', category: 'General', region: 'MR' },
  { name: 'Alakhbar RSS', url: 'https://alakhbar.info/feed/', type: 'rss', category: 'General', region: 'MR' },

  // ─── Venezuela (expanded) ───
  { name: 'Efecto Cocuyo RSS', url: 'https://efectococuyo.com/feed/', type: 'rss', category: 'General', region: 'VE' },
  { name: 'La Patilla RSS', url: 'https://www.lapatilla.com/feed/', type: 'rss', category: 'General', region: 'VE' },
  { name: 'TalCual RSS', url: 'https://talcualdigital.com/feed/', type: 'rss', category: 'General', region: 'VE' },

  // ─── Malaysia (expanded) ───
  { name: 'The Star Malaysia RSS', url: 'https://www.thestar.com.my/rss/Business', type: 'rss', category: 'Finance', region: 'MY' },
  { name: 'Malay Mail RSS', url: 'https://www.malaymail.com/feed', type: 'rss', category: 'General', region: 'MY' },
  { name: 'Lowyat.net RSS', url: 'https://www.lowyat.net/feed/', type: 'rss', category: 'Tech', region: 'MY' },
  { name: 'Amanz RSS', url: 'https://amanz.my/feed/', type: 'rss', category: 'Tech', region: 'MY' },

  // ─── Israel (expanded) ───
  { name: 'Times of Israel RSS', url: 'https://www.timesofisrael.com/feed/', type: 'rss', category: 'General', region: 'IL' },
  { name: 'Calcalist Tech RSS', url: 'https://www.calcalistech.com/rss/all', type: 'rss', category: 'Tech', region: 'IL' },

  // ─── UAE (expanded) ───
  { name: 'Arabian Business RSS', url: 'https://www.arabianbusiness.com/rss', type: 'rss', category: 'Business', region: 'AE' },
  { name: 'Khaleej Times RSS', url: 'https://www.khaleejtimes.com/rss', type: 'rss', category: 'General', region: 'AE' },
  { name: 'TahawulTech RSS', url: 'https://www.tahawultech.com/feed/', type: 'rss', category: 'Tech', region: 'AE' },

  // ─── Zimbabwe (expanded) ───
  { name: 'NewsDay Zimbabwe RSS', url: 'https://www.newsday.co.zw/feed/', type: 'rss', category: 'General', region: 'ZW' },
  { name: 'The Independent ZW RSS', url: 'https://www.theindependent.co.zw/feed/', type: 'rss', category: 'General', region: 'ZW' },
  { name: 'NewZimbabwe RSS', url: 'https://newzimbabwe.com/feed/', type: 'rss', category: 'General', region: 'ZW' },

  // ─── Ghana (expanded) ───
  { name: 'Graphic Online RSS', url: 'https://www.graphic.com.gh/feed/', type: 'rss', category: 'General', region: 'GH' },
  { name: 'Citi Newsroom RSS', url: 'https://citinewsroom.com/feed/', type: 'rss', category: 'General', region: 'GH' },
  { name: 'JB Klutse RSS', url: 'https://jbklutse.com/feed/', type: 'rss', category: 'Tech', region: 'GH' },

  // ─── Senegal (expanded) ───
  { name: 'Le Quotidien SN RSS', url: 'https://lequotidien.sn/feed/', type: 'rss', category: 'General', region: 'SN' },
  { name: 'CIO Mag RSS', url: 'https://cio-mag.com/feed/', type: 'rss', category: 'Tech', region: 'SN' },

  // ─── Trinidad & Tobago (expanded) ───
  { name: 'T&T Guardian RSS', url: 'https://guardian.co.tt/rss', type: 'rss', category: 'General', region: 'TT' },
  { name: 'Loop TT RSS', url: 'https://tt.loopnews.com/rss', type: 'rss', category: 'General', region: 'TT' },
  { name: 'AZP News RSS', url: 'https://azpnews.com/feed/', type: 'rss', category: 'General', region: 'TT' },

  // ─── Panama (expanded) ───
  { name: 'La Estrella RSS', url: 'https://www.laestrella.com.pa/rss/', type: 'rss', category: 'General', region: 'PA' },
  { name: 'Panamá América RSS', url: 'https://www.panamaamerica.com.pa/rss/', type: 'rss', category: 'General', region: 'PA' },
  { name: 'En Segundos RSS', url: 'https://ensegundos.com.pa/feed/', type: 'rss', category: 'General', region: 'PA' },
];

// ============================================================================
// API DATA SOURCES — central bank, statistics, government APIs
// ============================================================================

export const API_DATA_SOURCES: NewsSource[] = [
  // ─── United States ───
  { name: 'SEC EDGAR API', url: 'https://data.sec.gov/submissions/', type: 'api', category: 'Finance/Policy', region: 'US' },

  // ─── United Kingdom ───
  { name: 'ONS API', url: 'https://api.beta.ons.gov.uk/', type: 'api', category: 'Market Data', region: 'GB' },

  // ─── Canada ───
  { name: 'Bank of Canada Valet API', url: 'https://www.bankofcanada.ca/valet/', type: 'api', category: 'Finance', region: 'CA' },
  { name: 'Open Canada API', url: 'https://open.canada.ca/data/en/api/3', type: 'api', category: 'Policy', region: 'CA' },

  // ─── Germany ───
  { name: 'Bundesbank API', url: 'https://api.statistiken.bundesbank.de/', type: 'api', category: 'Finance', region: 'DE' },

  // ─── France ───
  { name: 'INSEE API', url: 'https://api.insee.fr/catalogue/', type: 'api', category: 'Market Data', region: 'FR' },
  { name: 'Banque de France API', url: 'https://webstat.banque-france.fr/api/', type: 'api', category: 'Finance', region: 'FR' },

  // ─── Spain ───
  { name: 'INE Spain API', url: 'https://servicios.ine.es/wstempus/jsCache/', type: 'api', category: 'Market Data', region: 'ES' },

  // ─── Brazil ───
  { name: 'Banco Central Brasil API', url: 'https://api.bcb.gov.br/', type: 'api', category: 'Finance', region: 'BR' },
  { name: 'IBGE API', url: 'https://servicodados.ibge.gov.br/api/', type: 'api', category: 'Market Data', region: 'BR' },

  // ─── St Lucia ───
  { name: 'ECCB Statistics API', url: 'https://www.eccb-centralbank.org/statistics/dashboard-datas/', type: 'api', category: 'Finance', region: 'LC' },
  { name: 'World Bank LC API', url: 'https://api.worldbank.org/v2/country/LC/indicator/NY.GDP.MKTP.CD?format=json', type: 'api', category: 'Market Data', region: 'LC' },

  // ─── Vanuatu ───
  { name: 'ReliefWeb VU API', url: 'https://api.reliefweb.int/v1/reports?appname=coindaily&query[value]=primary_country.iso3:vut', type: 'api', category: 'Policy', region: 'VU' },

  // ─── Chile ───
  { name: 'Banco Central Chile API', url: 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx', type: 'api', category: 'Finance', region: 'CL' },

  // ─── Paraguay ───
  { name: 'BCP Paraguay API', url: 'https://www.bcp.gov.py/webapps/web/api/', type: 'api', category: 'Finance', region: 'PY' },

  // ─── Kenya ───
  { name: 'Central Bank Kenya API', url: 'https://www.centralbank.go.ke/api/', type: 'api', category: 'Finance', region: 'KE' },
  { name: 'Code for Africa API', url: 'https://sourceafrica.codeforafrica.org/api/', type: 'api', category: 'Data', region: 'KE' },

  // ─── South Africa ───
  { name: 'SARB OpenAPI', url: 'https://developer.resbank.co.za/api/', type: 'api', category: 'Finance', region: 'ZA' },

  // ─── Malaysia ───
  { name: 'Bank Negara API', url: 'https://api.bnm.gov.my/', type: 'api', category: 'Finance', region: 'MY' },
  { name: 'DOSM Open Data API', url: 'https://open.dosm.gov.my/api/', type: 'api', category: 'Market Data', region: 'MY' },

  // ─── UAE ───
  { name: 'Bayanat UAE API', url: 'https://bayanat.ae/api/', type: 'api', category: 'Data', region: 'AE' },

  // ─── Senegal ───
  { name: 'ANSD Data API', url: 'https://www.ansd.sn/api/', type: 'api', category: 'Market Data', region: 'SN' },

  // ─── Panama ───
  { name: 'INEC Panama API', url: 'https://www.inec.gob.pa/api/', type: 'api', category: 'Market Data', region: 'PA' },
];

// ============================================================================
// COMBINED — all sources in one array for the pipeline
// ============================================================================

export const ALL_NEWS_SOURCES: NewsSource[] = [
  ...GLOBAL_FEEDS,
  ...COUNTRY_FEEDS,
  ...ADDITIONAL_FEEDS,
  ...API_DATA_SOURCES,
];

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
