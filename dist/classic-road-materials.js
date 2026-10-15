import * as T from './vendor/three.module.js';

// Locally authored pixel variants for the two stones absent from the bundled pack.
export function completeRoadTextures(maps){
  let seed=7319;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function texture(name,source,paint){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.drawImage(source.image,0,0,128,128);paint(ctx);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    map.magFilter=T.NearestFilter;map.minFilter=T.LinearMipmapLinearFilter;
    map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=source.anisotropy;maps[name]=map;
  }
  texture('cracked_stone_bricks',maps.stone_bricks,ctx=>{
    for(let n=0;n<24;n++){
      let x=Math.floor(random()*128),y=Math.floor(random()*128);
      for(let s=0;s<8+random()*12;s++){
        ctx.fillStyle='#454941';ctx.fillRect(x,y,2,2);
        ctx.fillStyle='#b0b0a1';ctx.fillRect(x+2,y,1,2);
        x+=Math.floor(random()*3)-1;y+=2;
      }
    }
  });
  texture('andesite',maps.stone,ctx=>{
    ctx.fillStyle='rgba(147,149,145,.35)';ctx.fillRect(0,0,128,128);
    for(let n=0;n<1800;n++){
      const value=85+Math.floor(random()*100);
      ctx.fillStyle=`rgba(${value},${value+2},${value},.55)`;
      ctx.fillRect(Math.floor(random()*64)*2,Math.floor(random()*64)*2,2+Math.floor(random()*2)*2,2);
    }
  });
}
