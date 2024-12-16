// ==UserScript==
// @name         Plonk Tracker
// @namespace    https://flatypus.me, https://github.com/flatypus
// @version      2024-12-16
// @description  Tracks your guesses on Geoguessr to identify hotspots and blindspots
// @author       Hinson Chan
// @match        https://*.geoguessr.com/*
// @match        https://*.flatypus.me/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log("<<<Plonk Tracker v0.1, by Hinson Chan>>>");

  // Save the original fetch function
  const originalFetch = window.fetch;

  // Override the fetch function
  window.fetch = async function (...args) {
    const [resource, config] = args;
    let modify = false;

    if (/geoguessr\.com\/api\/v3\/games\/[A-Z0-9]/.test(resource)) {
      modify = true;
    }

    const response = await originalFetch(...args);

    if (modify) {
      console.log("Fetch response:", response);
    }
    return response;
  };
})();
