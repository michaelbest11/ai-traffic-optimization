import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function TrafficMap({ hotspots, routes }) {
  return (
    <MapContainer center={[5.6037, -0.1870]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {hotspots.map((h, idx) => (
        <CircleMarker
          key={idx}
          center={[h.lat, h.lng]}
          radius={10}
          color={h.severity === 'high' ? 'red' : h.severity === 'medium' ? 'orange' : 'green'}
        >
          <Tooltip>{`${h.name} - ${h.severity}`}</Tooltip>
        </CircleMarker>
      ))}
      {routes.map((r, idx) => (
        <Polyline key={idx} positions={r.path} color="blue" weight={4}>
          <Tooltip>{r.name}</Tooltip>
        </Polyline>
      ))}
    </MapContainer>
  );
}
