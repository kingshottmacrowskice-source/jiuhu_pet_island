import * as T from './vendor/three.module.js';
import {heightAt,clearPlantSpot} from './classic-layout.js';
import {roadsideLamp} from './classic-props.js';

// Shared voxel geometry and bounded particle pools keep the wallpaper inexpensive.
export function createSeasonScenes(island,emitters){
  const autumn=new T.Group(),winter=new T.Group(),halloween=new T.Group();
  autumn.name='autumn-leaf-carpet';winter.name='winter-snow-garden';halloween.name='halloween-lantern-festival';
  island.add(autumn,winter,halloween);
  const cube=new T.BoxGeometry(1,1,1),materials=new Map();
  function box(parent,x,y,z,w,h,d,color,glow=false){
    const key=color+':'+glow;
    if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.9,emissive:glow?color:0,emissiveIntensity:glow?2:0}));
    const m=new T.Mesh(cube,materials.get(key));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  let seed=719;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const leafColors=[0xd99032,0xbf5130,0xe7b452];
  const carpet=[[],[],[]];
  for(let i=0;i<700;i++){const x=(rand()-.5)*30,z=(rand()-.5)*24;if(clearPlantSpot(x,z))carpet[i%3].push([x,heightAt(x,z)+.035,z]);}
  const dummy=new T.Object3D();
  carpet.forEach((items,k)=>{const batch=new T.InstancedMesh(cube,new T.MeshStandardMaterial({color:leafColors[k],roughness:1}),items.length);items.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.rotation.y=rand()*Math.PI;dummy.scale.set(.15+rand()*.18,.025,.12+rand()*.16);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});batch.receiveShadow=true;autumn.add(batch);});
  // Snow caps follow the actual tree crown bounds, including the giant resting tree.
  emitters.forEach(b=>box(winter,(b.min.x+b.max.x)/2,b.max.y+.035,(b.min.z+b.max.z)/2,b.max.x-b.min.x,.09,b.max.z-b.min.z,0xeaf4fa));
  const snowman=new T.Group();const snowSpot=roadsideLamp('southEast');snowman.position.set(...snowSpot);winter.add(snowman);
  box(snowman,0,.4,0,.8,.8,.7,0xf0f6fa);box(snowman,0,1,0,.56,.5,.52,0xf0f6fa);
  box(snowman,0,1.32,0,.75,.1,.65,0x354254);box(snowman,0,1.5,0,.46,.3,.43,0x354254);
  box(snowman,0,.81,0,.64,.12,.6,0xb8423d);box(snowman,.2,.65,.37,.13,.35,.09,0xb8423d);
  for(const x of [-.14,.14])box(snowman,x,1.06,.27,.07,.07,.025,0x283243);
  box(snowman,0,.97,.36,.09,.09,.25,0xe68b36);
  for(const y of [.3,.5])box(snowman,0,y,.36,.07,.07,.025,0x283243);
  for(const x of [-.58,.58]){const arm=box(snowman,x,.64,0,.5,.06,.06,0x74503b);arm.rotation.z=x;}
  const lanterns=[];
  for(const [i,name]of ['west','north','gardenTurn','wellPath','millPath','southEast'].entries()){
    const g=new T.Group();g.position.set(...roadsideLamp(name));g.rotation.y=i*.8;halloween.add(g);
    box(g,0,.33,0,.65,.56,.6,0xd76a20);box(g,0,.64,0,.12,.15,.12,0x616534);
    for(const x of [-.16,.16])box(g,x,.42,.306,.12,.12,.025,0xffcf67,true);
    box(g,0,.21,.307,.32,.065,.025,0xffcf67,true);box(g,.1,.27,.307,.07,.07,.025,0xffcf67,true);
    const light=new T.PointLight(0xffa344,1.4,3,2);light.position.set(0,.65,.4);g.add(light);lanterns.push(light);
  }
  const ghosts=[];
  for(let i=0;i<3;i++){
    const g=new T.Group();g.position.set(-1+i*2.1,3.8+i*.45,2+i*.8);halloween.add(g);
    box(g,0,0,0,.5,.58,.35,0xe8e5f6);box(g,0,.32,0,.36,.12,.3,0xe8e5f6);
    for(const x of [-.18,0,.18])box(g,x,-.35,0,.12,.18,.32,0xe8e5f6);
    for(const x of [-.12,.12])box(g,x,.08,.18,.075,.1,.025,0x423855);
    ghosts.push({g,y:g.position.y,phase:i*2});
  }
  const bats=[];
  for(let i=0;i<5;i++){
    const g=new T.Group();halloween.add(g);box(g,0,0,0,.12,.23,.14,0x393044);
    const wings=[];for(const sign of [-1,1]){const wing=new T.Group();g.add(wing);box(wing,sign*.22,.04,0,.38,.09,.22,0x393044);box(wing,sign*.35,-.02,.06,.18,.08,.12,0x393044);wings.push(wing);}bats.push({g,wings,phase:i*1.7});
  }
  function particleMap(snow){const c=document.createElement('canvas');c.width=c.height=8;const ctx=c.getContext('2d');ctx.fillStyle=snow?'#eff8ff':'#edaa43';ctx.fillRect(3,0,2,8);ctx.fillRect(0,3,8,2);if(!snow){ctx.fillStyle='#c45c31';ctx.fillRect(1,2,5,4);}const t=new T.CanvasTexture(c);t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;return t;}
  function pool(name,count,snow){const positions=new Float32Array(count*3);function reset(i,spread){const b=emitters[i%emitters.length];const x=snow?(rand()-.5)*32:b?T.MathUtils.lerp(b.min.x,b.max.x,rand()):0,z=snow?(rand()-.5)*26:b?T.MathUtils.lerp(b.min.z,b.max.z,rand()):0;const top=snow?13:b?.max.y||8;positions.set([x,spread?heightAt(x,z)+rand()*Math.max(0,top-heightAt(x,z)):top,z],i*3);}for(let i=0;i<count;i++)reset(i,true);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));const points=new T.Points(geo,new T.PointsMaterial({map:particleMap(snow),size:snow?.17:.32,alphaTest:.5}));points.name=name;points.frustumCulled=false;island.add(points);return {points,positions,count,reset,snow};}
  const leaves=pool('autumn-falling-leaves',130,false),snow=pool('winter-soft-snowfall',300,true);let elapsed=0;
  function apply(season,festive){autumn.visible=leaves.points.visible=season==='autumn';winter.visible=snow.points.visible=season==='winter';halloween.visible=festive;}
  function update(dt){if(dt<=0)return;elapsed+=dt;for(const p of [leaves,snow]){if(!p.points.visible)continue;for(let i=0;i<p.count;i++){const j=i*3;p.positions[j]+=Math.sin(elapsed*.6+i)*dt*.13;p.positions[j+1]-=dt*(p.snow?.48:.34);p.positions[j+2]+=dt*.04;if(p.positions[j+1]<heightAt(p.positions[j],p.positions[j+2])+.05)p.reset(i,false);}p.points.geometry.attributes.position.needsUpdate=true;}
    if(halloween.visible){ghosts.forEach(({g,y,phase})=>{g.position.y=y+Math.sin(elapsed*1.3+phase)*.25;g.rotation.y=Math.sin(elapsed*.4+phase)*.45;});bats.forEach(({g,wings,phase})=>{const a=elapsed*.35+phase;g.position.set(Math.cos(a)*4,6+Math.sin(a*2)*.5,-2+Math.sin(a)*2);g.rotation.y=-a;wings.forEach((w,i)=>w.rotation.z=Math.sin(elapsed*9+phase)*.55*(i?1:-1));});lanterns.forEach((l,i)=>l.intensity=1.3+Math.sin(elapsed*3+i)*.15);}}
  return {apply,update};
}
