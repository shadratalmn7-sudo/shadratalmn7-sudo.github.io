import fs from 'node:fs';
import {assertFails,assertSucceeds,initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,serverTimestamp,setDoc,updateDoc} from 'firebase/firestore';

const projectId='demo-shazarat-profile';
const rules=fs.readFileSync('firestore.rules','utf8');
const env=await initializeTestEnvironment({projectId,firestore:{rules}});

try{
  await env.clearFirestore();
  const db=env.authenticatedContext('age-user',{email:'student@example.com'}).firestore();
  const userRef=doc(db,'users','age-user');

  // Legacy usernames must not block unrelated profile fields such as age.
  await assertSucceeds(setDoc(userRef,{
    uid:'age-user',
    fullName:'Test Student',
    username:'Legacy-Name',
    role:'student',
    accountStatus:'active',
    publicProfile:false,
    age:null,
    nationality:'',
    currentCountry:'',
    city:'',
    contactMethod:'',
    contactValue:'',
    location:'',
    studyLevel:'',
    xp:0,
    level:1
  }));

  await assertSucceeds(updateDoc(userRef,{age:21,updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(userRef,{
    nationality:'اليمن',
    currentCountry:'السعودية',
    city:'نجران',
    studyLevel:'بكالوريوس',
    contactMethod:'تليجرام',
    contactValue:'@student',
    location:'السعودية / نجران',
    updatedAt:serverTimestamp()
  }));
  await assertFails(updateDoc(userRef,{age:11,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(userRef,{age:101,updatedAt:serverTimestamp()}));

  console.log('PASS: profile age 12-100 and ordinary profile fields save with a legacy username.');
} finally {
  await env.cleanup();
}
