import * as T from './vendor/three.module.js';
import {sunDirection} from './island-sun.js';

export function timePhase(hour) {
  return hour>=4&&hour<7?'凌晨':hour>=7&&hour<17?'白天':hour>=17&&hour<20?'黄昏':'夜晚';
}

// A camera-centred sky dome avoids seams and works offline in Wallpaper Engine.
export function createSky(scene) {
  const stops=[
    [0,'#080f29','#202d51',0], [4,'#101733','#414368',0],
    [5.5,'#696b9e','#e9b7bb',.25], [7,'#72b4df','#d9e9eb',1],
    [12,'#4d9bd3','#d0e5ef',1], [17,'#789ec7','#f0d2b4',1],
    [18.5,'#675784','#ef9b78',.4], [20,'#101831','#34354f',0],
    [24,'#080f29','#202d51',0]
  ];
  const uniforms={top:{value:new T.Color()},horizon:{value:new T.Color()},day:{value:1},cloud:{value:0},clock:{value:0},sunDir:{value:new T.Vector3()}};
  const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:false,uniforms,
    vertexShader:`varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec3 direction; uniform vec3 top,horizon,sunDir; uniform float day,cloud,clock;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){
        vec3 d=normalize(direction);
        vec3 color=mix(horizon,top,smoothstep(-1.,.65,d.y));
        float solar=max(0.,dot(d,sunDir));
        float visible=smoothstep(-.012,.025,sunDir.y);
        color+=vec3(1.,.58,.25)*pow(solar,48.)*.45*visible*(1.-cloud);
        color=mix(color,mix(vec3(4.,1.4,.3),vec3(6.,4.8,3.),smoothstep(0.,.4,sunDir.y)),smoothstep(.9984,.9992,solar)*visible*(1.-cloud));
        float lunar=dot(d,-sunDir);
        // A smaller crescent distinguishes moonrise from the warm solar disk.
        vec3 moonDir=-sunDir;
        vec3 tangent=normalize(cross(moonDir,vec3(0.,1.,0.)));
        float cutout=smoothstep(.9995,.9997,dot(d,normalize(moonDir+tangent*.018)));
        float moon=smoothstep(.9993,.9995,lunar)*(1.-cutout)
          *smoothstep(.02,.15,moonDir.y)*(1.-day)*(1.-cloud);
        color=mix(color,vec3(.79,.86,1.),moon);
        vec3 grid=d*310.; vec3 cell=floor(grid);
        float star=step(.994,hash(cell))*pow(max(0.,1.-length(fract(grid)-.5)*2.),3.);
        color+=star*vec3(.82,.89,1.)*(1.-day)*(1.-cloud)*smoothstep(-1.,-.2,d.y)*2.;
        float n=noise(d*7.+vec3(clock*.003,0,0))*.65+noise(d*19.)*.35;
        float mist=smoothstep(.52-cloud*.18,.8,n)*smoothstep(-1.,-.1,d.y);
        color=mix(color,mix(vec3(.16,.2,.29),vec3(.95,.95,.94),day),mist*(.4+cloud*.45));
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const dome=new T.Mesh(new T.SphereGeometry(110,32,16),material);
  dome.name='four-phase-sky';dome.frustumCulled=false;dome.renderOrder=-1000;
  dome.onBeforeRender=(_renderer,_scene,camera)=>{dome.position.copy(camera.position);dome.updateMatrixWorld();};
  scene.add(dome);
  const a=new T.Color(),b=new T.Color(),gray=new T.Color('#8a9cae');
  function update(state){
    const hour=((state.hour%24)+24)%24;
    const i=stops.findIndex((s,j)=>j<stops.length-1&&hour>=s[0]&&hour<stops[j+1][0]);
    const left=stops[i],right=stops[i+1],t=T.MathUtils.smoothstep(hour,left[0],right[0]);
    const overcast=state.weather==='clear'?0:state.weather==='cloud'?.55:.85;
    uniforms.top.value.set(left[1]).lerp(a.set(right[1]),t);
    uniforms.horizon.value.set(left[2]).lerp(b.set(right[2]),t);
    uniforms.day.value=T.MathUtils.lerp(left[3],right[3],t);
    uniforms.top.value.lerp(gray,overcast*.35*uniforms.day.value);
    uniforms.horizon.value.lerp(gray,overcast*.55*uniforms.day.value);
    uniforms.cloud.value=overcast;uniforms.clock.value=state.elapsed;
    sunDirection(hour,uniforms.sunDir.value);
    scene.background.copy(uniforms.horizon.value);
    return uniforms.day.value;
  }
  return {update};
}
