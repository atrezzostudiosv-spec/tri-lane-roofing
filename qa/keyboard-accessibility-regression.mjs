import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import axe from 'axe-core';

const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const PAGE_FILES=['index.html','about.html','services.html','gallery.html','contact.html'];
const WIDTHS=[375,768,1024,1440];
const errors=[];const records=[];
function assert(value,what){if(!value)throw new Error(what);}
function pixelDiff(a,b){
  if(a.width!==b.width||a.height!==b.height)return {invalid:true,a:[a.width,a.height],b:[b.width,b.height]};
  let changed=0,largest=0;
  for(let i=0;i<a.data.length;i+=4)for(let k=0;k<3;k++){const d=Math.abs(a.data[i+k]-b.data[i+k]);if(d){changed++;largest=Math.max(largest,d);}}
  return{changed,largest,width:a.width,height:a.height};
}
try{
for(const file of PAGE_FILES)for(const width of WIDTHS){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  try{
    const views=[];
    for(const port of [8765,8766]){
      const page=await ctx.newPage(),pageErrors=[];
      page.on('pageerror',e=>pageErrors.push(e.message));
      const response=await page.goto('http://127.0.0.1:'+port+'/'+file,{waitUntil:'networkidle',timeout:70000});
      assert(response?.status()===200,file+' HTTP '+response?.status());
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(100);
      const state=await page.evaluate(()=>{
        const selectors=['body','header','main','footer','h1','#mobile-menu-btn','.tl-official-logo','.at-gallery-hero-photo','.at-about-hero-photo','.sv-hero-photo'];
        const info=(el)=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return{
           x:b.x,y:b.y,w:b.width,h:b.height,display:s.display,color:s.color,bg:s.backgroundColor,font:s.fontFamily,weight:s.fontWeight,size:s.fontSize,letterSpacing:s.letterSpacing
        }};
        return{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
         elements:selectors.flatMap(sel=>[...document.querySelectorAll(sel)].slice(0,1)).map(info),
         fontIcon:getComputedStyle(document.querySelector('i.fa-solid')).fontFamily,
         robots:document.querySelector('meta[name="robots"]')?.content,
         bodyOverflow:document.body.style.overflow};
      });
      const screenshot=PNG.sync.read(await page.screenshot({animations:'disabled'}));
      views.push({page,state,screenshot,pageErrors});
    }
    const [before,after]=views,tag=file+' '+width;
    assert(JSON.stringify(before.state)===JSON.stringify(after.state),'Computed layout/fonts/icons changed '+tag);
    const pixels=pixelDiff(before.screenshot,after.screenshot);
    assert(!pixels.invalid && pixels.changed<=100 && pixels.largest<=60,'Closed-page screenshot materially changed '+tag+' '+JSON.stringify(pixels));
    assert(!after.pageErrors.length,'Runtime errors '+tag+' '+after.pageErrors.join(';'));
    assert(after.state.scrollWidth<=width+1,'horizontal overflow '+tag);

    const page=after.page;
    const menu=page.locator('#mobile-menu-btn');
    if(await menu.isVisible()){
       await menu.focus();
       await page.keyboard.press('Enter');
       assert(await page.locator('#mobile-menu').isVisible(),'Menu did not open by keyboard '+tag);
       assert(await menu.getAttribute('aria-expanded')==='true','Menu aria-expanded not true '+tag);
       await page.keyboard.press('Escape');
       assert(!(await page.locator('#mobile-menu').isVisible()),'Menu did not close on Escape '+tag);
       assert(await page.evaluate(()=>document.activeElement?.id)==='mobile-menu-btn','Menu button focus not restored '+tag);
       assert(await menu.getAttribute('aria-expanded')==='false','Menu aria-expanded not false '+tag);
       await menu.focus();
       await page.keyboard.press('Space');
       assert(await page.locator('#mobile-menu').isVisible(),'Menu did not reopen with Space '+tag);
       await menu.click();
       assert(!(await page.locator('#mobile-menu').isVisible()),'Menu did not close by second click '+tag);
    }

    const triggers=page.locator('button[onclick="openInquiryModal()"]:visible');
    assert(await triggers.count()>0,'Visible inquiry opener unavailable '+tag);
    const opener=triggers.first();
    await opener.click();
    const details=await page.evaluate(()=>{
      const modal=document.getElementById('inquiry-modal');
      const title=document.getElementById('assistant-title');
      return{
       visible:!modal.classList.contains('hidden'),role:modal.getAttribute('role'),ariaModal:modal.getAttribute('aria-modal'),
       labelledBy:modal.getAttribute('aria-labelledby'),
       focusedTitle:document.activeElement===title,
       inertBackground:[...document.body.children].filter(x=>x!==modal&&!x.contains(modal)&&x.tagName!=='SCRIPT').every(x=>x.inert),
       bodyOverflow:document.body.style.overflow
      };
    });
    assert(details.visible&&details.role==='dialog'&&details.ariaModal==='true'&&details.labelledBy==='assistant-title','Dialog semantic state wrong '+tag);
    assert(details.focusedTitle,'Dialog initial heading not focused '+tag);
    assert(details.inertBackground,'Dialog does not inert background '+tag);
    assert(details.bodyOverflow==='hidden','Dialog does not block background scrolling '+tag);

    // Navigate the dialog entirely with keyboard, forward and backward.
    await page.keyboard.press('Tab');
    const firstTab=await page.evaluate(()=>document.activeElement?.classList.contains('wiz-srv-btn'));
    assert(firstTab,'Tab from heading did not reach service controls '+tag);
    const tabSeq=[];
    for(let i=0;i<22;i++){
      await page.keyboard.press('Tab');
      const location=await page.evaluate(()=>({inside:document.getElementById('inquiry-modal').contains(document.activeElement),
        id:document.activeElement?.id,tag:document.activeElement?.tagName}));
      tabSeq.push(location);
      if(!location.inside)break;
    }
    assert(tabSeq.every(x=>x.inside),'Forward Tab escaped modal '+tag+' '+JSON.stringify(tabSeq));
    // Shift+Tab from first tabbable close control must wrap to last.
    const focusInfo=await page.evaluate(()=>{
      const modal=document.getElementById('inquiry-modal');
      const all=[...modal.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
        .filter(e=>e.tabIndex>=0&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden');
      return {first:all[0]?.outerHTML.slice(0,160),last:all.at(-1)?.outerHTML.slice(0,160)};
    });
    await page.locator('#inquiry-modal button[aria-label="Close Modal"]').focus();
    await page.keyboard.press('Shift+Tab');
    assert(await page.evaluate(()=>document.getElementById('inquiry-modal').contains(document.activeElement)),'Backward Tab escaped dialog '+tag);
    await page.locator('#inquiry-modal button[aria-label="Close Modal"]').focus();
    await page.keyboard.press('Enter');
    assert(!(await page.locator('#inquiry-modal').isVisible()),'Close control does not close '+tag);
    const returnedToOpener=await opener.evaluate(el=>document.activeElement===el);
    assert(returnedToOpener,'Modal close did not return focus to opener '+tag);
    const inertRestored=await page.evaluate(()=>[...document.body.children].every(x=>!x.inert));
    assert(inertRestored,'Background remains inert after close '+tag);

    // Reopen, advance all four steps, check focus moves to next step heading, use Escape.
    await opener.click();
    await page.locator('#wizard-step-1 .wiz-srv-btn').first().click();
    assert(await page.locator('#wizard-step-2').isVisible(),'Step 2 not visible '+tag);
    assert(await page.evaluate(()=>document.activeElement?.id)==='assistant-title','Focus lost on step 2 '+tag);
    await page.locator('#wiz-next-btn').click();
    assert(await page.locator('#wizard-step-3').isVisible(),'Step 3 not visible '+tag);
    assert(await page.evaluate(()=>document.activeElement?.id)==='assistant-title','Focus lost on step 3 '+tag);
    await page.locator('#wiz-city').fill('AUDIT');
    await page.locator('#wiz-zip').fill('76226');
    await page.locator('#wiz-next-btn').click();
    assert(await page.locator('#wizard-step-4').isVisible(),'Step 4 not visible '+tag);
    assert(await page.evaluate(()=>document.activeElement?.id)==='assistant-title','Focus lost on step 4 '+tag);
    await page.locator('#wiz-prev-btn').click();
    assert(await page.locator('#wizard-step-3').isVisible(),'Previous button failed '+tag);
    assert(await page.evaluate(()=>document.activeElement?.id)==='assistant-title','Focus not reset on previous '+tag);
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#inquiry-modal').isVisible()),'Escape did not close modal '+tag);
    assert(await opener.evaluate(el=>document.activeElement===el),'Escape did not restore trigger focus '+tag);
    assert(await page.evaluate(()=>document.body.style.overflow)==='','Body scroll lock not restored '+tag);

    if(file==='index.html'&&width===375){
      // Specifically verify the opener inside the mobile drawer, which becomes hidden after opening.
      await menu.click();
      const drawerButton=page.locator('#mobile-menu button[onclick*="openInquiryModal"]').first();
      await drawerButton.click();
      assert(await page.locator('#inquiry-modal').isVisible(),'Mobile drawer CTA failed '+tag);
      await page.keyboard.press('Escape');
      assert(await page.evaluate(()=>document.activeElement?.id)==='mobile-menu-btn','Focus did not fall back to mobile menu trigger '+tag);
    }
    if(width===375){
      await opener.click();
      await page.addScriptTag({content:axe.source});
      const scan=await page.evaluate(async()=>await window.axe.run(document,{
          runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
          resultTypes:['violations']}));
      assert(scan.violations.length===0,'Axe found '+scan.violations.map(x=>x.id).join(',')+' '+tag);
      await page.keyboard.press('Escape');
    }
    records.push({page:file,width,closedVisualDelta:pixels.changed,initialFocused:details.focusedTitle,
      backgroundInert:details.inertBackground,tabChecks:tabSeq.length,menuKeyboard:await menu.isVisible(),
      dialogCloseRestored:returnedToOpener,focusInfo});
    console.log('PASS KEYBOARD/VISUAL '+JSON.stringify({page:file,width,pixels:pixels.changed,tabChecks:tabSeq.length}));
    await before.page.close();await after.page.close();
  }catch(e){errors.push({page:file,width,error:String(e)});console.log('FAIL KEYBOARD '+file+' '+width+' '+String(e));}
  finally{await ctx.close();}
}
}finally{await browser.close();}
console.log('FINAL KEYBOARD QA '+JSON.stringify({success:records.length,total:PAGE_FILES.length*WIDTHS.length,errors}));
if(errors.length)process.exitCode=1;
