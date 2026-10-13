import assert from 'node:assert/strict';
import * as T from './dist/vendor/three.module.js';
import {addResident} from './dist/island-resident.js';
import {nodes,sweepTargets} from './dist/life-routes.js';
const elements=new Map();
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,{setAttribute(){},selectedOptions:[{textContent:'测试活动'}]});return elements.get(id);}};
const texture=new T.Texture(),clips=Object.fromEntries(['0','3','5','6','7','8','11','14','15','4','walk','sweep'].map(k=>[k,[texture]]));
const world={night:false,weather:'clear',hour:9};
const r=await addResident({island:new T.Group(),focusOn(){},getWorld:()=>world,spriteLoader:async()=>({clips,canvases:[{toDataURL:()=>''}]})});
r.request('wheat');r.update(.1);assert.equal(r.sprite.scale.x,1.48);assert.equal(r.sprite.scale.y,1.70);
for(let i=0;i<300;i++)r.update(.05);
assert.deepEqual(r.getState().position,nodes.wheat);assert(nodes.wheat[0]>-5.1&&nodes.wheat[0]<-2.4);assert(nodes.wheat[2]>2&&nodes.wheat[2]<3.9);
r.request('sweep');const visited=new Set();
for(let i=0;i<10000&&visited.size<sweepTargets.length;i++){r.update(.05);const s=r.getState();if(!s.moving)visited.add(s.destination);}
assert.equal(visited.size,sweepTargets.length);const before=r.getState();r.update(0);assert.deepEqual(r.getState(),before);
r.request('sweep',false);world.weather='rain';r.update(.05);assert.equal(r.getState().activity,'shelter');
console.log('Walk scale, in-field weeding, 16 cleaning destinations, pause and rain interruption passed.');
