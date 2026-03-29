'use client';

import { useState, useEffect, useCallback } from 'react';

type Constituency = { id: number; name: string };

export default function ConstituenciesPage() {
  const [items, setItems] = useState<Constituency[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Constituency | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/constituencies');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() { setForm({ name: '' }); setEditing(null); setError(''); setModal('add'); }
  function openEdit(item: Constituency) { setForm({ name: item.name }); setEditing(item); setError(''); setModal('edit'); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const url = editing ? `/api/admin/constituencies/${editing.id}` : '/api/admin/constituencies';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return; }
    await fetchData(); closeModal(); setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this constituency?')) return;
    const res = await fetch(`/api/admin/constituencies/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetchData();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-white">Constituencies</h1><p className="text-slate-400 mt-1">Manage election constituencies</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <span className="text-lg leading-none">+</span> Add Constituency
        </button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16 text-slate-500">Loading…</div>
          : items.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-slate-500"><span className="text-4xl mb-3">🗺️</span><p>No constituencies yet.</p></div>
          : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-slate-400"><th className="text-left px-6 py-3 font-medium">#</th><th className="text-left px-6 py-3 font-medium">Name</th><th className="text-right px-6 py-3 font-medium">Actions</th></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">{modal === 'add' ? 'Add Constituency' : 'Edit Constituency'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Constituency Name</label>
                <input required value={form.name} onChange={e => setForm({ name: e.target.value })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="e.g. North District" />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
