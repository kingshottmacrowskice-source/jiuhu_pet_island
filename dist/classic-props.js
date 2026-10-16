import {houseWidthScale} from './classic-house.js';
import {edges} from './life-routes.js';
import {zones,classicNodes,indoorNodes,insideHouse,heightAt,isRoad,inIsland,isWater,cellSize} from './classic-layout.js';

// Visual placement is separate from the fixed terrain and road layout.
export const homeItemShift={chimney:-.8,table:-1,bed:-1};
export const propShifts={home:[0,0,-.5],garden:[-1,0,0],fire:[1,0,0]};
export function propOffset(name){return zones[name].offset.map((v,i)=>v+(propShifts[name]?.[i]||0));}
export const residentNodes=Object.fromEntries(Object.entries(classicNodes).map(([name,p])=>[name,p.map((v,i)=>v+(indoorNodes.has(name)?propShifts.home[i]:0))]));
// Keep activity destinations aligned with the relocated furniture.
residentNodes.eat[0]+=homeItemShift.table;
for(const name of ['bedPath','bedFoot','sleep'])residentNodes[name][0]+=homeItemShift.bed;
// Activity destinations and walking access never alter the road graph.
for(const [name,x,z]of [['fire',0,5.7],['gardenGate',-10.1,2],['garden',-12,2]])residentNodes[name]=[x,heightAt(x,z)+.07,z];
const residentEdges=edges.map(([a,b])=>[a==='garden'?'gardenGate':a,b==='garden'?'gardenGate':b]).concat([['gardenGate','garden']]);
export function findResidentRoute(from,to){
  const queue=[from],previous=new Map([[from,null]]);
  for(let i=0;i<queue.length;i++){const at=queue[i];if(at===to)break;for(const [a,b]of residentEdges){const next=a===at?b:b===at?a:null;if(next&&!previous.has(next)){previous.set(next,at);queue.push(next);}}}
  if(!previous.has(to))throw Error('No resident route');
  const path=[];for(let at=to;at!==from;at=previous.get(at))path.unshift(at);return path;
}
export const insideMovedHouse=p=>insideHouse({x:.23+((p.x-propOffset('home')[0])-.23)/houseWidthScale+zones.home.offset[0],z:p.z-propShifts.home[2]});

export function overlapsRoad(x,z,w,d){
  const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2;
  for(let i=Math.floor(a/cellSize);i<=Math.floor(b/cellSize);i++)for(let j=Math.floor((c-.3)/cellSize);j<=Math.floor((e-.3)/cellSize);j++){
    const px=(i+.5)*cellSize,pz=(j+.5)*cellSize+.3;
    if(px+cellSize/2>a+1e-6&&px-cellSize/2<b-1e-6&&pz+cellSize/2>c+1e-6&&pz-cellSize/2<e-1e-6&&isRoad(px,pz))return true;
  }
  return false;
}

export function roadsideLamp(name){
  const [nx,,nz]=classicNodes[name],x=nx-.8,z=nz;
  for(let r=0;r<=3;r+=.25)for(let n=0;n<(r?16:1);n++){
    const a=n*Math.PI/8,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
    if(!inIsland(px,pz,1)||isWater(px,pz)||overlapsRoad(px,pz,.6,.6))continue;
    if(Object.keys(zones).some(key=>{const [dx,,dz]=propOffset(key),[a,b,c,d]=zones[key].bounds;return px+.3>a+dx&&px-.3<b+dx&&pz+.3>c+dz&&pz-.3<d+dz;}))continue;
    return [px,heightAt(px,pz),pz];
  }
  throw Error('No clear roadside lamp position: '+name);
}
