const fs=require('fs');const file='dist/app.js';let s=fs.readFileSync(file,'utf8');
s=s.replace("import * as THREE from './vendor/three.module.js';","import * as THREE from './vendor/three.module.js';\nimport {loadSprites} from './sprites.js';");
const start=s.indexOf("const tex=await new THREE.TextureLoader()"),end=s.indexOf("const shadow=",start);
if(start<0||end<0)throw Error('Sprite initialization not found');
s=s.slice(0,start)+`const spriteSet=await loadSprites();const tex=spriteSet.textures[0];const fox=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,alphaTest:.5}));fox.center.set(.5,.06);fox.scale.set(1.5,1.75,1);fox.position.set(-2,.24,2.8);island.add(fox);document.querySelector('.resident>img').src=spriteSet.canvases[0].toDataURL();let sleepView='auto',spriteIndex=-1;
const sleepSelect=document.createElement('select');sleepSelect.id='sleepView';sleepSelect.setAttribute('aria-label','床上睡姿');sleepSelect.innerHTML='<option value="auto">睡姿：随视角</option><option value="front">睡姿：正面</option><option value="side">睡姿：侧面</option>';sleepSelect.onchange=e=>sleepView=e.target.value;document.getElementById('activityMenu').append(sleepSelect);const galleryLink=document.createElement('a');galleryLink.href='./sprites.html';galleryLink.target='_blank';galleryLink.textContent='查看全部动作精灵 ↗';galleryLink.className='sprites-link';document.getElementById('activityMenu').append(galleryLink);
function animateSprite(){
 let i=0;const moving=route.length>0;
 if(moving)i=1+Math.floor(elapsed*5)%2;
 else if(current===0)i=3+Math.floor(elapsed/3)%2;
 else if(current===4)i=sleepView==='front'?9:sleepView==='side'?8:Math.abs(Math.sin(yaw))>.65?8:9;
 else i=({1:5,2:6,3:7,5:10,6:11,7:12+Math.floor(elapsed*2)%2,8:14,9:15})[current]??0;
 if(spriteIndex!==i){fox.material.map=spriteSet.textures[i];spriteIndex=i;fox.userData.pose=i;}
 fox.material.rotation=0;fox.scale.set(1.5,1.75,1);
 if(!moving){fox.position.y=current===4?.94:current===3?.46:.2; if(current===4){fox.scale.set(1.7,1.55,1);fox.position.y=.62;} if(current===5)fox.scale.set(1.55,1.6,1);}
}
`+s.slice(end);
s=s.replace("tool.visible=!route.length&&[0,6,7].includes(current)","tool.visible=false");
s=s.replace("camera.lookAt(target);renderer.render(scene,camera)","camera.lookAt(target);animateSprite();renderer.render(scene,camera)");
fs.writeFileSync(file,s);
fs.appendFileSync('dist/style.css',`\n#sleepView{width:100%;max-width:none;background:#83937318;padding:10px;margin-top:8px;border-radius:8px;font-size:11px}.sprites-link{display:block;text-align:center;color:inherit;font-size:11px;margin-top:14px;text-decoration:none}.resident>img{image-rendering:pixelated}\n`);
let readme=fs.readFileSync('README.md','utf8').replace('日常活动使用位置移动、简化的姿态变化和道具动画，不是逐帧角色动作精灵表。','日常活动使用 16 格独立精灵表，运行时按 48×56 逻辑像素显示。行走与扫地各有两帧，除草和除虫交替，其余为独立动作姿态。床上睡觉有正面与侧面，可手动选择或随视角切换。活动菜单中的「查看全部动作精灵」提供预览与逐张下载。');fs.writeFileSync('README.md',readme);
