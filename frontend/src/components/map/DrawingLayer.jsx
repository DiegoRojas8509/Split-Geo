import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import api from '../../api/axios';

export default function DrawingLayer({ groupId, onZoneSaved }) {
  const map = useMap();
  const [pendingCoords, setPendingCoords] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawCircle: false,
      drawRectangle: true,
      drawPolygon: true,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });

    function onCreate(e) {
      const layer = e.layer;
      const coords = layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
      map.removeLayer(layer);
      setPendingCoords(coords);
      setShowModal(true);
    }

    map.on('pm:create', onCreate);
    return () => { map.off('pm:create', onCreate); };
  }, [map]);

  async function handleSave(e) {
    e.preventDefault();
    try {
      await api.post('/locations', {
        name: zoneName,
        description: zoneDesc,
        type: 'zone',
        coordinates: pendingCoords,
        groupId,
      });
      onZoneSaved();
    } finally {
      setShowModal(false);
      setZoneName('');
      setZoneDesc('');
      setPendingCoords(null);
    }
  }

  if (!showModal) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 10000 }}
      className="flex items-center justify-center px-4"
    >
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Guardar zona trazada</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la zona"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={zoneDesc}
            onChange={(e) => setZoneDesc(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded-lg">
              Guardar zona
            </button>
            <button type="button" onClick={() => { setShowModal(false); setPendingCoords(null); }} className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 rounded-lg">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
