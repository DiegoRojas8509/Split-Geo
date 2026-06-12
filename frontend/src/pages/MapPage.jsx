import { useState, useEffect } from 'react';
import api from '../api/axios';
import MapView from '../components/map/MapView';
import LocationSearch from '../components/locations/LocationSearch';
import LocationTable from '../components/locations/LocationTable';

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLocations() {
    try {
      const { data } = await api.get('/locations');
      setLocations(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLocations(); }, []);

  if (loading) return <div className="text-gray-500 text-sm">Cargando mapa...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mapa global de ubicaciones</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <MapView locations={locations} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Buscar ubicación</h2>
        <LocationSearch />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Todas las ubicaciones</h2>
        <LocationTable locations={locations} />
      </div>
    </div>
  );
}
