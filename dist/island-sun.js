import * as T from './vendor/three.module.js';

// World east is -X, west is +X. Tilt the orbit toward the southern sky.
export function sunDirection(hour, target=new T.Vector3()) {
  const angle=(hour-6)*Math.PI/12;
  return target.set(-Math.cos(angle),Math.sin(angle)*.8,-Math.sin(angle)*.6).normalize();
}

export function updateSun(sun,state) {
  const direction=sun.userData.solarDirection ||= new T.Vector3();
  sunDirection(state.hour,direction);
  const direct=T.MathUtils.smoothstep(direction.y,0,.12);
  sun.userData.solarVisibility=direct;
  // Keep the sunlight aligned with the visible solar disk even below the horizon.
  sun.position.copy(direction).multiplyScalar(32).add(sun.target.position);
  sun.shadow.camera.far=Math.max(sun.shadow.camera.far,75);
  sun.shadow.camera.updateProjectionMatrix();
  sun.intensity=direct*(state.weather==='clear'?1.65:.5);
  if(direction.y>=0) sun.color.set('#fff8f0').lerp(new T.Color('#ffaa55'),1-T.MathUtils.smoothstep(direction.y,0,.5));
  else sun.color.set('#ffaa55');
}
