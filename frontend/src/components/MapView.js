import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const toLatLngs = (path) => (path || []).map((p) => [p.lat, p.lng]);

const FitBounds = ({ latlngs }) => {
const map = useMap();
React.useEffect(() => {
if (!map || !latlngs || !latlngs.length) return;
try {
const bounds = L.latLngBounds(latlngs);
map.fitBounds(bounds, { padding: [40, 40] });
} catch {}
}, [map, latlngs]);
return null;
};

const MapView = ({ selectedCity, routes = [], selectedRoute, aiRoute }) => {
const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];
const latlngsForFit = selectedRoute
? toLatLngs(selectedRoute.path)
: aiRoute
? aiRoute.map((p) => [p.lat, p.lng])
: routes.flatMap((r) => toLatLngs(r.path || []));

return ( <div className="w-full h-[600px] rounded">
<MapContainer center={mapInitialCenter} zoom={13} style={{ height: "100%", width: "100%" }}> <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
{latlngsForFit && <FitBounds latlngs={latlngsForFit} />}
{selectedRoute && ( <Polyline positions={toLatLngs(selectedRoute.path)} color="red" />
)}
{aiRoute && <Polyline positions={aiRoute.map((p) => [p.lat, p.lng])} color="blue" />}
{routes.map((r) =>
r.path.map((p, idx) => (
<Marker key={`${r.id}-${idx}`} position={[p.lat, p.lng]}> <Popup>{r.name || `Route ${r.id}`}</Popup> </Marker>
))
)} </MapContainer> </div>
);
};

export default MapView;
