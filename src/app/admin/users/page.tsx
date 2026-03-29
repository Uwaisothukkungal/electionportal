'use client';

import { useState, useEffect, useCallback } from 'react';

type Party = { id: number; name: string };
type Constituency = { id: number; name: string };
type Panchayat = { id: number; name: string };
type Booth = { id: number; number: number; name: string | null };
type User = {
  id: number; username: string; name: string; email: string; role: string;
  party: { id: number; name: string } | null;
  constituency: { id: number; name: string } | null;
  panchayat: { id: number; name: string } | null;
  booth: { id: number; number: number; name: string | null } | null;
};

const ROLE_LABELS: Record<string, string> = {
  MANDAL_ADMIN: 'Mandal Admin',
  PANCHAYAT_ADMIN: 'Panchayat Admin',
  BOOTH_ADMIN: 'Booth Admin',
};

const ROLE_COLORS: Record<string, string> = {
  MANDAL_ADMIN: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  PANCHAYAT_ADMIN: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  BOOTH_ADMIN: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

type FormType = {
  username: string; name: string; password: string;
  role: string; partyId: string;
  constituencyId: string; panchayatId: string; boothId: string;
};

const EMPTY_FORM: FormType = {
  username: '', name: '', password: '',
  role: '', partyId: '',
  constituencyId: '', panchayatId: '', boothId: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormType>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [uRes, ptRes, cRes, panRes, wRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/parties'),
      fetch('/api/admin/constituencies'),
      fetch('/api/admin/panchayats'),
      fetch('/api/admin/booths'),
    ]);
    if (uRes.ok) setUsers(await uRes.json());
    if (ptRes.ok) setParties(await ptRes.json());
    if (cRes.ok) setConstituencies(await cRes.json());
    if (panRes.ok) setPanchayats(await panRes.json());
    if (wRes.ok) setBooths(await wRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openAdd() { setForm(EMPTY_FORM); setEditing(null); setError(''); setModal('add'); }
  function openEdit(u: User) {
    setForm({
      username: u.username, name: u.name, password: '',
      role: u.role, partyId: u.party ? String(u.party.id) : '',
      constituencyId: u.constituency ? String(u.constituency.id) : '',
      panchayatId: u.panchayat ? String(u.panchayat.id) : '',
      boothId: u.booth ? String(u.booth.id) : '',
    });
    setEditing(u); setError(''); setModal('edit');
  }
  function closeModal() { setModal(null); }
  const f = (k: keyof FormType, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  // When role changes, clear location fields
  function handleRoleChange(role: string) {
    setForm(prev => ({ ...prev, role, constituencyId: '', panchayatId: '', boothId: '' }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const body: Record<string, unknown> = {
      name: form.name, role: form.role,
      partyId: form.partyId || null,
      constituencyId: form.role === 'MANDAL_ADMIN' ? (form.constituencyId || null) : null,
      panchayatId: form.role === 'PANCHAYAT_ADMIN' ? (form.panchayatId || null) : null,
      boothId: form.role === 'BOOTH_ADMIN' ? (form.boothId || null) : null,
    };
    if (!editing) { body.username = form.username; body.password = form.password; }
    else if (form.password) { body.password = form.password; }

    const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return; }
    await fetchAll(); closeModal(); setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetchAll();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-white">Admin Users</h1><p className="text-slate-400 mt-1">Manage admin accounts and their permissions</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <span className="text-lg leading-none">+</span> Add User
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16 text-slate-500">Loading…</div>
          : users.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-slate-500"><span className="text-4xl mb-3">👥</span><p>No admin users yet.</p></div>
          : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium">Username</th>
                <th className="text-left px-6 py-3 font-medium">Role</th>
                <th className="text-left px-6 py-3 font-medium">Party</th>
                <th className="text-left px-6 py-3 font-medium">Location</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">@{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md border text-xs font-medium ${ROLE_COLORS[u.role] ?? 'text-slate-400'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{u.party?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-300 text-xs">
                      {u.constituency?.name ?? u.panchayat?.name ?? (u.booth ? `Booth ${u.booth.number}${u.booth.name ? ` · ${u.booth.name}` : ''}` : '—')}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-5">{modal === 'add' ? 'Add Admin User' : 'Edit User'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input required value={form.name} onChange={e => f('name', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" placeholder="e.g. Ravi Kumar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input required={!editing} disabled={!!editing} value={form.username} onChange={e => f('username', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50" placeholder="username" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="password" required={!editing} value={form.password} onChange={e => f('password', e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" placeholder="••••••••" minLength={8} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                  <select required value={form.role} onChange={e => handleRoleChange(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
                    <option value="">Select role…</option>
                    <option value="MANDAL_ADMIN">Mandal Admin</option>
                    <option value="PANCHAYAT_ADMIN">Panchayat Admin</option>
                    <option value="BOOTH_ADMIN">Booth Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Party</label>
                  <select value={form.partyId} onChange={e => f('partyId', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
                    <option value="">No party</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Conditional location dropdown */}
              {form.role === 'MANDAL_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Constituency</label>
                  <select value={form.constituencyId} onChange={e => f('constituencyId', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
                    <option value="">Select constituency…</option>
                    {constituencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {form.role === 'PANCHAYAT_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Panchayat</label>
                  <select value={form.panchayatId} onChange={e => f('panchayatId', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
                    <option value="">Select panchayat…</option>
                    {panchayats.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              {form.role === 'BOOTH_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Booth</label>
                  <select value={form.boothId} onChange={e => f('boothId', e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
                    <option value="">Select booth…</option>
                    {booths.map(w => <option key={w.id} value={w.id}>Booth {w.number}{w.name ? ` — ${w.name}` : ''}</option>)}
                  </select>
                </div>
              )}

              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
