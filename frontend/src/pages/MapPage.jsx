import { useState, useEffect } from 'react';
import { Map, Table2 } from 'lucide-react';
import api from '../api/axios';
import MapView from '../components/map/MapView';
import LocationSearch from '../components/locations/LocationSearch';
import LocationTable from '../components/locations/LocationTable';

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState(null);

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
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <h1 className="text-2xl font-bold text-gray-900 pt-2">Mapa global</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Map size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800">Todas las ubicaciones</h2>
        </div>
        <div className="p-4">
          <MapView locations={locations} flyToTarget={flyToTarget} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Table2 size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800">Ubicaciones</h2>
        </div>
        <div className="p-4 space-y-4">
          <LocationSearch />
          <LocationTable locations={locations} onSelect={(target) => setFlyToTarget(target)} />
        </div>
      </div>
    </div>
  );
}
