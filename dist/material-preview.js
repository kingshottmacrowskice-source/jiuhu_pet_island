import {createSeasons} from './island-seasons.js';
import {createRealTime} from './real-time.js';
import {buildClassicHouse,houseX,houseWidthScale} from './classic-house.js';
import * as T from './vendor/three.module.js';
import {addPlantWind} from './plant-wind.js';
import {cameraDefaults,cameraSettings} from './camera-settings.js';
import { enrichIsland } from './island-details.js';
import { addResident } from './island-resident.js';
import { createLife } from './island-life.js';
import { createAtmosphere } from './island-atmosphere.js';
import {vanillaNames,mossGround,addMeadow} from './island-meadow.js';
import {createPostFX} from './island-postfx.js';
import {zones,heightAt,pondCells,isPondLocal,isWater,classicNodes,findClassicRoute,walkHeight,insideHouse} from './classic-layout.js';
import {buildClassicTerrain} from './classic-terrain.js';
import {completeRoadTextures} from './classic-road-materials.js';
import {homeItemShift,propOffset,residentNodes,findResidentRoute,insideMovedHouse} from './classic-props.js';

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
textureFiles.cherry_leaves='textures-pixlli/cherry_leaves.png';
textureFiles.mossy_stone_bricks='textures-pixlli/mossy_stone_bricks.png';
for(const name of ['dark_oak_planks','cobbled_deepslate','stripped_oak_log'])textureFiles[name]=`textures-pixlli/${name}.png`;
const names = ['cherry_leaves','dark_oak_planks','cobbled_deepslate','stripped_oak_log','oak_planks','spruce_planks','oak_log','oak_log_top','grass_block_top',
  'grass_block_side','grass_block_side_overlay','dirt','stone','cobblestone',
  'cobblestone_mossy','stone_bricks','mossy_stone_bricks','oak_leaves','vine','wheat_stage_7','water_still'];
let useTextures = true, isNight = false;
let atmosphere=null,postFX=null,seasons=null;
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
  group.userData.seasonPlant=name!=='vine';group.userData.preserveSummerPlant=name==='vine';plants.push(group);
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
  const houseBox=(x,y,z,w,h,d,...rest)=>box(houseX(x),y,z,w*houseWidthScale,h,d,...rest);
  houseBox(-2,.14,-2.35,4.4,.28,3.6,brick,0x919487);
  houseBox(-2,.32,-2.35,4,.12,3.3,wood,0xaf834e);
  const wall=material('stripped_oak_log');
  houseBox(-2,1.6,-4.03,4.35,2.6,.18,wall,0xb99a65,shell);
  for(const x of [-4.12,.12])houseBox(x,1.6,-2.35,.18,2.6,3.55,wall,0xb99a65,shell);
  // Left front panel below/above window, right side door frame.
  houseBox(-2.85,.83,-.61,2.4,1.04,.18,wall,0xb99a65,shell);
  houseBox(-2.85,2.55,-.61,2.4,.65,.18,wall,0xb99a65,shell);
  for(const x of [-3.95,-1.76])houseBox(x,1.79,-.61,.22,.94,.18,wall,0xb99a65,shell);
  houseBox(-.03,1.6,-.61,.3,2.6,.18,wall,0xb99a65,shell);
  houseBox(-.9,2.68,-.61,1.65,.4,.18,wall,0xb99a65,shell);
  for(const x of [-4.14,.14])for(const z of [-4.04,-.6])houseBox(x,1.65,z,.24,2.9,.24,logFaces,0x6d5033,shell);
  const glow=new T.MeshStandardMaterial({color:0xffda8e,emissive:0xffb54d,emissiveIntensity:.7,roughness:.6});
  houseBox(-2.85,1.8,-.6,1.94,.9,.06,glow,0xffd478,shell);
  houseBox(-2.85,1.8,-.47,.085,1.03,.12,roof,0x61472f,shell);
  houseBox(-2.85,1.8,-.47,2.05,.085,.12,roof,0x61472f,shell);
  buildClassicHouse({T,box,material,shell});
  box(-3.3+homeItemShift.chimney,4.45,-3.2,.6,2.6,.6,brick,0x92958c,shell);
  box(-3.3+homeItemShift.chimney,5.77,-3.2,.78,.15,.78,brick,0x878a80,shell);
  houseBox(-2,.24,.3,4.65,.24,1.7,wood,0xa98049);
  for(const x of [-4.05,-3.5,-2.95])houseBox(x,.73,1.08,.1,.85,.1,logFaces,0x85643d);
  houseBox(-3.5,1.12,1.08,1.25,.13,.13,wood,0xb18b56);
  box(-.85,.13,1.35,1.35,.26,.65,wood,0xb18b56);
  box(-.85,.065,1.77,1.55,.13,.4,wood,0xb18b56);
  const tableBox=(x,...rest)=>box(x+homeItemShift.table,...rest);
  const bedBox=(x,...rest)=>box(x+homeItemShift.bed,...rest);
  tableBox(-2.7,.94,.3,.9,.13,.7,wood,0x9c733f);
  for(const x of [-3.02,-2.38])for(const z of [.08,.52])tableBox(x,.63,z,.09,.52,.09,logFaces,0x735637);
  tableBox(-1.85,.58,.3,.45,.14,.45,wood,0x9c733f);
  for(const x of [-2.01,-1.69])tableBox(x,.4,.3,.1,.3,.34,logFaces,0x735637);
  bedBox(-3,.64,-2.55,1.2,.5,1.85,wood,0x987449);
  bedBox(-3,.93,-2.45,1.18,.1,1.7,flat(0xd1b98a),0xd1b98a);
  bedBox(-3,1,-2.18,1.18,.07,1.05,flat(0xa65c43),0xa65c43);
  bedBox(-3,1.03,-3.07,.92,.17,.4,flat(0xf4e8cb),0xf4e8cb);
  box(-.7,.87,-3,1.1,1,1,brick,0x8c9188);
  box(-.7,1.41,-3,1.15,.1,1.03,flat(0x37433f),0x37433f);
  box(-.7,1.51,-3,.6,.1,.6,flat(0x252e2b),0x252e2b);

  // Giant penjing: a winding trunk and asymmetric cloud-shaped foliage pads.
  // Crown top stays below the windmill roof; the southwest seat remains clear.
  const restTree=setZone('tree');
  const woodVoxels=new Set(),woodVoxelSize=.25;
  function bough(points,widths){
    // Rasterize the winding centreline into one shared grid of unrotated cubes.
    // Dense samples and a shared occupancy set keep bends joined without duplicates.
    for(let i=1;i<points.length;i++){
      const start=new T.Vector3(...points[i-1]),end=new T.Vector3(...points[i]);
      const steps=Math.ceil(start.distanceTo(end)/(woodVoxelSize*.25));
      const cells=Math.max(1,Math.round(widths[i-1]/woodVoxelSize));
      for(let step=0;step<=steps;step++){
        const point=start.clone().lerp(end,step/steps);
        const origin=[point.x,point.y,point.z].map(v=>Math.round(v/woodVoxelSize-cells/2));
        for(let dx=0;dx<cells;dx++)for(let dy=0;dy<cells;dy++)for(let dz=0;dz<cells;dz++){
          const [x,y,z]=[origin[0]+dx,origin[1]+dy,origin[2]+dz];
          if(y<0)continue;
          const key=x+','+y+','+z;if(woodVoxels.has(key))continue;woodVoxels.add(key);
          box((x+.5)*woodVoxelSize,(y+.5)*woodVoxelSize,(z+.5)*woodVoxelSize,
            woodVoxelSize,woodVoxelSize,woodVoxelSize,logFaces,0x765330);
        }
      }
    }
  }
  // The base leans right, folds back left, then rises into the off-centre crown.
  bough([[3,0,-2.8],[3.5,.85,-2.85],[3.9,1.65,-3],
    [3.65,2.45,-3.15],[2.8,3.25,-3.2],[2.35,4.1,-3.05],
    [2.75,4.95,-2.95],[3.45,5.75,-3.3],[3.65,6.65,-3.5]],
    [1.12,1,.88,.76,.65,.55,.44,.3]);
  for(const [x,z,w,d] of [[3.65,-2.8,1.1,.48],[3.1,-3.55,.55,1.15],[2.5,-3.2,.8,.45]])
    box(x,.18,z,w,.36,d,logFaces,0x765330);
  bough([[2.8,3.25,-3.2],[1.7,3.7,-2.85],[.6,3.95,-2.6],[.15,4.85,-2.4]],[.55,.4,.26]);
  bough([[2.35,4.1,-3.05],[3.6,4.35,-2.7],[4.8,4.15,-2.35],[5.65,4.75,-2.2],[5.9,5.25,-2.45]],[.5,.43,.32,.23]);
  bough([[2.75,4.95,-2.95],[2.4,4.55,-1.8],[2.8,4.85,-.65]],[.36,.24]);
  bough([[2.35,4.1,-3.05],[2.7,4.5,-4.2],[3.65,5.35,-5.05]],[.4,.27]);
  bough([[3.45,5.75,-3.3],[4.55,5.9,-4.15],[5.3,6.35,-4.5]],[.3,.2]);
  // Flattened, staggered pads reveal the crooked branches between tiers.
  for(const [x,y,z,w,h,d] of [[.35,5.05,-2.65,2.7,.9,2.4],
    [.85,5.6,-2.95,2.05,.55,1.8],[1.1,4.85,-1.05,2, .65,1.65],
    [5.45,5.3,-2.45,2.9,.85,2.55],[5.1,5.85,-2.75,2.15,.5,1.85],
    [4.95,5.05,-.85,2.1,.65,1.7],[2.8,5.15,-.75,2.5,.65,2],
    [3.5,5.6,-5,2.9,.85,2.4],[3.15,6.15,-4.95,2.05,.5,1.8],
    [5.1,6.4,-4.35,2.35,.7,2.1],[3.3,6.35,-3.05,2.3,.7,1.9],
    [3.65,7.25,-3.55,2.65,.8,2.35],[3.35,7.8,-3.55,1.85,.4,1.65]])
    box(x,y,z,w,h,d,leaf,0x618e40);

  // High-resolution wheat uses the legacy-named HD texture in this demo pack.
  setZone('wheat');
  box(-3.55,.015,2.95,2.3,.05,1.9,dirt,0x79502d);
  for(let i=0;i<5;i++)for(let j=0;j<3;j++) {
    const x=-4.5+i*.43,z=2.35+j*.58;
    plant(x,.07,z,.7,'wheat_stage_7',0xffffff);
    const stem=box(x,.35,z,.04,.6,.04,flat(0xb19b3e),0xb19b3e);
    const head=box(x,.69,z,.14,.25,.14,flat(0xe0bd59),0xe0bd59);
    stem.userData.seasonPlant=head.userData.seasonPlant=true;stem.userData.onlyPlain=head.userData.onlyPlain=true;
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
  waterMap.wrapS=waterMap.wrapT=T.RepeatWrapping;waterMap.repeat.set(1,1);
  const waterMat=new T.MeshStandardMaterial({map:waterMap,color:0x3daeb7,roughness:.2,metalness:.15});
  const waterPositions=[],waterUVs=[];
  for(const [x,z]of pondCells){
    const corners=[[x-.25,z-.25],[x-.25,z+.25],[x+.25,z+.25],[x+.25,z-.25]];
    for(const i of [0,1,2,0,2,3]){const [px,pz]=corners[i];waterPositions.push(px,-.05,pz);waterUVs.push(px,pz);}
  }
  const waterGeometry=new T.BufferGeometry();
  waterGeometry.setAttribute('position',new T.Float32BufferAttribute(waterPositions,3));
  waterGeometry.setAttribute('uv',new T.Float32BufferAttribute(waterUVs,2));waterGeometry.computeVertexNormals();
  const water=new T.Mesh(waterGeometry,waterMat);water.name='irregular-pond-water';water.receiveShadow=true;
  water.userData.textured=waterMat;water.userData.plain=flat(0x41adbf);meshes.push(water);placement.add(water);
  let bankIndex=0;
  for(const [x,z]of pondCells)for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){
    if(isPondLocal(x+dx*.5,z+dz*.5))continue;
    // Open inlet and dock access: never place a stone across either connection.
    const [ox,,oz]=propOffset('pond');
    if(isWater(x+dx*.5+ox,z+dz*.5+oz))continue;
    if(dx===-1&&x<2&&z>1.2&&z<2.5)continue;
    const n=bankIndex++,length=[.39,.55,.44,.32,.51][n%5],depth=[.32,.43,.27,.38][n%4],h=[.22,.34,.18,.42,.27][n%5];
    const px=x+dx*(.25+depth*.22),pz=z+dz*(.25+depth*.22);
    const stoneMesh=box(px,h/2-.035,pz,dx?depth:length,h,dz?depth:length,n%3===0?stone:moss,n%3===0?0xa5aaa0:0x9a9f94);
    stoneMesh.name='uneven-pond-bank';
  }
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
  setZone('home');lantern(-3.8,2.38,.8);setZone('tree');
  // Suspended lanterns and berry vines sway as a whole from their attachment point.
  for(const [i,[x,y,z,length]] of [[.75,4.7,-1.1,1.15],[5.5,4.8,-1.25,.95],[3.5,4.65,.1,1.1]].entries()){
    const hanger=new T.Group();hanger.position.set(x,y,z);restTree.add(hanger);placement=hanger;
    box(0,-length/2,0,.035,length,.035,flat(0x424939),0x424939);
    lantern(0,-length-.2,0);
    animated.push(t=>{hanger.position.x=x+Math.sin(t*.7+i*1.7)*.035;hanger.position.z=z+Math.cos(t*.6+i)*.025;});
  }
  const berryGlow=new T.MeshStandardMaterial({color:0xffd88a,emissive:0xffa630,emissiveIntensity:1.8,roughness:.5});
  for(const [i,[x,y,z,length]] of [[-.05,4.8,-2.5,1.3],[1.75,4.65,.05,1.25],[4.65,4.85,.1,1.5],[6.1,5.1,-3.2,1.2],[2.2,5.3,-5.6,.9],[3.9,4.9,-.2,.8]].entries()){
    const vine=new T.Group();vine.position.set(x,y,z);restTree.add(vine);placement=vine;
    box(0,-length/2,0,.055,length,.055,flat(0x547741),0x547741);
    for(let n=0;n<3;n++){
      const y=-length+n*.31,dx=n%2?.12:-.12;
      box(dx,y+.13,0,.25,.07,.16,leaf,0x618e40);
      const berry=box(dx,y,0,.17,.22,.17,berryGlow,0xffd88a);berry.userData.plain=berryGlow;
    }
    animated.push(t=>{vine.position.x=x+Math.sin(t*.85+i)*.035;});
  }
  setZone('tree');
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
    const key=[mesh.parent.uuid,mesh.geometry.uuid,...mats.map(m=>m.uuid),mesh.userData.plain.uuid,mesh.visible,!!mesh.userData.seasonPlant,!!mesh.userData.preserveSummerPlant,mesh.userData.seasonBaseY,JSON.stringify(mesh.userData.wind||null)].join(':');
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
  seasons=createSeasons({island,maps,meshes,plants,meadow});
  life=createLife({scene,ambient,sun,lamps,weatherBounds:[38,32],rainFloor:(x,z)=>heightAt(x,z)+(insideMovedHouse({x,z})?4.8:x>-12.6&&x<-9.4&&z>-4&&z<-1.35?2.5:.05),onNight:value=>{isNight=value;}});
  realTime=createRealTime(life,seasons);
  realTime.apply(window.islandCameraProperties||{});
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
    resident,life,postFX,seasons,getState:()=>({season:seasons.state.current,following,lighting:atmosphere.enabled,textured:useTextures,night:isNight,roofOpen:!shell.visible,meshCount:meshes.length,logicalMeshCount,areas:6,resident:resident.getState(),world:{...life.state}}),setTextures};
}
function setTextures(value){
  useTextures=value;
  for(const mesh of meshes){mesh.material=value?mesh.userData.textured:mesh.userData.plain;if(mesh.userData.onlyPlain)mesh.visible=!value;}
  for(const plant of plants)plant.visible=value;
  seasons?.apply(value);
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
let realTime=null;
const focus=new T.Vector3(0,1.2,0);
const views={all:[0,1.2,0,65],home:[-4.5,2.6,-2.5,25],garden:[-10,1,4.2,19],river:[9,.4,-1.2,22],mill:[-10,6.8,-8.5,29],lookout:[10,1.8,7,20]};
function setFollowing(value){if(value&&wallpaperCamera.locked)return;following=value;const button=document.getElementById('resident-focus');button.textContent=value?'停止跟随':'跟随酒狐';button.setAttribute('aria-pressed',String(value));}
setFollowing(false);
function setView(name){if(wallpaperCamera.locked)return;setFollowing(false);const [x,y,z,d]=views[name];focus.set(x,y,z);distance=d;yaw=name==='mill'?-.8:.42;pitch=name==='mill'?.65:.59;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.getElementById('reset').onclick=()=>{if(!wallpaperCamera.locked)applyDefaultCamera();};
const pointers=new Map();let pinch=0;
function applyDefaultCamera(){setFollowing(false);focus.set(0,1.2,0);yaw=T.MathUtils.degToRad(wallpaperCamera.yaw);pitch=T.MathUtils.degToRad(wallpaperCamera.pitch);distance=65*100/wallpaperCamera.zoom;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='all')));}
window.applyIslandCameraProperties=properties=>{
 realTime?.apply(properties);
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
 const dt=realTime.enabled?realDt:life.state.paused?0:realDt*life.state.speed;
 life.update(dt);realTime.sync();if(realTime.enabled)life.update(0);seasons.update(dt);resident.update(dt);shell.visible=!(manualRoof||resident.isInside());
 if(following){const p=resident.sprite.position;focus.set(p.x,p.y+.7,p.z);}
 const d=distance*Math.max(1,.98/camera.aspect);camera.position.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*d,focus.y+Math.sin(pitch)*d,focus.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(focus);camera.updateMatrixWorld();resident.updateFacing(camera);
 animated.forEach(update=>update(life.state.elapsed));atmosphere.update(life.state);
 if(postFX)postFX.render();else renderer.render(scene,camera);
}
build().then(render).catch(error=>{document.getElementById('status').textContent='样板加载失败：'+error.message;console.error(error);});


