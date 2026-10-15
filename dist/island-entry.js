const params=new URLSearchParams(location.search);
let saved;try{saved=localStorage.getItem('jiuhu-island');}catch{}
const selected=params.get('island')||(saved==='classic'?'classic':'dream');
const dream=selected!=='classic';
const switcher=document.createElement('button');switcher.id='island-switch';switcher.textContent=dream?'梦屿花庭 ⇄ 原始小岛':'原始小岛 ⇄ 梦屿花庭';
switcher.title='切换岛屿';switcher.onclick=()=>{const next=dream?'classic':'dream';try{localStorage.setItem('jiuhu-island',next);}catch{}const url=new URL(location.href);url.searchParams.set('island',next);location.href=url.href;};
document.body.append(switcher);
if(dream)import('./dream-island.js');else import('./material-preview.js');
