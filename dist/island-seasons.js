import * as T from './vendor/three.module.js';
import {createSeasonScenes} from './season-scenes.js';
import {heightAt} from './classic-layout.js';

// Four seasons, three island days each; the festival is an independent overlay.
export function createSeasons({island,maps,meshes,plants,meadow}){
  const state={current:'summer',auto:false,age:0,halloween:false},duration=1440;
  let textured=true;
  // Recolour the source with a full-strength luminance ramp; do not flatten its texture contrast.
  const grassCanvas=document.createElement('canvas');
  grassCanvas.width=maps.grass_block_top.image.width;grassCanvas.height=maps.grass_block_top.image.height;
  const grassContext=grassCanvas.getContext('2d');grassContext.drawImage(maps.grass_block_top.image,0,0);
  const grassPixels=grassContext.getImageData(0,0,grassCanvas.width,grassCanvas.height);
  for(let i=0;i<grassPixels.data.length;i+=4){
    const luminance=(grassPixels.data[i]*.2126+grassPixels.data[i+1]*.7152+grassPixels.data[i+2]*.0722)/255;
    const shade=Math.min(1,luminance+.16);
    grassPixels.data[i]=181*shade;grassPixels.data[i+1]=245*shade;grassPixels.data[i+2]=190*shade;
  }
  grassContext.putImageData(grassPixels,0,0);
  const springGrass=new T.CanvasTexture(grassCanvas);springGrass.colorSpace=T.SRGBColorSpace;
  springGrass.magFilter=T.NearestFilter;springGrass.minFilter=T.LinearMipmapLinearFilter;
  springGrass.wrapS=springGrass.wrapT=T.RepeatWrapping;springGrass.anisotropy=maps.grass_block_top.anisotropy;
  const leaves=[],grass=[],hidden=new Set(plants.filter(p=>!p.userData.preserveSummerPlant)),anchors=[],emitters=[];
  island.updateMatrixWorld(true);
  const bounds=new T.Box3(),matrix=new T.Matrix4();
  const addAnchor=(x,y,z)=>{if(!anchors.some(p=>Math.hypot(x-p.x,z-p.z)<.36&&Math.abs(y-p.y)<.5))anchors.push({x,y,z});};
  for(const p of meadow)addAnchor(p.x,heightAt(p.x,p.z)+.03,p.z);
  for(const plant of plants){
    if(!plant.userData.seasonPlant)continue;
    const p=plant.getWorldPosition(new T.Vector3());addAnchor(p.x,p.y+.03,p.z);
  }
  for(const mesh of meshes){
    const mat=mesh.userData.textured;if(!mat||Array.isArray(mat))continue;
    if(mesh.userData.seasonPlant){
      hidden.add(mesh);mesh.geometry.computeBoundingBox();
      for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1);i++){
        if(mesh.isInstancedMesh){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);}else matrix.copy(mesh.matrixWorld);
        bounds.copy(mesh.geometry.boundingBox).applyMatrix4(matrix);
        const base=mesh.userData.seasonBaseY;
        const y=base===undefined?heightAt((bounds.min.x+bounds.max.x)/2,(bounds.min.z+bounds.max.z)/2):base+mesh.parent.getWorldPosition(new T.Vector3()).y;
        if(!mesh.userData.onlyPlain)addAnchor((bounds.min.x+bounds.max.x)/2,y+.03,(bounds.min.z+bounds.max.z)/2);
      }
    }
    if(mat.map===maps.oak_leaves&&!mesh.userData.preserveSummerPlant){
      leaves.push({mesh,mat,map:mat.map,color:mat.color.clone(),plain:mesh.userData.plain.color.clone()});
      if(!hidden.has(mesh)){
        bounds.setFromObject(mesh);
        if(bounds.max.y>2.5)emitters.push(bounds.clone());
      }
    }
    if(mesh.name==='classic-pixel-terrain'&&(mat.map===maps.grass_block_top||mat.userData.seasonGrass))
      grass.push({mesh,mat,map:mat.map,color:mat.color.clone(),plain:mesh.userData.plain.color.clone()});
  }
  const summerVisibility=new Map([...hidden].map(o=>[o,o.visible]));
  // Low four-flower clusters inspired by Pink Petals, built from horizontal voxel petals.
  const spring=new T.Group();spring.name='spring-pink-petal-clusters';island.add(spring);
  const parts=[[],[],[],[]];
  const dummy=new T.Object3D();
  anchors.forEach(({x,y,z},i)=>{
    for(let n=0;n<4;n++){
      const px=x+(n%2-.5)*.34,pz=z+(Math.floor(n/2)-.5)*.34,py=y+.045+(n%2)*.025;
      parts[0].push([px,py-.025,pz,.025,.08,.025]);
      const size=.09+(i+n)%3*.012;
      for(const [dx,dz]of [[-size/2,0],[size/2,0],[0,-size/2],[0,size/2]])
        parts[1+(i+n)%2].push([px+dx,py+.025,pz+dz,size,.035,size]);
      parts[3].push([px,py+.047,pz,.038,.018,.038]);
    }
  });
  const colors=[0x789c58,0xf7c3d6,0xe993b5,0xffedb0];
  parts.forEach((items,k)=>{
    const batch=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:colors[k],roughness:1}),items.length);
    items.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});
    batch.instanceMatrix.needsUpdate=true;batch.receiveShadow=true;spring.add(batch);
  });
  // A bounded particle pool follows the tree crowns, never the entire sky.
  const count=160,positions=new Float32Array(count*3),particles=[];
  const petalCanvas=document.createElement('canvas');petalCanvas.width=petalCanvas.height=8;
  const ctx=petalCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const pixelPetal=['........','..LL.LL.','.LPPPPP.','.LPPPPS.','..PPPSS.','..PPSS..','...SS...','........'];
  const palette={L:'#ffe4ef',P:'#f4a6c5',S:'#d875a6'};
  pixelPetal.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(palette[pixel]){ctx.fillStyle=palette[pixel];ctx.fillRect(x,y,1,1);}}));
  const petalMap=new T.CanvasTexture(petalCanvas);petalMap.colorSpace=T.SRGBColorSpace;petalMap.magFilter=petalMap.minFilter=T.NearestFilter;petalMap.generateMipmaps=false;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));
  const petals=new T.Points(geo,new T.PointsMaterial({map:petalMap,color:0xffffff,size:.4,transparent:false,alphaTest:.5,opacity:1,depthWrite:true}));
  petals.name='spring-falling-cherry-petals';petals.frustumCulled=false;island.add(petals);
  let seed=3128;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  function reset(i,spread=false){
    const b=emitters[i%emitters.length];if(!b)return;
    const x=T.MathUtils.lerp(b.min.x,b.max.x,random()),z=T.MathUtils.lerp(b.min.z,b.max.z,random());
    const top=b.max.y-.2,floor=heightAt(x,z)+.08;
    positions.set([x,spread?T.MathUtils.lerp(floor,top,random()):top,z],i*3);
    particles[i]={speed:.26+random()*.22,phase:random()*Math.PI*2};
  }
  for(let i=0;i<count;i++)reset(i,true);
  const scenes=createSeasonScenes(island,emitters);
  function recolor(source,rgb){
    const c=document.createElement('canvas');c.width=source.image.width;c.height=source.image.height;
    const ctx=c.getContext('2d');ctx.drawImage(source.image,0,0);const data=ctx.getImageData(0,0,c.width,c.height);
    for(let i=0;i<data.data.length;i+=4){const l=(data.data[i]*.2126+data.data[i+1]*.7152+data.data[i+2]*.0722)/255;for(let k=0;k<3;k++)data.data[i+k]=rgb[k]*Math.min(1,l+.2);}
    ctx.putImageData(data,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=source.anisotropy;return t;
  }
  const autumnLeaves=recolor(maps.oak_leaves,[255,160,57]),winterLeaves=recolor(maps.oak_leaves,[217,235,243]);
  const autumnGrass=recolor(maps.grass_block_top,[218,185,110]),winterGrass=recolor(maps.grass_block_top,[245,250,255]);
  const order=['spring','summer','autumn','winter'];
  const controls=document.createElement('div');controls.style.cssText='display:flex;align-items:center;gap:6px;margin-top:9px;flex-wrap:wrap';
  const label=document.createElement('span');label.textContent='季节';label.style.fontSize='11px';controls.append(label);
  const buttons={};
  for(const [i,name]of order.entries()){const b=document.createElement('button');b.id='season-'+name;b.textContent=['春 · 樱花','夏 · 绿荫','秋 · 金叶','冬 · 初雪'][i];b.onclick=()=>setSeason(name);buttons[name]=b;controls.append(b);}
  const autoButton=document.createElement('button'),festivalButton=document.createElement('button');autoButton.id='season-auto';festivalButton.id='season-halloween';controls.append(autoButton,festivalButton);document.querySelector('.life-controls').append(controls);
  const note=document.createElement('small');note.textContent='四季自动更替：每季 3 个小岛日 · 万圣节可与任意季节搭配';controls.after(note);
  function apply(value=textured){
    textured=value;const isSpring=state.current==='spring',isAutumn=state.current==='autumn',isWinter=state.current==='winter';
    for(const item of leaves){
      const {mesh,mat,map,color,plain}=item;mat.map=isSpring?maps.cherry_leaves:isAutumn?autumnLeaves:isWinter?winterLeaves:map;mat.color.copy(state.current!=='summer'?new T.Color(0xffffff):color);mat.needsUpdate=true;
      mesh.userData.plain.color.copy(isSpring?new T.Color(0xeeb4cc):isAutumn?new T.Color(0xe6a044):isWinter?new T.Color(0xd9ebf3):plain);
      for(const depth of [mesh.customDepthMaterial,mesh.customDistanceMaterial])if(depth){depth.map=mat.map;depth.needsUpdate=true;}
    }
    for(const {mesh,mat,map,color,plain}of grass){mat.map=isSpring?springGrass:isAutumn?autumnGrass:isWinter?winterGrass:map;mat.color.copy(state.current!=='summer'?new T.Color(0xffffff):color);mat.needsUpdate=true;mesh.userData.plain.color.copy(isSpring?new T.Color(0xa6e2af):isAutumn?new T.Color(0xc9af75):isWinter?new T.Color(0xeaf3fa):plain);}
    for(const object of hidden)object.visible=!isSpring&&!isWinter&&(object.userData.onlyPlain?!textured:plants.includes(object)?textured:summerVisibility.get(object));
    spring.visible=petals.visible=isSpring;
    scenes.apply(state.current,state.halloween);
    for(const [name,button]of Object.entries(buttons)){const active=state.current===name;button.setAttribute('aria-pressed',String(active));button.style.background=active?'#365947':'';button.style.color=active?'#ffffff':'';}
    for(const [button,active]of [[autoButton,state.auto],[festivalButton,state.halloween]]){button.style.background=active?'#644276':'';button.style.color=active?'#ffffff':'';button.setAttribute('aria-pressed',String(active));}
    festivalButton.textContent=state.halloween?'万圣节：开':'万圣节：关';
    autoButton.setAttribute('aria-pressed',String(state.auto));autoButton.textContent=state.auto?'自动更替：开':'自动更替：关';
  }
  function setSeason(name){if(!order.includes(name))return;state.current=name;state.age=0;apply();}
  function setHalloween(value){state.halloween=Boolean(value);apply();}
  festivalButton.onclick=()=>setHalloween(!state.halloween);
  autoButton.onclick=()=>{state.auto=!state.auto;state.age=0;apply();};
  let elapsed=0;
  function update(dt){
    if(state.auto){state.age+=dt;if(state.age>=duration){const remainder=state.age%duration,turns=Math.floor(state.age/duration);setSeason(order[(order.indexOf(state.current)+turns)%order.length]);state.age=remainder;}}
    scenes.update(dt);
    if(state.current!=='spring'||dt<=0)return;elapsed+=dt;
    for(let i=0;i<count;i++){
      const p=particles[i];if(!p)continue;const j=i*3;
      positions[j]+=(.065+Math.sin(elapsed*.8+p.phase)*.11)*dt;positions[j+2]+=Math.cos(elapsed*.65+p.phase)*.08*dt;positions[j+1]-=p.speed*dt;
      if(positions[j+1]<heightAt(positions[j],positions[j+2])+.06)reset(i);
    }
    geo.attributes.position.needsUpdate=true;
  }
  apply();return {state,setSeason,setHalloween,apply,update,duration,stats:{leafMeshes:leaves.length,grassMeshes:grass.length,clusters:anchors.length,particles:count}};
}
