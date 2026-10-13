import * as T from './vendor/three.module.js';
export function createLife({scene,ambient,sun,lamps,onNight}){
 const state={hour:9,night:false,weather:'clear',weatherMode:'auto',paused:false,speed:1,elapsed:0};
 const names={clear:'晴天',cloud:'多云',rain:'下雨',snow:'下雪'};
 let weatherAge=0,lastLabel='',lastNight=null;
 const cloudRoot=new T.Group();scene.add(cloudRoot);
 const cloudMat=new T.MeshStandardMaterial({color:0xf0f2e9,transparent:true,opacity:.75,roughness:1});
 for(let i=0;i<7;i++){
  const group=new T.Group();group.position.set(-20+i*6,9+(i%3),-13-i%2*4);
  for(let j=0;j<4;j++){const mesh=new T.Mesh(new T.BoxGeometry(2.8,1+j%2*.4,2),cloudMat);mesh.position.set(j*1.7,0,j%2*.4);group.add(mesh);}
  cloudRoot.add(group);
 }
 const count=800,positions=new Float32Array(count*3),speeds=new Float32Array(count);
 for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*27;positions[i*3+1]=Math.random()*17;positions[i*3+2]=(Math.random()-.5)*23;speeds[i]=.7+Math.random()*.6;}
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
 document.getElementById('light').onclick=()=>{state.hour=state.night?9:22;update(0);};
 function update(dt){
  state.elapsed+=dt;state.hour=(state.hour+dt*.05)%24;state.night=state.hour<6||state.hour>=19;
  weatherAge+=dt;
  if(state.weatherMode==='auto'&&weatherAge>90){const choices=['clear','clear','cloud','rain','snow'];setWeather(choices[Math.floor(Math.random()*choices.length)]);}
  const daylight=T.MathUtils.smoothstep(Math.sin((state.hour-6)/12*Math.PI),-.08,.35);
  const wet=state.weather==='rain',snow=state.weather==='snow',overcast=wet||snow||state.weather==='cloud';
  const day=new T.Color(overcast?'#9aafba':'#d7e5e9'),night=new T.Color('#14253d');
  scene.background.copy(night).lerp(day,daylight);ambient.intensity=.45+daylight*(overcast?1.05:1.65);sun.intensity=.25+daylight*(overcast?.65:2.75);
  sun.color.set(daylight<.6?0xe9bb93:0xffefd9);lamps.forEach(l=>l.intensity=.7+(1-daylight)*2.3);
  stars.visible=state.night&&!overcast;cloudMat.color.set(overcast?0x8297a3:0xf0f2e9);cloudMat.opacity=overcast?.85:.45;cloudRoot.visible=!state.night||overcast;
  for(const cloud of cloudRoot.children){cloud.position.x+=dt*.09;if(cloud.position.x>26)cloud.position.x=-28;}
  precipitation.visible=snow;rain.visible=wet;precipitation.material.size=.12;precipitation.material.opacity=.85;
  if((wet||snow)&&dt){for(let i=0;i<count;i++){
   let p=i*3;positions[p+1]-=dt*(snow?1.25:12)*speeds[i];positions[p]+=dt*(snow?Math.sin(state.elapsed+i)*.3:-1.2);
   const x=positions[p],z=positions[p+2];
   const underRoof=(x>-4.6&&x<.6&&z>-4.5&&z<1.4)||(x>-8.6&&x<-5.4&&z>-3&&z<-.35);
   if(positions[p+1]<(underRoof?3:.05)){positions[p+1]=15+Math.random()*2;positions[p]=(Math.random()-.5)*27;positions[p+2]=(Math.random()-.5)*23;}
   if(positions[p]<-14)positions[p]=14;
   const j=i*6;streaks[j]=positions[p];streaks[j+1]=positions[p+1];streaks[j+2]=positions[p+2];streaks[j+3]=positions[p]+.04;streaks[j+4]=positions[p+1]+.36;streaks[j+5]=positions[p+2];
  }geo.attributes.position.needsUpdate=true;rainGeo.attributes.position.needsUpdate=true;}
  if(lastNight!==state.night){lastNight=state.night;onNight(state.night);document.body.classList.toggle('night',state.night);document.getElementById('light').textContent=state.night?'天亮':'入夜';document.getElementById('light').setAttribute('aria-pressed',String(state.night));}
  const h=String(Math.floor(state.hour)).padStart(2,'0'),m=String(Math.floor(state.hour%1*60)).padStart(2,'0');
  const label=`${state.night?'夜晚':'白天'} ${h}:${m} · ${names[state.weather]}`;
  if(label!==lastLabel){document.getElementById('world-time').textContent=label;lastLabel=label;}
 }
 function clock(){document.getElementById('system-clock').textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false});}
 if(!window.wallpaperPropertyListener){clock();setInterval(clock,1000);}update(0);
 return {state,update,setWeather};
}
