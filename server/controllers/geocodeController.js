const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const isValidAuPostcode = (code) => /^\d{4}$/.test(code);

exports.geocodePostcode = async (req, res) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!isValidAuPostcode(code)) {
      return res.status(400).json({ message: 'Invalid Australian postcode' });
    }

    const cached = cache.get(code);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('postalcode', code);
    url.searchParams.set('country', 'Australia');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Beyond5-Healthcare-Webapp/1.0 (healthcare marketplace)' },
    });

    if (!response.ok) {
      return res.status(502).json({ message: 'Geocoding service unavailable' });
    }

    const results = await response.json();
    if (!results.length) {
      return res.status(404).json({ message: 'Postcode not found' });
    }

    const data = {
      postcode: code,
      lat: Number.parseFloat(results[0].lat),
      lng: Number.parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };

    cache.set(code, { ts: Date.now(), data });
    return res.json(data);
  } catch (err) {
    console.error('Geocode error:', err.message);
    return res.status(500).json({ message: 'Failed to geocode postcode' });
  }
};
