import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Helper to convert intersections into LatLng array
const getLatLngs = (routeIds, intersections) => {
  return routeIds.map((id) => {
    const inter = intersections.find((i) => i.id === id);
    return inter ? [inter.lat, inter.lng] : null;
  }).filter(Boolean);
};

function MapView({ selectedRoute, intersections }) {
  if (!selectedRoute) return null;

  return (
    <div>
      <MapContainer center={[6.67, -1.62]} zoom={12} className="leaflet-container">
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedRoute.map((alt) => {
          const latlngs = getLatLngs(alt.route, intersections);
          return (
            <Polyline
              key={alt.id}
              positions={latlngs}
              color={alt.color || "blue"}
              weight={5}
            />
          );
        })}

        {selectedRoute.map((alt) =>
          alt.route.map((rid) => {
            const inter = intersections.find((i) => i.id === rid);
            if (!inter) return null;
            return (
              <Marker key={inter.id} position={[inter.lat, inter.lng]}>
                <Popup>
                  <strong>{inter.name}</strong>
                  <br />
                  {inter.feed.endsWith(".mp4") ? (
                    <video width="160" height="120" controls>
                      <source src={inter.feed} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={inter.feed} alt={inter.name} width="160" height="120" />
                  )}
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
