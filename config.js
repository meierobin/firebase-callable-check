import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth'


let fbApp = null;
const firebaseConfig = {
    apiKey: "xxx",
    authDomain: "xxx",
    projectId: "xxx",
    storageBucket: "xxx",
    messagingSenderId: "xxx",
    appId: "xxx"
};

if (getApps().length < 1) {
    console.log("initialized app");
    fbApp = initializeApp(firebaseConfig)
} else {
    console.log("get apps");
    fbApp = getApps()[0];
}

export const auth = getAuth(fbApp)
export const db = getFirestore(fbApp);
export const functions = getFunctions(fbApp, 'europe-west1');