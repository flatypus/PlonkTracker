/**
 * HELPER FUNCTIONS. Code for checking countries credit to nappyslappy - https://greasyfork.org/en/users/922456
 */

// Helper function to check for specific US territories
function checkUSTerritories(out) {
  const territories = {
    "US-PR": "pr", // Puerto Rico
    "US-GU": "gu", // Guam
    "US-MP": "mp", // Northern Mariana Islands
    "US-VI": "vi", // Virgin Islands
    "US-AS": "as", // American Samoa
  };
  return territories[out.address["ISO3166-2-lvl4"]] || null;
}

// Helper function to check for US Minor Outlying Islands
function checkUSMinorOutlyingIslands(countryCode) {
  return countryCode === "um" ? "us" : null;
}

// Helper function to check for specific AU territories
function checkAUTerritories(out) {
  const territories = {
    "Cocos (Keeling) Islands": "cc", // Cocos Islands
    "Christmas Island": "cx", // Christmas Island
  };
  return territories[out.address["territory"]] || null;
}

// Helper function to check for NL territories
function checkNLTerritories(out) {
  return out.address["ISO3166-2-lvl3"] === "NL-CW" ? "cw" : null; // Curaçao
}

// Helper function to handle Hong Kong & Macau within China
function checkHongKongMacau(out) {
  const regions = {
    "CN-HK": "hk", // Hong Kong
    "CN-MO": "mo", // Macau
  };
  return regions[out.address["ISO3166-2-lvl3"]] || null;
}

// Main function to determine the correct country code
function checkGuessCountryCode(out) {
  let countryCode = out.address.country_code || "NO CODE";

  // Check for specific US territories
  if (countryCode === "us") {
    countryCode = checkUSTerritories(out) || countryCode;
  }

  // Check for US Minor Outlying Islands
  if (countryCode === "um") {
    countryCode = checkUSMinorOutlyingIslands(countryCode);
  }

  // Check for AU territories
  if (countryCode === "au") {
    countryCode = checkAUTerritories(out) || countryCode;
  }

  // Check for NL territories
  if (countryCode === "nl") {
    countryCode = checkNLTerritories(out) || countryCode;
  }

  // Check for Palestine
  if (countryCode === "ps") {
    countryCode = "il";
  }

  // Check for Hong Kong & Macau
  if (countryCode === "cn") {
    countryCode = checkHongKongMacau(out) || countryCode;
  }

  return countryCode;
}

// Get the guess country code from location coordinates
async function getCountryCode(location) {
  if (location[0] <= -85.05 || !location) {
    return "AQ";
  } else {
    const api = `https://nominatim.openstreetmap.org/reverse.php?lat=${location[0]}&lon=${location[1]}&format=jsonv2`;
    try {
      const res = await fetch(api);
      const out = await res.json();
      return checkGuessCountryCode(out).toUpperCase();
    } catch (err) {
      return "ERROR";
    }
  }
}
