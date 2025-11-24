import React from "react";

const distanceKm = (lat1, lng1, lat2, lng2) => {
const R = 6371;
const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLng = ((lng2 - lng1) * Math.PI) / 180;
const a =
Math.sin(dLat / 2) ** 2 +
Math.cos((lat1 * Math.PI) / 180) *
Math.cos((lat2 * Math.PI) / 180) *
Math.sin(dLng / 2) ** 2;
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c;
};

const RouteList = ({ routes, selectedRouteId, onSelectRoute, cameras = [], onCameraSelect }) => {
const findNearbyCameras = (route) => {
if (!route.path) return [];
return cameras.filter((cam) =>
route.path.some((p) => distanceKm(p.lat, p.lng, cam.coords[0], cam.coords[1]) < 0.5)
);
};

return ( <div className="space-y-2">
{routes.map((route) => {
const isSelected = route.id === selectedRouteId;
const nearbyCams = findNearbyCameras(route);
return (
<div key={route.id} className={`border rounded p-2 ${isSelected ? "bg-blue-50" : "bg-white"}`}> <div className="flex justify-between items-center"> <div> <div className="font-medium">{route.name || `Route ${route.id}`}</div> <div className="text-xs text-gray-500">
{route.path.length} points </div> </div>
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
onClick={() => onCameraSelect && onCameraSelect(cam)}
/>
))} </div>
)} </div>
);
})} </div>
);
};

export default RouteList;
