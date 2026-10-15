import * as T from './vendor/three.module.js';
import {heightAt,inIsland,isWater,isRoad,cellSize,terraceStep,roadDepth} from './classic-layout.js';

// Only horizontal and vertical faces: half-width blocks, quarter-height terraces.
export function buildClassicTerrain({island,grass,grassSide,groundTop,dirt,stone,moss,flat,meshes,roadMaterials=[]}){
  const batches=new Map(),step=cellSize;
  function quad(material,a,b,c,d,uv){
    if(!batches.has(material))batches.set(material,{positions:[],uvs:[],normals:[]});
    const data=batches.get(material),normal=new T.Vector3().subVectors(new T.Vector3(...b),new T.Vector3(...a)).cross(new T.Vector3().subVectors(new T.Vector3(...c),new T.Vector3(...a))).normalize();
    for(const i of [0,1,2,0,2,3]){data.positions.push(...[a,b,c,d][i]);data.uvs.push(...uv[i]);data.normals.push(normal.x,normal.y,normal.z);}
  }
  const cells=new Map();
  for(let i=-34;i<34;i++)for(let j=-29;j<28;j++){
    const x=(i+.5)*step,z=(j+.5)*step+.3;
    if(inIsland(x,z))cells.set(`${i},${j}`,{i,j,x,z,wet:isWater(x,z),height:isWater(x,z)?-.75:heightAt(x,z)});
  }
  const layers=[{bottom:-1,scale:1,material:dirt},{top:-1,bottom:-2.5,scale:.96,material:stone},{top:-2.5,bottom:-4,scale:.82,material:stone},{top:-4,bottom:-5.5,scale:.61,material:moss},{top:-5.5,bottom:-6.5,scale:.36,material:stone},{top:-6.5,bottom:-7,scale:.14,material:stone}];
  const inLayer=(cell,index)=>!!cell&&index<layers.length&&(index===0||cell.x**2/(17*layers[index].scale)**2+cell.z**2/(14*layers[index].scale)**2<=1);
  for(const cell of cells.values()){
    const {i,j,x,z,wet,height}=cell,x0=x-step/2,z0=z-step/2,points=[[x0,z0],[x0,z0+step],[x0+step,z0+step],[x0+step,z0]];
    const paved=!wet&&inIsland(x,z,1)&&isRoad(x,z,2*cellSize)&&roadMaterials.length>0;
    // Replace the grass surface itself: no raised slab or coplanar faces.
    const hash=(Math.imul(i,73856093)^Math.imul(j,19349663))>>>0;
    const topMaterial=paved?roadMaterials[hash%roadMaterials.length]:wet?dirt:isRoad(x,z)?grass:groundTop(x,z,grass);
    quad(topMaterial,...points.map(([a,b])=>[a,height,b]),paved?[[0,0],[0,1],[1,1],[1,0]]:points);
    for(let layer=0;layer<layers.length;layer++){
      if(!inLayer(cell,layer))break;
      const {bottom,material}=layers[layer],top=layer===0?height:layers[layer].top;
      for(const [edge,di,dj]of [[0,-1,0],[1,0,1],[2,1,0],[3,0,-1]]){
        const neighbor=cells.get(`${i+di},${j+dj}`),neighborPresent=inLayer(neighbor,layer);
        const lower=neighborPresent?(layer===0?neighbor.height:top):bottom;
        if(lower>=top)continue;
        const [a,b]=[points[edge],points[(edge+1)%4]];
        const side=layer===0&&paved?topMaterial:layer===0&&neighborPresent&&!wet&&top-lower<=.5?(grassSide||grass):material;
        quad(side,[a[0],top,a[1]],[a[0],lower,a[1]],[b[0],lower,b[1]],[b[0],top,b[1]],[[0,top],[0,lower],[step,lower],[step,top]]);
      }
      if(!inLayer(cell,layer+1))quad(material,...[...points].reverse().map(([a,b])=>[a,bottom,b]),[...points].reverse());
    }
  }
  for(const [material,data]of batches){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(data.uvs,2));geometry.computeBoundingSphere();
    const mesh=new T.Mesh(geometry,material);mesh.name='classic-pixel-terrain';mesh.castShadow=mesh.receiveShadow=true;mesh.userData.textured=material;mesh.userData.plain=flat(material===dirt?0x987044:material===stone||material===moss||roadMaterials.includes(material)?0x858781:0x7ea655);island.add(mesh);meshes.push(mesh);
  }
  return {width:34,depth:28,cellSize,terraceStep,roadDepth,heightAt};
}
