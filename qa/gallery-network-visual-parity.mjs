import{chromium}from'playwright';import{PNG}from'pngjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const widths=[375,768,1024,1440];let ok=0;let errs=[];
try{
for(const width of widths){
const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
try{
const results=[];
for(const port of [8765,8766]){
const page=await ctx.newPage();
page.on('pageerror',e=>errs.push('JavaScript '+port+'/'+width+' '+e.message));
await page.goto('http://127.0.0.1:'+port+'/gallery.html',{waitUntil:'networkidle',timeout:65000});
await page.evaluate(()=>document.fonts.ready);
await page.addStyleTag({content:'*,*:before,*:after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
const checks=await page.evaluate(()=>{
const body=document.body;
const rect=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return [r.x,r.y,r.width,r.height,s.fontFamily,s.fontWeight,s.fontSize,s.lineHeight,s.color,s.backgroundColor]};
return {sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,
    fontChecks:[...document.querySelectorAll('header nav, header button, i.fa-solid, #at-gallery-redesign h1,#at-gallery-redesign h2,#at-gallery-redesign p,#at-gallery-redesign .at-gallery-tile,#at-gallery-redesign .at-gallery-cta')].slice(0,35).map(rect),
    stylesheet:[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.href),
    iconVersion:getComputedStyle(document.querySelector('i.fa-solid')).fontFamily,
    high:document.querySelector('.at-gallery-hero-photo').getAttribute('fetchpriority'),
    low:[...document.querySelectorAll('.at-gallery-tile img')].map(n=>n.getAttribute('fetchpriority'))
};});
await page.waitForTimeout(350);
const snap=PNG.sync.read(await page.screenshot({fullPage:true,animations:'disabled'}));
const tiles=await page.locator('.at-gallery-tile').count();if(tiles!==7)throw Error('Tiles missing '+tiles);
await page.locator('.at-gallery-tile').first().click();await page.locator('#at-gallery-viewer-img').evaluate(x=>x.decode());
const modal=PNG.sync.read(await page.screenshot({animations:'disabled'}));
const loaded=await page.locator('#at-gallery-viewer-img').evaluate(x=>({src:x.src,width:x.naturalWidth}));
await page.keyboard.press('Escape');const closed=await page.locator('#at-gallery-viewer').evaluate(x=>x.hidden);
results.push({checks,snap,modal,loaded,closed});await page.close();
}
const [a,b]=results;
if(a.checks.sw!==b.checks.sw||a.checks.sh!==b.checks.sh||JSON.stringify(a.checks.fontChecks)!==JSON.stringify(b.checks.fontChecks)||a.checks.iconVersion!==b.checks.iconVersion||JSON.stringify(a.checks.stylesheet)!==JSON.stringify(b.checks.stylesheet))errs.push('Computed font/icon/colors/layout/styles differ width '+width);
if(b.checks.high!=='high'||b.checks.low.some(v=>v!=='low'))errs.push('Resource priorities not as expected '+width);
if(b.checks.sw>width+1)errs.push('Horizontal overflow width '+width);
const diff=(x,y)=>{if(x.width!==y.width||x.height!==y.height)return -1;let c=0;for(let k=0;k<x.data.length;k++)if(x.data[k]!==y.data[k])c++;return c};
const pixelDiff=diff(a.snap,b.snap),viewerDiff=diff(a.modal,b.modal);
if(pixelDiff!==0)errs.push('Full page pixel deviation '+width+' bytes '+pixelDiff);
if(viewerDiff!==0)errs.push('Gallery fullscreen pixel deviation '+width+' bytes '+viewerDiff);
if(!a.closed||!b.closed||JSON.stringify(a.loaded)!==JSON.stringify(b.loaded))errs.push('Viewer behavior differs '+width);
console.log('PIXEL PARITY '+JSON.stringify({width,changedPixels:pixelDiff,changedViewerBytes:viewerDiff,fontsIconsUnchanged:JSON.stringify(a.checks.fontChecks)===JSON.stringify(b.checks.fontChecks),original:b.loaded.src.split('/').at(-1)}));
if(!errs.length)ok++;
}finally{await ctx.close()}
}
}finally{await browser.close()}
console.log('FINAL PARITY '+JSON.stringify({passed:ok,of:4,errors:errs}));
if(errs.length)process.exitCode=1;
