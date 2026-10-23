import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const configs=[
 {path:'about.html',img:'.at-about-company-photo img',expect:'gallery-secondary-'},
 {path:'services.html',img:'.sv-roofing img',expect:'gallery-feature-'}
];
const widths=[375,768,1024,1440];
const failures=[];let cases=0;
function comparePNG(a,b){
 if(a.width!==b.width||a.height!==b.height)throw Error('Image geometry changed '+JSON.stringify([a.width,a.height,b.width,b.height]));
 let sum=0,max=0;
 for(let i=0;i<a.data.length;i+=4)for(let k=0;k<3;k++){const d=Math.abs(a.data[i+k]-b.data[i+k]);sum+=d;if(d>max)max=d}
 return {avg:sum/(3*a.width*a.height),max,dimensions:[a.width,a.height]};
}
const check=(cond,message)=>{if(!cond)failures.push(message)};
try {
for(const config of configs)for(const width of widths){
 const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 try{
  const states=[];
  for(const port of [8765,8766]){
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto('http://127.0.0.1:'+port+'/'+config.path,{waitUntil:'networkidle',timeout:60000});
   if(response?.status()!==200)throw Error('Unexpected HTTP '+response?.status());
   await page.evaluate(()=>document.fonts.ready);
   await page.addStyleTag({content:'*,*:before,*:after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
   const img=page.locator(config.img);check(await img.count()===1,'Image selector invalid '+config.path);
   await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());
   await page.waitForTimeout(200);
   const facts=await page.evaluate(selector=>{
    const target=document.querySelector(selector);
    const rect=el=>{const r=el.getBoundingClientRect(),css=getComputedStyle(el);return {
      x:r.x,y:r.y,w:r.width,h:r.height,font:css.fontFamily,fontWeight:css.fontWeight,
      fontSize:css.fontSize,fill:css.color,display:css.display,objectFit:css.objectFit,
      objectPosition:css.objectPosition
    }};
    const elements=[...document.querySelectorAll('header, header i.fa-solid, header nav a, main h1, main h2')].slice(0,25);
    return {
      geometry:rect(target),
      descendants:elements.map(rect),
      alt:target.alt,original:target.getAttribute('src'),
      chosen:new URL(target.currentSrc).pathname.split('/').at(-1),
      originalWidth:target.naturalWidth,originalHeight:target.naturalHeight,
      scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight,
      h1:document.querySelectorAll('h1').length,
      robots:document.querySelector('meta[name=robots]')?.content,
      fonts:[document.fonts.check('700 32px "Barlow Condensed"'),document.fonts.check('400 14px Manrope')],
      iconFont:getComputedStyle(document.querySelector('i.fa-solid')).fontFamily
    };
   },config.img);
   const region=PNG.sync.read(await img.screenshot({animations:'disabled',timeout:45000}));
   const body=page.locator('body');const menu=page.locator('#mobile-menu-btn');let menuWorks=true;
   if(await menu.isVisible()){await menu.click();let open=!await page.locator('#mobile-menu').evaluate(el=>el.classList.contains('hidden'));await menu.click();let closed=await page.locator('#mobile-menu').evaluate(el=>el.classList.contains('hidden'));menuWorks=open&&closed}
   await page.evaluate(()=>openInquiryModal());
   const modal=await page.locator('#inquiry-modal').evaluate(el=>!el.classList.contains('hidden'));
   await page.evaluate(()=>selectWizardService('Roofing'));await page.evaluate(()=>wizardNext());
   const wizard=await page.locator('#wiz-city').isVisible();await page.evaluate(()=>closeInquiryModal());
   states.push({facts,region,menuWorks,modal,wizard,errors});await page.close();
  }
  const [base,next]=states;
  const label=config.path+' '+width+'px';
  const b={...base.facts},n={...next.facts};
  delete b.chosen;delete n.chosen;delete b.originalWidth;delete n.originalWidth;delete b.originalHeight;delete n.originalHeight;
  check(JSON.stringify(b)===JSON.stringify(n),'Computed fonts/icons/geometry/meta difference '+label);
  check(next.facts.scrollWidth<=width+1,'Horizontal overflow '+label);
  check(next.facts.chosen.startsWith(config.expect)||next.facts.chosen===base.facts.chosen,'Unexpected selected src '+label+': '+next.facts.chosen);
  check(next.menuWorks===base.menuWorks&&next.modal===base.modal&&next.wizard===base.wizard&&JSON.stringify(next.errors)===JSON.stringify(base.errors),
    'Menu, wizard, or JavaScript change '+label);
  const pixel=comparePNG(base.region,next.region);
  check(pixel.avg<7.5,'Photographic source appearance too different '+label+' RGB '+pixel.avg);
  const currentIsNew=next.facts.chosen.startsWith(config.expect);
  console.log('SECONDARY IMAGE QA '+JSON.stringify({page:config.path,width,selectedBefore:base.facts.chosen,selectedAfter:next.facts.chosen,usesNew:currentIsNew,rgbMean:Number(pixel.avg.toFixed(4)),size:pixel.dimensions,layoutUnchanged:JSON.stringify(b)===JSON.stringify(n)}));
  cases++;
 }finally{await ctx.close()}
}
}finally{await browser.close()}
console.log('SECONDARY IMAGE QA SUMMARY '+JSON.stringify({cases,failures}));
if(failures.length)process.exitCode=1;
