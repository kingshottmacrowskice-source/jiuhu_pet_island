import * as T from './vendor/three.module.js';
import {updateSun} from './island-sun.js';

// Original Three.js lighting; no Minecraft shader-pack code or assets are used.
export function createAtmosphere({scene,renderer,sun,ambient,waterMat}) {
  let enabled=true;
  const original={position:sun.position.clone(),exposure:renderer.toneMappingExposure,
    map:waterMat.map,roughness:waterMat.roughness,color:waterMat.color.clone(),ambient:ambient.color.clone(),ground:ambient.groundColor.clone()};
  const fog=new T.FogExp2(scene.background.clone(),.008);
  const warm=new T.Color('#ffaa55'),noon=new T.Color('#fff8f0'),moon=new T.Color('#c5d8ff'),duskSky=new T.Color('#ffa066');
  // Seamless, low amplitude wave normals, generated locally rather than copied from the pack.
  const size=128,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
    const normal=new T.Vector3(.23*Math.cos(u*3+v*2)+.09*Math.cos(u*7-v*4),.2*Math.cos(v*4-u*2),1).normalize();
    const i=(y*size+x)*4;data[i]=(normal.x*.5+.5)*255;data[i+1]=(normal.y*.5+.5)*255;data[i+2]=(normal.z*.5+.5)*255;data[i+3]=255;
  }
  const waves=new T.DataTexture(data,size,size);waves.wrapS=waves.wrapT=T.RepeatWrapping;
  waves.magFilter=T.LinearFilter;waves.minFilter=T.LinearMipmapLinearFilter;waves.generateMipmaps=true;waves.repeat.set(3,3);waves.needsUpdate=true;
  const button=document.getElementById('atmosphere');
  function setEnabled(value) {
    enabled=value;scene.fog=value?fog:null;waterMat.map=value?null:original.map;waterMat.normalMap=value?waves:null;waterMat.normalScale.set(.55,.55);waterMat.needsUpdate=true;
    if(!value){sun.position.copy(original.position);renderer.toneMappingExposure=original.exposure;ambient.color.copy(original.ambient);ambient.groundColor.copy(original.ground);waterMat.roughness=original.roughness;waterMat.color.copy(original.color);}
    button.textContent=value?'柔和光影：开':'柔和光影：关';button.setAttribute('aria-pressed',String(value));
  }
  button.onclick=()=>setEnabled(!enabled);
  setEnabled(true);
  function update(state) {
    if(!enabled)return;
    const elevation=Math.sin((state.hour-6)/12*Math.PI);
    const daylight=state.daylight;
    const dusk=(1-T.MathUtils.smoothstep(elevation,.08,.7))*daylight;
    const overcast=state.weather!=='clear';
    ambient.color.set('#bad7f5');ambient.groundColor.set('#7c654c');
    ambient.intensity=.5+daylight*(overcast?1.35:1.45);
    updateSun(sun,state);
    // Fog: denser at dusk/night for depth, thinner during the day for clarity.
    const fogBase=scene.background.clone();
    if(dusk>.3)fogBase.lerp(duskSky,dusk*.4);
    fog.color.copy(fogBase);
    fog.density=state.weather==='rain'?.014:state.weather==='snow'?.016:daylight>.5?.005:.009;
    renderer.toneMappingExposure=1.08+(1-daylight)*.15;
    waterMat.roughness=overcast?.32:daylight>.5?.18:.25;waterMat.color.set('#60afbb');
    waves.offset.set(state.elapsed*.012,state.elapsed*.007);
  }
  return {update,setEnabled,get enabled(){return enabled;}};
}
