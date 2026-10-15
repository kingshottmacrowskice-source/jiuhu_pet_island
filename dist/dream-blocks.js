import * as T from './vendor/three.module.js';
import {heightAt,dreamNodes,insideHouse} from './dream-layout.js';
import {edges} from './life-routes.js';

// Minecraft block palette and axis-aligned full blocks, slabs and stair pairs.
// The supplied dwarf cottage is a style reference, not an imported schematic.
export async function buildDreamBlocks({island,shell,waterMat,lamps,animated,textured}){
 const names=['sandstone','cut_sandstone','calcite','bricks','mossy_stone_bricks','purpur_block','purpur_pillar','prismarine_bricks','dark_prismarine','oxidized_cut_copper','weathered_cut_copper','cherry_planks','cherry_log','cherry_leaves','pink_terracotta','white_terracotta','light_blue_terracotta','red_concrete','quartz_block_side','stripped_birch_log','stripped_oak_log','green_terracotta','lime_terracotta','moss_block','dirt','stone','oak_planks','spruce_planks','oak_leaves','grass_block_side','grass_block_top','cyan_stained_glass','short_grass'];
 const maps={},materials={},geos=new Map(),staticMeshes=[];
 await Promise.all(names.map(async n=>{const t=await new T.TextureLoader().loadAsync(`./textures-pixlli/${n}.png`);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;t.wrapS=t.wrapT=T.RepeatWrapping;maps[n]=t;materials[n]=new T.MeshStandardMaterial({map:t,roughness:.9,alphaTest:n.includes('leaves')||n==='short_grass'?.4:0,side:n.includes('leaves')||n==='short_grass'?T.DoubleSide:T.FrontSide});}));
 materials.short_grass.color.setHex(0x83a55f);materials.oak_leaves.color.setHex(0x7fa359);materials.grass_block_top.color.setHex(0x88ae66);
 materials.cyan_stained_glass.emissive.setHex(0xffc36a);materials.cyan_stained_glass.emissiveIntensity=.22;
 const glow=new T.MeshStandardMaterial({color:0xffd99b,emissive:0xffb65b,emissiveIntensity:.8});
 function box(x,y,z,w,h,d,type,parent=island,dynamic=false){
  const key=[w,h,d].join(',');if(!geos.has(key)){const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv,sizes=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*sizes[f][0]*2,uv.getY(i)*sizes[f][1]*2);}geos.set(key,g);}
  const m=new T.Mesh(geos.get(key),typeof type==='string'?materials[type]:type);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);if(!dynamic)staticMeshes.push(m);return m;
 }
 const block=(x,y,z,type,parent=island)=>box(x,y+.25,z,.5,.5,.5,type,parent);
 const slab=(x,y,z,type,parent=island)=>box(x,y+.125,z,.5,.25,.5,type,parent);
 function stair(x,y,z,type,direction,parent=island){slab(x,y,z,type,parent);const dx=direction==='east'?.125:direction==='west'?-.125:0,dz=direction==='south'?.125:direction==='north'?-.125:0;box(x+dx,y+.375,z+dz,dx?.25:.5,.25,dz?.25:.5,type,parent);}
 const terrain=new Map();
 for(let x=-18;x<18;x++)for(let z=-14;z<14;z++){
  if(((x+.5)/18)**2+((z+.5)/14)**2>1)continue;
  const y=heightAt(x+.5,z+.5);terrain.set(`${x},${z}`,y);
  const top=(x*13+z*7)%5===0?'moss_block':'grass_block_top';
  const faces=[materials.grass_block_side,materials.grass_block_side,materials[top],materials.dirt,materials.grass_block_side,materials.grass_block_side];
  box(x+.5,y-.5,z+.5,1,1,1,faces);
  // Exposed voxel columns and a stepped taper below the island.
  for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){const outer=((x+.5+dx)/18)**2+((z+.5+dz)/14)**2>1;const low=outer?-2:heightAt(x+.5+dx,z+.5+dz);if(low<y-1)box(x+.5,y-1-(y-1-low)/2,z+.5,1,y-1-low,1,'dirt');}
  const edge=((x+.5)/18)**2+((z+.5)/14)**2;
  if(edge>.8)box(x+.5,-2.5,z+.5,1,1,1,(x+z)%4?'stone':'mossy_stone_bricks');
  if(edge<.86&&edge>.6)box(x+.5,-3.5,z+.5,1,1,1,'stone');
  if(edge<.64&&edge>.38)box(x+.5,-4.5,z+.5,1,1,1,'stone');
  if(edge<.4&&edge>.15)box(x+.5,-5.5,z+.5,1,1,1,'stone');
  if(edge<.17)box(x+.5,-6.5,z+.5,1,1,1,'stone');
 }
 // Half-block paving follows the same terraces used by the resident.
 const paving=new Set();
 for(const [a,b]of edges){const p=dreamNodes[a],q=dreamNodes[b];if(insideHouse({x:p[0],z:p[2]})||insideHouse({x:q[0],z:q[2]}))continue;const count=Math.ceil(Math.hypot(q[0]-p[0],q[2]-p[2])*4);for(let i=0;i<=count;i++){const x=Math.round((p[0]+(q[0]-p[0])*i/count)*2)/2,z=Math.round((p[2]+(q[2]-p[2])*i/count)*2)/2,key=`${x},${z}`;if(paving.has(key))continue;paving.add(key);box(x,heightAt(x,z)+.04,z,.52,.08,.52,i%7===0?'mossy_stone_bricks':'cut_sandstone');}}
 function lantern(x,y,z,parent=island){box(x,y,z,.2,.3,.2,glow,parent);box(x,y+.2,z,.28,.1,.28,'spruce_planks',parent);box(x,y-.2,z,.28,.1,.28,'spruce_planks',parent);box(x,y+.38,z,.06,.28,.06,'spruce_planks',parent);const l=new T.PointLight(0xffd09a,1.2,7,2);l.position.set(x,y,z);parent.add(l);lamps.push(l);}
 function mushroom(x,y,z,s=1,parent=island){box(x,y+.5*s,z,.25*s,1*s,.25*s,'calcite',parent);box(x,y+1.05*s,z,1.2*s,.3*s,1.2*s,'red_concrete',parent);box(x,y+1.3*s,z,.8*s,.2*s,.8*s,'red_concrete',parent);for(const [dx,dz]of [[-.35,-.35],[.35,.35],[-.35,.35]])box(x+dx*s,y+1.21*s,z+dz*s,.2*s,.025*s,.2*s,'quartz_block_side',parent);box(x,y+1.41*s,z,.2*s,.02*s,.2*s,'quartz_block_side',parent);}
 function flower(x,y,z,color='cherry_planks'){box(x,y+.18,z,.04,.35,.04,'green_terracotta');box(x,y+.38,z,.22,.08,.12,color);box(x,y+.38,z,.12,.08,.22,color);box(x,y+.44,z,.07,.04,.07,'sandstone');}
 function roof(cx,z,y,width,depth,palette,parent=shell){
  // Steep storybook gable, with a curled eave on both sides.
  const half=width/2,profile=[];for(let i=0;i<=width;i++){const x=cx+(i-half)*.5,edge=Math.abs(i-half);let rise=(half-edge)*.5;if(edge===half)rise=.5;if(edge===half-1)rise=.25;profile.push([x,rise]);}
  for(let j=0;j<=depth;j++){const zz=z+j*.5;for(let i=0;i<profile.length;i++){const [x,rise]=profile[i];const trim=j===0||j===depth;const type=trim?'oak_planks':palette[(i*3+j*7)%palette.length];stair(x,y+rise,zz,type,i<=half?'east':'west',parent);}}
  return profile;
 }
 const hy=heightAt(-8,-4);
 // Sandstone-and-calcite cottage, moss roof and projecting upper gable.
 box(-8,hy+.06,-4,5.5,.12,4.5,'oak_planks');
 for(let x=-10.5;x<=-5.5;x+=.5)for(let y=0;y<3;y+=.5){block(x,hy+y,-6,'sandstone',shell);if(x<-7.5||x>-6.5){if(!(x>=-9.5&&x<=-8.5&&y>=1&&y<2))block(x,hy+y,-2,((x*2+y*2)%3===0?'calcite':'sandstone'),shell);}}
 for(const x of [-10.5,-5.5])for(let z=-5.5;z<-2;z+=.5)for(let y=0;y<3;y+=.5)block(x,hy+y,z,y<.5?'mossy_stone_bricks':'calcite',shell);
 for(const x of [-10.5,-7.5,-5.5])box(x,hy+1.5,-1.72,.22,3,.22,'stripped_birch_log',shell);
 box(-9,hy+1.5,-1.74,1.4,1,.12,'cyan_stained_glass',shell);for(const x of [-9.75,-8.25])box(x,hy+1.5,-1.65,.22,1.2,.2,'cherry_planks',shell);box(-9,hy+1.5,-1.59,.09,1.2,.12,'oak_planks',shell);box(-9,hy+.93,-1.5,1.7,.25,.45,'cherry_planks',shell);for(let i=0;i<5;i++)flower(-9.6+i*.3,hy+1.1,-1.48);
 // Frame the open doorway; resident routes continue through it.
 for(const x of [-7.6,-6.4])box(x,hy+1,-1.66,.22,2,.26,'spruce_planks',shell);box(-7,hy+2.15,-1.66,1.45,.3,.3,'spruce_planks',shell);
 const profile=roof(-8,-6.75,hy+2.8,14,11,['moss_block','moss_block','green_terracotta','lime_terracotta']);
 for(const [x,rise]of profile){if(x<-10.5||x>-5.5)continue;for(let h=0;h<rise;h+=.5){if(Math.abs(x+8)<.65&&h>1&&h<2.5)continue;block(x,hy+3+h,-1.75,(Math.round(x*2+h*2)%4===0?'cut_sandstone':'calcite'),shell);}}
 box(-8,hy+4.8,-1.48,1.1,1.3,.12,'cyan_stained_glass',shell);box(-8,hy+4.8,-1.35,.1,1.5,.12,'cherry_planks',shell);box(-8,hy+4.1,-1.25,1.7,.25,.7,'cherry_planks',shell);for(const x of [-8.65,-7.35])box(x,hy+4.45,-.96,.1,.6,.1,'oak_planks',shell);box(-8,hy+4.75,-.96,1.4,.1,.1,'oak_planks',shell);lantern(-8,hy+5.85,-1.28,shell);
 // Side dormer, chimney dog-leg, roof garden and spotted mushrooms.
 box(-5.25,hy+3.4,-4.3,1.2,1.6,1.8,'pink_terracotta',shell);box(-4.6,hy+3.55,-4.3,.1,.8,.8,'cyan_stained_glass',shell);for(let i=0;i<4;i++)box(-5.25,hy+4.25+i*.25,-4.3,1.9-i*.4,.25,2.2,'cherry_planks',shell);
 box(-10,hy+4.1,-5.7,.65,3,.65,'bricks',shell);box(-10.25,hy+5.65,-5.7,1.15,.5,.65,'bricks',shell);box(-10.5,hy+6.6,-5.7,.65,1.5,.65,'bricks',shell);box(-10.5,hy+7.4,-5.7,.9,.25,.9,'spruce_planks',shell);
 mushroom(-9.9,hy+4.2,-3.6,.7,shell);mushroom(-6,hy+4.2,-5.3,.85,shell);
 for(let i=0;i<9;i++){const x=-10.8+i*.75,roofY=hy+3.2+Math.max(0,3.5-Math.abs(x+8))*.9;box(x,roofY,-5.9,.45,.25,.5,'moss_block',shell);}
 // Interior bed, counter and porch furniture stay aligned to daily activities.
 box(-9,hy+.4,-4.5,1.25,.65,1.85,'oak_planks');box(-9,hy+.76,-4.5,1.3,.15,1.85,'cherry_planks');box(-9,hy+.89,-5.1,1,.15,.4,'calcite');box(-6.6,hy+.55,-5.45,1.2,1.1,.6,'prismarine_bricks');box(-6.6,hy+1.14,-5.45,1.3,.08,.7,'dark_prismarine');box(-8.6,hy+.65,-1.2,.9,.12,.65,'oak_planks');box(-8.6,hy+.32,-1.2,.13,.6,.13,'oak_planks');lantern(-6.25,hy+2,-1.5,shell);
 // Separate purple-block observatory, square turret and stepped copper roof.
 const ty=heightAt(8,-6);
 box(8,ty+.12,-6,4.5,.25,4.5,'mossy_stone_bricks');
 for(let y=0;y<3.5;y+=.5)for(let x=-1.5;x<=1.5;x+=.5)for(let z=-1.5;z<=1.5;z+=.5){if(Math.abs(x)!==1.5&&Math.abs(z)!==1.5)continue;const window=y>=1.5&&y<2.5&&(x===0||z===0);if(z===1.5&&Math.abs(x)<.6&&y<1.5)continue;block(8+x,ty+.25+y,-6+z,window?'cyan_stained_glass':Math.abs(x)===1.5&&Math.abs(z)===1.5?'purpur_pillar':'white_terracotta');}
 for(let i=0;i<6;i++)box(8,ty+3.9+i*.3,-6,4.6-i*.6,.3,4.6-i*.6,i%2?'oxidized_cut_copper':'prismarine_bricks');box(8,ty+6,-6,.4,.6,.4,'purpur_block');
 for(const x of [6,10])for(const z of [-8,-4])box(x,ty+.65,z,.15,1,.15,'purpur_pillar');for(const z of [-8,-4])box(8,ty+1.1,z,4.1,.15,.15,'purpur_block');lantern(8,ty+2.6,-4.35);
 // Pink cherry-and-quartz tea pavilion on its own low terrace.
 const gy=heightAt(10,7);box(10,gy+.12,7,4,.25,3.5,'quartz_block_side');for(const x of [8.5,11.5])for(const z of [5.75,8.25])box(x,gy+1.35,z,.25,2.5,.25,'cherry_log');roof(10,5,gy+2.5,9,8,['cherry_planks','cherry_planks','pink_terracotta'],island);box(10,gy+.65,7,.9,.15,.8,'cherry_planks');box(10,gy+.35,7,.15,.6,.15,'cherry_log');for(const x of [9,11])box(x,gy+.35,7,.5,.2,1.2,'purpur_block');lantern(10,gy+2.4,7.9);
 // Rectangular block pond and small log pier.
 for(let x=2.5;x<=5.5;x+=.5)for(let z=4;z<=6;z+=.5)box(x,.32,z,.5,.08,.5,waterMat);
 for(let x=2;x<=6;x+=.5)for(const z of [3.5,6.5])slab(x,.26,z,'mossy_stone_bricks');for(let z=4;z<=6;z+=.5)for(const x of [2,6])slab(x,.26,z,'mossy_stone_bricks');for(let z=3;z<=4;z+=.5)box(2,.56,z,1,.15,.48,'oak_planks');
 for(const [x,z]of [[3,4.5],[4.5,5.5]]){box(x,.4,z,.4,.04,.4,'moss_block');flower(x,.43,z,'pink_terracotta');}
 // Crops in full-block beds, and square-canopy cherry/oak trees.
 for(const [x,z,flowering]of [[-11,4,false],[-11,6,true]]){const y=heightAt(x,z);box(x,y+.04,z,3,.08,1.2,'dirt');for(let i=0;i<7;i++)for(let j=0;j<2;j++)flower(x-1.2+i*.4,y+.1,z-.3+j*.6,flowering?'cherry_planks':'sandstone');for(const dz of [-.75,.75])box(x,y+.12,z+dz,3.5,.25,.25,'oak_planks');}
 function tree(x,z,cherry,s=1){const y=heightAt(x,z),leaf=cherry?'cherry_leaves':'oak_leaves';box(x,y+1.3*s,z,.5*s,2.6*s,.5*s,cherry?'cherry_log':'stripped_oak_log');for(const [dx,dy,dz,w]of [[0,2.6,0,2],[-.8,2.4,0,1.5],[.8,2.5,0,1.5],[0,2.4,.8,1.5],[0,2.4,-.8,1.5],[0,3.5,0,1.5]])box(x+dx*s,y+dy*s,z+dz*s,w*s,1*s,w*s,leaf);}
 for(const [x,z,cherry,s]of [[-14,-6,true,1.2],[-2,-8,false,1.2],[1,-6,true,1.1],[13,-2,false,1.1],[-15,6,true,1],[13,9,true,1],[-6,11,true,.9],[5,11,false,.85]])tree(x,z,cherry,s);
 for(let i=0;i<110;i++){const x=Math.round(Math.sin(i*127.1)*16*2)/2,z=Math.round(Math.sin(i*311.7)*12*2)/2;if((x/17)**2+(z/13)**2>1||insideHouse({x,z})||Math.hypot(x+8,z+4)<4.8||Math.hypot(x-8,z+6)<3.4||Math.hypot(x-10,z-7)<3||Math.hypot(x-4,z-5)<3||Object.values(dreamNodes).some(p=>Math.hypot(x-p[0],z-p[2])<.8)||paving.has(`${x},${z}`))continue;flower(x,heightAt(x,z),z,i%2?'purpur_block':'cherry_planks');}
 for(const [x,z]of [[-6,0],[-3,2],[0,7],[6,9],[12,10],[4,-2],[6,-4],[-12,8]]){const y=heightAt(x,z);box(x,y+.65,z,.15,1.3,.15,'oak_planks');lantern(x,y+1.5,z);}
 for(const [x,z,s]of [[-14,1,1.2],[-3,-10,1.5],[14,3,1],[-8,10,.65]])mushroom(x,heightAt(x,z),z,s);
 const fy=heightAt(-.4,5);box(-.4,fy+.12,5,.8,.25,.8,'mossy_stone_bricks');const flame=box(-.4,fy+.5,5,.3,.5,.3,glow,island,true);animated.push(t=>flame.scale.y=1+.15*Math.sin(t*7));
 // A stepped cascade emerges from the elevated eastern terrace.
 for(let i=0;i<8;i++){const x=10+i*.5,z=-9,y=heightAt(x,z);box(x,y+.05,z,.5,.1,.8,waterMat);for(const dz of [-.6,.6])slab(x,y,z+dz,'mossy_stone_bricks');}
 const wy=heightAt(13.5,-9);box(13.6,(wy-5)/2,-9,.12,wy+5,.8,waterMat);for(let i=0;i<8;i++){const drop=box(13.69,0,-9.3+(i%4)*.2,.03,.35,.04,glow,island,true);animated.push(t=>drop.position.y=wy-(t*1.4+i*.6)%(wy+5));}
 const grassGeo=new T.PlaneGeometry(.6,.65);
 function tuft(x,y,z,parent=island){for(const angle of [0,Math.PI/2]){const m=new T.Mesh(grassGeo,materials.short_grass);m.position.set(x,y+.3,z);m.rotation.y=angle;parent.add(m);staticMeshes.push(m);}}
 for(let i=0;i<180;i++){const x=Math.round(Math.sin(i*19.7)*16*2)/2,z=Math.round(Math.cos(i*37.1)*12*2)/2;if((x/17)**2+(z/13)**2>1||Math.hypot(x+8,z+4)<4.5||Math.hypot(x-8,z+6)<3||Math.hypot(x-10,z-7)<3||Math.hypot(x-4,z-5)<3||Object.values(dreamNodes).some(p=>Math.hypot(x-p[0],z-p[2])<.7)||paving.has(x+','+z))continue;tuft(x,heightAt(x,z),z);}
 for(let i=1;i<13;i+=2){const x=-11.5+i*.5,rise=(7-Math.abs(i-7))*.5;tuft(x,hy+3.3+rise,-4.5,shell);tuft(x,hy+3.3+rise,-6,shell);}
 // Render repeated blocks in batches without changing their Minecraft silhouettes.
 const groups=new Map();for(const m of staticMeshes){const key=[m.parent.uuid,m.geometry.uuid,...(Array.isArray(m.material)?m.material:[m.material]).map(a=>a.uuid)].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}
 for(const group of groups.values()){if(group.length<3)continue;const first=group[0],batch=new T.InstancedMesh(first.geometry,first.material,group.length);batch.castShadow=batch.receiveShadow=true;first.parent.add(batch);group.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);m.removeFromParent();});batch.instanceMatrix.needsUpdate=true;}
 const seen=new Set();island.traverse(m=>{if(!m.isMesh)return;for(const material of Array.isArray(m.material)?m.material:[m.material])if(material.map&&!seen.has(material)){seen.add(material);textured.push({material,userData:{map:material.map}});}});
 return {blockCount:staticMeshes.length,palette:names};
}
