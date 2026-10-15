import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './dist/vendor/three.module.js';
import {buildDreamBlocks} from './dist/dream-blocks.js';
T.TextureLoader.prototype.loadAsync=async url=>{assert(fs.existsSync('dist/'+url.replace('./','')),url);return new T.Texture();};
const island=new T.Group(),shell=new T.Group();island.add(shell);const textured=[];
const result=await buildDreamBlocks({island,shell,waterMat:new T.MeshStandardMaterial(),lamps:[],animated:[],textured});
let instances=0;island.traverse(m=>{if(m.isMesh){assert(['BoxGeometry','PlaneGeometry'].includes(m.geometry.type),'Non-Minecraft geometry: '+m.geometry.type);if(m.isInstancedMesh)instances+=m.count;}});
assert(result.palette.includes('purpur_block'));assert(result.palette.includes('cherry_planks'));assert(result.palette.includes('oxidized_cut_copper'));assert(textured.length>20);assert(instances>1000);console.log(result.blockCount+' blocks/slabs/details; '+result.palette.length+' verified texture files; '+instances+' batched instances. Box and crossed-plane geometry only.');
