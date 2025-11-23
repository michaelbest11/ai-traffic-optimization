import React, { useMemo } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "420px",
  borderRadius: 8,
  overflow: "hidden",
};

export default function MapView({
  apiKey,
  intersections = [],
  routes = [],
  selectedRoute,
  onSelectRoute,
}) {
  const center = useMemo(() => {
    if (intersections.length > 0) {
      return { lat: intersections[0].lat, lng: intersections[0].lng };
    }
    return { lat: 5.6037, lng: -0.1870 };
  }, [intersections]);

  return (
    <div className="map-card">
      <h3>Map</h3>
      <LoadScript googleMapsApiKey={apiKey || ""}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
          {/* Markers */}
          {intersections.map((i) => (
            <Marker
              key={i.id}
              position={{ lat: i.lat, lng: i.lng }}
              title={i.name}
              onClick={() => window.alert(`${i.name}\nLat: ${i.lat}\nLng: ${i.lng}`)}
            />
          ))}

          {/* Selected route polyline(s) */}
          {selectedRoute?.alternatives?.map((alt, idx) => (
            <Polyline
              key={alt.id || idx}
              path={alt.route.map((p) => ({ lat: p.lat, lng: p.lng }))}
              options={{
                strokeColor: alt.color || (idx % 2 === 0 ? "#1976d2" : "#2e7d32"),
                strokeOpacity: 0.9,
                strokeWeight: idx === 0 ? 5 : 3,
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {/* Quick route selector */}
      <div className="map-actions">
        <label>
          Quick select route:
          <select
            onChange={(e) => {
              const idx = Number(e.target.value);
              if (!isNaN(idx) && routes[idx]) onSelectRoute?.(routes[idx]);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Choose...
            </option>
            {routes.map((r, i) => (
              <option key={i} value={i}>
                {r.start} → {r.end}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
