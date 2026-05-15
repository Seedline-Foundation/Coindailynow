import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svg = readFileSync(join(publicDir, 'og-image.svg'));

await sharp(svg, { density: 150 })
  .resize(1200, 630)
  .png()
  .toFile(join(publicDir, 'og-image.png'));

console.log('Created og-image.png (1200x630)');

await sharp(svg, { density: 150 })
  .resize(1200, 630)
  .png()
  .toFile(join(publicDir, 'twitter-image.png'));

console.log('Created twitter-image.png (1200x630)');
