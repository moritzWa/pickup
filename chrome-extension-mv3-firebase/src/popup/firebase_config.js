import { initializeApp } from "firebase/app";

// TODO Fill Me!
// Find my details from Firebase Console

// config after registering firebase App
const config = {
  apiKey: "AIzaSyAJEqheM1ff9MM7fsxFp0IrAVrKmy1egRI",
  authDomain: "learning-dev-ai.firebaseapp.com",
  projectId: "learning-dev-ai",
  storageBucket: "learning-dev-ai.appspot.com",
  messagingSenderId: "85484920800",
  appId: "1:85484920800:web:75d2bef5afc82a92bc9585",
  measurementId: "G-GK6D2YH403",
};

// This creates firebaseApp instance
// version: SDK 9
const firebaseApp = initializeApp(config);

export { firebaseApp };
