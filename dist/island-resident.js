import * as T from './vendor/three.module.js';
import {loadSprites} from './sprites.js';
import {nodes,findRoute,chooseActivity,sweepTargets} from './life-routes.js';
import {facingRight} from './resident-facing.js';
export async function addResident({island,focusOn,getWorld,spriteLoader=loadSprites,routeNodes=nodes,routeFinder=findRoute,groundHeight=null,insideTest=null,gazeTargets={fire:[0,3.45],pond:[3,2]}}){
 const nodes=routeNodes,findRoute=routeFinder;
 const sprites=await spriteLoader();
 const sprite=new T.Sprite(new T.SpriteMaterial({map:sprites.clips[0][0],transparent:true,alphaTest:.5,depthWrite:false}));
 sprite.name='jiuhu-resident';sprite.center.set(.5,4/64);sprite.scale.set(1.55,1.78,1);sprite.position.set(...nodes.home);island.add(sprite);
 const shadow=new T.Mesh(new T.CircleGeometry(.27,24),new T.MeshBasicMaterial({color:0x263b27,transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;island.add(shadow);
 const activities={home:['0','在小屋前休息'],wheat:['3','正在给麦田除草'],tree:['5','坐在树下听风'],cook:['6','正在灶台前炒菜'],eat:['7','正在檐廊吃饭'],sleep:['8','正在床上睡觉'],pond:['11','正在池边钓鱼'],sweep:['sweep','正在打扫小岛'],shelter:['14','正在檐下躲避雨雪'],fire:['15','正在篝火旁取暖'],garden:['4','正在照料菜园']};
 let current='home',anchor='home',route=[],manual=false,dwell=0,phase=0,lastPolicy='';
 let sweepIndex=-1,sweepStops=0,destination='home';
 function planRoute(target){const first=route[0],origin=first||anchor;destination=target;route=(first?[first]:[]).concat(findRoute(origin,target));}
 function nextSweep(){sweepIndex=(sweepIndex+1)%sweepTargets.length;sweepStops++;dwell=0;phase=0;planRoute(sweepTargets[sweepIndex]);status.textContent=route.length?'正在前往下一处打扫':'正在打扫小岛';}
 const heading=new T.Vector3(-1,0,0),cameraRight=new T.Vector3();
 const mirrored=new Map();let facing=false,frame=sprites.clips[0][0];
 function updateFacing(camera){
  if(!route.length&&gazeTargets[current])heading.set(gazeTargets[current][0]-sprite.position.x,0,gazeTargets[current][1]-sprite.position.z);
  cameraRight.setFromMatrixColumn(camera.matrixWorld,0);
  facing=facingRight(heading,cameraRight,facing);
  // Fishing artwork holds the rod to the right; walking/warming artwork faces left.
  const flip=!route.length&&current==='pond'?!facing:facing;
  if(flip&&!mirrored.has(frame)){const texture=frame.clone();texture.repeat.x=-1;texture.offset.x=1;texture.needsUpdate=true;mirrored.set(frame,texture);}
  sprite.material.map=flip?mirrored.get(frame):frame;
 }
 const status=document.getElementById('resident-status'),select=document.getElementById('resident-place');
 document.getElementById('resident-portrait').src=sprites.canvases[0].toDataURL();
 function focus(){focusOn(sprite.position,current);}
 function request(key,forced=true){
  if(!activities[key])return;
  current=key;manual=forced;dwell=0;phase=0;
  // Finish the current segment before re-routing; never teleport across obstacles.
  if(key==='sweep'){sweepStops=0;nextSweep();}else planRoute(key);
  select.value=key;status.textContent=route.length?'正在前往'+select.selectedOptions[0].textContent:activities[key][1];
  document.getElementById('resident-auto').setAttribute('aria-pressed',String(!manual));
  document.getElementById('resident-mode').textContent=manual?'手动安排':'自在生活';
 }
 select.onchange=e=>{request(e.target.value);};
 document.getElementById('resident-focus').onclick=focus;
 document.getElementById('resident-auto').onclick=()=>{request(chooseActivity(getWorld()),false);};
 function update(dt){
  const world=getWorld(),policy=`${world.night}:${world.weather}:${Math.floor(world.hour)}`;
  if(dt>0&&!manual&&(policy!==lastPolicy||(current!=='sweep'&&dwell>20)||(current==='sweep'&&sweepStops>=sweepTargets.length&&!route.length&&dwell>6))){
   const urgent=world.night||world.weather==='rain'||world.weather==='snow'||(world.hour>=12&&world.hour<14);
   const continueSweeping=current==='sweep'&&!urgent&&sweepStops<sweepTargets.length;
   const next=continueSweeping?'sweep':chooseActivity(world);if(next!==current||(!continueSweeping&&dwell>6))request(next,false);lastPolicy=policy;
  }
  if(dt>0&&current==='sweep'&&!route.length&&dwell>=6)nextSweep();
  const moving=route.length>0;
  if(moving&&dt>0){
   let travel=dt*1.15;
   while(route.length&&travel>0){
    const target=new T.Vector3(...nodes[route[0]]),distance=groundHeight?Math.hypot(sprite.position.x-target.x,sprite.position.z-target.z):sprite.position.distanceTo(target),step=Math.min(travel,distance);phase+=step*7;travel-=step;
    if(step>0){heading.copy(target).sub(sprite.position);heading.y=0;}
    if(distance<=step+.00001){sprite.position.copy(target);anchor=route.shift();}else sprite.position.lerp(target,step/distance);
   }
   if(!route.length){dwell=0;phase=0;status.textContent=activities[current][1];}
  }else if(!moving){dwell+=dt;phase+=dt*(current==='sweep'?5:current==='sleep'?1.2:2);}
  if(groundHeight)sprite.position.y=groundHeight(sprite.position.x,sprite.position.z,sprite.position.y);
  const key=route.length?'walk':activities[current][0],clip=sprites.clips[key]||sprites.clips[0];
  frame=clip[Math.floor(phase)%clip.length];sprite.material.map=frame;sprite.scale.set(key==='walk'?1.48:current==='sleep'?1.7:1.55,key==='walk'?1.70:current==='sleep'?1.55:1.78,1);
  sprite.material.color.set(world.night?0xb8c6d8:0xffffff);shadow.position.set(sprite.position.x,sprite.position.y-.015,sprite.position.z);shadow.visible=!(current==='sleep'&&!route.length);
 }
 status.textContent=activities.home[1];update(0);
 return {sprite,request,focus,update,updateFacing,getState:()=>({activity:current,destination,sweepStops,facingRight:facing,heading:heading.toArray(),manual,moving:!!route.length,route:[...route],position:sprite.position.toArray()}),isInside:()=>insideTest?insideTest(sprite.position):sprite.position.z<-.5&&sprite.position.z>-4&&sprite.position.x>-4.2&&sprite.position.x<.2};
}
