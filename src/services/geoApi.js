/**
 * Advanced Dynamic Geo-Data Engine (Bulletproof Edition)
 * Fetches real-time data for History, Culture, and Regional Current Affairs.
 */
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY; 

// 1. Search Lookup Matrix (String -> Coordinates)
export async function fetchCountryCoordinates(countryName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(countryName)}&format=json&limit=1`,
      {
        headers: {
          'Accept-Language': 'en',
          // CRITICAL: Nominatim requires a User-Agent or it blocks requests with a 403
          'User-Agent': 'GeoInsightsStudyMatrixApplication/1.0 (contact: student-dev@example.com)'
        }
      }
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

// 2. Reverse Lookup & Insights Aggregator
export async function fetchInsights(lat, lng) {
  try {
    // Reverse Geocoding with valid User-Agent strings
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const geoResponse = await fetch(geoUrl, { 
      headers: { 
        'Accept-Language': 'en',
        'User-Agent': 'GeoInsightsStudyMatrixApplication/1.0 (contact: student-dev@example.com)'
      } 
    });
    const geoData = await geoResponse.json();

    const country = geoData.address?.country || null;
    const state = geoData.address?.state || geoData.address?.region || null;

    if (!country) {
      return { name: "Unknown Waters", isOcean: true };
    }

    // Build sub-resource query targets
    const wikiSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country)}`;
    const wikiCultureUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country + ' _culture')}`;
    const rssFeedUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${country}&hl=en-US&gl=US&ceid=US:en`)}`;

    // Use Promise.allSettled instead of Promise.all so if ONE api fails, the others don't reject!
    const [summaryRes, cultureRes, newsRes] = await Promise.allSettled([
      fetch(wikiSummaryUrl).then(res => res.ok ? res.json() : null),
      fetch(wikiCultureUrl).then(res => res.ok ? res.json() : null),
      fetch(rssFeedUrl).then(res => res.ok ? res.json() : null)
    ]);

    // Parse History
    let historyData = `Historical profiles are currently being gathered for ${country}.`;
    if (summaryRes.status === 'fulfilled' && summaryRes.value) {
      historyData = summaryRes.value.extract || historyData;
    }

    // Parse Culture
    let cultureData = `The unique cultural heritage of ${country} comprises its local arts, deep culinary roots, architectural monuments, and traditional societal values.`;
    if (cultureRes.status === 'fulfilled' && cultureRes.value && cultureRes.value.type !== 'no-title') {
      cultureData = cultureRes.value.extract || cultureData;
    }

    // Parse News Articles securely
    let newsArticles = [];
    if (newsRes.status === 'fulfilled' && newsRes.value && newsRes.value.items) {
      newsArticles = newsRes.value.items.slice(0, 4).map(item => ({
        title: item.title,
        source: item.author || "Global Dispatch",
        link: item.link
      }));
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
      country: "System Error", 
      state: "Maintenance Pipeline",
      isOcean: false, 
      history: `Failed connection payload. Core details: ${error.message}`,
      culture: "Data streams isolated. Check your browser network console tab.",
      currentAffairs: null
    };
  }
}

// Global local country matching dictionary array driving autocomplete
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

export async function fetchLiveGlobalEvents() {
  try {
    // Fetching significant earthquakes from the past 30 days globally
    const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson");
    if (!response.ok) throw new Error("Failed to pull live global event stream.");
    
    const data = await response.json();
    
    // Map out the GeoJSON into a clean array our Globe component can loop through natively
    return data.features.map(feature => ({
      id: feature.id,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      magnitude: feature.properties.mag,
      place: feature.properties.place,
      time: new Date(feature.properties.time).toLocaleString(),
      type: "Seismic Hazard",
      url: feature.properties.url
    }));
  } catch (error) {
    console.error("Crisis Feed Failure:", error);
    return []; // Return empty array on failure to prevent app crashes
  }
}

/**
 * PHASE 10: Lightweight Quiz Coordinate Validator
 * Returns ONLY the country name of a clicked point for fast verification.
 */
export async function verifyQuizClick(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'GeoInsightsStudyMatrixApplication/1.0 (contact: student-dev@example.com)'
        }
      }
    );
    const data = await response.json();
    return data.address?.country || null;
  } catch (error) {
    console.error("Quiz Validation Network Error:", error);
    return null;
  }
}