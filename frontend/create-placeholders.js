/**
 * Generate Placeholder Images
 * Creates placeholder images for missing assets
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG placeholder
function createSVGPlaceholder(width, height, text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f97316"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="14" fill="white">
    ${text}
  </text>
</svg>`;
}

// Create directories if they don't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
const adsDir = path.join(__dirname, 'public', 'images', 'ads');

[iconsDir, adsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create favicon placeholders
const favicon16 = createSVGPlaceholder(16, 16, 'CD');
const favicon32 = createSVGPlaceholder(32, 32, 'CD');
const adBanner = createSVGPlaceholder(728, 90, 'Binance Africa - Your Gateway to Crypto');

fs.writeFileSync(path.join(iconsDir, 'favicon-16x16.svg'), favicon16);
fs.writeFileSync(path.join(iconsDir, 'favicon-32x32.svg'), favicon32);
fs.writeFileSync(path.join(adsDir, 'binance-africa-banner.svg'), adBanner);

console.log('✅ Placeholder images created successfully!');
console.log('   - /icons/favicon-16x16.svg');
console.log('   - /icons/favicon-32x32.svg');
console.log('   - /images/ads/binance-africa-banner.svg');
console.log('\nNote: These are SVG placeholders. Replace with actual PNG/JPG images for production.');
