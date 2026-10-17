const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    for(const entry of ['index.html','wallpaper.html']){
      await page.goto('http://127.0.0.1:4173/'+entry);await page.waitForFunction(()=>window.__materialStudy?.ready);
      await page.evaluate(()=>window.__materialStudy.life.state.paused=true);
      for(const season of ['autumn','winter','spring','summer']){
        await page.click('#season-'+season);
        const result=await page.evaluate(season=>{
          const s=window.__materialStudy,c=s.seasons;
          const particleName={autumn:'autumn-falling-leaves',winter:'winter-soft-snowfall',spring:'spring-falling-cherry-petals'};
          for(const [name,id]of Object.entries(particleName))if(s.island.getObjectByName(id).visible!==(name===season))return 'visibility';
          if(particleName[season]){const p=s.island.getObjectByName(particleName[season]).geometry.attributes.position.array,before=Array.from(p);c.update(0);if(before.some((v,i)=>v!==p[i]))return 'pause';c.update(.5);if(before.every((v,i)=>v===p[i]))return 'motion';}
          s.setTextures(false);s.setTextures(true);return c.state.current;
        },season);assert.equal(result,season);
        if(entry==='index.html'&&['autumn','winter'].includes(season))await page.screenshot({path:'design/'+season+'-season.png'});
      }
      await page.click('#season-autumn');await page.click('#season-halloween');
      assert.equal(await page.evaluate(()=>window.__materialStudy.island.getObjectByName('halloween-lantern-festival').visible),true);
      if(entry==='index.html')await page.screenshot({path:'design/halloween-season.png'});
      const cycle=await page.evaluate(()=>{const s=window.__materialStudy,c=s.seasons;c.state.auto=true;const out=[];for(let i=0;i<4;i++){c.update(c.duration);out.push(c.state.current);}c.update(c.duration*5+7);out.push(c.state.current,c.state.age,c.state.halloween);c.state.auto=false;return out;});
      assert.deepEqual(cycle,['winter','spring','summer','autumn','winter',7,true]);
      await page.click('#season-halloween');assert.equal(await page.evaluate(()=>window.__materialStudy.island.getObjectByName('halloween-lantern-festival').visible),false);
      console.log(entry+': four seasons, particles, pause, textures, festival and multi-season cycle passed');
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
