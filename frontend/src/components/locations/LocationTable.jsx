export default function LocationTable({ locations, onSelect }) {
  const points = locations.filter((l) => l.type === 'point');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600">Nombre</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Descripción</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Latitud</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Longitud</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Creado por</th>
          </tr>
        </thead>
        <tbody>
          {points.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                Sin ubicaciones registradas
              </td>
            </tr>
          ) : (
            points.map((l) => (
              <tr
                key={l._id}
                onClick={() => onSelect?.({ lat: l.lat, lng: l.lng, ts: Date.now() })}
                className={`border-b border-gray-100 transition-colors ${onSelect ? 'cursor-pointer hover:bg-indigo-50' : 'hover:bg-gray-50'}`}
              >
                <td className="py-2 px-3 text-gray-800 font-medium">{l.name}</td>
                <td className="py-2 px-3 text-gray-500">{l.description || '—'}</td>
                <td className="py-2 px-3 text-gray-500">{l.lat?.toFixed(5)}</td>
                <td className="py-2 px-3 text-gray-500">{l.lng?.toFixed(5)}</td>
                <td className="py-2 px-3 text-gray-500">{l.createdBy?.name || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
