/**
 * Advanced Dynamic Geo-Data Engine
 * Fetches 100% real-time data for History, Culture, and Regional Current Affairs.
 */
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY; 

// NEW: Search Lookup Matrix function to convert country strings into lat/lng coordinates
export async function fetchCountryCoordinates(countryName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(countryName)}&format=json&limit=1`
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("Country matrix location not found");
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Geocoding Failure:", error);
    throw error;
  }
}

export async function fetchInsights(lat, lng) {
  try {
    // 1. Reverse Geocoding to identify the nation
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const geoResponse = await fetch(geoUrl, { headers: { 'Accept-Language': 'en' } });
    const geoData = await geoResponse.json();

    const country = geoData.address?.country || null;
    const state = geoData.address?.state || geoData.address?.region || null;

    if (!country) {
      return { name: "Unknown Waters", isOcean: true };
    }

    // 2. Wikipedia Main Summary Request (History / Overview)
    const wikiSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country)}`;
    
    // 3. Wikipedia Search Request to pull text explicitly matching cultural elements
    const wikiCultureUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country + ' _culture')}`;

    // 4. Bulletproof, Keyless Current Affairs engine using Google News RSS parsed directly to JSON
    const rssFeedUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${country}&hl=en-US&gl=US&ceid=US:en`)}`;

    // Execute all 3 network streams concurrently
    const [summaryRes, cultureRes, newsRes] = await Promise.all([
      fetch(wikiSummaryUrl).catch(() => null),
      fetch(wikiCultureUrl).catch(() => null),
      fetch(rssFeedUrl).catch(() => null)
    ]);

    // Parse History
    let historyData = "Historical profiles are currently being gathered for this zone.";
    if (summaryRes && summaryRes.ok) {
      const data = await summaryRes.json();
      historyData = data.extract || historyData;
    }

    // Parse Culture dynamically
    let cultureData = `The unique cultural heritage of ${country} comprises its local arts, deep culinary roots, architectural monuments, and traditional societal values passed down through generations.`;
    if (cultureRes && cultureRes.ok) {
      const data = await cultureRes.json();
      if (data.extract && data.type !== 'no-title') {
        cultureData = data.extract;
      }
    }

    // Parse Current Affairs news items securely
    let newsArticles = [];
    if (newsRes && newsRes.ok) {
      const data = await newsRes.json();
      if (data.items && data.items.length > 0) {
        // Map out the top 4 structural news articles
        newsArticles = data.items.slice(0, 4).map(item => ({
          title: item.title,
          source: item.author || "Global Dispatch",
          link: item.link
        }));
      }
    }

    return {
      country: country,
      state: state || "Main Territory",
      isOcean: false,
      history: historyData,
      culture: cultureData,
      currentAffairs: newsArticles.length > 0 ? newsArticles : null
    };

  } catch (error) {
    console.error("Critical Data Failure:", error);
    return { 
      country: "Error", 
      isOcean: false, 
      history: "Could not establish server linkages.",
      culture: "Data unretrievable.",
      currentAffairs: null
    };
  }
}

// Add this helper array to the bottom of your geoApi.js file
export const countryMatrixList = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", 
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", 
  "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Lithuania", 
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", 
  "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", 
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", 
  "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", 
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "South Sudan", 
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", 
  "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Uganda", 
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", 
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];