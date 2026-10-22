import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let checks=0,failures=[];const widths=[375,768,1024,1440],pages=[['about.html','.at-about-hero-photo'],['services.html','.sv-hero-photo']];
const result=(label,ok,message)=>{if(!ok)failures.push(label+' '+message);console.log((ok?'PASS ':'FAIL ')+label+' '+message)};
function compareImages(a,b){if(a.width!==b.width||a.height!==b.height)throw Error('Screenshot size mismatch '+a.width+'x'+a.height+' '+b.width+'x'+b.height);let sum=0,differing=0;for(let i=0;i<a.data.length;i+=4){for(let k=0;k<3;k++){const d=Math.abs(a.data[i+k]-b.data[i+k]);sum+=d;if(d>0)differing++}}return {avgRGB:sum/(a.width*a.height*3),diffChannels:differing,width:a.width,height:a.height};}
try{
for(const [name,selector] of pages)for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  const versions=[];
  try{
    for(const port of [8765,8766]){
      const page=await ctx.newPage(),errs=[];
      page.on('pageerror',e=>errs.push(e.message));
      const response=await page.goto('http://127.0.0.1:'+port+'/'+name,{waitUntil:'networkidle',timeout:65000});
      if(response?.status()!==200)throw Error('HTTP '+name);
      await page.evaluate(()=>document.fonts.ready);
      await page.locator(selector).evaluate(el=>el.decode());
      await page.addStyleTag({content:'*,*:before,*:after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
      await page.waitForTimeout(100);
      const metrics=await page.evaluate(sel=>{
        const image=document.querySelector(sel);const b=image.getBoundingClientRect();
        const props=ele=>{let r=ele.getBoundingClientRect(),cs=getComputedStyle(ele);return {x:r.x,y:r.y,w:r.width,h:r.height,font:cs.fontFamily,weight:cs.fontWeight,size:cs.fontSize,color:cs.color,background:cs.backgroundColor,lineHeight:cs.lineHeight}};
        return {scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,navItems:[...document.querySelectorAll('header nav a, header i.fa-solid, header button, main h1, main h2')].slice(0,23).map(props),
        hero:props(image),src:image.currentSrc.split('/').at(-1),fullImg:{width:image.naturalWidth,height:image.naturalHeight},
        h1:document.querySelectorAll('h1').length,robots:document.querySelector('meta[name=robots]')?.content};
      },selector);
      const im=PNG.sync.read(await page.screenshot({fullPage:true,animations:'disabled'}));
      const menu=page.locator('#mobile-menu-btn');
      let open=true,closed=true;
      if(await menu.isVisible()){
        await menu.click();open=await page.locator('#mobile-menu').evaluate(el=>!el.classList.contains('hidden'));
        await menu.click();closed=await page.locator('#mobile-menu').evaluate(el=>el.classList.contains('hidden'));
      }
      await page.evaluate(()=>openInquiryModal());
      const modalOpen=await page.locator('#inquiry-modal').evaluate(el=>!el.classList.contains('hidden'));
      await page.evaluate(()=>selectWizardService('Roofing'));
      await page.evaluate(()=>wizardNext());
      const wizard=await page.locator('#wiz-city').count();
      await page.evaluate(()=>closeInquiryModal());
      versions.push({metrics,im,open,closed,modalOpen,wizard,errors:errs});
      await page.close();
    }
    const [a,b]=versions;
    const label=name+' '+width;
    const structure=({src,fullImg,...x})=>x;
    result(label,JSON.stringify(structure(a.metrics))===JSON.stringify(structure(b.metrics)),'computed layout, typography, colors, icons, overflow and SEO unchanged');
    result(label,JSON.stringify([a.open,a.closed,a.modalOpen,a.wizard,a.errors])===JSON.stringify([b.open,b.closed,b.modalOpen,b.wizard,b.errors]),'menus and wizard unchanged');
    if(width<=768)result(label,b.metrics.src.startsWith('interior-hero-'),'responsive hero selected '+b.metrics.src);
    result(label,b.metrics.scrollWidth<=width+1,'no horizontal scroll');
    const diff=compareImages(a.im,b.im);
    if(diff.avgRGB>1.25){
      const sections=[];
      for(let top=0;top<a.im.height;top+=400){
        let delta=0;
        for(let y=top;y<Math.min(top+400,a.im.height);y++){
          for(let x=0;x<a.im.width;x++){
            const k=(y*a.im.width+x)*4;
            delta+=Math.abs(a.im.data[k]-b.im.data[k])+Math.abs(a.im.data[k+1]-b.im.data[k+1])+Math.abs(a.im.data[k+2]-b.im.data[k+2]);
          }
        }
        sections.push([top,Number((delta/(Math.min(400,a.im.height-top)*a.im.width*3)).toFixed(4))]);
      }
      console.log('DIFF BANDS '+JSON.stringify({name,width,sections}));
    }
    const topHeight=Math.min(900,a.im.height,b.im.height);
    const rowLen=a.im.width*4;
    const topA={width:a.im.width,height:topHeight,data:a.im.data.subarray(0,rowLen*topHeight)};
    const topB={width:b.im.width,height:topHeight,data:b.im.data.subarray(0,rowLen*topHeight)};
    const aboveFold=compareImages(topA,topB);
    result(label,aboveFold.avgRGB<=0.90,'above-fold 900px hero/header mean RGB delta '+aboveFold.avgRGB.toFixed(4)+'/255');
    console.log('FULLPAGE DIAGNOSTIC '+JSON.stringify({page:name,width,avgRGB:diff.avgRGB,belowFoldMayContainScrollActivatedSections:true}));
    console.log('VISUAL '+JSON.stringify({page:name,width,baselineSource:a.metrics.src,newSource:b.metrics.src,rgb:diff.avgRGB,canvas:[diff.width,diff.height]}));
    checks++;
  }finally{await ctx.close()}
}
}finally{await browser.close()}
console.log('FINAL HERO QA '+JSON.stringify({viewportGroups:checks,failed:failures.length,failures}));
if(failures.length)process.exitCode=1;
