const critical = require('critical');
const path = require('path');
const fs = require('fs');

// Critical CSS generation for key pages with enhanced configuration
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const pages = [
  { 
    url: `${baseUrl}/`, 
    output: 'critical-home.css',
    forceInclude: ['.hero', '.header', '.navigation', '.above-fold']
  },
  { 
    url: `${baseUrl}/news`, 
    output: 'critical-news.css',
    forceInclude: ['.article-grid', '.category-nav', '.featured-article']
  },
  { 
    url: `${baseUrl}/market`, 
    output: 'critical-market.css',
    forceInclude: ['.market-overview', '.price-table', '.trending-coins']
  },
  { 
    url: `${baseUrl}/analysis`, 
    output: 'critical-analysis.css',
    forceInclude: ['.analysis-header', '.insight-cards', '.chart-container']
  },
  { 
    url: `${baseUrl}/dashboard`, 
    output: 'critical-dashboard.css',
    forceInclude: ['.dashboard-nav', '.widget-grid', '.user-info']
  }
];

async function generateCriticalCSS() {
  console.log('🎯 Generating Critical CSS for performance optimization...');
  
  // Ensure critical CSS directory exists
  const criticalDir = path.join(__dirname, '..', 'public', 'critical');
  if (!fs.existsSync(criticalDir)) {
    fs.mkdirSync(criticalDir, { recursive: true });
  }

  const manifest = {
    generated: new Date().toISOString(),
    files: {},
    totalSize: 0
  };

  for (const page of pages) {
    try {
      console.log(`📄 Processing ${page.url}...`);
      
      const result = await critical.generate({
        src: page.url,
        dest: path.join(criticalDir, page.output),
        inline: false,
        width: 1300,
        height: 900,
        dimensions: [
          { width: 320, height: 568 },   // Mobile
          { width: 768, height: 1024 },  // Tablet  
          { width: 1300, height: 900 },  // Desktop
          { width: 1920, height: 1080 }  // Large Desktop
        ],
        penthouse: {
          blockJSRequests: false,
          timeout: 30000,
          pageLoadSkipTimeout: 10000,
          forceInclude: [
            ...page.forceInclude,
            '.loading',
            '.error',
            '.critical'
          ],
          propertiesToRemove: [
            '(-webkit-)?animation',
            '(-webkit-)?transition'
          ]
        },
        ignore: {
          atrule: ['@font-face'],
          rule: [/\.sr-only/]
        },
        minify: true,
        extract: true,
        include: [
          /font-display:\s*swap/,
          /display:\s*(flex|grid|block)/,
          /visibility|position|z-index/
        ]
      });

      console.log(`✅ Generated ${page.output}`);
      
      // Add to manifest
      const stats = fs.statSync(path.join(criticalDir, page.output));
      manifest.files[page.output] = {
        url: page.url,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size)
      };
      manifest.totalSize += stats.size;
      
    } catch (error) {
      console.error(`❌ Failed to generate ${page.output}:`, error.message);
      
      // Create fallback critical CSS
      const fallbackCSS = `/* Critical CSS generation failed for ${page.url} */\nbody { margin: 0; padding: 0; }\n.loading { display: block; }`;
      fs.writeFileSync(path.join(criticalDir, page.output), fallbackCSS);
    }
  }

  // Save manifest
  manifest.totalSizeFormatted = formatBytes(manifest.totalSize);
  fs.writeFileSync(
    path.join(criticalDir, 'critical-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('🎉 Critical CSS generation completed!');
  console.log(`📊 Total size: ${manifest.totalSizeFormatted}`);
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Run if called directly
if (require.main === module) {
  generateCriticalCSS().catch(console.error);
}

module.exports = { generateCriticalCSS };