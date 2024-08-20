chrome.action.onClicked.addListener((tab) => {
  if (tab.url) {
    fetch("http://localhost:8888/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation { createContentFromUrl(url: "${tab.url}") { id } }`,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data);
        chrome.runtime.sendMessage({ action: "urlSaved" });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
});

export {};
