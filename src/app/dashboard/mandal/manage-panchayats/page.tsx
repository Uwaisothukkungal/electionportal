'use client';

import { useState, useEffect } from 'react';
import { SubUserModal } from '@/components/dashboard/SubUserModal';

type Panchayat = { 
  id: number; 
  name: string; 
  _count: { users: number; booths: number } 
};

export default function ManagePanchayatsPage() {
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPanchayats();
  }, []);

  const fetchPanchayats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/mandal/panchayats');
      if (res.ok) {
        const data = await res.json();
        setPanchayats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = panchayats.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Manage Panchayats</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Organizational control and administrative assignments.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all w-full md:w-fit"
        >
          Create Panchayat Admin
        </button>
      </div>

      <div className="px-4 max-w-md">
        <div className="relative group">
           <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          <input
            type="text"
            placeholder="Filter Panchayats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm shadow-gray-200/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black text-gray-300 uppercase tracking-widest text-[10px] animate-pulse">Initializing Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div key={p.id} className="group p-8 rounded-[2.5rem] bg-white border border-gray-100 hover:border-emerald-600/20 shadow-sm transition-all space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏘️</div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{p._count.users} Admins</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{p.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p._count.booths} Booths Assigned</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
               <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No Matching Regions Found</p>
             </div>
          )}
        </div>
      )}

      {showModal && (
        <SubUserModal
          role="PANCHAYAT_ADMIN"
          panchayats={panchayats}
          onSuccess={() => { setShowModal(false); fetchPanchayats(); }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
