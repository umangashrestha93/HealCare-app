import { useEffect, useMemo, useState } from 'react';
import { resolvePostcodeCoords } from '../utils/postcodeCoords';

/**
 * Resolve lat/lng for a list of Australian postcodes (deduplicated).
 * Returns a map of postcode → { lat, lng, displayName? } | null.
 */
export const usePostcodeCoords = (postcodes = []) => {
  const normalized = useMemo(
    () => [...new Set(postcodes.filter(Boolean).map((code) => String(code).trim()))],
    [postcodes],
  );
  const key = normalized.join(',');

  const [coordsMap, setCoordsMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!normalized.length) {
      setCoordsMap({});
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      normalized.map(async (code) => {
        const coords = await resolvePostcodeCoords(code);
        return [code, coords];
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setCoordsMap(Object.fromEntries(entries));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { coordsMap, loading };
};

export default usePostcodeCoords;
