import * as T from './vendor/three.module.js';

// World-space bending keeps crossed planes and instanced plants moving together.
export function addPlantWind(island){
 const time={value:0};let count=0;
 island.updateMatrixWorld(true);
 island.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const material=mesh.material;if(Array.isArray(material))return;
  const source=material.map?.image?.src||'';
  const meadow=mesh.name.startsWith('meadow-');
  const leaves=source.includes('oak_leaves');
  const wheat=source.includes('wheat_stage');
  const flowerHead=source.includes('sunflower_front');
  if(!meadow&&!leaves&&!wheat&&!flowerHead&&!mesh.userData.wind)return;
  const geometry=mesh.geometry.clone();mesh.geometry=geometry;
  const matrix=new T.Matrix4(),origin=new T.Vector3();
  const instances=mesh.isInstancedMesh?mesh.count:1,params=new Float32Array(instances*3);
  for(let i=0;i<instances;i++){
   if(mesh.isInstancedMesh){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);}else matrix.copy(mesh.matrixWorld);
   origin.setFromMatrixPosition(matrix);
   const spec=mesh.userData.wind;
   let root=spec?.root??0,amplitude=spec?.amplitude??.055,height=spec?.height??(leaves?4:1);
   if(meadow||wheat){geometry.computeBoundingBox();root=new T.Vector3(0,geometry.boundingBox.min.y,0).applyMatrix4(matrix).y;height=new T.Vector3(0,geometry.boundingBox.max.y,0).applyMatrix4(matrix).y-root;amplitude=.045*Math.min(1.6,height);}
   if(flowerHead){root=.015;height=1.7;amplitude=.075;}
   params.set([root,amplitude,Math.max(.1,height)],i*3);
  }
  if(mesh.isInstancedMesh)geometry.setAttribute('plantWind',new T.InstancedBufferAttribute(params,3));
  else{const data=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<data.length;i+=3)data.set(params,i);geometry.setAttribute('plantWind',new T.BufferAttribute(data,3));}
  function patch(mat){
   mat.onBeforeCompile=shader=>{
    shader.uniforms.plantWindTime=time;
    shader.vertexShader='attribute vec3 plantWind;\nuniform float plantWindTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
      vec4 plantWorld=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
       plantWorld=instanceMatrix*plantWorld;
      #endif
      plantWorld=modelMatrix*plantWorld;
      float heightWeight=clamp((plantWorld.y-plantWind.x)/plantWind.z,0.0,1.0);
      heightWeight*=heightWeight;
      float breeze=sin(plantWindTime*1.35+plantWorld.x*.38+plantWorld.z*.24)*.7+sin(plantWindTime*2.1+plantWorld.z*.43)*.3;
      vec3 windOffset=vec3(breeze,0.0,breeze*.48)*plantWind.y*heightWeight;
      vec4 mvPosition=viewMatrix*vec4(plantWorld.xyz+windOffset,1.0);
      gl_Position=projectionMatrix*mvPosition;
    `).replace('#include <worldpos_vertex>',T.ShaderChunk.worldpos_vertex.replace('worldPosition = modelMatrix * worldPosition;','worldPosition = modelMatrix * worldPosition;\n worldPosition.xyz += windOffset;'));
   };
   mat.customProgramCacheKey=()=> 'rooted-plant-wind-v1';return mat;
  }
  const original=material;mesh.material=patch(original.clone());
  if(mesh.userData.textured===original)mesh.userData.textured=mesh.material;
  if(mesh.userData.plain)mesh.userData.plain=patch(mesh.userData.plain.clone());
  mesh.customDepthMaterial=patch(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:material.map,alphaTest:material.alphaTest,side:material.side}));
  mesh.customDistanceMaterial=patch(new T.MeshDistanceMaterial({map:material.map,alphaTest:material.alphaTest,side:material.side}));
  geometry.computeBoundingSphere();geometry.boundingSphere.radius+=.15;
  count++;
 });
 return {count,update(elapsed){time.value=elapsed;}};
}
