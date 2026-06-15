/**
 * Spendly — Icon & Splash asset generator
 * Requires: npm install --save-dev sharp
 * Usage:    node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const assets = resolve(root, 'assets');

const logoSvg  = readFileSync(resolve(assets, 'logo.svg'));
const markSvg  = readFileSync(resolve(assets, 'logo-mark.svg'));

// Android adaptive icon background — solid gradient rect (no rounded corners, Android clips shape)
const bgSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#3730A3"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`);

// Android monochrome — white mark on transparent (Android themes it automatically)
const monoSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <text
    x="512" y="512"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-weight="900"
    font-size="480"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
  >S</text>
  <circle cx="712" cy="232" r="22" fill="white" opacity="0.90"/>
  <circle cx="762" cy="296" r="13" fill="white" opacity="0.60"/>
  <circle cx="740" cy="172" r="13" fill="white" opacity="0.60"/>
</svg>`);

async function generate() {
  console.log('Generating Spendly icon assets...\n');

  // iOS app icon
  await sharp(logoSvg)
    .resize(1024, 1024)
    .png()
    .toFile(resolve(assets, 'icon.png'));
  console.log('✓ icon.png (1024×1024)');

  // Web favicon
  await sharp(logoSvg)
    .resize(48, 48)
    .png()
    .toFile(resolve(assets, 'favicon.png'));
  console.log('✓ favicon.png (48×48)');

  // Android adaptive — foreground (transparent background, mark centered in safe zone)
  await sharp(markSvg)
    .resize(1024, 1024)
    .png()
    .toFile(resolve(assets, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png (1024×1024)');

  // Android adaptive — background
  await sharp(bgSvg)
    .resize(1024, 1024)
    .png()
    .toFile(resolve(assets, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png (1024×1024)');

  // Android adaptive — monochrome
  await sharp(monoSvg)
    .resize(1024, 1024)
    .png()
    .toFile(resolve(assets, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png (1024×1024)');

  // Splash icon — mark centered on transparent (app.json backgroundColor = #4F46E5)
  await sharp(markSvg)
    .resize(512, 512)
    .extend({ top: 256, bottom: 256, left: 256, right: 256, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(assets, 'splash-icon.png'));
  console.log('✓ splash-icon.png (1024×1024 with transparent padding)');

  console.log('\nDone. All assets written to /assets/');
}

generate().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
