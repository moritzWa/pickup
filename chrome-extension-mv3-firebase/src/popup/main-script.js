import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { firebaseApp } from "./firebase_config";

const auth = getAuth(firebaseApp);

console.log("popup main!");

const apiUrl = process.env.API_URL;
console.log(`API URL: ${apiUrl}`);

const isDevelopment =
  apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");

function handleAuthStateChange(user) {
  if (user) {
    console.log("logged in!");
    console.log("current user:", user);
    document.getElementById("likeContent").style.display = "block";
    saveCurrentLink();

    if (isDevelopment) {
      document.getElementById("signOutContainer").style.display = "block";
    }
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

async function saveCurrentLink() {
  const messageDiv = document.getElementById("message");
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in");
      messageDiv.textContent = "Please log in to save links.";
      return;
    }

    console.log("saving link using api url:", apiUrl);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          query: `mutation($url: String!) {
            createContentFromUrl(url: $url) {
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

        // TODO: just get this from the same API call?
        // calling this here instead of in handleAuthStateChange to reduce redundant API calls
        await checkBookmarkStatus();
      } else {
        messageDiv.textContent = "Error saving link.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error saving link.";
    }
  });
}

async function checkBookmarkStatus() {
  const messageDiv = document.getElementById("message");
  const likeButton = document.getElementById("likeContent");
  const hintText = document.getElementById("hint");

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const url = tab.url;
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in");
      messageDiv.textContent = "Please log in to check bookmark status.";
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          query: `query($url: String!) {
            getIsBookmarked(url: $url)
          }`,
          variables: {
            url,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const isBookmarked = result.data.getIsBookmarked;

        console.log("isBookmarked", isBookmarked);

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

    if (!user) {
      console.error("No user logged in");
      messageDiv.textContent = "Please log in to toggle bookmark.";
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          query: `mutation($contentId: ID!) {
            bookmarkContent(contentId: $contentId) {
              id
              isBookmarked
            }
          }`,
          variables: {
            contentId: contentId,
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

console.log("isDevelopment", isDevelopment);

function signOutUser() {
  console.log("signing out user now");

  signOut(auth)
    .then(() => {
      console.log("User signed out successfully");
      window.location.replace("./popup.html");
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
}

document
  .getElementById("likeContent")
  .addEventListener("click", toggleBookmark);

if (isDevelopment) {
  document
    .getElementById("signOutButton")
    .addEventListener("click", signOutUser);
}

onAuthStateChanged(auth, handleAuthStateChange);
