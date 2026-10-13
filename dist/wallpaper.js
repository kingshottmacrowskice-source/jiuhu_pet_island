(() => {
  const setDebug=value=>{
    document.body.classList.toggle('wallpaper-clean',!value);
    document.getElementById('debug-toggle').setAttribute('aria-pressed',String(value));
  };
  setDebug(new URLSearchParams(location.search).get('debug')==='1');
  document.getElementById('debug-toggle').onclick=()=>setDebug(false);
  addEventListener('keydown',event=>{
    if(event.ctrlKey&&event.shiftKey&&event.code==='KeyD'){event.preventDefault();setDebug(document.body.classList.contains('wallpaper-clean'));}
  });
  window.islandCameraProperties={};
  window.wallpaperPropertyListener={
    applyUserProperties(properties){if(properties.debug)setDebug(properties.debug.value===true);Object.assign(window.islandCameraProperties,properties);window.applyIslandCameraProperties?.(properties);},
    setPaused(paused){window.islandHostPaused=paused;}
  };
  function clock(){const now=new Date();document.getElementById('system-clock').textContent=now.toLocaleTimeString('zh-CN',{hour12:false});document.getElementById('system-date').textContent=now.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});}
  clock();setInterval(clock,1000);
})();
