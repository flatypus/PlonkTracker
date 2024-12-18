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

// 30 minutes
const REFRESH = 1000 * 60 * 30;

const waitUntilLoaded = async (fn, callback) => {
  const repeat = setInterval(async () => {
    const complete = await fn();
    if (complete) {
      clearInterval(repeat);
      callback(complete);
    }
  }, 100);
};

const refresh = async (access_token, refresh_token, api_key) =>
  fetch(
    "https://pgqxivpgjzkikcxldpjv.supabase.co/auth/v1/token?grant_type=refresh_token",
    {
      headers: {
        apikey: api_key,
        authorization: `Bearer ${access_token}`,
      },
      body: `{"refresh_token":"${refresh_token}"}`,
      method: "POST",
      mode: "cors",
    },
  );

(async function () {
  "use strict";

  console.log("<<< Plonk Tracker v0.1, by Hinson Chan >>>");

  const refreshToken = async (access_token, refresh_token, anon_key) => {
    let refreshResponse;
    try {
      refreshResponse = await refresh(access_token, refresh_token, anon_key);
    } catch (e) {
      refreshResponse = await refresh(gmAT, gmRT, gmAK);
    }

    const newData = await refreshResponse.json();
    if (!newData?.access_token || !newData?.refresh_token) return;
    await GM.setValue("PLONKTRACKER_ACCESS_TOKEN", newData.access_token);
    await GM.setValue("PLONKTRACKER_REFRESH_TOKEN", newData.refresh_token);
    await GM.setValue("PLONKTRACKER_EXPIRES_AT", newData.expires_at);
    await GM.setValue("PLONKTRACKER_ANON_KEY", anon_key);
    localStorage.setItem("supabase.auth.access_token", newData.access_token);
    localStorage.setItem("supabase.auth.refresh_token", newData.refresh_token);
  };

  const verifyUser = async (
    access_token = null,
    refresh_token = null,
    anon_key = null,
  ) => {
    const gmAT = await GM.getValue("PLONKTRACKER_ACCESS_TOKEN", null);
    const gmRT = await GM.getValue("PLONKTRACKER_REFRESH_TOKEN", null);
    const gmAK = await GM.getValue("PLONKTRACKER_ANON_KEY", null);

    if (!access_token) access_token = gmAT;
    if (!refresh_token) refresh_token = gmRT;
    if (!anon_key) anon_key = gmAK;

    try {
      const response = await fetch(
        `https://api.plonk.flatypus.me/verify?access_token=${access_token}`,
      );
      const { success, reason } = await response.json();
      if (success) {
        return { success: true };
      } else {
        if (reason === "token expired") {
          try {
            await refreshToken(access_token, refresh_token, anon_key);
            return { success: true };
          } catch (e) {
            return { success: false, reason: e.message };
          }
        } else {
          return { success: false, reason };
        }
      }
    } catch (e) {
      return { success: false, reason: e.message };
    }
  };

  // #region SETUP FOR MY PERSONAL WEBSITE
  const personalSetup = async () => {
    // Verify on my page that the user is ready
    await waitUntilLoaded(
      async () => document.querySelector("#PLONKTRACKER_TRACKING_ID"),
      async (span) => {
        const anon_key = localStorage.getItem("supabase.auth.anon_key");
        const access_token = localStorage.getItem("supabase.auth.access_token");
        const refresh_token = localStorage.getItem(
          "supabase.auth.refresh_token",
        );
        const expires_at = parseFloat(
          localStorage.getItem("supabase.auth.expires_at") ?? 0,
        );

        const gmAT = await GM.getValue("PLONKTRACKER_ACCESS_TOKEN", null);
        const gmRT = await GM.getValue("PLONKTRACKER_REFRESH_TOKEN", null);
        const gmEA = parseFloat(
          (await GM.getValue("PLONKTRACKER_EXPIRES_AT", 0)) ?? 0,
        );

        if (!gmEA || expires_at > gmEA) {
          await GM.setValue("PLONKTRACKER_ACCESS_TOKEN", access_token);
          await GM.setValue("PLONKTRACKER_REFRESH_TOKEN", refresh_token);
          await GM.setValue("PLONKTRACKER_EXPIRES_AT", expires_at);
        } else if (expires_at < gmEA) {
          localStorage.setItem("supabase.auth.access_token", gmAT);
          localStorage.setItem("supabase.auth.refresh_token", gmRT);
          localStorage.setItem("supabase.auth.expires_at", gmEA);
        }

        const { success, reason } = await verifyUser(
          access_token,
          refresh_token,
          anon_key,
        );

        if (!success) {
          span.style.color = "#ff0000";
          span.innerText = `SCRIPT NOT READY: ${reason.toUpperCase()} TRY SIGNING OUT AND SIGNING IN.`;
        } else {
          span.style.color = "#00ff00";
          span.innerText = "SCRIPT IS TRACKING";
        }
      },
    );
  };
  // #endregion

  // #region SETUP FOR GEOGUESSR.COM
  const geoguessrSetup = async () => {
    const geoguessrRefresh = async () => {
      const { success } = await verifyUser();

      const style = document.createElement("style");
      style.innerHTML = `
        .plonk-banner { 
          animation: fadeOut 3s forwards; 
        } 
        @keyframes fadeOut {
          0% { opacity: 1; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);

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

      if (!success) {
        const text = document.createElement("span");
        text.innerText = "PlonkTracker is not tracking. ";
        const bold = document.createElement("b");
        bold.innerText = "Click here to setup!";
        banner.appendChild(text);
        banner.appendChild(bold);
      } else {
        const text = document.createElement("span");
        text.innerText = "PlonkTracker is tracking!";
        banner.classList.add("plonk-banner");
        banner.appendChild(text);
      }

      banner.onclick = () => {
        window.location.href = "https://plonk.flatypus.me";
      };

      document.body.appendChild(banner);
    };

    geoguessrRefresh();
    setInterval(geoguessrRefresh, REFRESH);

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
