import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import DrawingLayer from './DrawingLayer';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// Moves the map whenever flyToTarget changes
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.lat && target?.lng) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1 });
    }
  }, [target, map]);
  return null;
}

export default function MapView({ locations, onMapClick, onEdit, onDelete, groupId, onZoneSaved, flyToTarget }) {
  const firstPoint = locations.find((l) => l.type === 'point' && l.lat != null);
  const center = firstPoint ? [firstPoint.lat, firstPoint.lng] : [6.2442, -75.5812];

  const points = locations.filter((l) => l.type === 'point' && l.lat != null);
  const zones = locations.filter((l) => l.type === 'zone' && l.coordinates?.length);

  return (
    <div className="h-96 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {groupId && onZoneSaved && <DrawingLayer groupId={groupId} onZoneSaved={onZoneSaved} />}
        {flyToTarget && <FlyTo target={flyToTarget} />}

        {points.map((loc) => (
          <Marker key={loc._id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div className="min-w-48">
                <p className="font-semibold text-sm">{loc.name}</p>
                {loc.description && <p className="text-gray-500 text-xs mt-1">{loc.description}</p>}
                <p className="text-gray-400 text-xs mt-1">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </p>
                {onEdit && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => onEdit(loc)} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded">
                      Editar
                    </button>
                    <button onClick={() => onDelete(loc._id)} className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded">
                      Borrar
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {zones.map((z) => (
          <Polygon
            key={z._id}
            positions={z.coordinates.map(([lat, lng]) => [lat, lng])}
            pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.15 }}
          >
            <Popup>
              <div className="min-w-40">
                <p className="font-semibold text-sm">{z.name}</p>
                {z.description && <p className="text-gray-500 text-xs mt-1">{z.description}</p>}
                {onDelete && (
                  <button onClick={() => onDelete(z._id)} className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded mt-2">
                    Borrar zona
                  </button>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}
