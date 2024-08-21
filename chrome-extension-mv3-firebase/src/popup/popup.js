console.log("popup!");

import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
} from "firebase/auth";
import { firebaseApp } from "./firebase_config";

// Auth instance for the current firebaseApp
const auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence);

// ... imports and setup ...

function handleAuthStateChange(user) {
  if (user) {
    console.log("User logged in:", user);
    window.location.replace("./main.html");
  } else {
    console.log("No user logged in");
    // Show login button or form
  }
}

function initAuth() {
  onAuthStateChanged(auth, handleAuthStateChange);
}

function startGoogleSignIn() {
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (token) {
      const credential = GoogleAuthProvider.credential(null, token);
      signInWithCredential(auth, credential)
        .then((result) => {
          console.log("Sign-in successful:", result);
        })
        .catch((error) => {
          console.error("Sign-in error:", error);
        });
    } else {
      console.error("The OAuth token was null");
    }
  });
}

document
  .querySelector(".btn__google")
  .addEventListener("click", startGoogleSignIn);

initAuth();
