import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  function openCreate() {
    setEditGroup(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
  }

  function openEdit(g) {
    setEditGroup(g);
    setForm({ name: g.name, description: g.description || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editGroup) {
      await api.put(`/groups/${editGroup._id}`, form);
    } else {
      await api.post('/groups', form);
    }
    setShowForm(false);
    fetchGroups();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este grupo?')) return;
    await api.delete(`/groups/${id}`);
    fetchGroups();
  }

  function copyInviteLink(inviteToken) {
    const url = `${window.location.origin}/join/${inviteToken}`;
    navigator.clipboard.writeText(url);
    alert('Link de invitación copiado');
  }

  if (loading) return <div className="text-gray-500 text-sm">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mis grupos</h1>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo grupo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editGroup ? 'Editar grupo' : 'Nuevo grupo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded-lg">
                  Guardar
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-lg">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏖️</p>
          <p className="text-sm">No tienes grupos aún. ¡Crea uno!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3
                  className="font-semibold text-gray-800 cursor-pointer hover:text-indigo-600"
                  onClick={() => navigate(`/groups/${g._id}`)}
                >
                  {g.name}
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(g)} className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(g._id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded">
                    Borrar
                  </button>
                </div>
              </div>
              {g.description && <p className="text-gray-500 text-sm mb-3">{g.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{g.members?.length || 1} miembro(s)</span>
                <button
                  onClick={() => copyInviteLink(g.inviteToken)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Copiar invitación
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
