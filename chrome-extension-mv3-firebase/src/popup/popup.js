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

function handleAuthStateChange(user) {
  if (user) {
    console.log("User logged in:", user);
    window.location.replace("./main.html");
  } else {
    console.log("No user logged in");
    checkForExistingToken();
  }
}

function checkForExistingToken() {
  chrome.identity.getAuthToken({ interactive: false }, function (token) {
    if (token) {
      console.log("Existing token found, signing in...");
      const credential = GoogleAuthProvider.credential(null, token);
      signInWithCredential(auth, credential)
        .then((result) => {
          console.log("Sign-in successful:", result);
        })
        .catch((error) => {
          console.error("Sign-in error:", error);
          showLoginButton();
        });
    } else {
      showLoginButton();
    }
  });
}

function showLoginButton() {
  document.querySelector(".btn__google").style.display = "block";
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

onAuthStateChanged(auth, handleAuthStateChange);
