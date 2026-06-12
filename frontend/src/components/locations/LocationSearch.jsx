import { useState } from 'react';
import api from '../../api/axios';

export default function LocationSearch({ groupId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    const endpoint = groupId ? `/locations/group/${groupId}?name=${encodeURIComponent(query)}` : `/locations?name=${encodeURIComponent(query)}`;
    const { data } = await api.get(endpoint);
    setResults(data);
    setSearched(true);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Buscar ubicación por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          Buscar
        </button>
      </form>

      {searched && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-gray-400">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((l) => (
              <div key={l._id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium text-gray-800">{l.name}</span>
                {l.description && <span className="text-gray-500 ml-2">— {l.description}</span>}
                {l.lat && (
                  <span className="text-gray-400 ml-2 text-xs">
                    ({l.lat.toFixed(5)}, {l.lng.toFixed(5)})
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
