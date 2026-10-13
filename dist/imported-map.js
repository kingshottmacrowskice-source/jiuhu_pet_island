import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export async function loadImportedMap(){
 const gltf=await new GLTFLoader().loadAsync('./island.glb');const root=gltf.scene;
 const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3());
 root.position.set(-center.x,-30,-center.z);const group=new THREE.Group();group.add(root);group.scale.setScalar(.22);
 root.traverse(m=>{if(!m.isMesh)return;m.castShadow=false;m.receiveShadow=true;for(const mat of Array.isArray(m.material)?m.material:[m.material]){mat.metalness=0;mat.roughness=.95;if(mat.map){mat.map.magFilter=THREE.NearestFilter;mat.map.minFilter=THREE.NearestMipmapLinearFilter;mat.map.needsUpdate=true}}});
 group.updateMatrixWorld(true);return {group,root,bounds};
}
