const fs=require('fs');let p='dist/app.js',s=fs.readFileSync(p,'utf8');
s=s.replace("let sleepView='auto',spriteIndex=-1;","let spriteIndex=-1,animationKey='',animationStart=0,walkDistance=0;");
let a=s.indexOf("const sleepSelect="),b=s.indexOf("const galleryLink=",a);s=s.slice(0,a)+s.slice(b);
a=s.indexOf('function animateSprite(){');b=s.indexOf('const shadow=',a);
s=s.slice(0,a)+`function animateSprite(){
 const moving=route.length>0;
 const pose=({0:3,1:5,2:6,3:7,4:8,5:10,6:11,7:12,8:14,9:15})[current]??0;
 const key=moving?'walk':current===7?'sweep':String(pose);
 if(key!==animationKey){animationKey=key;animationStart=elapsed;}
 const frames=spriteSet.clips[key]||spriteSet.clips[0];
 const phase=moving?walkDistance*8:(elapsed-animationStart)*(key==='sweep'?5:3);
 const frame=Math.floor(phase)%frames.length;
 if(fox.material.map!==frames[frame])fox.material.map=frames[frame];
 fox.userData.pose=pose;fox.userData.animation=key;fox.userData.frame=frame;
 fox.material.rotation=0;fox.scale.set(moving||current===7?1.65:1.5,moving||current===7?1.89:1.75,1);
 fox.position.y=moving?.25:current===4?1.06:current===3?.46:.2;
 if(current===4&&!moving)fox.scale.set(1.7,1.55,1);
 if(current===5&&!moving)fox.scale.set(1.55,1.6,1);
}
`+s.slice(b);
s=s.replace('v.normalize().multiplyScalar(sim*.85);fox.position.add(v)','const step=Math.min(v.length(),sim*.85);walkDistance+=step;v.normalize().multiplyScalar(step);fox.position.add(v)');
fs.writeFileSync(p,s);
