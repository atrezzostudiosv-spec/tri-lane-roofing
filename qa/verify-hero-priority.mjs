import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
const pages = [
  ['index.html', 'img[src="assets/images/home-hero.webp"]', 'home-hero.webp', 1672, 941],
  ['about.html', '.at-about-hero-photo', 'home-hero.webp', 1672, 941],
  ['services.html', '.sv-hero-photo', 'home-hero.webp', 1672, 941],
  ['gallery.html', '.at-gallery-hero-photo', 'home-intro.webp', 1122, 1402]
];
const widths = [375, 768, 1024, 1440];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
let passed = 0;
try {
  for (const [file, selector, imageFile, width, height] of pages) {
    for (const viewportWidth of widths) {
      const captures = [];
      for (const port of [8765, 8766]) {
        const context = await browser.newContext({
          viewport: { width: viewportWidth, height: 900 },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce'
        });
        try {
          const page = await context.newPage();
          const response = await page.goto('http://127.0.0.1:' + port + '/' + file, { waitUntil: 'domcontentloaded', timeout: 60000 });
          if (!response || response.status() !== 200) throw Error(file + ' HTTP ' + response?.status());
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(750);
          if (port === 8766) {
            const data = await page.evaluate((sel) => {
              const e = document.querySelector(sel);
              const p = document.querySelector('link[rel="preload"][as="image"]');
              return { src: e?.getAttribute('src'), w: e?.getAttribute('width'), h: e?.getAttribute('height'), priority: e?.getAttribute('fetchpriority'), preload: p?.getAttribute('href'), preloadPriority: p?.getAttribute('fetchpriority'), imageReady: !!e?.complete && (e?.naturalWidth ?? 0) > 0 };
            }, selector);
            if (data.src !== 'assets/images/' + imageFile || data.preload !== 'assets/images/' + imageFile ||
                data.priority !== 'high' || data.preloadPriority !== 'high' || data.w !== String(width) ||
                data.h !== String(height) || !data.imageReady) {
              throw Error('Hero invariant failed ' + file + ' ' + viewportWidth + ': ' + JSON.stringify(data));
            }
          }
          await page.addStyleTag({ content: '*,*::before,*::after { transition-duration: 0s !important; animation-duration: 0s !important; caret-color: transparent !important; }' });
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(100);
          const capture = await page.screenshot({ animations: 'disabled' });
          captures.push(createHash('sha256').update(capture).digest('hex'));
        } finally {
          await context.close();
        }
      }
      if (captures[0] !== captures[1]) throw Error('Visual mismatch: ' + file + ' @' + viewportWidth + 'px');
      passed++;
      console.log('PASS: ' + file + ' @' + viewportWidth + 'px; hero priority verified and screenshot identical');
    }
  }
  console.log('PASS: ' + passed + '/' + (pages.length * widths.length) + ' viewports');
} finally {
  await browser.close();
}
