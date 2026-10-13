export const nodes={
 home:[-.6,.09,2.15],hub:[-.85,.09,2.05],west:[-1.7,.09,2.05],wheatEntry:[-2.05,.07,2.8],wheat:[-3.45,.07,2.95],
 firePath:[-1.65,.07,3.7],fire:[-1.05,.07,3.7],north:[.55,.09,1.5],pond:[1.05,.285,1.5],
 turn:[.6,.07,-.05],treePath:[1.6,.07,-1.4],tree:[2,.07,-1.8],
 step:[-.85,.27,1.35],porch:[-.85,.37,.65],door:[-.85,.38,-.6],inside:[-.85,.38,-1.4],
 cook:[-.7,.38,-2],bedPath:[-2.2,.38,-1.4],bedFoot:[-3,.38,-1.4],sleep:[-3,1.07,-2.45],
 eat:[-1.85,.66,.3],sweep:[-.85,.37,.8],shelter:[-1.1,.37,.6],
 south:[-1.7,.07,5.4],gardenTurn:[-3.1,.07,5.7],gardenCorner:[-4.7,.07,4.7],gardenApproach:[-5.25,.07,4.7],garden:[-5.25,.07,3.1],
 gardenNorth:[-5.35,.07,-.2],shedPath:[-5.1,.07,-3.5],millPath:[-4.5,.07,-4.15],
 bridgeApproach:[4.35,.07,-.8],bridgeWest:[4.7,.3,-2.02],bridgeCenter:[5.9,.425,-2.02],bridgeEast:[7.2,.25,-2.02],orchard:[7.7,.07,-3.4],
 southEast:[1.5,.07,4.4],wellPath:[4.6,.07,4.3],lookoutEntry:[6.6,.18,4.2],lookout:[6.6,.31,5.2]
};
export const edges=[['home','hub'],['hub','west'],['west','wheatEntry'],['wheatEntry','wheat'],['west','firePath'],['firePath','fire'],
 ['hub','north'],['north','pond'],['north','turn'],['turn','treePath'],['treePath','tree'],
 ['hub','step'],['step','porch'],['porch','door'],['door','inside'],['inside','cook'],
 ['inside','bedPath'],['bedPath','bedFoot'],['bedFoot','sleep'],['porch','eat'],['porch','sweep'],['porch','shelter'],
 ['firePath','south'],['south','gardenTurn'],['gardenTurn','gardenCorner'],['gardenCorner','gardenApproach'],['gardenApproach','garden'],['garden','gardenNorth'],['gardenNorth','shedPath'],['shedPath','millPath'],
 ['treePath','bridgeApproach'],['bridgeApproach','bridgeWest'],['bridgeWest','bridgeCenter'],['bridgeCenter','bridgeEast'],['bridgeEast','orchard'],
 ['south','southEast'],['southEast','wellPath'],['wellPath','lookoutEntry'],['lookoutEntry','lookout']];
export const sweepTargets=['sweep','home','firePath','south','gardenTurn','garden','gardenNorth','shedPath','millPath','treePath','bridgeApproach','bridgeCenter','orchard','lookout','wellPath','southEast'];
export function findRoute(from,to){
 if(!nodes[from]||!nodes[to])throw new Error('Unknown path destination');
 const dist=new Map([[from,0]]),prev=new Map(),pending=new Set(Object.keys(nodes));
 while(pending.size){
  let current=null,best=Infinity;
  for(const n of pending)if((dist.get(n)??Infinity)<best){current=n;best=dist.get(n);}
  if(current===null)break;
  pending.delete(current);if(current===to)break;
  for(const [a,b]of edges){const next=a===current?b:b===current?a:null;if(!next||!pending.has(next))continue;
   const p=nodes[current],q=nodes[next],cost=best+Math.hypot(...p.map((v,i)=>v-q[i]));
   if(cost<(dist.get(next)??Infinity)){dist.set(next,cost);prev.set(next,current);}
  }
 }
 if(!dist.has(to))throw new Error('No walkable route');
 const path=[];for(let n=to;n!==from;n=prev.get(n))path.unshift(n);
 return path;
}
export function chooseActivity({night,weather,hour},random=Math.random()){
 if(night)return 'sleep';
 if(weather==='rain'||weather==='snow')return 'shelter';
 if(hour>=12&&hour<13)return 'cook';
 if(hour>=13&&hour<14)return 'eat';
 return ['wheat','tree','pond','sweep','fire','garden','home'][Math.min(6,Math.floor(random*7))];
}
