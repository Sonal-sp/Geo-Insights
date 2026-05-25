/**
 * Converts Latitude & Longitude into real-world geographic names and historical data.
 */
export async function fetchInsights(lat, lng) {
  try {
    // 1. Reverse Geocoding using OpenStreetMap (Free, no token needed)
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const geoResponse = await fetch(geoUrl, {
      headers: { 'Accept-Language': 'en' } // Forces english responses
    });
    const geoData = await geoResponse.json();

    // Extract the country and state safely
    const country = geoData.address?.country || null;
    const state = geoData.address?.state || geoData.address?.region || null;

    if (!country) {
      return { 
        name: "Unknown Waters", 
        details: "Looks like you clicked an ocean or an uninhabited area. Try clicking on land!" 
      };
    }

    // 2. Query Wikipedia for regional background info
    // We use the country name to get a high-yield summary paragraph
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country)}`;
    const wikiResponse = await fetch(wikiUrl);
    let wikiExtract = "Academic insights for this region are currently being indexed.";

    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      wikiExtract = wikiData.extract || wikiExtract;
    }

    return {
      country: country,
      state: state || "Main Region",
      summary: wikiExtract,
    };

  } catch (error) {
    console.error("Data Engine Error:", error);
    return {
      country: "Error",
      state: "Connection Failed",
      summary: "Could not fetch geographical insights. Check your internet connection."
    };
  }
}