import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const cases = [
  ['index.html', 'img[src="assets/images/home-hero.webp"]', 'home-hero.webp', 1672, 941],
  ['about.html', '.at-about-hero-photo', 'home-hero.webp', 1672, 941],
  ['services.html', '.sv-hero-photo', 'home-hero.webp', 1672, 941],
  ['gallery.html', '.at-gallery-hero-photo', 'home-intro.webp', 1122, 1402]
];
const sizes = [375, 768, 1024, 1440];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const style = '*,*::before,*::after { transition-duration: 0s !important; animation-duration: 0s !important; caret-color: transparent !important; }';
let passed = 0;

try {
  for (const [file, selector, imgName, w, h] of cases) {
    for (const width of sizes) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const shots = [];
      const geom = [];
      try {
        for (const port of [8765, 8766]) {
          const page = await context.newPage();
          const response = await page.goto('http://127.0.0.1:' + port + '/' + file, { waitUntil: 'load', timeout: 45000 });
          if (!response || response.status() !== 200) throw Error(file + ' HTTP error ' + response?.status());
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction((sel) => { const el = document.querySelector(sel); return !!el && el.complete && el.naturalWidth > 0; }, selector, { timeout: 20000 });
          await page.addStyleTag({content: style});
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(250);
          const measures = await page.evaluate((sel) => {
            const el = document.querySelector(sel), r = el.getBoundingClientRect();
            return { x:r.x,y:r.y,width:r.width,height:r.height,documentHeight:document.documentElement.scrollHeight,
              scrollWidth:document.documentElement.scrollWidth };
          }, selector);
          geom.push(measures);
          if (port === 8766) {
            const fields = await page.evaluate((sel) => {
              const img=document.querySelector(sel), link=document.querySelector('link[rel="preload"][as="image"]');
              return {src:img.getAttribute('src'),w:img.getAttribute('width'),h:img.getAttribute('height'),
                fetchpriority:img.getAttribute('fetchpriority'),preload:link?.getAttribute('href'),
                preloadPriority:link?.getAttribute('fetchpriority')};
            }, selector);
            if(fields.src !== 'assets/images/'+imgName || fields.w !== String(w) || fields.h !== String(h) ||
              fields.fetchpriority !== 'high' || fields.preload !== 'assets/images/'+imgName || fields.preloadPriority !== 'high')
              throw Error('Hero markup contract failed '+file+': '+JSON.stringify(fields));
          }
          shots.push(PNG.sync.read(await page.screenshot({animations:'disabled'})));
          await page.close();
        }
        if (JSON.stringify(geom[0]) !== JSON.stringify(geom[1]))
          throw Error('Geometry changed '+file+' '+width+': '+JSON.stringify(geom));
        const [a,b]=shots;
        if(a.width!==b.width || a.height!==b.height)throw Error('Screenshot dimensions changed '+file);
        let pixels = 0, changed = 0;
        for(let i=0;i<a.data.length;i+=4) {
          pixels++;
          if(Math.abs(a.data[i]-b.data[i]) > 8 || Math.abs(a.data[i+1]-b.data[i+1]) > 8 ||
          Math.abs(a.data[i+2]-b.data[i+2]) > 8 || Math.abs(a.data[i+3]-b.data[i+3]) > 8)changed++;
        }
        const pct=100*changed/pixels;
        if(pct>0.05) throw Error('Screenshot mismatch '+file+' '+width+' pixels changed: '+pct.toFixed(4)+'%');
        passed++;
        console.log('PASS '+file+' @ '+width+'px; '+pct.toFixed(4)+'% pixel variation, 0px geometry difference');
      } finally {
        await context.close();
      }
    }
  }
  console.log('PASS '+passed+'/16 responsive hero render comparisons');
} finally {
  await browser.close();
}
