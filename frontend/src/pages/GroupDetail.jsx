import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Link2, Check, Plus, Pencil, Trash2, MapPin, Search,
  Loader2, X, TrendingUp, TrendingDown, Receipt, Users, Map, Table2,
  CreditCard, CheckCircle2, ChevronRight,
} from 'lucide-react';
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

function GeoSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef(null);
  const listRef = useRef(null);

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
    onSelect({ name, lat, lng });
    setQuery('');
    setResults([]);
  }

  return (
    <div>
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 bg-gray-50">
        {loading ? <Loader2 size={15} className="text-gray-400 animate-spin shrink-0" /> : <Search size={15} className="text-gray-400 shrink-0" />}
        <input
          type="text"
          placeholder="Escribe un lugar…"
          value={query}
          onChange={handleChange}
          className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">Error al buscar, intenta de nuevo</p>}
      {results.length > 0 && (
        <ul ref={listRef} className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {results.map((f, i) => (
            <li
              key={f.properties.osm_id ?? i}
              onClick={() => pick(f)}
              className="flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 bg-white"
            >
              <MapPin size={14} className="text-indigo-400 mt-0.5 shrink-0" />
              <span>
                <span className="font-medium text-gray-800 block">{f.properties.name || describe(f.properties).split(',')[0]}</span>
                <span className="text-gray-400 text-xs">{describe(f.properties)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Location modal (edit) ─────────────────────────────────────────────────────

function LocationModal({ editLoc, onClose, onSaved }) {
  const [name, setName] = useState(editLoc?.name || '');
  const [description, setDescription] = useState(editLoc?.description || '');
  const [lat, setLat] = useState(editLoc?.lat?.toString() || '');
  const [lng, setLng] = useState(editLoc?.lng?.toString() || '');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Editar ubicación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSaved({ name, description, lat: parseFloat(lat), lng: parseFloat(lng) }); }} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Latitud</label>
              <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Longitud</label>
              <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-xl">Guardar</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2.5 rounded-xl">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Expense modal ─────────────────────────────────────────────────────────────

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
    if (editExp?.splitAmong?.length)
      return Object.fromEntries(editExp.splitAmong.map((s) => [s.user?._id || s.user, s.share.toString()]));
    return {};
  });
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
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

      if (location) {
        const locPayload = { name: location.name, description: `Gasto: ${title}`, type: 'point', lat: location.lat, lng: location.lng, groupId, linkedExpense: expenseId };
        if (linkedLocation) await api.put(`/locations/${linkedLocation._id}`, locPayload);
        else await api.post('/locations', locPayload);
      } else if (linkedLocation) {
        await api.delete(`/locations/${linkedLocation._id}`);
      }

      onSaved(location ? { lat: location.lat, lng: location.lng } : null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <button onClick={onClose} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
            <X size={16} /> Cancelar
          </button>
          <h3 className="font-semibold text-gray-900">{editExp ? 'Editar gasto' : 'Nuevo gasto'}</h3>
          <button form="exp-form" type="submit" disabled={saving}
            className="flex items-center gap-1 text-indigo-600 font-semibold text-sm hover:text-indigo-700 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Guardar
          </button>
        </div>

        <form id="exp-form" onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Description + amount */}
          <div className="flex gap-3 items-start">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Receipt size={22} className="text-indigo-500" />
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border-0 border-b-2 border-gray-100 pb-1 text-base text-gray-800 focus:outline-none focus:border-indigo-400 bg-transparent placeholder-gray-300"
              />
              <div className="flex items-baseline gap-1">
                <span className="text-gray-400 text-lg font-light">$</span>
                <input
                  type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setOverrides({}); }}
                  required
                  className="w-full border-0 border-b-2 border-gray-100 pb-1 text-3xl font-light text-gray-800 focus:outline-none focus:border-indigo-400 bg-transparent placeholder-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Paid by */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <CreditCard size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 shrink-0">Pagado por</span>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
              className="flex-1 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none">
              {groupMembers.map((m) => (
                <option key={m._id} value={m._id}>{m.name}{m._id === currentUserId ? ' (yo)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Members split */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dividir entre</p>
              </div>
              <button type="button" onClick={() => { setSelected(new Set(groupMembers.map((m) => m._id))); setOverrides({}); }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Todos
              </button>
            </div>

            <div className="space-y-1.5">
              {groupMembers.map((m) => {
                const checked = selected.has(m._id);
                const color = memberColor(m._id);
                return (
                  <div key={m._id} onClick={() => toggle(m._id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      checked ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-transparent opacity-50'
                    }`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: color }}>
                      {initials(m.name)}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {m.name}{m._id === currentUserId ? ' (yo)' : ''}
                    </span>
                    {checked && total > 0 && (
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <input type="number" min="0" step="0.01"
                          value={overrides[m._id] !== undefined ? overrides[m._id] : equalShare.toFixed(2)}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [m._id]: e.target.value }))}
                          className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    )}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-indigo-600' : 'border-2 border-gray-300'
                    }`}>
                      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {total > 0 && selectedCount > 0 && (
              <div className={`mt-3 rounded-xl px-3 py-2 flex justify-between text-xs font-medium ${
                balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                <span>${splitTotal.toFixed(2)} / ${total.toFixed(2)} repartido</span>
                <span>{balanced ? '✓ Todo cuadra' : `Diferencia: $${(total - splitTotal).toFixed(2)}`}</span>
              </div>
            )}
            {selectedCount > 0 && total > 0 && (
              <p className="text-center text-xs text-gray-400 mt-1.5">
                ${equalShare.toFixed(2)} por persona · {selectedCount} {selectedCount === 1 ? 'persona' : 'personas'}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={14} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación (opcional)</p>
            </div>
            {location ? (
              <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
                <MapPin size={16} className="text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{location.name}</p>
                  <p className="text-xs text-gray-400">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                </div>
                <button type="button" onClick={() => setLocation(null)}
                  className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50">
                  <X size={14} />
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

function BalancePanel({ balances, members }) {
  const entries = Object.entries(balances);
  if (entries.length === 0) return null;

  const owed = entries.filter(([, b]) => b.net > 0.009);   // otros me deben a mí
  const owing = entries.filter(([, b]) => b.net < -0.009); // yo debo a otros

  const totalOwed = owed.reduce((s, [, b]) => s + b.net, 0);
  const totalOwing = owing.reduce((s, [, b]) => s + Math.abs(b.net), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Summary bar */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Te deben</span>
          </div>
          <p className="text-xl font-bold text-green-600">${totalOwed.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {owed.length === 0 ? 'Nadie te debe' : `${owed.length} persona${owed.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown size={14} className="text-red-500" />
            </div>
            <span className="text-xs font-medium text-gray-500">Tú debes</span>
          </div>
          <p className="text-xl font-bold text-red-500">${totalOwing.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {owing.length === 0 ? 'No debes nada' : `A ${owing.length} persona${owing.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Detail rows */}
      {(owed.length > 0 || owing.length > 0) && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {owed.map(([uid, b]) => (
            <div key={uid} className="flex items-center px-4 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mr-3"
                style={{ background: memberColor(uid) }}>
                {initials(b.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{b.name}</p>
                <p className="text-xs text-gray-400">te debe</p>
              </div>
              <span className="text-sm font-bold text-green-600">${b.net.toFixed(2)}</span>
            </div>
          ))}
          {owing.map(([uid, b]) => (
            <div key={uid} className="flex items-center px-4 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mr-3"
                style={{ background: memberColor(uid) }}>
                {initials(b.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{b.name}</p>
                <p className="text-xs text-gray-400">tú debes</p>
              </div>
              <span className="text-sm font-bold text-red-500">${Math.abs(b.net).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
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

  if (!group) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 pt-2">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2">
            <ArrowLeft size={14} /> Mis grupos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          {group.description && <p className="text-gray-500 text-sm mt-0.5">{group.description}</p>}
          <div className="flex items-center gap-1.5 mt-3">
            {members.map((m) => (
              <div key={m._id} title={m.name}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                style={{ background: memberColor(m._id) }}>
                {initials(m.name)}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-1">{members.length} miembro{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button onClick={copyInvite}
          className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-all ${
            copied ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
          }`}>
          {copied ? <Check size={15} /> : <Link2 size={15} />}
          {copied ? 'Copiado' : 'Invitar'}
        </button>
      </div>

      {/* ── Balance ── */}
      <BalancePanel balances={balances} members={members} />

      {/* ── Expenses ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-800">Gastos</h2>
            {expenses.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{expenses.length}</span>
            )}
          </div>
          <button onClick={() => { setEditExp(null); setShowExpForm(true); }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={15} /> Añadir
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <Receipt size={40} strokeWidth={1} className="mb-3" />
            <p className="text-sm text-gray-400">Sin gastos aún</p>
            <p className="text-xs text-gray-300 mt-1">Añade el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
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
                <div key={exp._id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt size={18} className="text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{exp.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {paidByMe ? 'Tú pagaste' : `${exp.paidBy?.name} pagó`} · <span className="font-medium text-gray-600">${exp.amount.toFixed(2)}</span>
                    </p>

                    {expLoc && (
                      <button onClick={() => setFlyToTarget({ lat: expLoc.lat, lng: expLoc.lng, ts: Date.now() })}
                        className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1">
                        <MapPin size={11} /> {expLoc.name}
                      </button>
                    )}

                    {exp.splitAmong?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exp.splitAmong.map((s) => {
                          const isMe = (s.user?._id || s.user) === user?._id;
                          const color = memberColor(s.user?._id || s.user || '');
                          return (
                            <span key={s.user?._id || s.user}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: color + '18', color }}>
                              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                                style={{ background: color, fontSize: 7 }}>
                                {initials(s.user?.name || '?')}
                              </span>
                              {isMe ? 'Tú' : s.user?.name?.split(' ')[0]}: ${s.share?.toFixed(2)}
                              {s.settled && <CheckCircle2 size={10} className="ml-0.5" />}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {myNet !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                        myNet > 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {myNet > 0
                          ? <><TrendingUp size={11} /> +${myNet.toFixed(2)}</>
                          : <><TrendingDown size={11} /> -${Math.abs(myNet).toFixed(2)}</>
                        }
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditExp(exp); setShowExpForm(true); }}
                        className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDeleteExp(exp._id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {myShare && !myShare.settled && !paidByMe && (
                      <button onClick={() => handleSettle(exp._id)}
                        className="inline-flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg transition-colors">
                        <CheckCircle2 size={11} /> Liquidar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Map size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800">Mapa del grupo</h2>
        </div>
        <div className="p-4">
          <MapView
            locations={locations}
            onEdit={(loc) => setEditLoc(loc)}
            onDelete={handleDeleteLoc}
            groupId={id}
            onZoneSaved={fetchLocations}
            flyToTarget={flyToTarget}
          />
        </div>
      </div>

      {/* ── Locations table + search ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Table2 size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800">Ubicaciones</h2>
          {locations.filter(l => l.type === 'point').length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
              {locations.filter(l => l.type === 'point').length}
            </span>
          )}
        </div>
        <div className="p-4 space-y-4">
          <LocationSearch groupId={id} />
          <LocationTable locations={locations} onSelect={(target) => setFlyToTarget(target)} />
        </div>
      </div>

      {/* ── Modals ── */}
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
      {editLoc && (
        <LocationModal editLoc={editLoc} onClose={() => setEditLoc(null)} onSaved={handleLocSaved} />
      )}
    </div>
  );
}
