// ==UserScript==
// @name         Plonk Tracker
// @namespace    https://flatypus.me, https://github.com/flatypus/PlonkTracker
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

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const [resource, config] = args;
    console.log(args);
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
})();
