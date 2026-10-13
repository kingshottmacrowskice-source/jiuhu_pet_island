import * as THREE from './vendor/three.module.js';
export const poseNames=['站立','行走','行走','除草','除虫','树下坐着','炒菜','吃饭','侧面睡觉','侧面睡觉','篝火打盹','钓鱼','扫地','扫地','檐下躲雨','篝火闲坐'];
export async function loadSprites(){
 async function image(src){const i=new Image();i.src=src;await i.decode();return i;}
 const [daily,active,rest,motion]=await Promise.all([image('./jiuhu-daily-v3.png'),image('./jiuhu-active-v3.png'),image('./jiuhu-rest-v3.png'),image('./jiuhu-motion.png')]);
 function row(sheet,bounds,r,columns=4){
  // Generated sheets are not exact grids. Find the transparent gutter between
  // characters across the entire row before cropping, so tails stay attached.
  const strip=document.createElement('canvas');strip.width=sheet.width;strip.height=bounds[r+1]-bounds[r];
  const sc=strip.getContext('2d');sc.drawImage(sheet,0,bounds[r],sheet.width,strip.height,0,0,strip.width,strip.height);
  const alpha=sc.getImageData(0,0,strip.width,strip.height).data;
  const density=new Uint32Array(strip.width);
  for(let y=0;y<strip.height;y++)for(let x=0;x<strip.width;x++)if(alpha[(y*strip.width+x)*4+3]>180)density[x]++;
  const edges=[0],cell=sheet.width/columns;
  for(let col=1;col<columns;col++){
   const nominal=col*cell;let best=Math.round(nominal),score=Infinity;
   for(let x=Math.floor(nominal-cell*.3);x<Math.ceil(nominal+cell*.3);x++){
    const occupancy=density[x-1]+density[x]+density[x+1];
    const candidate=occupancy*sheet.width+Math.abs(x-nominal);
    if(candidate<score){score=candidate;best=x;}
   }edges.push(best);
  }edges.push(sheet.width);
  const originals=[];
  for(let col=0;col<columns;col++){
   const c=document.createElement('canvas');c.width=edges[col+1]-edges[col];c.height=strip.height;const ctx=c.getContext('2d');ctx.drawImage(strip,edges[col],0,c.width,c.height,0,0,c.width,c.height);
   const data=ctx.getImageData(0,0,c.width,c.height);let minX=c.width,minY=c.height,maxX=0,maxY=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let p=(y*c.width+x)*4;data.data[p+3]=data.data[p+3]>180?255:0;if(data.data[p+3]){minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY)}}ctx.putImageData(data,0,0);
   let sum=0,n=0;for(let y=minY;y<minY+(maxY-minY)*.32;y++)for(let x=minX;x<=maxX;x++){const p=(y*c.width+x)*4;if(data.data[p+3]&&data.data[p]>140&&data.data[p+1]>90&&data.data[p+2]<180){sum+=x;n++}}
   originals.push({c,minX,minY,maxX,maxY,anchor:n?sum/n:(minX+maxX)/2});
  }
  // One scale per clip; align the face horizontally and the feet vertically.
  // All pixels remain together: no body splitting, stretching or fake breathing.
  const maxHeight=Math.max(...originals.map(o=>o.maxY-o.minY+1));
  const maxLeft=Math.max(...originals.map(o=>o.anchor-o.minX)),maxRight=Math.max(...originals.map(o=>o.maxX-o.anchor));
  const scale=Math.min(52/maxHeight,25/Math.max(1,maxLeft),27/Math.max(1,maxRight));
  return originals.map(o=>{const c=document.createElement('canvas');c.width=56;c.height=64;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(o.c,Math.round(26-o.anchor*scale),Math.round(60-(o.maxY+1)*scale),Math.round(o.c.width*scale),Math.round(o.c.height*scale));return c});
 }
 const a=[0,315,565,830,1085,1270,1536],b=[0,302,568,848,1189];
 const rowsA=Array.from({length:6},(_,i)=>row(daily,a,i)),rowsB=Array.from({length:4},(_,i)=>row(active,b,i));
 const restBounds=[0,Math.round(rest.height*.56),rest.height];
 const standing=row(rest,restBounds,0),warming=row(rest,restBounds,1);
 const motionBounds=[0,Math.round(motion.height/3),Math.round(motion.height*2/3),motion.height];
 const oldWalk=row(motion,motionBounds,0,6),oldSweep=row(motion,motionBounds,1,6);
 const frames={walk:[0,1,3,4,3,1].map(i=>oldWalk[i]),sweep:[3,4,5,4].map(i=>oldSweep[i]),0:standing,3:rowsA[1],4:rowsB[3],5:rowsA[0],6:rowsA[2],7:rowsA[3],8:rowsA[4],10:rowsA[4],11:rowsA[5],14:standing,15:warming};
 function texture(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;}
 const clips=Object.fromEntries(Object.entries(frames).map(([key,images])=>[key,images.map(texture)]));
 const canvases=Array.from({length:16},(_,i)=>(frames[i]||frames[0])[0]);return {clips,canvases,textures:canvases.map(texture)};
}
