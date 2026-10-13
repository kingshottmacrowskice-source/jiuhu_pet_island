import * as T from './vendor/three.module.js';

// Original Three.js lighting; no Minecraft shader-pack code or assets are used.
export function createAtmosphere({scene,renderer,sun,ambient,waterMat}) {
  let enabled=true;
  const original={position:sun.position.clone(),exposure:renderer.toneMappingExposure,
    map:waterMat.map,roughness:waterMat.roughness,color:waterMat.color.clone(),ambient:ambient.color.clone(),ground:ambient.groundColor.clone()};
  const fog=new T.FogExp2(scene.background.clone(),.008);
  const warm=new T.Color('#ffd09a'),noon=new T.Color('#fff0da'),moon=new T.Color('#b5ceff');
  const daySky=new T.Color('#c7dfea'),duskSky=new T.Color('#e6bfab'),nightSky=new T.Color('#111f36');
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
    const daylight=T.MathUtils.smoothstep(elevation,-.08,.35);
    const dusk=(1-T.MathUtils.smoothstep(elevation,.08,.7))*daylight;
    const overcast=state.weather!=='clear';
    ambient.color.set('#bad7f5');ambient.groundColor.set('#927554');
    ambient.intensity=.52+daylight*(overcast?1.05:.95);
    sun.intensity=.2+daylight*(overcast?.85:3.5);
    sun.color.copy(moon).lerp(noon,daylight).lerp(warm,dusk*.85);
    // The moon uses the same shadow light at night. Its orbit remains above the island.
    const angle=(state.hour-6)/12*Math.PI;
    sun.position.set(-Math.cos(angle)*18,12+Math.abs(Math.sin(angle))*16,12);
    scene.background.copy(nightSky).lerp(daySky,daylight).lerp(duskSky,dusk*.45);
    if(overcast)scene.background.lerp(new T.Color('#8ea6b5'),daylight*.5);
    fog.color.copy(scene.background);fog.density=state.weather==='rain'?.015:state.weather==='snow'?.018:.007;
    renderer.toneMappingExposure=1.02+(1-daylight)*.12;
    waterMat.roughness=overcast?.32:.22;waterMat.color.set('#60afbb');
    waves.offset.set(state.elapsed*.012,state.elapsed*.007);
  }
  return {update,setEnabled,get enabled(){return enabled;}};
}
