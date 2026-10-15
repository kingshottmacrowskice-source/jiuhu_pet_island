import {nodes as originalNodes,edges} from './life-routes.js';

// Buildings keep their original proportions; only their grounds move apart.
export const zones={
  home:{offset:[-1.5,1,-1.5],bounds:[-4.8,.95,-4.5,1.95]},
  tree:{offset:[1,.5,-1.5],bounds:[2.3,3.7,-3.5,-2.4]},
  wheat:{offset:[-2,.25,1.6],bounds:[-4.95,-2.1,1.9,4.25]},
  fire:{offset:[0,.25,2],bounds:[-1.4,1.5,2.1,5]},
  garden:{offset:[-4,.75,1.2],bounds:[-8.9,-5.05,.1,6.9]},
  shed:{offset:[-4,1.25,-1],bounds:[-8.9,-5.3,-3.05,-.25]},
  mill:{offset:[-4,2,-4],bounds:[-7.4,-4.1,-6.6,-3.9]},
  pond:{offset:[3,0,.3],bounds:[.55,7.3,-3.2,3.95]},
  stream:{offset:[3,0,.3],bounds:[4.4,5.6,-12.5,-3.2]},
  lookout:{offset:[4,.75,2],bounds:[4.85,8.4,4.1,7.5]},
  well:{offset:[2,.5,3],bounds:[2.1,4.1,5.2,7.2]}
};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function worldPoint(zone,x,y,z){const [a,b,c]=zones[zone].offset;return [x+a,y+b,z+c];}
export function inIsland(x,z,margin=0){return x*x/(17-margin)**2+z*z/(14-margin)**2<=1;}
function terrainField(x,z){
  let sum=.5+.25*Math.sin(x*.17+.4)*Math.cos(z*.19)+.35*Math.exp(-((x+7)**2+(z+9)**2)/65),weight=1;
  for(const {offset:[dx,y,dz],bounds:[a,b,c,d]} of Object.values(zones)){
    const distance=Math.hypot(Math.max(a+dx-x,0,x-b-dx),Math.max(c+dz-z,0,z-d-dz));
    if(distance<1e-8)return y;
    const w=4*(1-smooth(distance/4.5))/distance**1.6;
    sum+=y*w;weight+=w;
  }
  return Math.max(0,Math.min(2.25,sum/weight));
}
export const cellSize=.5,terraceStep=.25,roadDepth=.125;
export const roadWidth=1.5;
export function cellCenter(x,z){return [Math.floor(x/cellSize)*cellSize+cellSize/2,Math.floor((z-.3)/cellSize)*cellSize+.3+cellSize/2];}
const heightCache=new Map();
export function baseHeightAt(x,z){[x,z]=cellCenter(x,z);const key=`${x},${z}`;if(!heightCache.has(key))heightCache.set(key,Math.round(terrainField(x,z)/terraceStep)*terraceStep);return heightCache.get(key);}
export const streamCells=new Set(['5,1','5,0','6,0','6,-1','6,-2','6,-3','5,-3','5,-4','5,-5','5,-6','5,-7','5,-8','5,-9','5,-10','5,-11','5,-12']);
export function isWater(x,z){
  x-=zones.pond.offset[0];z-=zones.pond.offset[2];
  return (x>1.5&&x<4.5&&z>.5&&z<3.5)||streamCells.has(`${Math.floor(x+.5)},${Math.floor(z+.5)}`);
}
const nodeZones={home:'home',hub:'home',west:'home',wheatEntry:'wheat',wheat:'wheat',firePath:'fire',fire:'fire',north:'home',pond:'pond',turn:'tree',treePath:'tree',tree:'tree',step:'home',porch:'home',door:'home',inside:'home',cook:'home',bedPath:'home',bedFoot:'home',sleep:'home',eat:'home',sweep:'home',shelter:'home',south:'fire',gardenTurn:'wheat',gardenCorner:'garden',gardenApproach:'garden',garden:'garden',gardenNorth:'garden',shedPath:'shed',millPath:'mill',bridgeApproach:'pond',bridgeWest:'pond',bridgeCenter:'pond',bridgeEast:'pond',orchard:'pond',southEast:'fire',wellPath:'well',lookoutEntry:'lookout',lookout:'lookout'};
export const classicNodes=Object.fromEntries(Object.entries(originalNodes).map(([key,p])=>[key,worldPoint(nodeZones[key],...p)]));
// Long connecting walks bend around the crop beds, the house and the water.
for(const [name,x,z] of [['west',-3.2,1.2],['wheatEntry',-4.05,4.4],['gardenTurn',-6.9,7.4],['gardenCorner',-8.7,7.4],['gardenApproach',-9.25,5.9],['gardenNorth',-9.35,1],['shedPath',-9.1,-4.5],['millPath',-8.5,-8.15],['north',.2,1.7],['turn',1.6,-1.55],['southEast',2.8,7.4],['wellPath',7.6,7.3]])classicNodes[name]=[x,baseHeightAt(x,z)+.07,z];
export function findClassicRoute(from,to){
  const queue=[from],previous=new Map([[from,null]]);
  for(let i=0;i<queue.length;i++){const at=queue[i];if(at===to)break;for(const [a,b]of edges){const next=a===at?b:b===at?a:null;if(next&&!previous.has(next)){previous.set(next,at);queue.push(next);}}}
  if(!previous.has(to))throw Error('No classic island route');
  const path=[];for(let at=to;at!==from;at=previous.get(at))path.unshift(at);return path;
}
export const indoorNodes=new Set(['step','porch','door','inside','cook','bedPath','bedFoot','sleep','eat','sweep','shelter']);
export const bridgeNodes=new Set(['bridgeWest','bridgeCenter','bridgeEast']);
export const roadEdges=edges.filter(([a,b])=>!indoorNodes.has(a)&&!indoorNodes.has(b)&&a!=='wheat'&&b!=='wheat'&&!(bridgeNodes.has(a)&&bridgeNodes.has(b)));
export function isRoad(x,z,width=roadWidth){
  [x,z]=cellCenter(x,z);
  if(isWater(x,z)||x>3.5&&x<4.8&&z>1.2&&z<2.8)return false;
  // Preserve the timber floor at the lookout and the raised cottage entrance.
  if(x>8.85&&x<12.4&&z>6.5&&z<9.5||x>-5.7&&x<-1.3&&z<.25&&z>-5.5)return false;
  return roadEdges.some(([a,b])=>{const p=classicNodes[a],q=classicNodes[b],dx=q[0]-p[0],dz=q[2]-p[2],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-p[0]-t*dx,z-p[2]-t*dz)<width/2;});
}
export function heightAt(x,z){return baseHeightAt(x,z)-(isRoad(x,z)?roadDepth:0);}
for(const [name,p]of Object.entries(classicNodes))if(!indoorNodes.has(name)&&!bridgeNodes.has(name)&&!['pond','lookout','lookoutEntry'].includes(name))p[1]=heightAt(p[0],p[2])+.07;
const nodeLifts=Object.fromEntries(Object.entries(classicNodes).map(([key,p])=>[key,p[1]-heightAt(p[0],p[2])]));
export function walkHeight(x,z){
  let nearest=Infinity,lift=.07;
  for(const [a,b]of edges){const p=classicNodes[a],q=classicNodes[b],dx=q[0]-p[0],dz=q[2]-p[2],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[2])*dz)/(dx*dx+dz*dz||1))),distance=Math.hypot(x-p[0]-t*dx,z-p[2]-t*dz);
    if(distance<nearest){nearest=distance;lift=nodeLifts[a]*(1-t)+nodeLifts[b]*t;}}
  return heightAt(x,z)+Math.max(.07,lift);
}
export const insideHouse=p=>p.x>-5.7&&p.x<-1.3&&p.z>-5.5&&p.z<-2;
export function clearPlantSpot(x,z){
  if(!inIsland(x,z,1)||isWater(x,z))return false;
  for(const {offset:[dx,,dz],bounds:[a,b,c,d]}of Object.values(zones))if(x>a+dx-.35&&x<b+dx+.35&&z>c+dz-.35&&z<d+dz+.35)return false;
  for(const [a,b]of edges){const p=classicNodes[a],q=classicNodes[b],dx=q[0]-p[0],dz=q[2]-p[2],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[2])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-p[0]-t*dx,z-p[2]-t*dz)<roadWidth/2+.2)return false;}
  return true;
}
