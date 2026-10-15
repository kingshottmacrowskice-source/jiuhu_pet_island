import * as T from './vendor/three.module.js';
import {createLife} from './island-life.js';
import {createAtmosphere} from './island-atmosphere.js';
import {addResident} from './island-resident.js';
import {edges} from './life-routes.js';
import {heightAt,dreamNodes,makeRouteFinder,insideHouse} from './dream-layout.js';
import {cameraDefaults,cameraSettings} from './camera-settings.js';
import {buildDreamBlocks} from './dream-blocks.js';
import {createPostFX} from './island-postfx.js';

const canvas=document.getElementById('world'),scene=new T.Scene();scene.background=new T.Color('#d7e5e9');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const camera=new T.PerspectiveCamera(36,1,.1,250),island=new T.Group(),shell=new T.Group();island.name='dream-garden-island';scene.add(island);island.add(shell);
const ambient=new T.HemisphereLight(0xe9f4ff,0x5a3a28,1.8),sun=new T.DirectionalLight(0xffefd9,1.6);sun.position.set(-15,28,18);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:90});sun.shadow.normalBias=.04;sun.shadow.bias=-.0004;scene.add(ambient,sun);
const rimLight=new T.DirectionalLight(0xb5d0ff,0.45);rimLight.position.set(8,20,-18);scene.add(rimLight);
const lamps=[],animated=[],textured=[];
const waterMat=new T.MeshStandardMaterial({color:0x62aeb8,roughness:.2,metalness:.15});
let life,resident,atmosphere,following=false,manualRoof=false,lastFrame=null,yaw=.42,pitch=.59,distance=76,settings={...cameraDefaults};const focus=new T.Vector3(0,2,0);
const views={all:[0,2,0,76],home:[-8,6,-3,30],garden:[-11,1,5,25],river:[4,1,4.8,25],mill:[8,7,-6,32],lookout:[10,3,7,24]};
function reset(){following=false;focus.set(0,2,0);yaw=T.MathUtils.degToRad(settings.yaw);pitch=T.MathUtils.degToRad(settings.pitch);distance=76*100/settings.zoom;}
window.applyIslandCameraProperties=p=>{settings=cameraSettings(p,settings);if(p.viewangle||p.viewtilt||p.zoom)reset();if(settings.locked)following=false;};window.applyIslandCameraProperties(window.islandCameraProperties||{});
function setView(name){if(settings.locked)return;following=false;const [x,y,z,d]=views[name];focus.set(x,y,z);distance=d;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
document.querySelectorAll('[data-view]').forEach(b=>{b.onclick=()=>setView(b.dataset.view);if(b.dataset.view==='mill')b.textContent='观星塔';if(b.dataset.view==='river')b.textContent='方池';});
document.querySelector('header h1').textContent='梦屿花庭';document.querySelector('header p').innerHTML='苔顶童话小屋 · 樱花与铜绿的方块庭院<br>拖动旋转与俯仰 · 滚轮或双指缩放';document.getElementById('badge').textContent='梦屿花庭 · 独立新岛';
document.getElementById('reset').onclick=()=>{if(!settings.locked)reset();};document.getElementById('roof').onclick=()=>{manualRoof=!manualRoof;document.getElementById('roof').setAttribute('aria-pressed',String(manualRoof));};
function setTextures(value){for(const m of textured){m.material.map=value?m.userData.map:null;m.material.needsUpdate=true;}document.getElementById('textured').setAttribute('aria-pressed',String(value));document.getElementById('plain').setAttribute('aria-pressed',String(!value));}
document.getElementById('textured').onclick=()=>setTextures(true);document.getElementById('plain').onclick=()=>setTextures(false);
const pointers=new Map();let pinch=0;canvas.onpointerdown=e=>{if(settings.locked)return;following=false;pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(settings.locked||!pointers.has(e.pointerId))return;const p=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const[a,b]=[...pointers.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)distance=T.MathUtils.clamp(distance+(pinch-d)*.05,12,105);pinch=d;}else{yaw-=(e.clientX-p[0])*.006;pitch=T.MathUtils.clamp(pitch+(e.clientY-p[1])*.004,.08,1.3);}};canvas.onpointerup=canvas.onpointercancel=e=>{pointers.delete(e.pointerId);pinch=0;};canvas.addEventListener('wheel',e=>{e.preventDefault();if(!settings.locked){following=false;distance=T.MathUtils.clamp(distance+e.deltaY*.02,12,105);}},{passive:false});
let postFX=null;
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(postFX)postFX.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
async function build(){const blockScene=await buildDreamBlocks({island,shell,waterMat,lamps,animated,textured});
 life=createLife({scene,ambient,sun,lamps,onNight:()=>{},rainFloor:(x,z)=>heightAt(x,z)+(insideHouse({x,z})?4.5:Math.hypot(x-8,z+6)<1.9?5.8:Math.hypot(x-10,z-7)<2.3?3.8:.05)});
 resident=await addResident({island,getWorld:()=>life.state,routeNodes:dreamNodes,routeFinder:makeRouteFinder(edges),insideTest:insideHouse,gazeTargets:{pond:[4,4.8],fire:[-.4,5]},groundHeight:(x,z,y)=>Math.abs(x+9)<.65&&z<-3.5&&z>-5.5?Math.max(y,heightAt(x,z)+.78):heightAt(x,z)+.13,focusOn:()=>{if(!settings.locked){following=!following;distance=19;document.getElementById('resident-focus').setAttribute('aria-pressed',String(following));}}});
 atmosphere=createAtmosphere({scene,renderer,sun,ambient,waterMat});
 postFX=createPostFX({renderer,scene,camera,sun,ambient});
 document.getElementById('status').remove();window.__dreamIsland={ready:true,scene,resident,life,blockScene,postFX,getState:()=>({island:'dream',world:{...life.state},resident:resident.getState()})};requestAnimationFrame(render);
}
function render(time){requestAnimationFrame(render);if(window.islandHostPaused){lastFrame=null;return;}const real=lastFrame===null?0:Math.min(.05,(time-lastFrame)*.001);lastFrame=time;const dt=life.state.paused?0:real*life.state.speed;life.update(dt);resident.update(dt);shell.visible=!(manualRoof||resident.isInside());if(following)focus.copy(resident.sprite.position).add(new T.Vector3(0,1,0));const d=distance*Math.max(1,.98/camera.aspect);camera.position.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*d,focus.y+Math.sin(pitch)*d,focus.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(focus);camera.updateMatrixWorld();resident.updateFacing(camera);animated.forEach(f=>f(life.state.elapsed));atmosphere.update(life.state);if(postFX)postFX.render();else renderer.render(scene,camera);}
build().catch(e=>{document.getElementById('status').textContent='新岛加载失败：'+e.message;console.error(e);});
