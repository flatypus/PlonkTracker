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
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-start
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js?v=10
// @require      https://raw.githubusercontent.com/flatypus/PlonkTracker/refs/heads/master/lib.js
// @copyright    2024, Hinson Chan (https://github.com/flatypus)
// ==/UserScript==

const VERSION = 0.21;
console.log(`<<< Plonk Tracker v${VERSION}, by Hinson Chan >>>`);

const REFRESH = 1000 * 60 * 30;
const SUPABASE_URL = "https://pgqxivpgjzkikcxldpjv.supabase.co";
// const BACKEND_URL = "https://api.plonk.flatypus.me";
const BACKEND_URL = "http://localhost:4000";
const SCRIPT_UPDATE_URL = "https://github.com/flatypus/PlonkTracker"; // update this l8r

// Wait for a condition to be true before executing the callback function
const waitUntilLoaded = async (fn, callback) => {
  const repeat = setInterval(async () => {
    const complete = await fn();
    if (complete) {
      clearInterval(repeat);
      callback(complete);
    }
  }, 100);
};

// Refresh access token
const refresh = async (access_token, refresh_token, api_key) => {
  const response = fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    headers: {
      apikey: api_key,
      authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ refresh_token }),
    method: "POST",
    mode: "cors",
  }); // save the response to a variable so that we can use it

  const new_AT = await response.headers.get("authorization").split("Bearer ")[1];

  // response is of type Response, response.headers returns a Header
  // headers.get("Authorization") returns a string representing everything under "Authorization"
  // .split should just manipulate the string for us to use

  if (new_AT) {
    console.log("New Access Token: ", new_AT);
    await GM.setValue("PLONKTRACKER_ACCESS_TOKEN", new_AT);
    // wait for greasemonkey to change the access token to the new access token
  }
};

const authFetch = async ({ access_token, path, method, body }) => {
  const at = access_token ?? await GM.getValue("PLONKTRACKER_ACCESS_TOKEN", null);
  return fetch(`${BACKEND_URL}/${path}`, {
    headers: {
      "Authorization": `Bearer ${at}`,
    },
    method: method ?? "GET",
    body: JSON.stringify(body)
  })
}

// Verify the user's token
const verifyReq = async (access_token) => authFetch({
  access_token,
  path: "verify",
  method: "GET"
})

// Send round info to the backend
const post_round = async (round) => authFetch({
  path: "round",
  body: round,
  method: "POST"
});

// Send a guess to the backend
const post_guess = async (guess) => authFetch({
  path: "guess",
  body: guess,
  method: "POST",
});

// Get round info
const getGameInfo = async (game_id) => fetch(`/api/v3/games/${game_id}`);

// Script has update
const hasUpdate = async () => {
  const time = new Date().getTime();
  const request = await fetch(
    `https://raw.githubusercontent.com/flatypus/PlonkTracker/refs/heads/master/VERSION.txt?_=${time}`,
    { cache: "no-store" },
  );
  const latestVersionNum = parseFloat(await request.text());
  return latestVersionNum > VERSION;
};

// Refresh the token if expired
const refreshToken = async (access_token, refresh_token, anon_key) => {
  let refreshResponse;
  try {
    refreshResponse = await refresh(access_token, refresh_token, anon_key);
  } catch (e) {
    refreshResponse = await refresh(gmAT, gmRT, gmAK);
  }

  const newData = await refreshResponse.json();
  if (!newData?.access_token || !newData?.refresh_token) return false;
  await GM.setValue("PLONKTRACKER_ACCESS_TOKEN", newData.access_token);
  await GM.setValue("PLONKTRACKER_REFRESH_TOKEN", newData.refresh_token);
  await GM.setValue("PLONKTRACKER_EXPIRES_AT", newData.expires_at);

  localStorage.setItem("supabase.auth.access_token", newData.access_token);
  localStorage.setItem("supabase.auth.refresh_token", newData.refresh_token);
  localStorage.setItem("supabase.auth.expires_at", newData.expires_at);
  return true;
};

// Verify the user's credentials
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
    const response = await verifyReq(access_token);
    const { success, reason } = await response.json();
    if (success) {
      return { success: true };
    } else {
      if (reason === "token expired" || reason == "invalid token") {
        try {
          const isTokenRefreshed = await refreshToken(
            access_token,
            refresh_token,
            anon_key,
          );
          if (isTokenRefreshed) {
            return { success: isTokenRefreshed };
          } else {
            return { success: false, reason: "refresh failed" };
          }
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

// Setup for personal website
const personalSetup = async () => {
  await waitUntilLoaded(
    async () => document.querySelector("#PLONKTRACKER_TRACKING_ID"),
    async (span) => {
      const anon_key = localStorage.getItem("supabase.auth.anon_key");
      await GM.setValue("PLONKTRACKER_ANON_KEY", anon_key);

      const access_token = localStorage.getItem("supabase.auth.access_token");
      const refresh_token = localStorage.getItem("supabase.auth.refresh_token");
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

// Setup for Geoguessr
const geoguessrSetup = async () => {
  const geoguessrRefresh = async () => {
    const { success } = await verifyUser();
    const update = await hasUpdate();

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
    banner.style.display = "flex";
    banner.style.flexDirection = "row";
    banner.style.justifyContent = "center";
    banner.style.alignItems = "center";
    banner.style.gap = "5px";

    if (!success) {
      const text = document.createElement("span");
      text.innerText = "PlonkTracker is NOT tracking!!";
      text.style.color = "#ff3333";
      const bold = document.createElement("b");
      bold.innerText = "Click here to setup!";
      banner.appendChild(text);
      banner.appendChild(bold);
    } else {
      const text = document.createElement("span");
      text.innerText = "PlonkTracker is tracking!";
      text.style.color = "#00ff00";
      banner.classList.add("plonk-banner");
      setTimeout(() => document.body.removeChild(banner), 3000);
      banner.appendChild(text);
    }

    const boldUpdate = document.createElement("b");
    boldUpdate.innerText = update
      ? "(Update Available! Click here to update)"
      : "(You are on the latest version!)";
    boldUpdate.style.color = update ? "#ff3333" : "#00ff00";
    boldUpdate.onclick = (event) => {
      event.stopPropagation();
      window.open(SCRIPT_UPDATE_URL, '_blank').focus();
    };

    banner.appendChild(boldUpdate);
    banner.onclick = () => (window.open("https://plonk.flatypus.me", '_blank').focus());

    document.body.appendChild(banner);
  };

  geoguessrRefresh();
  setInterval(geoguessrRefresh, REFRESH);

  GeoGuessrEventFramework.init().then((GEF) => {
    GEF.events.addEventListener("round_start", async (event) => {
      // Access all the info about the round/player that do not depend on the guess
      const { current_game_id, current_round, map } = event.detail;
      const { id: map_id, name: map_name } = map;
      const request = await getGameInfo(current_game_id);
      const game_info = await request.json();

      const {
        forbidMoving,
        forbidRotating,
        forbidZooming,
        mode,
        player,
        rounds,
        timeLimit,
      } = game_info;

      const location = rounds.at(-1);
      if (!location) return;

      const { lat, lng, panoId } = location;
      const country_code = await getCountryCode([lat, lng]);

      const { countryCode, id, isVerified, nick, pin } = player;
      const { pin_url } = pin;

      const view_limitation = forbidMoving
        ? forbidRotating && forbidZooming
          ? "nmpz"
          : "nm"
        : "m";

      await post_round({
        round: {
          game_id: current_game_id,
          round_num: current_round,
          map_name: map_name,
          map_id: map_id,
          actual_lat: lat,
          actual_lng: lng,
          actual_country: country_code,
          pano_id: panoId,
          game_mode: mode === "standard" ? "practice" : "duel",
          time_allowed: timeLimit,
          view_limitation: view_limitation,
        },
        player: {
          player_id: id,
          name: nick,
          pin_url: pin_url,
          country: countryCode,
          verified: isVerified,
        },
      });
    });

    GEF.events.addEventListener("round_end", async (event) => {
      // Access all the info that are guess dependent
      const { current_game_id, current_round, rounds } = event.detail;
      const last_round = rounds.at(-1);
      if (!last_round) return;
      const { distance, player_guess, score, time } = last_round;
      const km = distance.meters.amount;
      const { lat: guess_lat, lng: guess_lng } = player_guess;
      const guessCountryCode = await getCountryCode([guess_lat, guess_lng]);

      await post_guess({
        game_id: current_game_id,
        guess_lat: guess_lat,
        guess_lng: guess_lng,
        guess_country: guessCountryCode,
        round_num: current_round,
        time_spent: time,
        distance: km,
        score: score.amount,
      });
    });
  });
};

if (
  window.location.hostname.includes("flatypus.me") ||
  window.location.hostname.includes("localhost")
) {
  personalSetup();
}

if (window.location.hostname.includes("geoguessr.com")) {
  geoguessrSetup();
}
