// Local calendar: meteorological seasons in the northern hemisphere.
export function realCalendar(now=new Date()){
  const month=now.getMonth()+1;
  return {hour:now.getHours()+now.getMinutes()/60+now.getSeconds()/3600+now.getMilliseconds()/3600000,
    season:month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter',
    halloween:month===10&&now.getDate()===31};
}

export function createRealTime(life,seasons){
  let enabled=false,saved;
  const controls=['light','speed','pause','season-spring','season-summer','season-autumn','season-winter','season-auto','season-halloween'].map(id=>document.getElementById(id)).filter(Boolean);
  function sync(now){
    if(!enabled)return;
    const calendar=realCalendar(now);
    life.state.hour=calendar.hour;
    if(seasons.state.current!==calendar.season)seasons.setSeason(calendar.season);
    if(seasons.state.halloween!==calendar.halloween)seasons.setHalloween(calendar.halloween);
  }
  function apply(properties){
    if(!properties.realtime)return;
    const next=properties.realtime.value===true;
    if(next===enabled)return;
    enabled=next;
    if(enabled){
      saved={hour:life.state.hour,paused:life.state.paused,speed:life.state.speed,season:{...seasons.state},disabled:controls.map(c=>c.disabled)};
      life.state.paused=false;life.state.speed=1;seasons.state.auto=false;
      controls.forEach(c=>c.disabled=true);
      sync();
    }else{
      Object.assign(life.state,{hour:saved.hour,paused:saved.paused,speed:saved.speed});
      Object.assign(seasons.state,saved.season);seasons.apply();
      controls.forEach((c,i)=>c.disabled=saved.disabled[i]);
    }
    life.update(0);
  }
  return {apply,sync,get enabled(){return enabled;}};
}
