import assert from 'node:assert/strict';
import {nodes,edges,findRoute,chooseActivity} from './dist/life-routes.js';
let pairs=0;
for(const a of Object.keys(nodes))for(const b of Object.keys(nodes)){
 const route=findRoute(a,b);let previous=a;
 for(const n of route){assert(edges.some(([x,y])=>(x===previous&&y===n)||(y===previous&&x===n)));previous=n;}
 assert.equal(previous,b);pairs++;
}
assert(findRoute('pond','sleep').includes('door'));
assert(findRoute('garden','cook').includes('door'));
assert.equal(chooseActivity({night:true,weather:'rain',hour:23}),'sleep');
assert.equal(chooseActivity({night:false,weather:'rain',hour:9}),'shelter');
assert.equal(chooseActivity({night:false,weather:'snow',hour:9}),'shelter');
assert.equal(chooseActivity({night:false,weather:'clear',hour:12.5}),'cook');
assert.equal(chooseActivity({night:false,weather:'clear',hour:13.5}),'eat');
// Outdoor route samples must stay out of the pond and away from the campfire.
for(const [a,b] of edges){if(['sleep','bedFoot'].includes(a)||['sleep','bedFoot'].includes(b))continue;
 for(let i=0;i<=20;i++){const x=nodes[a][0]+(nodes[b][0]-nodes[a][0])*i/20,z=nodes[a][2]+(nodes[b][2]-nodes[a][2])*i/20;
 assert(!(x>1.5&&x<4.5&&z>.5&&z<3.5),'Route enters pond');assert(Math.hypot(x,z-3.45)>.75,'Route enters fire ring');}
}
console.log(`${pairs} route pairs, pond/fire clearance, doorway and day/weather policy checks passed.`);
