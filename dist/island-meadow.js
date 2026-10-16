import * as T from './vendor/three.module.js';
import {clearPlantSpot,heightAt} from './classic-layout.js';
export {clearPlantSpot};
export const vanillaNames=['moss_block','short_grass','tall_grass_bottom','tall_grass_top','fern','large_fern_bottom','large_fern_top','dandelion','poppy','blue_orchid','allium','azure_bluet','red_tulip','orange_tulip','white_tulip','pink_tulip','oxeye_daisy','cornflower','lily_of_the_valley','lilac_bottom','lilac_top','rose_bush_bottom','rose_bush_top','peony_bottom','peony_top','sunflower_bottom','sunflower_top','sunflower_front','sunflower_back'];

export function mossGround(maps) {
  const variants=[.24,.43,.62].map(amount=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.drawImage(maps.grass_block_top.image,0,0,128,128);
    ctx.globalCompositeOperation='multiply';ctx.fillStyle='#7da44b';ctx.fillRect(0,0,128,128);ctx.globalCompositeOperation='source-over';
    const layer=document.createElement('canvas');layer.width=layer.height=128;
    const lc=layer.getContext('2d');lc.imageSmoothingEnabled=false;lc.drawImage(maps.moss_block.image,0,0,128,128);
    const pixels=lc.getImageData(0,0,128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const u=x/128*Math.PI*2,v=y/128*Math.PI*2;
      const noise=.5+.22*Math.sin(u+Math.sin(v))+.16*Math.cos(v*2-u)+.1*Math.sin(u*5+v*3);
      pixels.data[(y*128+x)*4+3]=255*T.MathUtils.smoothstep(noise,1-amount-.18,1-amount+.18);
    }
    lc.putImageData(pixels,0,0);ctx.drawImage(layer,0,0);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.wrapS=texture.wrapT=T.RepeatWrapping;
    const mat=new T.MeshStandardMaterial({map:texture,roughness:1});mat.userData.seasonGrass=true;return mat;
  });
  const patches=[[-13,1,3],[-11,-7,2.8],[.8,-9.8,3],[12,-4.8,2.8],[7.6,10.6,2.8],[-4.8,10.1,2.7]];
  return (x,z,grass)=>{
    const strength=Math.max(...patches.map(([a,b,r])=>Math.max(0,1-Math.hypot(x-a,z-b)/r)));
    return strength>.08?variants[Math.min(2,Math.floor(strength*3))]:grass;
  };
}

export function addMeadow({island,maps,plants}) {
  let seed=419;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const batches=new Map(),placements=[];
  function place(name,x,z,size=1,tint=0xffffff){
    if(!clearPlantSpot(x,z))return;
    if(placements.some(p=>Math.hypot(x-p.x,z-p.z)<.34))return;
    placements.push({name,x,z});
    const key=name+':'+tint;if(!batches.has(key))batches.set(key,{name,tint,items:[]});
    batches.get(key).items.push({x,z,size,angle:random()*Math.PI});
  }
  const patches=[[-14,1.6,1.2],[-10,8.8,1.5],[-6.4,-10.3,1.5],[-2.2,-9.7,1.8],[1,-10,1.5],[11.6,-6.8,1.5],[14,.5,1.2],[13.8,3,1],[-4.5,10.4,1.7],[.6,10.7,1.5],[6.4,11.5,1],[-7.8,-.3,1],[1,4,1.1],[2,-7.3,1.2]];
  patches.forEach(([x,z,r],i)=>{
    for(let n=0;n<8;n++){const a=random()*Math.PI*2,d=Math.sqrt(random())*r;place(n<5?'short_grass':i%3===0?'fern':'tall_grass',x+Math.cos(a)*d,z+Math.sin(a)*d,n<5?.48+random()*.27:.72+random()*.18,0x86aa55);}
  });
  const flowers=['dandelion','poppy','blue_orchid','allium','azure_bluet','red_tulip','orange_tulip','white_tulip','pink_tulip','oxeye_daisy','cornflower','lily_of_the_valley'];
  flowers.forEach((name,i)=>{
    const [x,z,r]=patches[i%patches.length];
    let count=0;for(let n=0;n<28&&count<3;n++){const before=placements.length;place(name,x+(random()-.5)*r*2,z+(random()-.5)*r*2,.55+random()*.18);if(placements.length>before)count++;}
  });
  for(const[name,x,z]of [['lilac',-4.2,-6.4],['rose_bush',-8.8,-3.5],['peony',3.5,-6.9],['sunflower',-6.2,6.5],['sunflower',-5.5,7],['large_fern',7.4,-6]])place(name,x,z,.85,name==='large_fern'?0x86aa55:0xffffff);
  const geometry=new T.PlaneGeometry(1,1),dummy=new T.Object3D();
  for(const {name,tint,items}of batches.values()){
    let texture=maps[name],tall=false;
    if(!texture){
      tall=true;const c=document.createElement('canvas');c.width=16;c.height=32;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
      ctx.drawImage(maps[name+'_top'].image,0,0,16,16);ctx.drawImage(maps[name+'_bottom'].image,0,16,16,16);
      texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;
    }
    const mat=new T.MeshStandardMaterial({map:texture,color:tint,alphaTest:.45,side:T.DoubleSide,roughness:1});
    const mesh=new T.InstancedMesh(geometry,mat,items.length*2);mesh.name='meadow-'+name;mesh.castShadow=mesh.receiveShadow=true;
    items.forEach(({x,z,size,angle},i)=>{for(let side=0;side<2;side++){
      dummy.position.set(x,heightAt(x,z)+.015+size*(tall?1:.5),z);dummy.scale.set(size,size*(tall?2:1),1);dummy.rotation.set(0,angle+side*Math.PI/2,0);dummy.updateMatrix();mesh.setMatrixAt(i*2+side,dummy.matrix);
    }});mesh.instanceMatrix.needsUpdate=true;island.add(mesh);plants.push(mesh);
    if(name==='sunflower')for(const{x,z,size}of items){
      const head=new T.Mesh(new T.PlaneGeometry(size*.9,size*.9),new T.MeshStandardMaterial({map:maps.sunflower_front,alphaTest:.45,side:T.DoubleSide,roughness:1}));
      head.position.set(x,heightAt(x,z)+size*1.65,z+.05);head.rotation.x=-.15;head.castShadow=true;island.add(head);plants.push(head);
    }
  }
  return placements;
}
