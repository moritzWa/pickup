import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "./firebase_config";
// Auth instance for the current firebaseApp
const auth = getAuth(firebaseApp);

console.log("popup main!");

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log("logged in!");
    console.log("current user:", user);
    setupSaveLinkButton();
  } else {
    console.log("No user");
    document.getElementById("saveLink").style.display = "none";
  }
});

document.querySelector("#sign_out").addEventListener("click", () => {
  auth.signOut();
  window.location.replace("./popup.html");
});

function setupSaveLinkButton() {
  const saveLinkButton = document.getElementById("saveLink");
  const messageDiv = document.getElementById("message");

  saveLinkButton.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await fetch("http://localhost:8888/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `mutation { createContentFromUrl(url: "${tab.url}") { id title websiteUrl content audioUrl thumbnailImageUrl } }`,
        }),
      });

      if (response.ok) {
        messageDiv.textContent = "Link saved!";
      } else {
        messageDiv.textContent = "Error saving link.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error saving link.";
    }
  });
}
