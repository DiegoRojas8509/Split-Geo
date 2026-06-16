import { useEffect, useState } from 'react';
import api from '../api/axios';

const TABS = ['Usuarios', 'Grupos', 'Viajes', 'Gastos'];

export default function AdminPanel() {
  const [tab, setTab] = useState('Usuarios');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetModal, setResetModal] = useState(null); // { id, name }
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchTab(tab); }, [tab]);

  async function fetchTab(t) {
    setLoading(true);
    setMsg(null);
    try {
      if (t === 'Usuarios') {
        const r = await api.get('/admin/users');
        setUsers(r.data);
      } else if (t === 'Grupos') {
        const r = await api.get('/admin/groups');
        setGroups(r.data);
      } else if (t === 'Viajes') {
        const r = await api.get('/admin/trips');
        setTrips(r.data);
      } else if (t === 'Gastos') {
        const r = await api.get('/admin/expenses');
        setExpenses(r.data);
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al cargar datos' });
    }
    setLoading(false);
  }

  async function deleteUser(id, name) {
    if (!confirm(`¿Eliminar la cuenta de "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setMsg({ type: 'ok', text: `Usuario "${name}" eliminado.` });
    } catch {
      setMsg({ type: 'error', text: 'No se pudo eliminar el usuario.' });
    }
  }

  async function resetPassword() {
    if (!newPassword.trim()) return;
    try {
      await api.patch(`/admin/users/${resetModal.id}/password`, { newPassword });
      setMsg({ type: 'ok', text: `Contraseña de "${resetModal.name}" actualizada.` });
      setResetModal(null);
      setNewPassword('');
    } catch {
      setMsg({ type: 'error', text: 'No se pudo actualizar la contraseña.' });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de administración</h1>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded text-sm ${msg.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm">Cargando...</p>}

      {!loading && tab === 'Usuarios' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Nombre</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Rol</th>
                <th className="pb-2 pr-4">Creado</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 flex gap-2">
                    <button
                      onClick={() => { setResetModal({ id: u._id, name: u.name }); setMsg(null); }}
                      className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                      Resetear contraseña
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(u._id, u.name)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">Sin usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'Grupos' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Nombre</th>
                <th className="pb-2 pr-4">Propietario</th>
                <th className="pb-2 pr-4">Miembros</th>
                <th className="pb-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{g.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{g.owner?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{g.members?.length ?? 0}</td>
                  <td className="py-3 text-gray-500">{new Date(g.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">Sin grupos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'Viajes' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Nombre</th>
                <th className="pb-2 pr-4">Grupo</th>
                <th className="pb-2 pr-4">Creado por</th>
                <th className="pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{t.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{t.group?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{t.createdBy?.name ?? '—'}</td>
                  <td className="py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">Sin viajes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'Gastos' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Título</th>
                <th className="pb-2 pr-4">Monto</th>
                <th className="pb-2 pr-4">Grupo</th>
                <th className="pb-2 pr-4">Pagado por</th>
                <th className="pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{e.title}</td>
                  <td className="py-3 pr-4 text-gray-700">${e.amount.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-gray-600">{e.group?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{e.paidBy?.name ?? '—'}</td>
                  <td className="py-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">Sin gastos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {resetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Resetear contraseña</h2>
            <p className="text-sm text-gray-500 mb-4">Usuario: <strong>{resetModal.name}</strong></p>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setResetModal(null); setNewPassword(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={resetPassword}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
