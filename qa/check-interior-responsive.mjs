import {chromium} from 'playwright';import {PNG} from 'pngjs';
const cases=[
 ['about.html','.at-about-hero-photo','home-hero-',false],
 ['services.html','.sv-hero-photo','home-hero-',false],
 ['gallery.html','.at-gallery-hero-photo','home-intro-',true]];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
let passed=0;
try{
 for(const [name,selector,prefix,portrait] of cases)for(const width of [375,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  const shots=[],rects=[];
  try{
   for(const port of [8765,8766]){
    const page=await context.newPage();const resp=await page.goto('http://127.0.0.1:'+port+'/'+name,{waitUntil:'load',timeout:60000});
    if(resp?.status()!==200)throw Error('HTTP '+name+' '+port);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(sel=>{let img=document.querySelector(sel);return !!img&&img.complete&&img.naturalWidth>0},selector,{timeout:20000});
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}'});
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
    const measured=await page.evaluate(sel=>{let e=document.querySelector(sel),r=e.getBoundingClientRect();return {hero:[r.x,r.y,r.width,r.height],fullWidth:document.documentElement.scrollWidth,fullHeight:document.documentElement.scrollHeight,selected:e.currentSrc}},selector);
    if(port===8766&&width<=768&&(!measured.selected.includes(prefix)||measured.selected.endsWith((portrait?'home-intro.webp':'home-hero.webp'))))throw Error('Mobile not selecting variant '+name+' '+width+' '+measured.selected);
    rects.push(measured);
    shots.push(PNG.sync.read(await page.screenshot({animations:'disabled'})));
    await page.close();
   }
   const [a,b]=rects;
   if(JSON.stringify([a.hero,a.fullWidth,a.fullHeight])!==JSON.stringify([b.hero,b.fullWidth,b.fullHeight]))throw Error('Changed geometry '+name+' '+width+' '+JSON.stringify(rects));
   if(b.fullWidth>width+1)throw Error('Horizontal overflow '+name+' '+width);
   const [x,y]=shots;
   if(x.width!==y.width||x.height!==y.height)throw Error('Different screenshot dimensions');
   let sum=0;for(let i=0;i<x.data.length;i+=4)for(let k=0;k<3;k++)sum+=Math.abs(x.data[i+k]-y.data[i+k]);
   let avg=sum/(x.width*x.height*3);
   if(avg>5)throw Error('Photo/layout diff exceeded '+name+' '+width+' '+avg);
   passed++;console.log('PASS '+name+' @'+width+'px: selected '+b.selected.split('/').at(-1)+' photo RGB delta '+avg.toFixed(3)+' /255 and identical layout');
  }finally{await context.close();}
 }
 console.log('SUCCESS '+passed+'/12 responsive image tests with no geometry regressions');
}finally{await browser.close();}
