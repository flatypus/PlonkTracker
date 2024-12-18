// ==UserScript==
// @name         Geoguessr Plonk Tracker
// @namespace    https://flatypus.me, https://github.com/flatypus/PlonkTracker
// @version      2024-12-16
// @description  Tracks your guesses on Geoguessr to identify hotspots and blindspots
// @author       Hinson Chan
// @match        https://*.geoguessr.com/*
// @match        https://*.flatypus.me/*
// @match        http://localhost:*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM.getValue
// @grant       GM.setValue
// ==/UserScript==

const waitUntilLoaded = async (fn) => {
  const repeat = setInterval(() => {
    const complete = fn();
    if (complete) clearInterval(repeat);
  }, 100);
};

(async function () {
  "use strict";

  console.log("<<<Plonk Tracker v0.1, by Hinson Chan>>>");
  // #region SETUP FOR MY PERSONAL WEBSITE
  const personalSetup = async () => {
    // Verify on my page that the user is ready
    const verifyUser = () => {
      const span = document.querySelector("#PLONKTRACKER_TRACKING_ID");
      if (!span) return false;
      console.log("Script is ready!");
      span.style.color = "#00ff00";
      span.innerText = "SCRIPT IS TRACKING";
      return true;
    };

    // Grab the access token
    waitUntilLoaded(verifyUser);
  };
  // #endregion

  // #region SETUP FOR GEOGUESSR.COM
  const geoguessrSetup = async () => {
    const access_token = await GM.getValue("PLONKTRACKER_ACCESS_TOKEN", null);
    const refresh_token = await GM.getValue("PLONKTRACKER_REFRESH_TOKEN", null);

    if (!access_token || !refresh_token) {
      const banner = document.createElement("button");

      banner.style.position = "absolute";
      banner.style.width = "calc(100vw - 20px)";
      banner.style.margin = "10px";
      banner.style.borderRadius = "5px";
      banner.style.top = "0";
      banner.style.left = "0";
      banner.style.backgroundColor = "#7950e5";
      banner.style.color = "#ffffff";
      banner.style.padding = "8px";
      banner.style.textAlign = "center";
      banner.style.zIndex = "9999";
      banner.style.cursor = "pointer";
      banner.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";

      const text = document.createElement("span");
      text.innerText = "PlonkTracker is not tracking. ";
      const bold = document.createElement("b");
      bold.innerText = "Click here to setup!";

      banner.onclick = () => {
        window.location.href = "https://plonk.flatypus.me";
      };

      banner.appendChild(text);
      banner.appendChild(bold);
      document.body.appendChild(banner);
      console.log("Plonk Tracker is not setup.", banner);
    }

    // Setup the observer
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const [resource, config] = args;
      let modify = false;

      if (/geoguessr\.com\/api\/v3\/games\/[A-Z0-9]/.test(resource)) {
        modify = true;
      }

      const response = await originalFetch(...args);

      if (modify) {
        const data = await response.json();
        console.log("Fetch data:", data);
        console.log("Fetch config:", config);
      }
      return response;
    };
  };
  // #endregion

  if (
    window.location.hostname.includes("flatypus.me") ||
    window.location.hostname.includes("localhost")
  ) {
    personalSetup();
  }

  if (window.location.hostname.includes("geoguessr.com")) {
    geoguessrSetup();
  }
})();
