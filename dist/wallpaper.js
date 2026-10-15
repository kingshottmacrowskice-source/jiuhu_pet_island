(() => {
  // Avoid Chromium's native select layout crash in Wallpaper Engine.
  // Controls are buttons in the original HTML, before the first layout.
  document.querySelectorAll('button[data-choices]').forEach(control=>{
    const choices=JSON.parse(control.dataset.choices);
    let index=0;
    const render=()=>{
      control.textContent=choices[index].text+' ↻';
      control.setAttribute('aria-label',control.dataset.label+'：'+choices[index].text+'，点击切换');
      control.title='点击切换；方向键选择';
    };
    Object.defineProperties(control,{
      value:{get:()=>choices[index].value,set:value=>{
        const next=choices.findIndex(choice=>choice.value===String(value));
        if(next>=0){index=next;render();}
      }},
      selectedOptions:{get:()=>[{textContent:choices[index].text}]}
    });
    const change=step=>{
      index=(index+step+choices.length)%choices.length;
      render();control.dispatchEvent(new Event('change',{bubbles:true}));
    };
    control.addEventListener('click',()=>change(1));
    control.addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.key)){
        event.preventDefault();change(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1);
      }
    });
    render();
  });
  const setDebug=value=>{
    document.body.classList.toggle('wallpaper-clean',!value);
    document.getElementById('debug-toggle').setAttribute('aria-pressed',String(value));
  };
  setDebug(new URLSearchParams(location.search).get('debug')!=='0');
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
