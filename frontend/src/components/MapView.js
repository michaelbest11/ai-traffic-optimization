import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
iconRetinaUrl: "[https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png)",
iconUrl: "[https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png)",
shadowUrl: "[https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png)",
});

const toLatLngs = (path) => (path || []).map((p) => [p.lat, p.lng]);

const MapView = ({ selectedCity, routes, selectedRoute, onSelectRoute }) => {
const mapCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];

return (
<MapContainer center={mapCenter} zoom={13} style={{ height: "600px", width: "100%" }}> <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

```
  {routes.map((route) => {  
    const pathCoords = toLatLngs(route.path);  
    if (!pathCoords.length) return null;  
    const isSelected = selectedRoute && selectedRoute.id === route.id;  

    return (  
      <Polyline  
        key={route.id}  
        positions={pathCoords}  
        color={isSelected ? "blue" : "red"}  
        weight={isSelected ? 5 : 3}  
        eventHandlers={{  
          click: () => {  
            if (onSelectRoute) onSelectRoute(route);  
          },  
        }}  
      />  
    );  
  })}  

  {/* Optional: show route start/end markers */}  
  {selectedRoute && selectedRoute.path && selectedRoute.path.length > 0 && (  
    <>  
      <Marker position={[selectedRoute.path[0].lat, selectedRoute.path[0].lng]}>  
        <Popup>Start</Popup>  
      </Marker>  
      <Marker position={[selectedRoute.path[selectedRoute.path.length - 1].lat, selectedRoute.path[selectedRoute.path.length - 1].lng]}>  
        <Popup>End</Popup>  
      </Marker>  
    </>  
  )}  
</MapContainer>  


);
};

export default MapView;
