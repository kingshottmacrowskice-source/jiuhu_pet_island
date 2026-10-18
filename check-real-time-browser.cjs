const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  for(const entry of ['index.html','wallpaper.html'])for(const initial of [false,true]){
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(initial=>{window.islandCameraProperties={realtime:{value:initial}};Object.defineProperty(window,'islandCameraProperties',{get(){return this.__properties;},set(value){this.__properties={...value,realtime:{value:initial}};},configurable:true});},initial);
   await page.goto('http://127.0.0.1:4173/'+entry);
   await page.waitForFunction(()=>window.__materialStudy?.ready,{timeout:60000});
   for(const enabled of [true,false,true]){
    await page.evaluate(enabled=>window.wallpaperPropertyListener.applyUserProperties({realtime:{value:enabled}}),enabled);
    const before=await page.evaluate(()=>window.__materialStudy.life.state.elapsed);
    await page.waitForTimeout(1200);
    const after=await page.evaluate(()=>({elapsed:window.__materialStudy.life.state.elapsed,hour:window.__materialStudy.life.state.hour,now:new Date().getHours()+new Date().getMinutes()/60+new Date().getSeconds()/3600,disabled:document.getElementById('speed').disabled}));
    assert.ok(after.elapsed>before,'Render loop must continue');assert.equal(after.disabled,enabled);
    if(enabled)assert.ok(Math.abs(after.hour-after.now)<.002,'Local time must stay synchronized');
   }
   assert.deepEqual(errors,[]);await page.close();console.log(entry+' initial='+initial+': startup, toggle and continuous rendering passed');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
