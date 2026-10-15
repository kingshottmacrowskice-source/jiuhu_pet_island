import assert from 'node:assert/strict';
import * as T from './dist/vendor/three.module.js';
import {addResident} from './dist/island-resident.js';
import {edges,sweepTargets} from './dist/life-routes.js';
import {dreamNodes,heightAt,makeRouteFinder,insideHouse} from './dist/dream-layout.js';
const find=makeRouteFinder(edges);let pairs=0;
for(const a of Object.keys(dreamNodes))for(const b of Object.keys(dreamNodes)){let prev=a;for(const n of find(a,b)){assert(edges.some(([x,y])=>x===prev&&y===n||y===prev&&x===n));prev=n;}assert.equal(prev,b);pairs++;}
const els=new Map();globalThis.document={getElementById(id){if(!els.has(id))els.set(id,{setAttribute(){},selectedOptions:[{textContent:'活动'}]});return els.get(id);}};
const texture=new T.Texture(),clips=Object.fromEntries(['0','3','5','6','7','8','11','14','15','4','walk','sweep'].map(k=>[k,[texture]]));
const r=await addResident({island:new T.Group(),focusOn(){},getWorld:()=>({night:false,weather:'clear',hour:9}),routeNodes:dreamNodes,routeFinder:find,insideTest:insideHouse,groundHeight:(x,z,y)=>Math.abs(x+9)<.65&&z<-3.5&&z>-5.5?Math.max(y,heightAt(x,z)+.78):heightAt(x,z)+.13,spriteLoader:async()=>({clips,canvases:[{toDataURL:()=>''}]})});
for(const target of ['sleep','garden','cook','eat','wheat','pond','fire','tree','shelter','home']){r.request(target);for(let i=0;i<6000&&r.getState().moving;i++){r.update(.05);const [x,y,z]=r.getState().position;assert(y>=heightAt(x,z)+.06,'Resident under terrain');}assert(!r.getState().moving,'Cannot reach '+target);assert(Math.hypot(r.sprite.position.x-dreamNodes[target][0],r.sprite.position.z-dreamNodes[target][2])<.01);}
r.request('sweep');const seen=new Set();for(let i=0;i<22000&&seen.size<sweepTargets.length;i++){r.update(.05);if(!r.getState().moving)seen.add(r.getState().destination);}assert.equal(seen.size,sweepTargets.length);
console.log(`${pairs} dream routes, all activities, terrain clearance and ${seen.size} sweep stops passed.`);
