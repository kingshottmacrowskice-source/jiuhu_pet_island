export const cameraDefaults={yaw:24.064,pitch:33.805,zoom:100,locked:false};
export function cameraSettings(properties,previous=cameraDefaults){
 const next={...previous};
 for(const [property,key,min,max]of [['viewangle','yaw',-180,180],['viewtilt','pitch',5,75],['zoom','zoom',80,250]]){
  if(properties[property]){const value=Number(properties[property].value);if(Number.isFinite(value))next[key]=Math.max(min,Math.min(max,value));}
 }
 if(properties.viewlocked)next.locked=properties.viewlocked.value===true;
 return next;
}
