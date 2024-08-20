import React, { useEffect, useState } from "react";

const Popup: React.FC = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "urlSaved") {
          setMessage("Link saved");
        }
      });
    } else {
      setMessage("Extension not loaded in Chrome");
    }
  }, []);

  return (
    <div style={{ width: "200px", padding: "10px" }}>
      <h1>URL Saver</h1>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Popup;
