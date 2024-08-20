document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let currentUrl = tabs[0].url;

    console.log("currentUrl in background.js", currentUrl);

    fetch("http://localhost:8888/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { createContentFromUrl(url: "${currentUrl}") { id } }`,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        document.getElementById("message").textContent = "Link saved!";
      })
      .catch((error) => {
        document.getElementById("message").textContent = "Error saving link";
        console.error("Error:", error);
      });
  });
});
