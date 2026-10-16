import * as T from './vendor/three.module.js';
import {updateSun} from './island-sun.js';
import {createSky,timePhase} from './island-sky.js';
export function createLife({scene,ambient,sun,lamps,onNight,rainFloor=null,weatherBounds=[27,23]}){
 const state={hour:9,night:false,weather:'clear',weatherMode:'auto',paused:false,speed:1,elapsed:0};
 const sky=createSky(scene);
 const moonLight=new T.DirectionalLight('#b5ceff',0);
 moonLight.name='moonlight';scene.add(moonLight);
 const names={clear:'晴天',cloud:'多云',rain:'下雨',snow:'下雪'};
 let weatherAge=0,lastLabel='',lastNight=null;
 const count=800,positions=new Float32Array(count*3),speeds=new Float32Array(count);
 for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*weatherBounds[0];positions[i*3+1]=Math.random()*17;positions[i*3+2]=(Math.random()-.5)*weatherBounds[1];speeds[i]=.7+Math.random()*.6;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));
 const particleCanvas=document.createElement('canvas');particleCanvas.width=particleCanvas.height=16;const ctx=particleCanvas.getContext('2d');ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8,8,6,0,Math.PI*2);ctx.fill();
 const particleMap=new T.CanvasTexture(particleCanvas);
 const precipitation=new T.Points(geo,new T.PointsMaterial({map:particleMap,color:0xc9e5f0,size:.08,transparent:true,opacity:.75,depthWrite:false}));precipitation.frustumCulled=false;scene.add(precipitation);
 const streaks=new Float32Array(count*6),rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(streaks,3));
 const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xbcd6e4,transparent:true,opacity:.5,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
 const starsPos=[];for(let i=0;i<240;i++){const a=Math.random()*Math.PI*2,r=40+Math.random()*20;starsPos.push(Math.cos(a)*r,15+Math.random()*35,Math.sin(a)*r);}
 const stars=new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(starsPos,3)),new T.PointsMaterial({color:0xffefcd,size:.11,transparent:true,opacity:.8}));scene.add(stars);
 function setWeather(weather){state.weather=weather;weatherAge=0;}
 document.getElementById('weather').onchange=e=>{state.weatherMode=e.target.value;setWeather(state.weatherMode==='auto'?'clear':state.weatherMode);};
 document.getElementById('speed').onchange=e=>{state.speed=Number(e.target.value);};
 document.getElementById('pause').onclick=()=>{state.paused=!state.paused;document.getElementById('pause').textContent=state.paused?'继续':'暂停';document.getElementById('pause').setAttribute('aria-pressed',String(state.paused));};
 document.getElementById('light').onclick=()=>{const hours={凌晨:9,白天:18,黄昏:22,夜晚:5.5};state.hour=hours[timePhase(state.hour)];update(0);};
 function update(dt){
  state.elapsed+=dt;state.hour=(state.hour+dt*.05)%24;state.night=state.hour<6||state.hour>=19;
  weatherAge+=dt;
  if(state.weatherMode==='auto'&&weatherAge>90){const choices=['clear','clear','cloud','rain','snow'];setWeather(choices[Math.floor(Math.random()*choices.length)]);}
  state.phase=timePhase(state.hour);
  const daylight=sky.update(state);state.daylight=daylight;
  const wet=state.weather==='rain',snow=state.weather==='snow',overcast=wet||snow||state.weather==='cloud';
  ambient.intensity=.45+daylight*(overcast?1.05:1.65);sun.intensity=.15+daylight*(overcast?.4:1.5);
  updateSun(sun,state);
  moonLight.position.copy(sun.userData.solarDirection).multiplyScalar(-32);
  moonLight.intensity=.12*T.MathUtils.smoothstep(-sun.userData.solarDirection.y,0,.2);
  lamps.forEach(l=>l.intensity=.8+(1-daylight)*3);
  stars.visible=false;
  precipitation.visible=snow;rain.visible=wet;precipitation.material.size=.12;precipitation.material.opacity=.85;
  if((wet||snow)&&dt){for(let i=0;i<count;i++){
   let p=i*3;positions[p+1]-=dt*(snow?1.25:12)*speeds[i];positions[p]+=dt*(snow?Math.sin(state.elapsed+i)*.3:-1.2);
   const x=positions[p],z=positions[p+2];
   const underRoof=(x>-4.6&&x<.6&&z>-4.5&&z<1.4)||(x>-8.6&&x<-5.4&&z>-3&&z<-.35);
   if(positions[p+1]<(rainFloor?rainFloor(x,z):(underRoof?3:.05))){positions[p+1]=15+Math.random()*2;positions[p]=(Math.random()-.5)*weatherBounds[0];positions[p+2]=(Math.random()-.5)*weatherBounds[1];}
   if(positions[p]<-weatherBounds[0]/2)positions[p]=weatherBounds[0]/2;
   const j=i*6;streaks[j]=positions[p];streaks[j+1]=positions[p+1];streaks[j+2]=positions[p+2];streaks[j+3]=positions[p]+.04;streaks[j+4]=positions[p+1]+.36;streaks[j+5]=positions[p+2];
  }geo.attributes.position.needsUpdate=true;rainGeo.attributes.position.needsUpdate=true;}
  if(lastNight!==state.night){lastNight=state.night;onNight(state.night);document.body.classList.toggle('night',state.night);document.getElementById('light').setAttribute('aria-pressed',String(state.night));}
  const h=String(Math.floor(state.hour)).padStart(2,'0'),m=String(Math.floor(state.hour%1*60)).padStart(2,'0');
  document.getElementById('light').textContent=`${state.phase} · 切换时段`;
  const label=`${state.phase} ${h}:${m} · ${names[state.weather]}`;
  if(label!==lastLabel){document.getElementById('world-time').textContent=label;lastLabel=label;}
 }
 function clock(){document.getElementById('system-clock').textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false});}
 if(!window.wallpaperPropertyListener){clock();setInterval(clock,1000);}update(0);
 return {state,update,setWeather};
}
