import * as T from './vendor/three.module.js';
import {addPlantWind} from './plant-wind.js';
import {cameraDefaults,cameraSettings} from './camera-settings.js';
import { enrichIsland } from './island-details.js';
import { addResident } from './island-resident.js';
import { createLife } from './island-life.js';
import { createAtmosphere } from './island-atmosphere.js';
import {vanillaNames,mossGround,addMeadow} from './island-meadow.js';
import {createPostFX} from './island-postfx.js';
import {zones,heightAt,classicNodes,findClassicRoute,walkHeight,insideHouse} from './classic-layout.js';
import {buildClassicTerrain} from './classic-terrain.js';
import {completeRoadTextures} from './classic-road-materials.js';
import {propOffset,residentNodes,findResidentRoute,insideMovedHouse} from './classic-props.js';

// Expanded pixel-block island with shallow terraces and recessed paths.
const canvas = document.getElementById('world');
const scene = new T.Scene();
scene.background = new T.Color('#d7e5e9');
const renderer = new T.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const camera = new T.PerspectiveCamera(36, 1, .1, 250);
const ambient = new T.HemisphereLight(0xe9f4ff, 0x4a3a28, 2.3);
scene.add(ambient);
const sun = new T.DirectionalLight(0xffefd9, 1.6);
sun.position.set(-9, 20, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, {left:-24, right:24, top:24, bottom:-24, near:1, far:90});
sun.shadow.normalBias = .04;
sun.shadow.bias = -.0004;
scene.add(sun);
// Rim / back-fill light: subtle cool tone from behind to add depth and separate the island silhouette.
const rimLight = new T.DirectionalLight(0xb5d0ff, 0.45);
rimLight.position.set(5, 14, -16);
scene.add(rimLight);

const island = new T.Group();
island.name = 'original-hd-island-study';
scene.add(island);
const shell = new T.Group();
shell.name = 'removable-cottage-shell';
island.add(shell);
const grounds=new Map();let placement=island;
function setZone(name){
  if(!name){placement=island;return island;}
  if(!grounds.has(name)){const group=new T.Group();group.name='classic-area-'+name;group.position.set(...propOffset(name));island.add(group);grounds.set(name,group);}
  placement=grounds.get(name);return placement;
}
setZone('home').add(shell);setZone(null);
const meshes = [], lamps = [], plants = [];
const animated = [];
const maps = {}, materials = new Map(), flatMaterials = new Map();
const textureFiles = {"red_tulip":"textures-vanilla/red_tulip.png","orange_tulip":"textures-vanilla/orange_tulip.png","peony_top":"textures-vanilla/peony_top.png","stone_bricks":"textures-pixlli/stone_bricks.png","oak_leaves":"textures-pixlli/oak_leaves.png","oak_log_top":"textures-pixlli/oak_log_top.png","stone":"textures-pixlli/stone.png","dirt":"textures-pixlli/dirt.png","vine":"textures-hd/vine.png","cobblestone":"textures-pixlli/cobblestone.png","cornflower":"textures-vanilla/cornflower.png","grass_block_side":"textures-pixlli/grass_block_side.png","sunflower_top":"textures-vanilla/sunflower_top.png","large_fern_bottom":"textures-vanilla/large_fern_bottom.png","large_fern_top":"textures-vanilla/large_fern_top.png","grass_block_top":"textures-pixlli/grass_block_top.png","water_still":"textures-hd/water_still.png","oak_log":"textures-pixlli/oak_log.png","oxeye_daisy":"textures-vanilla/oxeye_daisy.png","wheat_stage_7":"textures-hd/wheat_stage_7.png","poppy":"textures-vanilla/poppy.png","pink_tulip":"textures-vanilla/pink_tulip.png","blue_orchid":"textures-vanilla/blue_orchid.png","rose_bush_bottom":"textures-vanilla/rose_bush_bottom.png","fern":"textures-vanilla/fern.png","peony_bottom":"textures-vanilla/peony_bottom.png","grass_block_side_overlay":"textures-pixlli/grass_block_side_overlay.png","tall_grass_top":"textures-pixlli/tall_grass_top.png","azure_bluet":"textures-vanilla/azure_bluet.png","short_grass":"textures-pixlli/short_grass.png","sunflower_bottom":"textures-vanilla/sunflower_bottom.png","moss_block":"textures-pixlli/moss_block.png","rose_bush_top":"textures-vanilla/rose_bush_top.png","tall_grass_bottom":"textures-pixlli/tall_grass_bottom.png","lilac_top":"textures-vanilla/lilac_top.png","lily_of_the_valley":"textures-vanilla/lily_of_the_valley.png","sunflower_front":"textures-vanilla/sunflower_front.png","white_tulip":"textures-vanilla/white_tulip.png","cobblestone_mossy":"textures-pixlli/cobblestone_mossy.png","spruce_planks":"textures-pixlli/spruce_planks.png","allium":"textures-vanilla/allium.png","lilac_bottom":"textures-vanilla/lilac_bottom.png","oak_planks":"textures-pixlli/oak_planks.png","dandelion":"textures-vanilla/dandelion.png","sunflower_back":"textures-vanilla/sunflower_back.png"};
textureFiles.mossy_stone_bricks='textures-pixlli/mossy_stone_bricks.png';
const names = ['oak_planks','spruce_planks','oak_log','oak_log_top','grass_block_top',
  'grass_block_side','grass_block_side_overlay','dirt','stone','cobblestone',
  'cobblestone_mossy','stone_bricks','mossy_stone_bricks','oak_leaves','vine','wheat_stage_7','water_still'];
let useTextures = true, isNight = false;
let atmosphere=null,postFX=null;
let life=null,resident=null,manualRoof=false,following=false,lastFrame=null;

function material(name, color = 0xffffff, cutout = false) {
  const key = `${name}:${color}:${cutout}`;
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({
    map:maps[name], color, roughness:.95,
    alphaTest:cutout ? .45 : 0, side:cutout ? T.DoubleSide : T.FrontSide
  }));
  return materials.get(key);
}
function flat(color) {
  if (!flatMaterials.has(color)) flatMaterials.set(color, new T.MeshStandardMaterial({color,roughness:1}));
  return flatMaterials.get(color);
}

// UV dimensions follow world dimensions: planks and stone are not stretched over walls.
const geometries = new Map();
function box(x,y,z,w,h,d,mat,color,parent=placement) {
  const key = `${w},${h},${d}`;
  if (!geometries.has(key)) {
    const geo = new T.BoxGeometry(w,h,d), uv = geo.attributes.uv;
    const size = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for (let f=0; f<6; f++) for (let v=0; v<4; v++) {
      const i=f*4+v;
      uv.setXY(i,uv.getX(i)*size[f][0],uv.getY(i)*size[f][1]);
    }
    geometries.set(key,geo);
  }
  const mesh = new T.Mesh(geometries.get(key),mat);
  mesh.position.set(x,y,z);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.textured = mat;
  mesh.userData.plain = flat(color);
  meshes.push(mesh);
  parent.add(mesh);
  return mesh;
}
function plant(x,y,z,size,name,color) {
  const group = new T.Group(); group.position.set(x,y,z); placement.add(group);
  for (const a of [0,Math.PI/2]) {
    const mat = material(name,color,true);
    const mesh = new T.Mesh(new T.PlaneGeometry(size,size),mat);
    mesh.position.y=size/2; mesh.rotation.y=a;
    mesh.castShadow=mesh.receiveShadow=true;
    group.add(mesh);
  }
  plants.push(group);
  return group;
}

async function build() {
  const loader = new T.TextureLoader();
  await Promise.all([...names,...vanillaNames].map(async name => {
    const texture = await loader.loadAsync(`./${textureFiles[name]}`);
    texture.colorSpace=T.SRGBColorSpace;
    texture.magFilter=T.NearestFilter;
    texture.minFilter=T.LinearMipmapLinearFilter;
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    maps[name]=texture;
  }));
  completeRoadTextures(maps);
  const roadMaterials=['stone','stone_bricks','cobblestone_mossy','cobblestone','mossy_stone_bricks','cracked_stone_bricks','andesite'].map(name=>material(name));
  const dirt=material('dirt'), stone=material('stone'), brick=material('stone_bricks');
  const wood=material('oak_planks'), roof=material('spruce_planks');
  const log=material('oak_log'), end=material('oak_log_top');
  const logFaces=[log,log,end,end,log,log];
  const grassTop=material('grass_block_top',0x7da44b), grassSide=material('grass_block_side');
  const moss=material('cobblestone_mossy'), leaf=material('oak_leaves',0x6f9547,true);

  const groundTop=mossGround(maps);
  const terrain=buildClassicTerrain({island,grass:grassTop,grassSide,groundTop,dirt,stone,moss,flat,meshes,roadMaterials});
  // Cottage with an openable exterior and a furnished interior.
  setZone('home');
  box(-2,.14,-2.35,4.4,.28,3.6,brick,0x919487);
  box(-2,.32,-2.35,4,.12,3.3,wood,0xaf834e);
  box(-2,1.6,-4.03,4.35,2.6,.18,wood,0xb48a55,shell);
  for(const x of [-4.12,.12])box(x,1.6,-2.35,.18,2.6,3.55,wood,0xb48a55,shell);
  // Left front panel below/above window, right side door frame.
  box(-2.85,.83,-.61,2.4,1.04,.18,wood,0xb48a55,shell);
  box(-2.85,2.55,-.61,2.4,.65,.18,wood,0xb48a55,shell);
  for(const x of [-3.95,-1.76])box(x,1.79,-.61,.22,.94,.18,wood,0xb48a55,shell);
  box(-.03,1.6,-.61,.3,2.6,.18,wood,0xb48a55,shell);
  box(-.9,2.68,-.61,1.65,.4,.18,wood,0xb48a55,shell);
  for(const x of [-4.14,.14])for(const z of [-4.04,-.6])box(x,1.65,z,.24,2.9,.24,logFaces,0x6d5033,shell);
  const glow=new T.MeshStandardMaterial({color:0xffda8e,emissive:0xffb54d,emissiveIntensity:.7,roughness:.6});
  box(-2.85,1.8,-.6,1.94,.9,.06,glow,0xffd478,shell);
  box(-2.85,1.8,-.47,.085,1.03,.12,roof,0x61472f,shell);
  box(-2.85,1.8,-.47,2.05,.085,.12,roof,0x61472f,shell);
  for(let level=0;level<6;level++) {
    const width=5.15-level*.76;
    box(-2,3.03+level*.25,-2.35,width,.26,4.2,roof,0x624a34,shell);
    if(level>0)box(-2,2.88+level*.25,-.63,width-.38,.26,.17,wood,0xb48a55,shell);
  }
  box(-3.3,4.1,-3.2,.6,1.9,.6,brick,0x92958c,shell);
  box(-3.3,5.07,-3.2,.78,.15,.78,brick,0x878a80,shell);
  box(-2,.24,.3,4.65,.24,1.7,wood,0xa98049);
  box(-2,2.74,.3,4.9,.2,1.95,roof,0x705237,shell);
  for(const x of [-4.1,.1])box(x,1.47,1.05,.18,2.4,.18,logFaces,0x765535,shell);
  for(const x of [-4.05,-3.5,-2.95])box(x,.73,1.08,.1,.85,.1,logFaces,0x85643d);
  box(-3.5,1.12,1.08,1.25,.13,.13,wood,0xb18b56);
  box(-.85,.13,1.35,1.35,.26,.65,wood,0xb18b56);
  box(-.85,.065,1.77,1.55,.13,.4,wood,0xb18b56);
  box(-2.7,.94,.3,.9,.13,.7,wood,0x9c733f);
  for(const x of [-3.02,-2.38])for(const z of [.08,.52])box(x,.63,z,.09,.52,.09,logFaces,0x735637);
  box(-1.85,.58,.3,.45,.14,.45,wood,0x9c733f);
  for(const x of [-2.01,-1.69])box(x,.4,.3,.1,.3,.34,logFaces,0x735637);
  box(-3,.64,-2.55,1.2,.5,1.85,wood,0x987449);
  box(-3,.93,-2.45,1.18,.1,1.7,flat(0xd1b98a),0xd1b98a);
  box(-3,1,-2.18,1.18,.07,1.05,flat(0xa65c43),0xa65c43);
  box(-3,1.03,-3.07,.92,.17,.4,flat(0xf4e8cb),0xf4e8cb);
  box(-.7,.87,-3,1.1,1,1,brick,0x8c9188);
  box(-.7,1.41,-3,1.15,.1,1.03,flat(0x37433f),0x37433f);
  box(-.7,1.51,-3,.6,.1,.6,flat(0x252e2b),0x252e2b);

  // Seven canopy volumes, modest branches; cutout alpha is retained.
  setZone('tree');
  box(3,1.55,-2.8,.62,3.1,.62,logFaces,0x765330);
  box(3.4,2.5,-2.8,1.15,.25,.25,logFaces,0x765330);
  for(const [x,y,z,w,h,d] of [[3,3.5,-2.8,1.6,1.4,1.5],[1.95,3.15,-2.8,1.3,1.2,1.3],
    [4.05,3.25,-2.8,1.3,1.2,1.3],[3,3.25,-1.75,1.4,1.1,1.2],
    [3,3.4,-3.85,1.5,1.3,1.3],[3,4.5,-2.8,1.4,1,1.3],[2.1,3.1,-1.85,1.1,1,1.1]])box(x,y,z,w,h,d,leaf,0x618e40);

  // High-resolution wheat uses the legacy-named HD texture in this demo pack.
  setZone('wheat');
  box(-3.55,.015,2.95,2.3,.05,1.9,dirt,0x79502d);
  for(let i=0;i<5;i++)for(let j=0;j<3;j++) {
    const x=-4.5+i*.43,z=2.35+j*.58;
    plant(x,.07,z,.7,'wheat_stage_7',0xffffff);
    const stem=box(x,.35,z,.04,.6,.04,flat(0xb19b3e),0xb19b3e);
    const head=box(x,.69,z,.14,.25,.14,flat(0xe0bd59),0xe0bd59);
    stem.userData.onlyPlain=head.userData.onlyPlain=true;
    stem.visible=head.visible=false;
  }
  for(const x of [-4.8,-3.65,-2.5])box(x,.5,4.02,.14,1,.14,logFaces,0x876238);
  for(const y of [.38,.74])box(-3.65,y,4.02,2.4,.12,.1,wood,0xac854e);
  for(const z of [2,3])box(-4.8,.5,z,.14,1,.14,logFaces,0x876238);
  for(const y of [.38,.74])box(-4.8,y,3,.1,.12,2.1,wood,0xac854e);

  // Recessed pond. Frame 0 of the pack's 16px animated water texture.
  setZone('pond');
  const waterTexture=maps.water_still;
  waterTexture.repeat.set(3,waterTexture.image.width/waterTexture.image.height*3);
  // Use a single frame clone; canvas avoids sampling adjacent animation frames.
  const frame=document.createElement('canvas');frame.width=frame.height=waterTexture.image.width;
  frame.getContext('2d').drawImage(waterTexture.image,0,0,frame.width,frame.height,0,0,frame.width,frame.height);
  const waterMap=new T.CanvasTexture(frame);waterMap.colorSpace=T.SRGBColorSpace;
  waterMap.wrapS=waterMap.wrapT=T.RepeatWrapping;waterMap.repeat.set(3,3);
  const waterMat=new T.MeshStandardMaterial({map:waterMap,color:0x3daeb7,roughness:.2,metalness:.15});
  const water=new T.Mesh(new T.PlaneGeometry(3,3),waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(3,-.05,2);water.receiveShadow=true;
  water.userData.textured=waterMat;water.userData.plain=flat(0x41adbf);meshes.push(water);placement.add(water);
  for(let i=0;i<4;i++) {
    box(1.7+i*.85,.08,.35,.8,.26,.38,moss,0x9a9f94);
    box(1.7+i*.85,.08,3.65,.8,.26,.38,brick,0xa5aaa0);
  }
  box(4.65,.08,2,.35,.26,3.65,brick,0xa5aaa0);
  for(const z of [.85,3.1])box(1.4,.08,z,.35,.26,.75,brick,0xa5aaa0);
  for(let i=0;i<4;i++)box(1.15,.19,1.2+i*.32,1.05,.15,.3,wood,0xa17a45);
  for(const z of [1.2,2.15])box(1.5,-.18,z,.14,.7,.14,logFaces,0x795432);
  setZone('fire');
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(Math.cos(a)*.65,.16,3.45+Math.sin(a)*.65,.3,.32,.3,stone,0x8b918b);}
  for(const a of [-.65,.65]){const b=box(0,.17,3.45,.85,.18,.2,logFaces,0x6f4e30);b.rotation.y=a;}
  const fireMat=new T.MeshBasicMaterial({color:0xff9836});
  const coreMat=new T.MeshBasicMaterial({color:0xffdf82});
  for(let i=0;i<7;i++){
    const angle=i*2.4,x=Math.cos(angle)*.2,z=3.45+Math.sin(angle)*.16,h=.32+(i%3)*.15;
    const flame=box(x,.24+h/2,z,.13,h,.14,i%2?coreMat:fireMat,0xffbb47);
    flame.name='dancing-flame-'+i;flame.userData.dynamic=true;
    animated.push(t=>{const pulse=.8+.25*Math.sin(t*7+i*1.7)+.14*Math.sin(t*13+i);flame.scale.set(1+.12*Math.sin(t*9+i),pulse,1);flame.position.set(x+.035*Math.sin(t*5+i),.24+h*pulse/2,z);flame.rotation.z=.09*Math.sin(t*6+i);});
  }
  const sparkMat=new T.MeshBasicMaterial({color:0xffbd58,transparent:true,opacity:.8,depthWrite:false});
  for(let i=0;i<6;i++){
    const spark=box(0,.5,3.45,.025,.045,.025,sparkMat,0xffbd58);spark.userData.dynamic=true;spark.castShadow=false;
    animated.push(t=>{const phase=(t*.48+i/6)%1;spark.position.set(Math.sin(t*2+i)*phase*.25,.4+phase*1.1,3.45+Math.cos(t+i)*phase*.16);spark.scale.setScalar(1-phase);});
  }
  // The bench beside the campfire has been removed.
  function lantern(x,y,z){
    const metal=flat(0x424939);
    box(x,y,z,.19,.27,.19,glow,0xffd478);
    for(const dx of [-.13,.13])for(const dz of [-.13,.13])box(x+dx,y,z+dz,.045,.36,.045,metal,0x424939);
    for(const dy of [-.19,.19])box(x,y+dy,z,.33,.065,.33,metal,0x424939);
    const light=new T.PointLight(0xffbb6b,1.2,7,2);light.position.set(x,y,z);lamps.push(light);placement.add(light);
  }
  setZone('home');lantern(-3.8,2.38,.8);setZone('tree');lantern(2.6,2.2,-2.8);
  for(const [zone,x,z]of [['wheat',-4.8,4.02],['pond',4.7,3.65]]){setZone(zone);box(x,.62,z,.14,1.24,.14,logFaces,0x795432);lantern(x,1.38,z);}
  setZone('fire');
  const fireLight=new T.PointLight(0xffa344,1.5,8,2);fireLight.position.set(0,.7,3.45);fireLight.castShadow=true;fireLight.shadow.mapSize.set(512,512);fireLight.shadow.bias=-.002;lamps.push(fireLight);placement.add(fireLight);
  animated.push(t=>{fireLight.intensity*=1+.13*Math.sin(t*9)+.07*Math.sin(t*17);});
  // Vines follow the expanded outer cliff instead of the former island edge.
  setZone(null);
  for(const [x,z]of [[-8,12.53],[8,12.53],[-15,6.53],[2,14.03],[-4,13.53],[13,9.03]]){
    for(let n=0;n<3;n++)plant(x,-.45-n*.7,z,.8,'vine',0x648b39);
  }
  enrichIsland({T,island,box,flat,material,plant,wood,roof,logFaces,stone,brick,moss,leaf,dirt,waterMat,lantern,animated,setZone,heightAt});
  setZone(null);
  const meadow=addMeadow({island,maps,plants});
  // Batch repeated static boxes to keep the larger scene inexpensive to draw.
  const logicalMeshCount=meshes.length;
  const batches=new Map();
  for(const mesh of meshes){
    if(!mesh.isMesh||mesh.userData.dynamic)continue;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    const key=[mesh.parent.uuid,mesh.geometry.uuid,...mats.map(m=>m.uuid),mesh.userData.plain.uuid,mesh.visible,JSON.stringify(mesh.userData.wind||null)].join(':');
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  }
  for(const group of batches.values()){
    if(group.length<3)continue;
    const first=group[0],batch=new T.InstancedMesh(first.geometry,first.material,group.length);
    batch.castShadow=batch.receiveShadow=true;batch.userData={...first.userData};batch.visible=first.visible;
    first.parent.add(batch);
    group.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);m.removeFromParent();});
    batch.instanceMatrix.needsUpdate=true;
    meshes.push(batch);
  }
  for(let i=meshes.length-1;i>=0;i--)if(!meshes[i].parent)meshes.splice(i,1);
  const wind=addPlantWind(island);animated.push(t=>wind.update(t));
  life=createLife({scene,ambient,sun,lamps,weatherBounds:[38,32],rainFloor:(x,z)=>heightAt(x,z)+(insideMovedHouse({x,z})?4.8:x>-12.6&&x<-9.4&&z>-4&&z<-1.35?2.5:.05),onNight:value=>{isNight=value;}});
  resident=await addResident({island,getWorld:()=>life.state,routeNodes:residentNodes,routeFinder:findResidentRoute,groundHeight:walkHeight,insideTest:insideMovedHouse,gazeTargets:{fire:[propOffset('fire')[0],propOffset('fire')[2]+3.45],pond:[6,2.3],garden:[-12,3]},focusOn:(position,place)=>{
    if(wallpaperCamera.locked)return;
    setFollowing(!following);
    if(!following)return;
    focus.set(position.x,position.y+.7,position.z);distance=13;yaw=place==='pond'?-.85:.25;pitch=place==='pond'?.5:.38;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
  }});
  atmosphere=createAtmosphere({scene,renderer,sun,ambient,waterMat});
  postFX=createPostFX({renderer,scene,camera,sun,ambient});
  document.getElementById('status').remove();
  window.__materialStudy={ready:true,scene,island,camera,renderer,terrain,textureCount:names.length+vanillaNames.length,meadow,
    resident,life,postFX,getState:()=>({following,lighting:atmosphere.enabled,textured:useTextures,night:isNight,roofOpen:!shell.visible,meshCount:meshes.length,logicalMeshCount,areas:6,resident:resident.getState(),world:{...life.state}}),setTextures};
}
function setTextures(value){
  useTextures=value;
  for(const mesh of meshes){mesh.material=value?mesh.userData.textured:mesh.userData.plain;if(mesh.userData.onlyPlain)mesh.visible=!value;}
  for(const plant of plants)plant.visible=value;
  document.getElementById('textured').setAttribute('aria-pressed',String(value));
  document.getElementById('plain').setAttribute('aria-pressed',String(!value));
  document.getElementById('badge').textContent=value?'128×128 材质 · 本地加载':'纯色几何体 · 相同场景';
}
document.getElementById('textured').onclick=()=>setTextures(true);
document.getElementById('plain').onclick=()=>setTextures(false);
document.getElementById('roof').onclick=()=>{
  manualRoof=!manualRoof;
  document.getElementById('roof').setAttribute('aria-pressed',String(manualRoof));
  document.getElementById('roof').textContent=manualRoof?'合上屋顶':'查看屋内';
};
let yaw=.42,pitch=.59,distance=65;
let wallpaperCamera={...cameraDefaults};
const focus=new T.Vector3(0,1.2,0);
const views={all:[0,1.2,0,65],home:[-3.5,2,-2.5,19],garden:[-10,1,4.2,19],river:[9,.4,-1.2,22],mill:[-10,6.8,-8.5,29],lookout:[10,1.8,7,20]};
function setFollowing(value){if(value&&wallpaperCamera.locked)return;following=value;const button=document.getElementById('resident-focus');button.textContent=value?'停止跟随':'跟随酒狐';button.setAttribute('aria-pressed',String(value));}
setFollowing(false);
function setView(name){if(wallpaperCamera.locked)return;setFollowing(false);const [x,y,z,d]=views[name];focus.set(x,y,z);distance=d;yaw=name==='mill'?-.8:.42;pitch=name==='mill'?.65:.59;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.getElementById('reset').onclick=()=>{if(!wallpaperCamera.locked)applyDefaultCamera();};
const pointers=new Map();let pinch=0;
function applyDefaultCamera(){setFollowing(false);focus.set(0,1.2,0);yaw=T.MathUtils.degToRad(wallpaperCamera.yaw);pitch=T.MathUtils.degToRad(wallpaperCamera.pitch);distance=65*100/wallpaperCamera.zoom;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='all')));}
window.applyIslandCameraProperties=properties=>{
 wallpaperCamera=cameraSettings(properties,wallpaperCamera);
 if(properties.viewangle||properties.viewtilt||properties.zoom)applyDefaultCamera();
 if(wallpaperCamera.locked){setFollowing(false);pointers.clear();pinch=0;}
};
window.applyIslandCameraProperties(window.islandCameraProperties||{});
canvas.onpointerdown=e=>{if(wallpaperCamera.locked)return;setFollowing(false);pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{
  if(wallpaperCamera.locked||!pointers.has(e.pointerId))return;
  const before=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===2){const[a,b]=[...pointers.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)distance=T.MathUtils.clamp(distance+(pinch-d)*.035,9,95);pinch=d;}
  else{yaw-=(e.clientX-before[0])*.006;pitch=T.MathUtils.clamp(pitch+(e.clientY-before[1])*.004,.08,1.3);}
};
function release(e){pointers.delete(e.pointerId);pinch=0;}
canvas.onpointerup=canvas.onpointercancel=release;
canvas.addEventListener('wheel',e=>{e.preventDefault();if(wallpaperCamera.locked)return;setFollowing(false);distance=T.MathUtils.clamp(distance+e.deltaY*.015,9,95);},{passive:false});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(postFX)postFX.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
function render(time=0){
 requestAnimationFrame(render);
 if(window.islandHostPaused){lastFrame=null;return;}
 const realDt=lastFrame===null?0:Math.min(.05,Math.max(0,(time-lastFrame)*.001));lastFrame=time;
 const dt=life.state.paused?0:realDt*life.state.speed;
 life.update(dt);resident.update(dt);shell.visible=!(manualRoof||resident.isInside());
 if(following){const p=resident.sprite.position;focus.set(p.x,p.y+.7,p.z);}
 const d=distance*Math.max(1,.98/camera.aspect);camera.position.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*d,focus.y+Math.sin(pitch)*d,focus.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(focus);camera.updateMatrixWorld();resident.updateFacing(camera);
 animated.forEach(update=>update(life.state.elapsed));atmosphere.update(life.state);
 if(postFX)postFX.render();else renderer.render(scene,camera);
}
build().then(render).catch(error=>{document.getElementById('status').textContent='样板加载失败：'+error.message;console.error(error);});


