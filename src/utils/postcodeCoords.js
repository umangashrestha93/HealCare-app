/**
 * Australian postcode → approximate lat/lng lookup.
 * Covers Melbourne metro + common regional postcodes.
 * For postcodes not in the map, falls back to a best-effort approach.
 */

const POSTCODE_COORDS = {
  // Melbourne CBD & surrounds
  '3000': { lat: -37.8136, lng: 144.9631 },
  '3001': { lat: -37.8130, lng: 144.9710 },
  '3002': { lat: -37.8186, lng: 144.9866 },
  '3003': { lat: -37.8073, lng: 144.9470 },
  '3004': { lat: -37.8388, lng: 144.9787 },
  '3005': { lat: -37.8225, lng: 144.9550 },
  '3006': { lat: -37.8262, lng: 144.9650 },
  '3008': { lat: -37.8127, lng: 144.9393 },

  // Inner north
  '3010': { lat: -37.7963, lng: 144.9613 },
  '3011': { lat: -37.8006, lng: 144.8986 }, // Footscray
  '3012': { lat: -37.7890, lng: 144.8770 }, // Brooklyn / Maidstone
  '3020': { lat: -37.7750, lng: 144.8630 }, // Albion / Sunshine
  '3031': { lat: -37.7897, lng: 144.9240 }, // Flemington / Kensington
  '3032': { lat: -37.7830, lng: 144.9050 }, // Ascot Vale / Maribyrnong
  '3039': { lat: -37.7735, lng: 144.9230 }, // Moonee Ponds
  '3051': { lat: -37.8000, lng: 144.9430 }, // North Melbourne
  '3052': { lat: -37.7949, lng: 144.9558 }, // Parkville
  '3053': { lat: -37.8040, lng: 144.9666 }, // Carlton
  '3054': { lat: -37.7897, lng: 144.9720 }, // Carlton North
  '3055': { lat: -37.7718, lng: 144.9505 }, // Brunswick West
  '3056': { lat: -37.7672, lng: 144.9600 }, // Brunswick
  '3057': { lat: -37.7737, lng: 144.9730 }, // Brunswick East
  '3058': { lat: -37.7540, lng: 144.9660 }, // Coburg
  '3065': { lat: -37.8003, lng: 144.9788 }, // Fitzroy
  '3066': { lat: -37.7963, lng: 144.9828 }, // Collingwood
  '3067': { lat: -37.7946, lng: 144.9916 }, // Abbotsford
  '3068': { lat: -37.7860, lng: 144.9780 }, // Clifton Hill / Fitzroy North

  // Inner northeast
  '3070': { lat: -37.7700, lng: 144.9940 }, // Northcote
  '3071': { lat: -37.7600, lng: 145.0010 }, // Thornbury
  '3072': { lat: -37.7450, lng: 145.0060 }, // Preston
  '3073': { lat: -37.7300, lng: 145.0140 }, // Reservoir
  '3078': { lat: -37.7846, lng: 145.0050 }, // Alphington / Fairfield
  '3079': { lat: -37.7694, lng: 145.0310 }, // Ivanhoe
  '3081': { lat: -37.7390, lng: 145.0470 }, // Heidelberg
  '3083': { lat: -37.7180, lng: 145.0570 }, // Bundoora / Kingsbury

  // Inner east
  '3101': { lat: -37.8100, lng: 145.0370 }, // Kew
  '3102': { lat: -37.8020, lng: 145.0560 }, // Kew East
  '3103': { lat: -37.8160, lng: 145.0650 }, // Balwyn
  '3104': { lat: -37.7970, lng: 145.0780 }, // Balwyn North
  '3121': { lat: -37.8190, lng: 144.9960 }, // Richmond / Cremorne
  '3122': { lat: -37.8200, lng: 145.0270 }, // Hawthorn
  '3123': { lat: -37.8260, lng: 145.0440 }, // Hawthorn East
  '3124': { lat: -37.8340, lng: 145.0630 }, // Camberwell
  '3125': { lat: -37.8470, lng: 145.0820 }, // Burwood
  '3126': { lat: -37.8240, lng: 145.0800 }, // Canterbury
  '3127': { lat: -37.8110, lng: 145.0930 }, // Surrey Hills
  '3128': { lat: -37.8150, lng: 145.1100 }, // Box Hill South

  // Inner south
  '3141': { lat: -37.8380, lng: 144.9920 }, // South Yarra / Prahran
  '3142': { lat: -37.8500, lng: 144.9930 }, // Toorak
  '3143': { lat: -37.8560, lng: 145.0080 }, // Armadale
  '3144': { lat: -37.8650, lng: 145.0180 }, // Malvern / Kooyong
  '3145': { lat: -37.8600, lng: 145.0350 }, // Malvern East / Caulfield North
  '3146': { lat: -37.8720, lng: 145.0300 }, // Glen Iris
  '3161': { lat: -37.8740, lng: 145.0130 }, // Caulfield North
  '3162': { lat: -37.8850, lng: 145.0100 }, // Caulfield South
  '3181': { lat: -37.8570, lng: 144.9830 }, // Prahran / Windsor
  '3182': { lat: -37.8685, lng: 144.9860 }, // St Kilda
  '3183': { lat: -37.8720, lng: 144.9960 }, // St Kilda East / Balaclava
  '3185': { lat: -37.8800, lng: 144.9870 }, // Elsternwick
  '3186': { lat: -37.8890, lng: 144.9910 }, // Brighton
  '3204': { lat: -37.8870, lng: 145.0250 }, // Bentleigh / McKinnon
  '3205': { lat: -37.8365, lng: 144.9580 }, // South Melbourne

  // Southeast
  '3130': { lat: -37.8140, lng: 145.1280 }, // Blackburn / Blackburn South
  '3131': { lat: -37.8290, lng: 145.1450 }, // Forest Hill / Nunawading
  '3132': { lat: -37.8400, lng: 145.1580 }, // Mitcham
  '3133': { lat: -37.8540, lng: 145.1700 }, // Vermont / Vermont South
  '3134': { lat: -37.8100, lng: 145.1580 }, // Ringwood
  '3150': { lat: -37.8760, lng: 145.1730 }, // Glen Waverley
  '3152': { lat: -37.8470, lng: 145.1950 }, // Wantirna South / Knoxfield
  '3168': { lat: -37.9120, lng: 145.1250 }, // Clayton
  '3170': { lat: -37.8930, lng: 145.1570 }, // Mulgrave

  // West
  '3021': { lat: -37.7600, lng: 144.8320 }, // St Albans
  '3023': { lat: -37.7500, lng: 144.7810 }, // Deer Park / Caroline Springs
  '3025': { lat: -37.8300, lng: 144.8510 }, // Altona North / Williamstown North
  '3028': { lat: -37.8700, lng: 144.8850 }, // Altona Meadows
  '3029': { lat: -37.8200, lng: 144.7800 }, // Hoppers Crossing / Tarneit
  '3030': { lat: -37.8900, lng: 144.7000 }, // Werribee

  // Northern suburbs
  '3041': { lat: -37.7440, lng: 144.9090 }, // Essendon / Strathmore
  '3042': { lat: -37.7310, lng: 144.8930 }, // Airport West / Niddrie
  '3043': { lat: -37.7150, lng: 144.8850 }, // Gladstone Park / Tullamarine
  '3046': { lat: -37.7140, lng: 144.9280 }, // Glenroy
  '3047': { lat: -37.6930, lng: 144.9330 }, // Broadmeadows / Dallas
  '3060': { lat: -37.7400, lng: 144.9400 }, // Fawkner
  '3064': { lat: -37.6100, lng: 144.9400 }, // Craigieburn
  '3075': { lat: -37.7530, lng: 145.0430 }, // Ivanhoe East
  '3082': { lat: -37.7190, lng: 145.0340 }, // Mill Park / South Morang (partial)
  '3084': { lat: -37.7040, lng: 145.0820 }, // Rosanna / Viewbank

  // Outer east
  '3135': { lat: -37.8220, lng: 145.1930 }, // Bedford Road / Ringwood East
  '3136': { lat: -37.7950, lng: 145.2120 }, // Croydon
  '3140': { lat: -37.8100, lng: 145.2800 }, // Lilydale
  '3148': { lat: -37.8640, lng: 145.1440 }, // Glen Waverley (near)

  // Major regional VIC
  '3220': { lat: -38.1499, lng: 144.3617 }, // Geelong
  '3350': { lat: -37.5622, lng: 143.8503 }, // Ballarat
  '3550': { lat: -36.7570, lng: 144.2794 }, // Bendigo
  '3630': { lat: -36.3566, lng: 145.3939 }, // Shepparton
  '3690': { lat: -36.1209, lng: 146.8870 }, // Wodonga
  '3820': { lat: -38.1734, lng: 145.9426 }, // Warragul
  '3844': { lat: -38.2270, lng: 146.3957 }, // Traralgon
  '3850': { lat: -38.2330, lng: 146.5350 }, // Sale

  // Sydney common
  '2000': { lat: -33.8688, lng: 151.2093 },
  '2010': { lat: -33.8750, lng: 151.2210 },
  '2020': { lat: -33.9060, lng: 151.1960 },
  '2060': { lat: -33.8350, lng: 151.2070 },
  '2100': { lat: -33.7800, lng: 151.2520 },
  '2150': { lat: -33.8150, lng: 150.9900 },

  // Brisbane common
  '4000': { lat: -27.4698, lng: 153.0251 },
  '4101': { lat: -27.4850, lng: 153.0260 },
  '4305': { lat: -27.6150, lng: 152.7700 },

  // Other capitals
  '5000': { lat: -34.9285, lng: 138.6007 }, // Adelaide
  '6000': { lat: -31.9505, lng: 115.8605 }, // Perth
  '7000': { lat: -42.8821, lng: 147.3272 }, // Hobart
  '0800': { lat: -12.4634, lng: 130.8456 }, // Darwin
  '2600': { lat: -35.2809, lng: 149.1300 }, // Canberra
};

/**
 * Default centre (Melbourne CBD)
 */
export const DEFAULT_CENTER = { lat: -37.8136, lng: 144.9631 };
export const DEFAULT_ZOOM = 12;

/** Radius (km) for "near me" / local practitioner matching */
export const NEARBY_RADIUS_KM = 12;

const sessionCache = new Map();
const pendingRequests = new Map();

/**
 * Get lat/lng for a known postcode from the local lookup table or session cache.
 */
export const getPostcodeCoords = (postcode) => {
  if (!postcode) return null;
  const code = String(postcode).trim();
  return POSTCODE_COORDS[code] || sessionCache.get(code) || null;
};

/**
 * Haversine distance between two lat/lng points in kilometres.
 */
export const haversineKm = (a, b) => {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/**
 * Resolve lat/lng for any valid Australian postcode.
 * Uses local lookup first, then the backend geocoding API (OpenStreetMap).
 */
export const resolvePostcodeCoords = async (postcode) => {
  if (!postcode) return null;
  const code = String(postcode).trim();
  if (!/^\d{4}$/.test(code)) return null;

  const known = POSTCODE_COORDS[code];
  if (known) {
    sessionCache.set(code, known);
    return known;
  }

  if (sessionCache.has(code)) {
    return sessionCache.get(code);
  }

  if (pendingRequests.has(code)) {
    return pendingRequests.get(code);
  }

  const request = (async () => {
    try {
      const { geocodeService } = await import('../services/api');
      const data = await geocodeService.lookupPostcode(code);
      const coords = { lat: data.lat, lng: data.lng, displayName: data.displayName };
      sessionCache.set(code, coords);
      return coords;
    } catch {
      return null;
    } finally {
      pendingRequests.delete(code);
    }
  })();

  pendingRequests.set(code, request);
  return request;
};

export default POSTCODE_COORDS;
