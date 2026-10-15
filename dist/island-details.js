// Hand-built expansion: every structure uses the same local material library.
import {streamCells,classicNodes} from './classic-layout.js';
export {streamCells};

export function enrichIsland({T,island,box,flat,material,plant,wood,roof,logFaces,stone,brick,moss,leaf,dirt,waterMat,lantern,animated,setZone,heightAt}){
  const metal=flat(0x465047),cream=flat(0xe9d9b0),green=flat(0x64924b);
  const B=(x,y,z,w,h,d,mat=wood,color=0xa48050,parent=undefined)=>{
    const mesh=box(x,y,z,w,h,d,mat,color,parent);
    if(x>-8.3&&x<-5.7&&z>1.2&&z<5.5&&y>.16&&[leaf,green].includes(mat)||x>-8.3&&x<-5.7&&z>1.2&&z<5.5&&[0xd98e43,0x95b66e,0xc5513d].includes(color))mesh.userData.wind={root:.16,height:.55,amplitude:.025};
    return mesh;
  };
  function fence(x,z,w,axis='x'){
    for(let i=0;i<=w;i++)B(x+(axis==='x'?i:0),.46,z+(axis==='z'?i:0),.12,.92,.12,logFaces,0x795832);
    for(const y of [.35,.7])B(x+(axis==='x'?w/2:0),y,z+(axis==='z'?w/2:0),axis==='x'?w:.08,.1,axis==='z'?w:.08);
  }
  function pot(x,y,z,color=0xcb8061){
    B(x,y+.18,z,.36,.36,.36,flat(color),color);
    B(x,y+.38,z,.43,.09,.43,flat(color),color);
    B(x,y+.44,z,.27,.07,.27,dirt,0x785c3f);
  }
  function flower(x,y,z,color=0xedb1a4){
    const W=(...args)=>{const mesh=B(...args);mesh.userData.wind={root:y,height:.5,amplitude:.025};return mesh;};
    W(x,y+.18,z,.035,.35,.035,green,0x64924b);
    W(x,y+.39,z,.21,.07,.11,flat(color),color);
    W(x,y+.39,z,.11,.07,.21,flat(color),color);
    W(x,y+.43,z,.07,.04,.07,flat(0xefcb65),0xefcb65);
  }
  function tree(x,z,s=1,fruit=false){
    B(x,1.2*s,z,.38*s,2.4*s,.38*s,logFaces,0x765637);
    for(const [dx,dy,dz,w]of [[0,2.65,0,1.55],[-.7,2.25,0,1.1],[.7,2.3,.15,1.1],[0,2.2,.65,1.2],[0,2.3,-.7,1.2],[0,3.3,0,1]])B(x+dx*s,dy*s,z+dz*s,w*s,.95*s,w*s,leaf,0x6f9547);
    if(fruit)for(const [dx,dy,dz]of [[-.65,2.05,.54],[.65,2.4,.58],[.25,2.75,.72],[-.4,2.45,-.65]])B(x+dx*s,dy*s,z+dz*s,.18,.18,.18,flat(0xbc5440),0xbc5440);
  }
  function crate(x,y,z){
    B(x,y+.32,z,.65,.64,.65);
    for(const dx of [-.26,.26])B(x+dx,y+.32,z+.34,.07,.64,.055,roof,0x695135);
    for(const dy of [.07,.55])B(x,y+dy,z+.34,.65,.07,.055,roof,0x695135);
  }
  function barrel(x,z){
    B(x,.42,z,.62,.84,.62,wood,0xa77f48);
    for(const y of [.14,.67]){B(x,y,z,.67,.07,.67,metal,0x465047);}
    B(x,.85,z,.6,.03,.6,logFaces,0xad8955);
  }

  // West: three crop beds with irrigation, vegetables and a garden cart.
  setZone('garden');
  for(const z of [1.8,3.35,4.9]){
    B(-7,.08,z,2.4,.16,1.05,dirt,0x735332);
    for(const dz of [-.59,.59])B(-7,.13,z+dz,2.65,.16,.12);
    for(const x of [-8.26,-5.74])B(x,.13,z,.12,.16,1.25);
    for(let i=0;i<5;i++)for(const dz of [-.26,.26]){
      const x=-7.95+i*.48;
      if(z<2){B(x,.24,z+dz,.12,.23,.12,flat(0xd98e43),0xd98e43);B(x,.4,z+dz,.26,.08,.07,green,0x64924b);B(x,.4,z+dz,.07,.08,.26,green,0x64924b);}
      else if(z<4){B(x,.27,z+dz,.3,.28,.3,leaf,0x78a555);B(x,.4,z+dz,.17,.08,.17,flat(0x95b66e),0x95b66e);}
      else{B(x,.35,z+dz,.04,.6,.04,logFaces,0x7a6239);B(x,.53,z+dz,.29,.3,.19,leaf,0x659147);B(x+.12,.44,z+dz+.12,.12,.14,.12,flat(0xc5513d),0xc5513d);}
    }
  }
  fence(-8.7,.9,5,'z');fence(-8.7,5.9,3);
  B(-5.5,.38,5.6,.7,.13,1);B(-5.5,.64,6.06,.7,.4,.1);
  for(const x of [-5.86,-5.14]){B(x,.6,5.6,.08,.4,1);B(x,.65,6.45,.065,.065,.8,logFaces,0x765637);}
  for(const x of [-5.88,-5.12])B(x,.22,5.45,.15,.4,.4,metal,0x465047);
  B(-5.5,.54,5.6,.4,.25,.65,leaf,0x74a24d);
  pot(-5.7,0,.4);flower(-5.7,.45,.4,0xf0cc80);

  // West storage lean-to: open front, stacked crates, barrels and a woodpile.
  setZone('shed');
  B(-7,.11,-1.65,2.8,.22,2.25,brick,0x999c8b);
  B(-7,1.03,-2.72,2.8,1.8,.12,wood,0xa17a46);
  for(const x of [-8.3,-5.7])for(const z of [-2.68,-.63])B(x,1.06,z,.16,2.05,.16,logFaces,0x795634);
  const shedRoof=B(-7,2.18,-1.65,3.12,.17,2.6,roof,0x6e5132);shedRoof.rotation.x=.12;
  crate(-7.9,.22,-2);crate(-7.2,.22,-2);crate(-7.6,.87,-2);barrel(-6.25,-1.9);
  for(let n=0;n<4;n++)B(-8.55,.22+n*.19,-1.25,.4,.17,1.1,logFaces,0x866339);
  lantern(-5.76,1.66,-.66);

  // Rear windmill provides a second landmark and a slow rotating sail assembly.
  setZone('mill');
  B(-6,3.75,-5.25,1.8,7.5,1.8,brick,0xa3a390);
  B(-6,7.74,-5.25,2.25,.4,2.2,wood,0xa57e48);
  for(let n=0;n<4;n++)B(-6,8.14+n*.46,-5.25,2.45-n*.5,.48,2.3-n*.35,roof,0x6e5237);
  B(-6,.65,-4.31,.55,1.3,.06,roof,0x685035);
  const rotor=new T.Group();rotor.position.set(-6,7.1,-4.02);rotor.scale.setScalar(2);setZone('mill').add(rotor);
  B(0,0,0,.36,.36,.35,logFaces,0x795832,rotor);
  for(let i=0;i<4;i++){
    const arm=new T.Group();arm.rotation.z=i*Math.PI/2;rotor.add(arm);
    B(0,1.02,0,.1,2.1,.09,wood,0x96774d,arm);
    B(.28,1.26,.01,.58,1.4,.07,cream,0xe9d9b0,arm);
    for(const y of [.65,1.04,1.45,1.88])B(.28,y,.065,.63,.045,.04,wood,0x96774d,arm);
  }
  animated.push(t=>{rotor.rotation.z=-t*.18;});
  crate(-4.5,0,-5.3);B(-4.5,.73,-5.3,.48,.13,.48,flat(0xd6b26c),0xd6b26c);

  // The stream joins the old pond, passes under a bridge, and spills over the rear cliff.
  setZone('pond');
  for(const key of streamCells){
    const [x,z]=key.split(',').map(Number);
    B(x,-.09,z,1,.06,1,waterMat,0x41adbf);
    for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nx=x+dx,nz=z+dz;
      if(streamCells.has(`${nx},${nz}`)||(nx>=2&&nx<=4&&nz>=1&&nz<=3)||nz<-12)continue;
      B(x+dx*.56,.04,z+dz*.56,dx?.18:.65,.17,dz?.18:.65,moss,0x8f9d83);
    }
  }
  const falling=new T.MeshStandardMaterial({color:0x5baac1,transparent:true,opacity:.78,roughness:.35});
  B(5,-1.8,-12.48,.84,3.65,.12,falling,0x5baac1);
  for(let n=0;n<5;n++){
    const drop=B(4.68+n*.15,-2,-12.58,.035,.4,.04,flat(0xd1ecdf),0xd1ecdf);
    drop.userData.dynamic=true; animated.push(t=>{drop.position.y=-((t*1.4+n*.61)%4.2);});
  }
  for(let i=0;i<8;i++){const x=4.82+i*.31;B(x,.2+Math.sin(i/7*Math.PI)*.16,-2.02,.29,.13,1.35);}
  for(const z of [-2.72,-1.32]){
    for(const x of [4.85,6,7])B(x,.62,z,.09,1.04,.09,logFaces,0x7d5d37);
    B(5.92,1.07,z,2.25,.09,.09);
  }
  lantern(7,1.37,-1.32);
  for(const [x,z]of [[4.4,-5.5],[6,-4.4],[7,.8],[5.2,3.7]]){
    for(let n=0;n<3;n++)B(x+n*.12,.4+n*.06,z,.035,.8+n*.12,.035,green,0x77a464);
  }
  for(const [x,z]of [[3.7,2.7],[2.3,1.2]]){B(x,-.002,z,.37,.025,.28,green,0x75a362);flower(x,.02,z,0xd8a8b3);}

  // Southeast: timber lookout pergola, table, stools and a small telescope.
  setZone('lookout');
  for(let i=0;i<10;i++)B(6.6,.2,4.8+i*.25,3.1,.18,.23);
  for(const x of [5.15,8.05])for(const z of [4.75,7])B(x,1.42,z,.16,2.7,.16,logFaces,0x785b35);
  for(const x of [5.15,8.05])B(x,2.75,5.88,.18,.16,2.65,roof,0x735734);
  for(let n=0;n<7;n++)B(5.05+n*.5,2.89,5.88,.17,.12,2.85,wood,0xa18454);
  for(const x of [5.15,8.05]){B(x,.92,5.85,.09,.1,2.3);for(const z of [5.2,6,6.75])B(x,.58,z,.07,.7,.07);}
  B(6.35,.85,6.4,.9,.13,.8);B(6.35,.5,6.4,.16,.6,.16,logFaces,0x785b35);
  for(const x of [5.7,7]){B(x,.49,6.35,.45,.13,.45);B(x,.29,6.35,.22,.36,.22,logFaces,0x785b35);}
  B(6.35,.98,6.4,.21,.14,.18,cream,0xe9d9b0);
  const scope=B(7.3,1.15,5.25,.22,.22,.85,metal,0x465047);scope.rotation.x=-.35;
  for(const dx of [-.22,.22]){const leg=B(7.3+dx,.63,5.35,.06,1,.06,logFaces,0x8b6a40);leg.rotation.z=dx;}
  lantern(5.15,2.3,4.75);
  B(6.6,.09,4.45,1.3,.18,.45,brick,0xa4a99b);

  // Camp clearing, well, and a picnic corner on the new southern lawn.
  setZone('fire');
  for(let i=0;i<10;i++){const a=i*Math.PI/5;B(.1+Math.cos(a)*1.35,.025,3.6+Math.sin(a)*1.1,.5,.05,.38,dirt,0xa48e63);}
  for(const [x,z]of [[-2,6.2],[1.6,6.6]]){B(x,.48,z,1.2,.17,.38);for(const dx of [-.45,.45])B(x+dx,.24,z,.1,.4,.32,logFaces,0x785b35);}
  const wellX=3.1,wellZ=6.2;
  setZone('well');
  for(const [dx,dz,w,d]of [[-.6,0,.22,1.4],[.6,0,.22,1.4],[0,-.6,1,.22],[0,.6,1,.22]])B(wellX+dx,.42,wellZ+dz,w,.84,d,moss,0x949f86);
  B(wellX,.25,wellZ,.95,.03,.95,waterMat,0x41adbf);
  for(const dx of [-.7,.7])B(wellX+dx,1.15,wellZ,.13,2.3,.13,logFaces,0x785b35);
  B(wellX,1.75,wellZ,1.6,.12,.12,logFaces,0x785b35);
  for(let n=0;n<3;n++)B(wellX,2.3+n*.2,wellZ,1.9-n*.55,.2,1.7,roof,0x735734);
  B(wellX,1.36,wellZ,.025,.74,.025,cream,0xe9d9b0);
  B(wellX,.94,wellZ,.25,.3,.25,wood,0xa48050);
  // Sparse tree clusters leave the expanded paths and central lawn open.
  setZone(null);
  for(const [x,z,s]of [[-4,-9.2,.9],[0,-9,1],[3.2,-10,.85],[-13,-5.8,.8],[-7,10,.85],[13,-.5,.9],[12,-6,.85]]){
    const group=new T.Group();group.position.y=heightAt(x,z);island.add(group);
    const before=new Set(island.children);tree(x,z,s,true);
    for(const child of [...island.children])if(!before.has(child))group.add(child);
  }
  for(const name of ['gardenNorth','gardenTurn','southEast','orchard','millPath']){
    const [x,,z]=classicNodes[name],y=heightAt(x-.8,z);B(x-.8,y+.64,z,.12,1.28,.12,logFaces,0x775a34);lantern(x-.8,y+1.5,z);
  }
  // Window boxes, chimney cap and a mailbox make the home feel inhabited.
  setZone('home');
  B(-2.85,1.2,-.36,1.7,.2,.3,wood,0xa48050);
  for(const x of [-3.45,-3.05,-2.65,-2.25])flower(x,1.32,-.3,x<-3?0xeacb80:0xd997ad);
  B(.65,.6,1.05,.1,1.2,.1,logFaces,0x775a34);B(.65,1.2,1.05,.45,.3,.35,roof,0x6c573a);
  B(.65,1.21,1.24,.27,.025,.035,metal,0x465047);
  const smokeMat=new T.MeshBasicMaterial({color:0xe8e9da,transparent:true,opacity:.38,depthWrite:false});
  for(let i=0;i<4;i++){
    const p=B(-3.3,5.3+i*.35,-3.2,.2,.2,.2,smokeMat,0xe8e9da);
    p.userData.dynamic=true; animated.push(t=>{p.position.y=5.2+(t*.35+i*.4)%1.6;p.position.x=-3.3+Math.sin(t*.4+i)*.15;});
  }
  // Placed vegetation rather than random clutter in walking space.
  setZone(null);
  for(const [x,z]of [[-14,1],[-13,-5],[-9,9],[-3,11],[.7,11.4],[8,10.9],[14,2],[13,-3],[4.2,-11.3],[-.7,-11.1]]){
    const y=heightAt(x,z);B(x,y+.25,z,.65,.46,.65,leaf,0x719447);flower(x+.45,heightAt(x+.45,z+.12),z+.12,0xe5bd74);flower(x+.18,heightAt(x+.18,z+.4),z+.4,0xcda0bd);
    if(x>0)B(x-.35,heightAt(x-.35,z-.1)+.13,z-.1,.4,.26,.33,moss,0x949f86);
  }
}


