import {chromium} from 'playwright'; import AxeBuilder from '@axe-core/playwright';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const cases=[['index.html','wizard'],['contact.html','wizard'],['gallery.html','viewer']];
let all=[];
try{
for(const [file,mode] of cases){
const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});const page=await context.newPage();
try{
await page.goto('http://127.0.0.1:8766/'+file,{waitUntil:'load',timeout:60000});
const steps=[];
if(mode==='wizard'){
 await page.evaluate(()=>openInquiryModal());
 steps.push('step-1');
 await page.evaluate(()=>selectWizardService('Roofing'));
 steps.push('step-2');
 await page.evaluate(()=>wizardNext());
 steps.push('step-3');
 await page.locator('#wiz-city').fill('Test City');
 await page.locator('#wiz-zip').fill('00000');
 await page.evaluate(()=>wizardNext());
 steps.push('step-4');
} else {
 await page.locator('#at-gallery-redesign .at-gallery-tile').first().click();
 steps.push('viewer');
}
for(const step of steps){
 if(mode==='wizard'&&step!=='step-4'){
 const n=Number(step.slice(-1));
 await page.evaluate(n=>{currentWizStep=n;updateWizardUI()},n);
 }
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 const issues=scan.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,12)}));
 all.push({file,step,issues});console.log('OVERLAY A11Y '+JSON.stringify({file,step,issues}));
}
}finally{await context.close()}
}
}finally{await browser.close()}
console.log('OVERLAY SUMMARY '+JSON.stringify(all));
