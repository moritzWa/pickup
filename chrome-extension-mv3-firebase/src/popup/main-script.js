import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { firebaseApp } from "./firebase_config";

const auth = getAuth(firebaseApp);

console.log("popup main!");

function handleAuthStateChange(user) {
  if (user) {
    console.log("logged in!");
    console.log("current user:", user);
    setupSaveLinkButton();
    document.getElementById("saveLink").style.display = "block";
    saveCurrentLink();
  } else {
    console.log("No user");
    window.location.replace("./popup.html");
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
          saveCurrentLink();
        })
        .catch((error) => {
          console.error("Sign-in error:", error);
          window.location.replace("./popup.html");
        });
    } else {
      window.location.replace("./popup.html");
    }
  });
}

function saveCurrentLink() {
  const messageDiv = document.getElementById("message");
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const user = auth.currentUser;
    const authProviderId = user ? user.uid : null;

    try {
      const response = await fetch("http://localhost:8888/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `mutation($url: String!, $authProviderId: String) {
            createContentFromUrl(url: $url, authProviderId: $authProviderId) {
              id
              title
              websiteUrl
              content
              audioUrl
              thumbnailImageUrl
            }
          }`,
          variables: {
            url: tab.url,
            authProviderId,
          },
        }),
      });

      if (response.ok) {
        messageDiv.textContent = "Link saved successfully!";
      } else {
        messageDiv.textContent = "Error saving link.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error saving link.";
    }
  });
}

function setupSaveLinkButton() {
  const saveLinkButton = document.getElementById("saveLink");
  saveLinkButton.addEventListener("click", saveCurrentLink);
}

onAuthStateChanged(auth, handleAuthStateChange);
