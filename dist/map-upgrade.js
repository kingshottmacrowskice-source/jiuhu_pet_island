import * as THREE from './vendor/three.module.js';
export async function upgradeMap({island,shell,leaves,wheat,water,scene}){
 const names=['grass_block_top','grass_block_side','dirt','stone','cobblestone','mossy_cobblestone','oak_leaves','oak_log','oak_log_top','oak_planks','spruce_planks','spruce_log','spruce_log_top','stone_bricks','vine','wheat_stage7','short_grass','dirt_path_top','water_still','moss_block'];
 const maps={};await Promise.all(names.map(async name=>{const t=await new THREE.TextureLoader().loadAsync('./textures/'+name+'.png');t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;maps[name]=t}));
 const cache=new Map();function material(name,tint=0xffffff,transparent=false){const key=name+tint+transparent;if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({map:maps[name],color:tint,roughness:.9,alphaTest:transparent?.45:0,side:transparent?THREE.DoubleSide:THREE.FrontSide}));return cache.get(key)}
 const cube=new THREE.BoxGeometry(1,1,1);function block(x,y,z,w,h,d,m,parent=island){const mesh=new THREE.Mesh(cube,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 const dirt=material('dirt'),stone=material('stone'),cobble=material('cobblestone'),moss=material('mossy_cobblestone'),wood=material('oak_planks'),darkwood=material('spruce_planks'),log=material('oak_log'),logTop=material('oak_log_top'),leaf=material('oak_leaves',0x76a044,true);
 const logFaces=[log,log,logTop,logTop,log,log],grassFaces=[material('grass_block_side'),material('grass_block_side'),material('grass_block_top',0x83ad4a),dirt,material('grass_block_side'),material('grass_block_side')];
 let seed=6842;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // Replace stretched earth columns with layered, tapering Minecraft blocks.
 const tops=[];for(const m of [...island.children])if(m.isMesh&&m.geometry.type==='BoxGeometry'){
  if(m.position.y<-.3){island.remove(m);continue}
  if(m.position.y===-.08){tops.push([m.position.x,m.position.z]);m.position.y=-.43;m.scale.y=1;m.material=grassFaces;continue}
 }
 for(const [x,z] of tops){const depth=Math.max(1,Math.floor(5.8-(x*x/45+z*z/31)*3.5+rand()*1.7));for(let y=1;y<=depth;y++){if(y>2&&rand()<.08)continue;block(x,-.43-y,z,1,1,1,y===1?dirt:rand()<.15?moss:stone)}if(rand()<.17)block(x,-depth-1.2,z,.65,1,.65,stone)}
 // Use the supplied resource pack on existing architecture and props.
 island.traverse(m=>{if(!m.isMesh||m.geometry.type!=='BoxGeometry'||Array.isArray(m.material)||m.position.y<-.1)return;const c=m.material.color;if(!c)return;const hex=c.getHexString();
  if(['647e77','526e69','647d72'].includes(hex))m.material=darkwood;
  else if(['715c43','87714d','796348','756147','715b43','816848','826c4b','6b543d'].includes(hex))m.material=logFaces;
  else if(['b18b60','bd966b','b68e62','bc976a','b79a70','b6986b','8e7858','ac976e','b2a383','8b704b','725c40','9b7d53','a78959','826a47','b49a6f','b29c72'].includes(hex))m.material=wood;
  else if(['919583','a5ac8b','8b8778','6c6b61','85847a'].includes(hex))m.material=rand()<.25?moss:cobble;
  else if(hex==='bac0a0')m.material=material('dirt_path_top');
 });
 // More articulated tree canopy with cutout leaves, trunk roots and branches.
 for(const m of leaves)island.remove(m);for(const m of [...island.children])if(m.isMesh&&m.material?.color?.getHexString()==='88a269')island.remove(m);
 for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)for(let y=0;y<3;y++){if(x*x+z*z+y*1.4>6.8||rand()<.16)continue;block(3+x*.65,3+y*.55,-2.4+z*.65,.82,.65,.82,leaf)}
 for(const [dx,dz] of [[.6,0],[-.6,0],[0,.6],[0,-.6]])block(3+dx,.35,-2.4+dz,.35,.65,.35,logFaces);
 block(2.45,2.4,-2.4,1.2,.25,.25,logFaces);block(3,2.7,-1.8,.25,.25,1.2,logFaces);
 // Crossed cutout plants preserve the resource pack's 8-pixel silhouettes.
 function plant(x,y,z,size,name,tint=0xffffff,parent=island){const g=new THREE.Group();g.position.set(x,y,z);const mat=material(name,tint,true);for(const angle of [0,Math.PI/2]){const p=new THREE.Mesh(new THREE.PlaneGeometry(size,size),mat);p.position.y=size/2;p.rotation.y=angle;p.castShadow=true;g.add(p)}parent.add(g);return g}
 for(const g of wheat){g.clear();plant(0,0,0,.65,'wheat_stage7',0xffe6a3,g)}
 function fence(x,z,axis='x'){block(x,.65,z,.13,1.1,.13,logFaces);for(const y of [.47,.84])block(x+(axis==='x'?.45:0),y,z+(axis==='z'?.45:0),axis==='x'?.9:.09,.11,axis==='z'?.9:.09,wood)}
 for(let x=-4.8;x<-2;x+=.9)fence(x,4.05);for(let z=2.1;z<4;z+=.9)fence(-4.8,z,'z');
 // Warm lanterns at veranda, tree, field and pond.
 const glow=new THREE.MeshBasicMaterial({color:0xffdc8a}),metal=new THREE.MeshStandardMaterial({color:0x3e423c,roughness:.7});
 function lantern(x,y,z,parent=island){block(x,y,z,.19,.25,.19,glow,parent);for(const dx of [-.12,.12])for(const dz of [-.12,.12])block(x+dx,y,z+dz,.035,.3,.035,metal,parent);block(x,y+.17,z,.29,.06,.29,metal,parent);block(x,y-.17,z,.27,.05,.27,metal,parent);const l=new THREE.PointLight(0xffbd69,1.6,3);l.position.set(x,y,z);parent.add(l)}
 lantern(-3.8,2.2,.9);lantern(.45,2.2,1);lantern(2.45,2,-2.4);for(const [x,z] of [[-4.8,4.05],[4.6,3.5],[4.7,-1.2]]){block(x,.65,z,.16,1.25,.16,logFaces);lantern(x,1.4,z)}
 // Porch rails leave the doorway and character path open.
 for(let x=-3.8;x<-2.8;x+=.55)block(x,.75,1.24,.1,.8,.1,logFaces);block(-3.3,1.17,1.24,1.2,.1,.14,wood);
 // Stone footing, timber lintels and chimney cap enrich the cottage silhouette.
 block(-1.75,.04,-3.75,4.7,.42,.5,cobble);block(-4,.04,-2.2,.45,.42,3.5,cobble);block(.5,.04,-2.2,.45,.42,3.5,cobble);
 block(-1.75,2.85,-.35,4.7,.24,.3,logFaces,shell);block(-1.75,4.54,-2.15,.5,.18,4.4,material('stone_bricks'),shell);block(-3,4.86,-2.9,.9,.2,.9,cobble,shell);
 // Pond border, reeds, low bushes, and hanging vines on the cliff face.
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=3+Math.cos(a)*1.65,z=2+Math.sin(a)*1.65;if(x<1.6)continue;block(x,.15,z,.5,.35,.5,i%3?moss:cobble)}
 for(let i=0;i<7;i++){const x=4.15+rand()*.5,z=1.5+rand()*1.3;block(x,.48,z,.055,.7+rand()*.4,.055,material('grass_block_top',0x8eb455))}
 for(let i=0;i<75;i++){let x=(rand()-.5)*11,z=(rand()-.5)*9;if(x*x/38+z*z/24>.95||x>-4.5&&x<1&&z<1.8||x>1&&z>0||x<-2&&z>1.8)continue;plant(x,.08,z,.3+rand()*.3,'short_grass',0x83ab4c);if(i%7===0)block(x,.4,z,.15,.13,.15,new THREE.MeshStandardMaterial({color:i%2?0xe5d39b:0xc6a7c8}))}
 const vineMat=material('vine',0x66883e,true);for(const [x,z] of tops){if(x*x/45+z*z/31<.65||rand()>.24)continue;const a=Math.atan2(x,z),length=2+Math.floor(rand()*4);for(let k=0;k<length;k++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.7,1),vineMat);p.position.set(x+Math.sin(a)*.51,-.6-k,z+Math.cos(a)*.51);p.rotation.y=a;island.add(p)}}
 const waterTexture=maps.water_still;waterTexture.repeat.set(1,waterTexture.image.width/waterTexture.image.height);water.material.map=waterTexture;water.material.color.set(0x3c9fad);water.material.opacity=.88;water.material.needsUpdate=true;
 // A continuous sky gradient puts the textured island in open air.
 const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{night:{value:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 v;uniform float night;void main(){float h=smoothstep(-0.3,0.65,normalize(v).y);vec3 day=mix(vec3(0.91,0.78,0.62),vec3(0.48,0.69,0.79),h);vec3 dark=mix(vec3(0.08,0.12,0.20),vec3(0.025,0.055,0.12),h);gl_FragColor=vec4(mix(day,dark,night),1.0);}'});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(70,24,16),skyMaterial);sky.renderOrder=-10;sky.onBeforeRender=()=>{skyMaterial.uniforms.night.value=scene.background?1-THREE.MathUtils.smoothstep(scene.background.r,.02,.55):0};scene.add(sky);
 // Small distant islands maintain the floating-world setting from the reference.
 for(const [x,y,z,s] of [[-15,-5,-15,1.2],[14,-3,-19,1.5],[-21,0,-28,.8]]){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);block(0,0,0,3,.6,2.5,grassFaces,g);for(let n=0;n<3;n++)block(0,-.7-n,0,2.6-n*.6,1,2-n*.4,stone,g)}
 return {textureCount:names.length};
}
