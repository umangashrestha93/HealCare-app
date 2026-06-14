import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Stack, Chip, Avatar, Button, CircularProgress } from '@mui/material';
import { LocationOn, Star, Verified } from '@mui/icons-material';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../utils/postcodeCoords';
import usePostcodeCoords from '../../hooks/usePostcodeCoords';

/* ── Fix Leaflet default marker icon paths (broken by bundlers) ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Custom coloured markers (SVG-based) ── */
const makeIcon = (color, size = 32) =>
  L.divIcon({
    className: '',
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 4)],
    html: `
      <svg width="${size}" height="${size + 10}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10.8 14.4 24.8 15.2 25.6a1.067 1.067 0 001.6 0C17.6 40.8 32 26.8 32 16 32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="15" r="7" fill="white" opacity="0.9"/>
        <circle cx="16" cy="15" r="4" fill="${color}" opacity="0.7"/>
      </svg>
    `,
  });

const pinGreen  = makeIcon('#0d8a72');
const pinBlue   = makeIcon('#004a99');
const pinAmber  = makeIcon('#f59e0b');
const pinRed    = makeIcon('#ef4444', 36); // searched postcode

/* ── Component to recenter the map smoothly ── */
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center?.[0] != null && center?.[1] != null) {
      map.flyTo(center, zoom ?? DEFAULT_ZOOM, { duration: 1.2 });
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
};

/* ── Helpers ── */
const getFullName = (p) =>
  p.name || `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || 'Practitioner';

const getPostcode = (p) =>
  p.postcode || p.locationPostcode || p.userId?.postcode || '';

const getFunding = (p) =>
  Array.isArray(p.fundingOptions) && p.fundingOptions.length ? p.fundingOptions : [];

/**
 * PractitionerMap
 * 
 * Props:
 *  - practitioners: array of normalised practitioner objects
 *  - searchPostcode: the postcode the user searched for
 *  - height: map container height (default 460)
 *  - onBook: callback(practitioner) when user clicks Book
 *  - onEnquire: callback(practitioner) when user clicks Enquire
 */
const PractitionerMap = ({
  practitioners = [],
  searchPostcode = '',
  height = 460,
  onBook,
  onEnquire,
}) => {
  const mapRef = useRef(null);

  const postcodesToResolve = useMemo(
    () => [searchPostcode, ...practitioners.map(getPostcode)].filter(Boolean),
    [searchPostcode, practitioners],
  );
  const { coordsMap, loading: geocoding } = usePostcodeCoords(postcodesToResolve);

  const searchCoords = searchPostcode ? coordsMap[searchPostcode] : null;
  const center = searchCoords || DEFAULT_CENTER;

  const pins = useMemo(() => {
    return practitioners
      .map((p) => {
        const code = getPostcode(p);
        const coords = code ? coordsMap[code] : null;
        if (!coords) return null;
        const highlighted = Boolean(p.localMatch || p.travelsToPostcode);
        return { ...p, coords, highlighted };
      })
      .filter(Boolean);
  }, [practitioners, coordsMap]);

  return (
    <Box
      sx={{
        height,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        '& .leaflet-container': { height: '100%', width: '100%', borderRadius: 12 },
      }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={[center.lat, center.lng]} zoom={DEFAULT_ZOOM} />

        {/* Searched-postcode pin */}
        {searchCoords && (
          <Marker position={[searchCoords.lat, searchCoords.lng]} icon={pinRed}>
            <Popup>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                📍 Searched postcode: {searchPostcode}
              </Typography>
              {searchCoords?.displayName && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {searchCoords.displayName}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Showing practitioners near this area.
              </Typography>
            </Popup>
          </Marker>
        )}

        {/* Practitioner pins */}
        {pins.map((p) => (
          <Marker
            key={p._id || p.id}
            position={[p.coords.lat, p.coords.lng]}
            icon={p.highlighted ? pinGreen : pinBlue}
          >
            <Popup minWidth={220} maxWidth={280}>
              <Box sx={{ p: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Avatar
                    src={p.avatar || p.image || `https://api.dicebear.com/7.x/initials/svg?seed=${getFullName(p)}`}
                    sx={{ width: 36, height: 36 }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                      {getFullName(p)}
                      {p.verificationStatus === 'approved' && (
                        <Verified sx={{ fontSize: 14, ml: 0.5, color: '#0d8a72', verticalAlign: 'text-bottom' }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      {p.discipline}
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <LocationOn sx={{ fontSize: 13 }} />
                    {p.location || p.userId?.location || 'Location on profile'} {getPostcode(p)}
                  </Typography>
                  {p.averageRating > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <Star sx={{ fontSize: 13, color: '#f59e0b' }} />
                      {p.averageRating ?? p.rating ?? 'New'} ({p.totalReviews ?? p.reviews ?? 0} reviews)
                    </Typography>
                  )}
                </Stack>

                {getFunding(p).length > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mb: 1.5 }}>
                    {getFunding(p).slice(0, 3).map((f) => (
                      <Chip key={f} label={f} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                    ))}
                  </Stack>
                )}

                {p.highlighted && (
                  <Chip
                    label={p.distanceLabel || `Near ${searchPostcode}`}
                    size="small"
                    color="success"
                    sx={{ mb: 1.5, fontWeight: 700, height: 22 }}
                  />
                )}

                <Stack direction="row" spacing={1}>
                  {onBook && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onBook(p)}
                      sx={{ fontSize: 11, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.3 }}
                    >
                      Book
                    </Button>
                  )}
                  {onEnquire && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onEnquire(p)}
                      sx={{ fontSize: 11, fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.3 }}
                    >
                      Enquire
                    </Button>
                  )}
                </Stack>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay badge */}
      <Box
        sx={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
          borderRadius: 2, px: 2, py: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        {geocoding && searchPostcode ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={14} />
            <Typography variant="caption" fontWeight={800}>Locating {searchPostcode}…</Typography>
          </Stack>
        ) : searchPostcode && !searchCoords ? (
          <Typography variant="caption" fontWeight={800} color="error.main">
            Could not locate postcode {searchPostcode}. Check it is a valid Australian postcode.
          </Typography>
        ) : (
          <Typography variant="caption" fontWeight={800} sx={{ display: 'block' }}>
            {searchPostcode
              ? `📍 ${searchPostcode}${searchCoords?.displayName ? ` · ${searchCoords.displayName.split(',')[1]?.trim() || ''}` : ''}`
              : 'Enter a postcode'} · {pins.length} practitioner{pins.length !== 1 ? 's' : ''}
          </Typography>
        )}
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0d8a72' }} />
            <Typography variant="caption" sx={{ fontSize: 10 }}>Nearby / travels to you</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#004a99' }} />
            <Typography variant="caption" sx={{ fontSize: 10 }}>Other area</Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default PractitionerMap;
