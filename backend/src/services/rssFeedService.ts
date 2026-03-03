// RSS Feed Output Service
// Generates full-text RSS 2.0 and Atom XML feeds for AI crawlers, feed readers, and syndication
// Critical for LLM ingestion and Google News visibility

import prisma from '../lib/prisma';

export interface RSSFeedOptions {
  category?: string;
  limit?: number;
  language?: string;
  territory?: string;
  fullText?: boolean;
}

export class RSSFeedService {
  private readonly siteUrl = process.env.SITE_URL || 'https://coindaily.online';
  private readonly siteName = 'CoinDaily';
  private readonly siteDescription = "Africa's Premier Cryptocurrency & Finance News Platform";

  /**
   * Parse tags string into array (tags stored as comma-separated string or JSON)
   */
  private parseTags(tags: string | null | undefined): string[] {
    if (!tags) return [];
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map((t: any) => typeof t === 'string' ? t : t.name || String(t));
    } catch {
      // Not JSON, try comma-separated
    }
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  /**
   * Generate RSS 2.0 XML feed with full article content for AI crawlers
   */
  async generateRSS(options: RSSFeedOptions = {}): Promise<string> {
    const { category, limit = 50, language, territory, fullText = true } = options;

    const where: any = { status: 'PUBLISHED' };
    if (category) where.Category = { slug: category };

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        User: { select: { id: true, firstName: true, lastName: true, email: true, bio: true, role: true } },
        Category: { select: { name: true, slug: true } },
        ArticleTranslation: language ? { where: { languageCode: language }, select: { title: true, content: true, languageCode: true } } : false,
      },
    });

    const feedCategory = category ? ` - ${category.charAt(0).toUpperCase() + category.slice(1)}` : '';
    const lastBuildDate = articles.length > 0 ? new Date(articles[0].publishedAt || articles[0].createdAt).toUTCString() : new Date().toUTCString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
     xmlns:schema="http://schema.org/">
  <channel>
    <title>${this.escapeXml(`${this.siteName}${feedCategory} - African Crypto &amp; Finance News`)}</title>
    <link>${this.siteUrl}</link>
    <description>${this.escapeXml(this.siteDescription)}</description>
    <language>${language || 'en'}</language>
    <copyright>Copyright ${new Date().getFullYear()} ${this.siteName}. All rights reserved.</copyright>
    <managingEditor>editor@coindaily.online (CoinDaily Editorial)</managingEditor>
    <webMaster>tech@coindaily.online (CoinDaily Tech)</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>CoinDaily RSS Generator v1.0</generator>
    <atom:link href="${this.siteUrl}/rss${category ? `/${category}` : ''}.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${this.siteUrl}/logo.png</url>
      <title>${this.siteName}</title>
      <link>${this.siteUrl}</link>
    </image>
`;

    for (const article of articles) {
      const authorName = article.User ? `${article.User.firstName || ''} ${article.User.lastName || ''}`.trim() || 'CoinDaily Staff' : 'CoinDaily Staff';
      const authorEmail = article.User?.email || 'editor@coindaily.online';
      const pubDate = new Date(article.publishedAt || article.createdAt).toUTCString();
      const articleUrl = `${this.siteUrl}/news/${article.slug}`;
      const tagList = this.parseTags(article.tags);
      const categories = [
        article.Category?.name,
        ...tagList
      ].filter(Boolean);

      xml += `    <item>
      <title>${this.escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${this.escapeXml(authorName)}</dc:creator>
      <author>${this.escapeXml(authorEmail)} (${this.escapeXml(authorName)})</author>
      <description>${this.escapeXml(article.excerpt || article.title)}</description>
`;

      for (const cat of categories) {
        xml += `      <category>${this.escapeXml(cat!)}</category>\n`;
      }

      if (article.featuredImageUrl) {
        xml += `      <media:content url="${this.escapeXml(article.featuredImageUrl)}" medium="image"/>
      <media:thumbnail url="${this.escapeXml(article.featuredImageUrl)}"/>
`;
      }

      // Full-text content for AI crawlers
      if (fullText && article.content) {
        xml += `      <content:encoded><![CDATA[
        <article itemscope itemtype="https://schema.org/NewsArticle">
          <h1 itemprop="headline">${article.title}</h1>
          <div itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span itemprop="name">${authorName}</span>
          </div>
          <time itemprop="datePublished" datetime="${new Date(article.publishedAt || article.createdAt).toISOString()}">${pubDate}</time>
          ${article.updatedAt ? `<time itemprop="dateModified" datetime="${new Date(article.updatedAt).toISOString()}">Updated</time>` : ''}
          <div itemprop="articleBody">
            ${article.content}
          </div>
          <div itemprop="speakable" itemscope itemtype="https://schema.org/SpeakableSpecification">
            <meta itemprop="cssSelector" content=".key-facts, .executive-summary"/>
          </div>
        </article>
      ]]></content:encoded>
`;
      }

      // Machine-readable metadata
      if (article.Category) {
        xml += `      <schema:entity type="category">${this.escapeXml(article.Category.name)}</schema:entity>\n`;
      }

      xml += `    </item>\n`;
    }

    xml += `  </channel>\n</rss>`;
    return xml;
  }

  /**
   * Generate Atom 1.0 XML feed
   */
  async generateAtom(options: RSSFeedOptions = {}): Promise<string> {
    const { category, limit = 50, language } = options;

    const where: any = { status: 'PUBLISHED' };
    if (category) where.Category = { slug: category };

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        User: { select: { firstName: true, lastName: true, email: true } },
        Category: { select: { name: true, slug: true } },
      },
    });

    const updated = articles.length > 0 ? new Date(articles[0].publishedAt || articles[0].createdAt).toISOString() : new Date().toISOString();
    const feedCategory = category ? ` - ${category}` : '';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${this.escapeXml(`${this.siteName}${feedCategory} - African Crypto &amp; Finance News`)}</title>
  <subtitle>${this.escapeXml(this.siteDescription)}</subtitle>
  <link href="${this.siteUrl}" rel="alternate"/>
  <link href="${this.siteUrl}/atom${category ? `/${category}` : ''}.xml" rel="self"/>
  <id>${this.siteUrl}/</id>
  <updated>${updated}</updated>
  <rights>Copyright ${new Date().getFullYear()} ${this.siteName}</rights>
  <generator uri="${this.siteUrl}" version="1.0">CoinDaily Feed Generator</generator>
  <icon>${this.siteUrl}/favicon.ico</icon>
  <logo>${this.siteUrl}/logo.png</logo>
`;

    for (const article of articles) {
      const authorName = article.User ? `${article.User.firstName || ''} ${article.User.lastName || ''}`.trim() || 'CoinDaily Staff' : 'CoinDaily Staff';
      const articleUrl = `${this.siteUrl}/news/${article.slug}`;
      const published = new Date(article.publishedAt || article.createdAt).toISOString();
      const updatedAt = new Date(article.updatedAt || article.createdAt).toISOString();

      xml += `  <entry>
    <title>${this.escapeXml(article.title)}</title>
    <link href="${articleUrl}" rel="alternate"/>
    <id>${articleUrl}</id>
    <published>${published}</published>
    <updated>${updatedAt}</updated>
    <author>
      <name>${this.escapeXml(authorName)}</name>
      ${article.User?.email ? `<email>${article.User.email}</email>` : ''}
    </author>
    <summary>${this.escapeXml(article.excerpt || article.title)}</summary>
    <content type="html"><![CDATA[${article.content || ''}]]></content>
`;

      const tagList = this.parseTags(article.tags);
      const categories = [article.Category?.name, ...tagList].filter(Boolean);
      for (const cat of categories) {
        xml += `    <category term="${this.escapeXml(cat!)}"/>\n`;
      }

      xml += `  </entry>\n`;
    }

    xml += `</feed>`;
    return xml;
  }

  /**
   * Generate Google News specific RSS feed (last 2 days only)
   */
  async generateGoogleNewsFeed(): Promise<string> {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: twoDaysAgo },
      },
      orderBy: { publishedAt: 'desc' },
      take: 100,
      include: {
        User: { select: { firstName: true, lastName: true } },
        Category: { select: { name: true } },
      },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.siteName} - Google News Feed</title>
    <link>${this.siteUrl}</link>
    <description>Latest African crypto and finance news</description>
    <language>en</language>
    <atom:link href="${this.siteUrl}/feeds/google-news.xml" rel="self" type="application/rss+xml"/>
`;

    for (const article of articles) {
      const pubDate = new Date(article.publishedAt || article.createdAt);
      const tagList = this.parseTags(article.tags);
      const keywords = tagList.slice(0, 10).join(', ');

      xml += `    <item>
      <title>${this.escapeXml(article.title)}</title>
      <link>${this.siteUrl}/news/${article.slug}</link>
      <guid>${this.siteUrl}/news/${article.slug}</guid>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <news:news>
        <news:publication>
          <news:name>${this.siteName}</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${pubDate.toISOString()}</news:publication_date>
        <news:title>${this.escapeXml(article.title)}</news:title>
        ${keywords ? `<news:keywords>${this.escapeXml(keywords)}</news:keywords>` : ''}
      </news:news>
    </item>
`;
    }

    xml += `  </channel>\n</rss>`;
    return xml;
  }

  /**
   * Generate JSON feed (for modern readers and LLMs)
   */
  async generateJSONFeed(options: RSSFeedOptions = {}): Promise<object> {
    const { category, limit = 50 } = options;

    const where: any = { status: 'PUBLISHED' };
    if (category) where.Category = { slug: category };

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        User: { select: { firstName: true, lastName: true, bio: true } },
        Category: { select: { name: true, slug: true } },
      },
    });

    return {
      version: 'https://jsonfeed.org/version/1.1',
      title: `${this.siteName} - African Crypto & Finance News`,
      home_page_url: this.siteUrl,
      feed_url: `${this.siteUrl}/feeds/feed.json`,
      description: this.siteDescription,
      icon: `${this.siteUrl}/logo.png`,
      favicon: `${this.siteUrl}/favicon.ico`,
      language: 'en',
      items: articles.map(article => {
        const tagList = this.parseTags(article.tags);
        return {
          id: `${this.siteUrl}/news/${article.slug}`,
          url: `${this.siteUrl}/news/${article.slug}`,
          title: article.title,
          content_html: article.content || '',
          summary: article.excerpt || '',
          date_published: new Date(article.publishedAt || article.createdAt).toISOString(),
          date_modified: new Date(article.updatedAt || article.createdAt).toISOString(),
          authors: article.User ? [{
            name: `${article.User.firstName || ''} ${article.User.lastName || ''}`.trim() || 'CoinDaily Staff',
            url: `${this.siteUrl}/authors/${(article.User.firstName || '').toLowerCase()}-${(article.User.lastName || '').toLowerCase()}`
          }] : [],
          tags: [
            article.Category?.name,
            ...tagList
          ].filter(Boolean),
          image: article.featuredImageUrl || undefined,
        };
      }),
    };
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const rssFeedService = new RSSFeedService();
