// Camera-right projection for billboard art whose original pose faces left.
// Keep the last facing near the screen-depth axis to avoid flip jitter.
export function facingRight(direction,right,previous=false){
 const length=Math.hypot(direction.x,direction.z);
 if(length<1e-6)return previous;
 const horizontal=(direction.x*right.x+direction.z*right.z)/length;
 return horizontal>.08?true:horizontal<-.08?false:previous;
}
