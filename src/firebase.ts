import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config parsed from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBrYD4DhTBLEDblWXXzPyLEUlyOkMRyS4w",
  authDomain: "ai-studio-applet-webapp-f78e7.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-f78e7",
  storageBucket: "ai-studio-applet-webapp-f78e7.firebasestorage.app",
  messagingSenderId: "717940026511",
  appId: "1:717940026511:web:f4aecc4e9a0132257914fa"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from the config
const db = getFirestore(app, "ai-studio-fd31e368-e61b-4d50-87ab-58823b9be109");

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
