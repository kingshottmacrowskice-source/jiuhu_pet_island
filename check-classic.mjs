import assert from 'node:assert/strict';
import * as T from './dist/vendor/three.module.js';
import {heightAt,baseHeightAt,isRoad,roadDepth,cellSize,terraceStep,inIsland,isWater,zones,classicNodes,findClassicRoute,walkHeight,insideHouse,bridgeNodes} from './dist/classic-layout.js';
import {buildClassicTerrain} from './dist/classic-terrain.js';
import {edges,sweepTargets} from './dist/life-routes.js';
import {addResident} from './dist/island-resident.js';
import {propOffset,overlapsRoad,roadsideLamp,residentNodes,findResidentRoute,insideMovedHouse} from './dist/classic-props.js';

let min=Infinity,max=-Infinity,maxStep=0,roadSamples=0;
for(let x=-17;x<=17;x+=.125)for(let z=-14;z<=14;z+=.125){
  if(!inIsland(x,z))continue;
  const h=heightAt(x,z);min=Math.min(min,h);max=Math.max(max,h);
  const base=baseHeightAt(x,z);assert(Math.abs(base/terraceStep-Math.round(base/terraceStep))<1e-7);
  maxStep=Math.max(maxStep,Math.abs(baseHeightAt(x+cellSize,z)-base),Math.abs(baseHeightAt(x,z+cellSize)-base));
  if(isRoad(x,z)){assert.equal(base-h,roadDepth);roadSamples++;}
}
assert(max-min<=3,'Surface relief exceeds three blocks');
assert(maxStep<=.5,'Terrain has a tall cliff between neighboring blocks');assert(roadSamples>100,'Missing lowered paths');
for(const {offset:[dx,y,dz],bounds:[a,b,c,d]}of Object.values(zones)){
  for(let x=a+.25;x<=b-.25;x+=.25)for(let z=c+.25;z<=d-.25;z+=.25)assert(Math.abs(baseHeightAt(x+dx,z+dz)-y)<1e-7,'Building pad is not level');
}
const island=new T.Group(),meshes=[],grass=new T.MeshStandardMaterial(),dirt=grass.clone(),stone=grass.clone(),moss=grass.clone();
const roadMaterials=Array.from({length:7},()=>grass.clone());
buildClassicTerrain({island,grass,groundTop:()=>grass,dirt,stone,moss,flat:()=>grass,meshes,roadMaterials});island.updateMatrixWorld(true);
for(const mesh of meshes){const normals=mesh.geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert.equal(Math.abs(normals.getX(i))+Math.abs(normals.getY(i))+Math.abs(normals.getZ(i)),1,'Terrain contains a curved or sloping face');}
const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
let raySamples=0;
for(let x=-15.987;x<16;x+=.37)for(let z=-12.983;z<13;z+=.41){
  if(!inIsland(x,z,1))continue;
  ray.set(new T.Vector3(x,10,z),down);const hit=ray.intersectObjects(meshes)[0];assert(hit,'Terrain contains a hole');
  const expected=isWater(x,z)?-.75:heightAt(x,z);assert(Math.abs(hit.point.y-expected)<.075,`Rendered terrain does not match walk height at ${x},${z}: ${hit.point.y} vs ${expected}`);raySamples++;
}
let pairs=0;
for(const a of Object.keys(classicNodes))for(const b of Object.keys(classicNodes)){
  let prev=a;for(const n of findClassicRoute(a,b)){assert(edges.some(([x,y])=>x===prev&&y===n||y===prev&&x===n));prev=n;}assert.equal(prev,b);pairs++;
}
for(const [a,b]of edges)for(let i=0;i<=100;i++){
  const p=classicNodes[a],q=classicNodes[b],x=p[0]+(q[0]-p[0])*i/100,z=p[2]+(q[2]-p[2])*i/100;
  assert(inIsland(x,z,1),'Path leaves island');
  if(isWater(x,z))assert(bridgeNodes.has(a)&&bridgeNodes.has(b),'Walk enters water outside bridge');
  assert(Math.hypot(x,z-5.45)>.75,'Walk enters fire');
  assert(!(x>-12.4&&x<-9.6&&z>-3.8&&z<-1.5),'Walk enters shed');
  if(!['wheatEntry','wheat'].includes(a)&&!['wheatEntry','wheat'].includes(b))assert(!(x>-6.9&&x<-4.3&&z>3.6&&z<5.7),'Walk crosses wheat fence');
}
const els=new Map();globalThis.document={getElementById(id){if(!els.has(id))els.set(id,{setAttribute(){},selectedOptions:[{textContent:'活动'}]});return els.get(id);}};
const texture=new T.Texture(),clips=Object.fromEntries(['0','3','5','6','7','8','11','14','15','4','walk','sweep'].map(k=>[k,[texture]]));
const resident=await addResident({island:new T.Group(),focusOn(){},getWorld:()=>({night:false,weather:'clear',hour:9}),routeNodes:residentNodes,routeFinder:findResidentRoute,insideTest:insideMovedHouse,groundHeight:walkHeight,spriteLoader:async()=>({clips,canvases:[{toDataURL:()=>''}]})});
for(const target of ['sleep','garden','cook','eat','wheat','pond','fire','tree','shelter','home']){
  resident.request(target);
  for(let i=0;i<8000&&resident.getState().moving;i++){resident.update(.05);const [x,y,z]=resident.getState().position;assert(y>=heightAt(x,z)+.069,'Resident under terrain');}
  assert(!resident.getState().moving,'Cannot reach '+target);assert(Math.hypot(...resident.sprite.position.toArray().map((n,i)=>n-residentNodes[target][i]))<.015,'Activity position mismatches '+target);
}
resident.request('sweep');const seen=new Set();for(let i=0;i<30000&&seen.size<sweepTargets.length;i++){resident.update(.05);if(!resident.getState().moving)seen.add(resident.getState().destination);}assert.equal(seen.size,sweepTargets.length);
console.log(`${pairs} routes, ${raySamples} terrain rays, pixel-only faces, ${roadSamples} recessed road samples, all activities and ${seen.size} sweep stops passed. Relief ${(max-min).toFixed(2)}, max block step ${maxStep.toFixed(2)}.`);

// Test actual rendered road faces: all seven materials, flush heights, full-cell tiles.
let stoneSides=0;
for(const material of roadMaterials){
 const mesh=meshes.find(m=>m.material===material);assert(mesh,'Missing road material');
 const p=mesh.geometry.attributes.position;
 for(let k=0;k<p.count;k+=6){
  const normal=mesh.geometry.attributes.normal;
  if(normal.getY(k)===0){stoneSides++;continue;}
  const x=(p.getX(k)+p.getX(k+2))/2,z=(p.getZ(k)+p.getZ(k+2))/2;
  assert(Math.abs(p.getY(k)-heightAt(x,z))<1e-6,'Road is raised above grass');
  assert.equal(Math.abs(p.getX(k)-p.getX(k+2)),cellSize);
  assert(Math.abs(Math.abs(p.getZ(k)-p.getZ(k+2))-cellSize)<1e-6,'Gap between tiles');
 }
}
assert(stoneSides>0,'Missing stone road sides');
console.log('Seven flush stone surfaces, stone road sides and gapless tiles passed.');

for(const [name,zone,x,z,w,d] of [
 ['house','home',-2,-1.675,4.9,5.65],
 ...[1.8,3.35,4.9].map(z=>['crop bed','garden',-7,z,2.66,1.3]),
 ['cart','garden',-5.5,6,1,1.8],['fence','garden',-7.2,5.9,3.2,.2],['campfire','fire',0,3.45,1.6,1.6]
]){const [dx,,dz]=propOffset(zone);assert(!overlapsRoad(x+dx,z+dz,w,d),name+' overlaps the fixed road');}
for(const name of ['gardenNorth','gardenTurn','southEast','orchard','millPath']){const [x,,z]=roadsideLamp(name);assert(!overlapsRoad(x,z,.6,.6),'Lamp overlaps road');}
console.log('Moved props clear the fixed road; indoor activities use the moved house.');
