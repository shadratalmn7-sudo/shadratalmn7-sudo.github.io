import*as base from'./student-artifacts-a4.js?v=6&base=1';
import{doc,getDoc}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{artifactSaveLimit,levelFromXp}from'./level-system.js?v=4';
export*from'./student-artifacts-a4.js?v=6&base=1';

export async function saveArtifact(record){
 const user=await base.waitForUser();if(!user)return base.saveArtifact(record);
 try{
  const userSnap=await getDoc(doc(base.db,'users',user.uid)),level=levelFromXp(userSnap.data()?.xp||0),limit=artifactSaveLimit(level),items=await base.listArtifacts(user.uid),type=record.artifactType==='motivation'?'motivation':'cv',groups=new Set(items.filter(x=>x.artifactType===type).map(x=>x.artifactGroupId||x.id)),group=String(record.artifactGroupId||'');
  if(!groups.has(group)&&groups.size>=limit){
   const error=Object.assign(new Error('ARTIFACT_LEVEL_LIMIT'),{code:'artifact-level-limit',level,limit});
   window.dispatchEvent(new CustomEvent('shadrat:artifact-limit',{detail:{type,level,limit}}));
   throw error;
  }
 }catch(error){
  if(error?.code==='artifact-level-limit')throw error;
  console.warn('[Shadrat] artifact level limit check unavailable; continuing save',error);
 }
 return base.saveArtifact(record);
}
