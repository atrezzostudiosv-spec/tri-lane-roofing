import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const sizes=[375,768,1024,1440];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
let passes=0;
try {
 for(const width of sizes){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  const screens=[],layouts=[];
  try{
   for(const port of [8765,8766]){
    const page=await context.newPage();
    const response=await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load',timeout:60000});
    if(!response||response.status()!==200)throw Error('HTTP failed '+port);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>{const e=document.querySelector('img[alt="Illustrative residential roofing hero image for Tri-Lane website mockup"]');return e&&e.complete&&e.naturalWidth>0;},null,{timeout:20000});
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(350);
    const selector='img[alt="Illustrative residential roofing hero image for Tri-Lane website mockup"]';
    const selectorIntro='img[alt="Illustrative roofing craftsmanship image for Tri-Lane website mockup"]';
    const geometry=await page.evaluate(([a,b])=>{
      const rect=x=>{const e=document.querySelector(x);if(!e)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100)};
      return {hero:rect(a),intro:rect(b),pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight};
    },[selector,selectorIntro]);
    layouts.push(geometry);
    const heroImage=await page.$(selector);
    if(port===8766){
      const currentSrc=await heroImage.evaluate(el=>el.currentSrc);
      const expected=width<=640?'home-hero-640.webp':width<=960?'home-hero-960.webp':width<=1280?'home-hero-1280.webp':'home-hero.webp';
      if(!currentSrc.endsWith(expected))throw Error('Responsive hero selection error '+width+' '+currentSrc);
    }
    const top=PNG.sync.read(await page.screenshot({animations:'disabled'}));
    await page.locator(selectorIntro).scrollIntoViewIfNeeded();
    await page.waitForFunction((x)=>{const img=document.querySelector(x);return img&&img.complete&&img.naturalWidth>0;},selectorIntro,{timeout:20000});
    await page.waitForTimeout(350);
    const intro=PNG.sync.read(await page.screenshot({animations:'disabled'}));
    if(port===8766 && width<=768){
      const reqs=await page.evaluate(()=>performance.getEntriesByType('resource').map(x=>x.name));
      if(reqs.some(x=>x.endsWith('/assets/images/home-hero.webp')||x.endsWith('/assets/images/home-intro.webp')))
         throw Error('Mobile loaded unnecessary original full-resolution photo: '+width);
    }
    screens.push({top,intro});
    await page.close();
   }
   if(JSON.stringify(layouts[0])!==JSON.stringify(layouts[1]))throw Error('Layout geometry changed '+width+' '+JSON.stringify(layouts));
   if(layouts[1].pageWidth>width)throw Error('Horizontal overflow at '+width);
   for(const key of ['top','intro']){
     const a=screens[0][key],b=screens[1][key];
     if(a.width!==b.width||a.height!==b.height)throw Error('Screenshot dims changed');
     let sum=0;
     for(let i=0;i<a.data.length;i+=4)for(let k=0;k<3;k++)sum+=Math.abs(a.data[i+k]-b.data[i+k]);
     const mean=sum/(a.width*a.height*3);
     console.log('VISUAL '+width+'px '+key+' mean-RGB-diff '+mean.toFixed(3)+' /255; 0px geometry difference');
     if(mean>5.0)throw Error('Excessive visual difference '+width+' '+key+' '+mean.toFixed(3));
   }
   passes++;
   console.log('PASS: '+width+'px: responsive selection, fully loaded images, no horizontal overflow, unchanged layout');
  }finally{await context.close();}
 }
 console.log('SUCCESS: '+passes+'/'+sizes.length+' viewport groups, eight screenshot comparisons');
}finally{await browser.close();}
