// Upper structure follows the original removable cottage shell.
export const houseWidthScale=1.5;
export const houseX=x=>.23+(x-.23)*houseWidthScale;
export function buildClassicHouse({T,box,material,shell}){
 const timber=material('dark_oak_planks'),slate=material('cobbled_deepslate'),wall=material('stripped_oak_log');
 const B=(x,y,z,w,h,d,m=timber)=>box(houseX(x),y,z,w*houseWidthScale,h,d,m,m===slate?0x51545a:m===wall?0xb99a65:0x493321,shell);
 function beam(a,b,s=.14){const start=new T.Vector3(houseX(a[0]),a[1],a[2]),end=new T.Vector3(houseX(b[0]),b[1],b[2]),delta=end.clone().sub(start),mid=start.clone().add(end).multiplyScalar(.5);const m=box(...mid.toArray(),s,delta.length(),s,timber,0x493321,shell);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}
 for(const y of [.47,1.28,2.87]){B(-2,y,-4.15,4.5,.17,.17);for(const x of [-4.23,.23])B(x,y,-2.35,.17,.17,3.7);}
 for(const x of [-4.16,-2.85,-1.65,.16])B(x,1.65,-4.15,.18,2.75,.18);
 for(const x of [-4.23,.23]){
  for(const z of [-4.03,-2.35,-.61])B(x,1.65,z,.18,2.75,.18);
  for(const [a,b]of [[-3.93,-2.45],[-2.25,-.71]]){beam([x,1.38,a],[x,2.78,b]);beam([x,2.78,a],[x,1.38,b]);}
 }
 for(const [a,b]of [[-4.05,-2.95],[-2.75,-1.75],[-1.55,.05]])beam([a,1.38,-4.16],[b,2.78,-4.16]);
 for(const x of [-4.16,-1.65,.16])B(x,1.65,-.46,.18,2.75,.18);
 B(-2,2.91,-.46,4.5,.2,.2);B(-2.85,.46,-.46,2.45,.18,.18);
 // Thin stair-stepped roof skins with timber verges, fascia and ridge caps.
 function gable(cx,cz,width,depth,eave,rise,axis='z'){
  const p=(u,y,v)=>axis==='z'?[cx+u,y,cz+v]:[cx+v,y,cz+u];
  const block=(u,y,v,w,h,d,m)=>axis==='z'?B(...p(u,y,v),w,h,d,m):B(...p(u,y,v),d,h,w,m);
  const n=Math.ceil(width/.42),step=width/n;
  for(let i=0;i<n;i++){const u=-width/2+(i+.5)*step,y=eave+rise*(1-Math.abs(u)/(width/2));block(u,y,0,step+.012,rise*2/n+.06,depth,slate);for(const v of [-depth/2,depth/2])block(u,y,v,step+.018,rise*2/n+.09,.17,timber);}
  for(const u of [-width/2,width/2])block(u,eave-.03,0,.18,.24,depth+.16,timber);
  block(0,eave+rise+.02,0,.24,.24,depth+.18,timber);
  for(const v of [-depth/2+.14,depth/2-.14]){
   for(let i=0;i<n;i++){const u=-width/2+(i+.5)*step,h=rise*(1-Math.abs(u)/(width/2))-.18;if(h>0)block(u,eave+h/2-.1,v,step,h,.12,wall);}
   const face=v+Math.sign(v)*.1;
   beam(p(-width/2,eave-.1,face),p(width/2,eave-.1,face),.18);beam(p(0,eave-.1,face),p(0,eave+rise-.12,face),.16);
   for(const s of [-1,1])beam(p(s*(width/2-.15),eave,face),p(0,eave+rise-.12,face),.16);
  }
 }
 gable(-2,-2.35,4.95,4.05,3.15,2.15);
 gable(-2,-2.1,2.8,5.05,3.3,1.42,'x');
 gable(-2.85,-.48,2.25,1.35,3.18,1.35);
 // Original porch footprint and clear doorway, with visible knee braces.
 B(-2,2.79,.3,4.9,.16,1.95,slate);
 for(const z of [-.68,1.28])B(-2,2.77,z,5.05,.22,.16);
 for(const x of [-4.46,.46])B(x,2.77,.3,.16,.22,1.95);
 B(-2,2.58,1.05,4.45,.23,.22);
 for(const x of [-4.1,.1]){B(x,1.47,1.05,.23,2.4,.23);beam([x,2.02,1.05],[x+(x<0?.48:-.48),2.55,1.05],.17);beam([x,2.02,1.05],[x,2.62,.43],.17);B(x,2.57,.23,.18,.2,1.8);}
 // Sparse leaf cubes sit on the roof steps, leaving the slate and ridge visible.
 const leaves=material('oak_leaves',0x799b50,true);
 for(const [x,z,w,d]of [[-3.9,-3.95,.46,.5],[-3.64,-3.7,.42,.42],[-.45,-.85,.46,.5],[-.7,-1,.35,.36],[-2.5,-4.05,.36,.4]]){
  const n=Math.ceil(4.95/.42),step=4.95/n,u=Math.floor((x+2+4.95/2)/step)*step-4.95/2+step/2;
  const top=3.15+2.15*(1-Math.abs(u)/(4.95/2))+(2.15*2/n+.06)/2;
  box(houseX(x),top+.12,z,w,.26,d,leaves,0x799b50,shell);
 }
 for(const [x,z]of [[-4.05,.8],[-3.72,.86]])box(houseX(x),2.98,z,.38,.24,.42,leaves,0x799b50,shell);
}
