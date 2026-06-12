import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/map/MapView';
import LocationTable from '../components/locations/LocationTable';
import LocationSearch from '../components/locations/LocationSearch';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];
function memberColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

function computeBalances(expenses, userId) {
  const map = {};
  for (const exp of expenses) {
    const paidById = exp.paidBy?._id || exp.paidBy;
    if (paidById === userId) {
      for (const s of exp.splitAmong) {
        const sid = s.user?._id || s.user;
        if (sid === userId) continue;
        if (!map[sid]) map[sid] = { name: s.user?.name || '?', net: 0 };
        if (!s.settled) map[sid].net += s.share;
      }
    } else {
      const myShare = exp.splitAmong.find((s) => (s.user?._id || s.user) === userId);
      if (myShare && !myShare.settled) {
        if (!map[paidById]) map[paidById] = { name: exp.paidBy?.name || '?', net: 0 };
        map[paidById].net -= myShare.share;
      }
    }
  }
  return map;
}

// ── Geocoding autocomplete (Photon / OpenStreetMap) ───────────────────────────
// Photon está hecha para autocompletar mientras tecleas (Nominatim lo bloquea).

function GeoSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef(null);
  const listRef = useRef(null);

  // El buscador vive al fondo del modal: al aparecer resultados hay que scrollear hacia ellos
  useEffect(() => {
    if (results.length > 0) listRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [results]);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setError(false);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        // lat/lon dan prioridad a resultados cercanos (Medellín)
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=6&lat=6.2442&lon=-75.5812`
        );
        const data = await res.json();
        setResults(data.features || []);
      } catch {
        setResults([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function describe(p) {
    return [p.street, p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
  }

  function pick(f) {
    const [lng, lat] = f.geometry.coordinates;
    const name = f.properties.name || describe(f.properties).split(',')[0];
    onSelect({ name, lat, lng, display: describe(f.properties) });
    setQuery('');
    setResults([]);
  }

  return (
    <div className="relative">
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
        <span className="pl-3 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Escribe un lugar: ej. Plaza…"
          value={query}
          onChange={handleChange}
          className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
        />
        {loading && <span className="pr-3 text-gray-400 text-xs">…</span>}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">Error al buscar, intenta de nuevo</p>}
      {results.length > 0 && (
        <ul ref={listRef} className="w-full bg-white border border-gray-200 rounded-lg shadow-sm mt-1 max-h-56 overflow-y-auto">
          {results.map((f, i) => (
            <li
              key={f.properties.osm_id ?? i}
              onClick={() => pick(f)}
              className="flex items-start gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-400 mt-0.5">📍</span>
              <span>
                <span className="font-medium block">{f.properties.name || describe(f.properties).split(',')[0]}</span>
                <span className="text-gray-400 text-xs">{describe(f.properties)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Location modal (edit only, from map popup) ────────────────────────────────

function LocationModal({ editLoc, onClose, onSaved }) {
  const [name, setName] = useState(editLoc?.name || '');
  const [description, setDescription] = useState(editLoc?.description || '');
  const [lat, setLat] = useState(editLoc?.lat?.toString() || '');
  const [lng, setLng] = useState(editLoc?.lng?.toString() || '');

  async function handleSubmit(e) {
    e.preventDefault();
    onSaved({ name, description, lat: parseFloat(lat), lng: parseFloat(lng) });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Editar ubicación</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Nombre del lugar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              placeholder="ej. Donde cenamos el primer día"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Latitud</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Longitud</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg">
              Guardar
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2.5 rounded-lg">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Expense modal (Splitwise-style, with location inside) ─────────────────────

function ExpenseModal({ editExp, linkedLocation, groupMembers, currentUserId, groupId, onClose, onSaved }) {
  const [title, setTitle] = useState(editExp?.title || '');
  const [amount, setAmount] = useState(editExp?.amount?.toString() || '');
  const [paidBy, setPaidBy] = useState(editExp?.paidBy?._id || editExp?.paidBy || currentUserId);
  const [location, setLocation] = useState(
    linkedLocation ? { name: linkedLocation.name, lat: linkedLocation.lat, lng: linkedLocation.lng } : null
  );
  const [selected, setSelected] = useState(() => {
    if (editExp?.splitAmong?.length) return new Set(editExp.splitAmong.map((s) => s.user?._id || s.user));
    return new Set(groupMembers.map((m) => m._id));
  });
  const [overrides, setOverrides] = useState(() => {
    if (editExp?.splitAmong?.length) {
      return Object.fromEntries(editExp.splitAmong.map((s) => [s.user?._id || s.user, s.share.toString()]));
    }
    return {};
  });

  const total = parseFloat(amount) || 0;
  const selectedCount = selected.size;
  const equalShare = selectedCount > 0 ? parseFloat((total / selectedCount).toFixed(2)) : 0;

  function toggle(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setOverrides((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  function getShare(id) {
    return overrides[id] !== undefined ? parseFloat(overrides[id]) || 0 : equalShare;
  }

  const splitTotal = groupMembers.filter((m) => selected.has(m._id)).reduce((s, m) => s + getShare(m._id), 0);
  const balanced = Math.abs(total - splitTotal) <= 0.02;

  async function handleSubmit(e) {
    e.preventDefault();
    const splitAmong = groupMembers
      .filter((m) => selected.has(m._id))
      .map((m) => ({ user: m._id, share: getShare(m._id) }))
      .filter((s) => s.share > 0);

    const payload = { title, amount: total, paidBy, groupId, splitAmong };
    let expenseId;
    if (editExp) {
      await api.put(`/expenses/${editExp._id}`, payload);
      expenseId = editExp._id;
    } else {
      const { data } = await api.post('/expenses', payload);
      expenseId = data._id;
    }

    // Sync the linked location: upsert if one is chosen, delete if it was removed
    if (location) {
      const locPayload = {
        name: location.name,
        description: `Gasto: ${title}`,
        type: 'point',
        lat: location.lat,
        lng: location.lng,
        groupId,
        linkedExpense: expenseId,
      };
      if (linkedLocation) await api.put(`/locations/${linkedLocation._id}`, locPayload);
      else await api.post('/locations', locPayload);
    } else if (linkedLocation) {
      await api.delete(`/locations/${linkedLocation._id}`);
    }

    onSaved(location ? { lat: location.lat, lng: location.lng } : null);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕ Cancelar</button>
          <h3 className="font-semibold text-gray-900">{editExp ? 'Editar gasto' : 'Añadir gasto'}</h3>
          <button form="exp-form" type="submit" className="text-indigo-600 font-semibold text-sm hover:text-indigo-700">Guardar</button>
        </div>

        <form id="exp-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {/* Description + amount */}
          <div className="flex gap-3 items-start">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">🧾</div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border-0 border-b border-gray-200 pb-1 text-base text-gray-800 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setOverrides({}); }}
                  required
                  className="w-full border-0 border-b border-gray-200 pb-1 text-2xl font-light text-gray-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Paid by */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 shrink-0">Pagado por</span>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {groupMembers.map((m) => (
                <option key={m._id} value={m._id}>{m.name}{m._id === currentUserId ? ' (yo)' : ''}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500 shrink-0">y dividido</span>
            <span className="text-sm font-medium text-indigo-600 shrink-0">
              {selectedCount === groupMembers.length ? 'por igual' : `${selectedCount} pers.`}
            </span>
          </div>

          {/* Members split */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dividir entre</p>
              <button
                type="button"
                onClick={() => { setSelected(new Set(groupMembers.map((m) => m._id))); setOverrides({}); }}
                className="text-xs text-indigo-600 hover:underline"
              >
                Todos
              </button>
            </div>

            <div className="space-y-1">
              {groupMembers.map((m) => {
                const checked = selected.has(m._id);
                const color = memberColor(m._id);
                return (
                  <div
                    key={m._id}
                    onClick={() => toggle(m._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      checked ? 'bg-indigo-50' : 'bg-gray-50 opacity-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: color }}
                    >
                      {initials(m.name)}
                    </div>

                    {/* Name */}
                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {m.name}{m._id === currentUserId ? ' (yo)' : ''}
                    </span>

                    {/* Share amount */}
                    {checked && total > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1"
                      >
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={overrides[m._id] !== undefined ? overrides[m._id] : equalShare.toFixed(2)}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [m._id]: e.target.value }))}
                          className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    )}

                    {/* Checkmark */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}>
                      {checked && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer totals */}
            {total > 0 && selectedCount > 0 && (
              <div className={`mt-3 flex justify-between text-xs px-1 font-medium ${balanced ? 'text-green-600' : 'text-red-500'}`}>
                <span>${splitTotal.toFixed(2)} / ${total.toFixed(2)} repartido</span>
                <span>{balanced ? 'Todo cuadra ✓' : `Diferencia: $${(total - splitTotal).toFixed(2)}`}</span>
              </div>
            )}

            {selectedCount > 0 && total > 0 && (
              <p className="text-center text-xs text-gray-400 mt-1">
                ${equalShare.toFixed(2)}/persona ({selectedCount} {selectedCount === 1 ? 'persona' : 'personas'})
              </p>
            )}
          </div>

          {/* Location (OpenStreetMap geocoding) */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📍 Ubicación (opcional)</p>
            {location ? (
              <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2.5">
                <span className="text-lg">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{location.name}</p>
                  <p className="text-xs text-gray-400">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  className="text-gray-400 hover:text-red-500 text-sm px-1.5"
                >
                  ✕
                </button>
              </div>
            ) : (
              <GeoSearch onSelect={(r) => setLocation({ name: r.name, lat: r.lat, lng: r.lng })} />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Balance panel ─────────────────────────────────────────────────────────────

function BalancePanel({ balances }) {
  const entries = Object.entries(balances);
  if (entries.length === 0) return null;
  const owed = entries.filter(([, b]) => b.net > 0.009);
  const owing = entries.filter(([, b]) => b.net < -0.009);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-800 mb-3">Resumen de deudas</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {owed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-600 mb-2">Te deben a ti</p>
            {owed.map(([uid, b]) => (
              <div key={uid} className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2 mb-1">
                <span className="text-sm text-gray-700">{b.name}</span>
                <span className="text-sm font-bold text-green-700">${b.net.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        {owing.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-500 mb-2">Tú debes</p>
            {owing.map(([uid, b]) => (
              <div key={uid} className="flex justify-between items-center bg-red-50 rounded-lg px-3 py-2 mb-1">
                <span className="text-sm text-gray-700">{b.name}</span>
                <span className="text-sm font-bold text-red-600">${Math.abs(b.net).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [copied, setCopied] = useState(false);

  const [editLoc, setEditLoc] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);

  const [showExpForm, setShowExpForm] = useState(false);
  const [editExp, setEditExp] = useState(null);

  const fetchLocations = useCallback(async () => {
    const { data } = await api.get(`/locations/group/${id}`);
    setLocations(data);
  }, [id]);

  const fetchExpenses = useCallback(async () => {
    const { data } = await api.get(`/expenses/group/${id}`);
    setExpenses(data);
  }, [id]);

  const fetchData = useCallback(async () => {
    const { data } = await api.get(`/groups/${id}`);
    setGroup(data);
    await Promise.all([fetchLocations(), fetchExpenses()]);
  }, [id, fetchLocations, fetchExpenses]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const balances = useMemo(() => (user ? computeBalances(expenses, user._id) : {}), [expenses, user]);
  const members = group?.members || [];

  // Location linked to each expense (to show the 📍 chip and prefill on edit)
  const locationByExpense = useMemo(() => {
    const map = {};
    for (const l of locations) {
      const expId = l.linkedExpense?._id || l.linkedExpense;
      if (expId) map[expId] = l;
    }
    return map;
  }, [locations]);

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${group.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLocSaved({ name, description, lat, lng }) {
    await api.put(`/locations/${editLoc._id}`, { name, description, lat, lng });
    setEditLoc(null);
    fetchLocations();
  }

  async function handleDeleteLoc(locId) {
    if (!confirm('¿Eliminar esta ubicación?')) return;
    await api.delete(`/locations/${locId}`);
    fetchLocations();
  }

  async function handleDeleteExp(expId) {
    if (!confirm('¿Eliminar este gasto?')) return;
    await api.delete(`/expenses/${expId}`);
    fetchExpenses();
    fetchLocations();
  }

  async function handleSettle(expId) {
    await api.patch(`/expenses/${expId}/settle`);
    fetchExpenses();
  }

  if (!group) return <div className="text-gray-500 text-sm p-8">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Mis grupos</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{group.name}</h1>
          {group.description && <p className="text-gray-500 text-sm">{group.description}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            {members.map((m) => (
              <div
                key={m._id}
                title={m.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: memberColor(m._id) }}
              >
                {initials(m.name)}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-1">{members.length} miembro(s)</span>
          </div>
        </div>
        <button
          onClick={copyInvite}
          className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg font-medium"
        >
          {copied ? '✓ Copiado' : '🔗 Copiar invitación'}
        </button>
      </div>

      {/* BALANCE */}
      <BalancePanel balances={balances} />

      {/* EXPENSES */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Gastos</h2>
          <button
            onClick={() => { setEditExp(null); setShowExpForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            + Añadir gasto
          </button>
        </div>

        {showExpForm && (
          <ExpenseModal
            editExp={editExp}
            linkedLocation={editExp ? locationByExpense[editExp._id] : null}
            groupMembers={members}
            currentUserId={user?._id}
            groupId={id}
            onClose={() => { setShowExpForm(false); setEditExp(null); }}
            onSaved={(fly) => {
              setShowExpForm(false);
              setEditExp(null);
              if (fly) setFlyToTarget(fly);
              fetchExpenses();
              fetchLocations();
            }}
          />
        )}

        {expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm">Sin gastos aún. ¡Agrega el primero!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expenses.map((exp) => {
              const paidByMe = (exp.paidBy?._id || exp.paidBy) === user?._id;
              const myShare = exp.splitAmong?.find((s) => (s.user?._id || s.user) === user?._id);
              const myNet = paidByMe
                ? exp.splitAmong?.reduce((s, x) => {
                    const isMe = (x.user?._id || x.user) === user?._id;
                    return isMe ? s : s + (x.settled ? 0 : x.share);
                  }, 0)
                : myShare && !myShare.settled ? -myShare.share : 0;
              const expLoc = locationByExpense[exp._id];

              return (
                <div key={exp._id} className="py-4 flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0">🧾</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{exp.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {paidByMe ? 'Tú pagaste' : `${exp.paidBy?.name} pagó`} ${exp.amount.toFixed(2)}
                    </p>
                    {expLoc && (
                      <button
                        onClick={() => setFlyToTarget({ lat: expLoc.lat, lng: expLoc.lng, ts: Date.now() })}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
                      >
                        📍 {expLoc.name}
                      </button>
                    )}
                    {exp.splitAmong?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {exp.splitAmong.map((s) => {
                          const isMe = (s.user?._id || s.user) === user?._id;
                          const color = memberColor(s.user?._id || s.user || '');
                          return (
                            <span
                              key={s.user?._id || s.user}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{ background: color + '20', color }}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ background: color, fontSize: 8 }}
                              >
                                {initials(s.user?.name || '?')}
                              </span>
                              {isMe ? 'Tú' : s.user?.name?.split(' ')[0]}: ${s.share?.toFixed(2)}
                              {s.settled ? ' ✓' : ''}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right side: net + actions */}
                  <div className="shrink-0 text-right">
                    {myNet !== 0 && (
                      <p className={`text-sm font-bold ${myNet > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {myNet > 0 ? 'prestaste' : 'pediste'}
                        <br />${Math.abs(myNet).toFixed(2)}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => { setEditExp(exp); setShowExpForm(true); }} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded">
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteExp(exp._id)} className="text-xs text-red-300 hover:text-red-500 px-1.5 py-0.5 rounded">
                        🗑️
                      </button>
                    </div>
                    {myShare && !myShare.settled && !paidByMe && (
                      <button
                        onClick={() => handleSettle(exp._id)}
                        className="mt-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg"
                      >
                        Liquidar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-1">Mapa del grupo</h2>
        <p className="text-xs text-gray-400 mb-3">Las ubicaciones se añaden desde cada gasto · Los controles del mapa trazan zonas</p>
        <MapView
          locations={locations}
          onEdit={(loc) => setEditLoc(loc)}
          onDelete={handleDeleteLoc}
          groupId={id}
          onZoneSaved={fetchLocations}
          flyToTarget={flyToTarget}
        />
      </div>

      {/* LOCATION EDIT MODAL */}
      {editLoc && (
        <LocationModal
          editLoc={editLoc}
          onClose={() => setEditLoc(null)}
          onSaved={handleLocSaved}
        />
      )}

      {/* LOCATIONS TABLE + SEARCH */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Tabla de ubicaciones</h2>
        <LocationSearch groupId={id} />
        <div className="mt-4">
          <LocationTable locations={locations} />
        </div>
      </div>
    </div>
  );
}
