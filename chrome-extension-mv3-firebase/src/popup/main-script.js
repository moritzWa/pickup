import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { firebaseApp } from "./firebase_config";

const auth = getAuth(firebaseApp);

console.log("popup main!");

function handleAuthStateChange(user) {
  if (user) {
    console.log("logged in!");
    console.log("current user:", user);
    document.getElementById("likeContent").style.display = "block";
    saveCurrentLink();
    checkBookmarkStatus();
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

const apiUrl = process.env.API_URL;
console.log(`API URL: ${apiUrl}`);

async function saveCurrentLink() {
  const messageDiv = document.getElementById("message");
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const user = auth.currentUser;
    const authProviderId = user ? user.uid : null;

    console.log("saving link using api url:", apiUrl);

    try {
      const response = await fetch(`${apiUrl}/graphql`, {
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
        const result = await response.json();

        console.log("result", result.data);

        const contentId = result.data.createContentFromUrl.id;
        chrome.storage.local.set({ currentContentId: contentId }, () => {
          console.log("Content ID saved:", contentId);
        });
        messageDiv.textContent = "Link saved successfully!";
      } else {
        messageDiv.textContent = "Error saving link.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error saving link.";
    }
  });
  await checkBookmarkStatus();
}

async function checkBookmarkStatus() {
  const messageDiv = document.getElementById("message");
  const likeButton = document.getElementById("likeContent");
  const hintText = document.getElementById("hint");

  chrome.storage.local.get(["currentContentId"], async (result) => {
    const contentId = result.currentContentId;
    if (!contentId) {
      messageDiv.textContent =
        "No content ID found. Please save the link first.";
      return;
    }

    const user = auth.currentUser;
    const authProviderId = user ? user.uid : null;

    try {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query($contentId: ID!, $authProviderId: String) {
            getIsBookmarked(contentId: $contentId, authProviderId: $authProviderId)
          }`,
          variables: {
            contentId: contentId,
            authProviderId,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const isBookmarked = result.data.getIsBookmarked;

        if (isBookmarked) {
          likeButton.textContent = "Unlike Content";
          likeButton.classList.add("btn-unlike");
          hintText.textContent = "Will be removed from your profile";
        } else {
          likeButton.textContent = "Like Content";
          likeButton.classList.remove("btn-unlike");
          hintText.textContent = "Will appear on your profile";
        }
      } else {
        messageDiv.textContent = "Error checking bookmark status.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error checking bookmark status.";
    }
  });
}

async function toggleBookmark() {
  const messageDiv = document.getElementById("message");
  const likeButton = document.getElementById("likeContent");
  const hintText = document.getElementById("hint");

  chrome.storage.local.get(["currentContentId"], async (result) => {
    const contentId = result.currentContentId;
    if (!contentId) {
      messageDiv.textContent =
        "No content ID found. Please save the link first.";
      return;
    }

    const user = auth.currentUser;
    const authProviderId = user ? user.uid : null;

    try {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `mutation($contentId: ID!, $authProviderId: String) {
            bookmarkContent(contentId: $contentId, authProviderId: $authProviderId) {
              id
              isBookmarked
            }
          }`,
          variables: {
            contentId: contentId,
            authProviderId,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const isBookmarked = result.data.bookmarkContent.isBookmarked;

        // Update button text, hint, and class immediately
        if (isBookmarked) {
          likeButton.textContent = "Unlike Content";
          likeButton.classList.add("btn-unlike");
          hintText.textContent = "Will be removed from your profile";
          messageDiv.textContent = "Content liked successfully!";
        } else {
          likeButton.textContent = "Like Content";
          likeButton.classList.remove("btn-unlike");
          hintText.textContent = "Will appear on your profile";
          messageDiv.textContent = "Content unliked successfully!";
        }
      } else {
        messageDiv.textContent = "Error toggling like.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error toggling like.";
    }
  });
}

document
  .getElementById("likeContent")
  .addEventListener("click", toggleBookmark);

onAuthStateChanged(auth, handleAuthStateChange);
