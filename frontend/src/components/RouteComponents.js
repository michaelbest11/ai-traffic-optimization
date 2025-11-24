import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import L from "leaflet";

// Helper to convert path to Leaflet LatLng array safely
export const toLatLngs = (path) => (path || []).map((p) => [p.lat, p.lng]);

// FitBounds component safely sets map bounds
export const FitBounds = ({ latlngs, mapRef }) => {
useEffect(() => {
if (!mapRef?.current || !latlngs?.length) return;
try {
const bounds = L.latLngBounds(latlngs);
mapRef.current.fitBounds(bounds, { padding: [40, 40] });
} catch (e) {
console.error("FitBounds error:", e);
}
}, [latlngs, mapRef]);
return null;
};
FitBounds.propTypes = {
latlngs: PropTypes.array,
mapRef: PropTypes.object,
};

// RouteList safely renders routes and nearby cameras
export const RouteList = ({ routes = [], selectedRouteId, onSelectRoute, cameras = [], onCameraSelect }) => {
const findNearbyCameras = (route) => {
if (!route?.path?.length) return [];
return cameras.filter((cam) =>
route.path.some((p) => {
const [lat, lng] = cam.coords || [];
if (lat == null || lng == null) return false;
const R = 6371;
const dLat = ((p.lat - lat) * Math.PI) / 180;
const dLng = ((p.lng - lng) * Math.PI) / 180;
const a =
Math.sin(dLat / 2) ** 2 +
Math.cos((p.lat * Math.PI) / 180) *
Math.cos((lat * Math.PI) / 180) *
Math.sin(dLng / 2) ** 2;
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c < 0.5;
})
);
};

return ( <div className="space-y-2">
{routes.map((route) => {
const isSelected = route.id === selectedRouteId;
const nearbyCams = findNearbyCameras(route);
return (
<div key={route.id} className={`border rounded p-2 ${isSelected ? "bg-blue-50" : "bg-white"}`}> <div className="flex justify-between items-center"> <div> <div className="font-medium">{route.name || `Route ${route.id}`}</div> <div className="text-xs text-gray-500">{route.path?.length ?? 0} points</div> </div>
<button
className="text-sm px-2 py-1 border rounded bg-blue-600 text-white"
onClick={() => onSelectRoute(route.id)}
>
{isSelected ? "Deselect" : "Select"} </button> </div>
{nearbyCams.length > 0 && ( <div className="flex gap-2 mt-2 overflow-x-auto">
{nearbyCams.map((cam) => (
<img
key={cam.id}
src={cam.thumbnail}
alt={cam.title}
className="w-16 h-16 object-cover border rounded cursor-pointer"
title={cam.title}
onClick={() => onCameraSelect?.(cam)}
/>
))} </div>
)} </div>
);
})} </div>
);
};
RouteList.propTypes = {
routes: PropTypes.array,
selectedRouteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
onSelectRoute: PropTypes.func.isRequired,
cameras: PropTypes.array,
onCameraSelect: PropTypes.func,
};

// RouteRecommendation safely generates AI routes
export const RouteRecommendation = ({ city, cameras = [], onRouteGenerated, onCameraSelect }) => {
const [formData, setFormData] = useState({
startLat: "5.5600",
startLng: "-0.1969",
endLat: "5.5566",
endLng: "-0.1969",
city,
});
const [loading, setLoading] = useState(false);
const [routeData, setRouteData] = useState(null);

useEffect(() => setFormData((f) => ({ ...f, city })), [city]);

const handleOptimizeRoute = async () => {
setLoading(true);
try {
const payload = {
start: { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
end: { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
city: formData.city,
};
const final = {
optimized_route: [
payload.start,
{ lat: (payload.start.lat + payload.end.lat) / 2, lng: (payload.start.lng + payload.end.lng) / 2 },
payload.end,
],
estimated_time_minutes: 15,
distance_km: 3.2,
traffic_conditions: "Moderate",
ai_insights: "Mock: avoids hotspots",
};
setRouteData(final);
onRouteGenerated?.(final.optimized_route);
} finally {
setLoading(false);
}
};

const nearbyCameras = routeData?.optimized_route
? cameras.filter((cam) =>
routeData.optimized_route.some(
(p) => {
const [lat, lng] = cam.coords || [];
if (lat == null || lng == null) return false;
const R = 6371;
const dLat = ((p.lat - lat) * Math.PI) / 180;
const dLng = ((p.lng - lng) * Math.PI) / 180;
const a =
Math.sin(dLat / 2) ** 2 +
Math.cos((p.lat * Math.PI) / 180) *
Math.cos((lat * Math.PI) / 180) *
Math.sin(dLng / 2) ** 2;
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c < 0.5;
}
)
)
: [];

return ( <div className="bg-white rounded-lg shadow-lg p-4 mb-4"> <h3 className="font-semibold mb-2">AI Route Optimization</h3> <div className="grid grid-cols-2 gap-2 mb-2">
<input value={formData.startLat} onChange={(e) => setFormData({ ...formData, startLat: e.target.value })} />
<input value={formData.startLng} onChange={(e) => setFormData({ ...formData, startLng: e.target.value })} />
<input value={formData.endLat} onChange={(e) => setFormData({ ...formData, endLat: e.target.value })} />
<input value={formData.endLng} onChange={(e) => setFormData({ ...formData, endLng: e.target.value })} /> </div> <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleOptimizeRoute} disabled={loading}>
{loading ? "Optimizing..." : "Optimize Route"} </button>
{nearbyCameras.length > 0 && ( <div className="flex gap-2 mt-2 overflow-x-auto">
{nearbyCameras.map((cam) => (
<img
key={cam.id}
src={cam.thumbnail}
alt={cam.title}
className="w-16 h-16 object-cover border rounded cursor-pointer"
title={cam.title}
onClick={() => onCameraSelect?.(cam)}
/>
))} </div>
)} </div>
);
};
RouteRecommendation.propTypes = {
city: PropTypes.string.isRequired,
cameras: PropTypes.array,
onRouteGenerated: PropTypes.func,
onCameraSelect: PropTypes.func,
};
