"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Member } from '../../types';
import AttendanceManager from '../../components/AttendanceManager';
import StatsRegistration from '../../components/StatsRegistration';
import FantasySelection from '../../components/FantasySelection';
import RankingBoard from '../../components/RankingBoard';

export default function AdminDashboard() {
  const [pachangas, setPachangas] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedPachangaId, setSelectedPachangaId] = useState<string | null>(null);
  const [newPachanga, setNewPachanga] = useState({
    date: '',
    format: 5,
    status: 'draft'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const pData = await db.getPachangas();
        const mData = await db.getMembers();
        setPachangas(pData || []);
        setMembers(mData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function refreshPachangas() {
      try {
        const pData = await db.getPachangas();
        setPachangas(pData || []);
      } catch (error) {
        console.error('Error refreshing pachangas:', error);
      }
    }
    refreshPachangas();
  }, [selectedPachangaId]);

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleCreate = async () => {
    if (!newPachanga.date) {
      alert('Por favor selecciona una fecha para la pachanga.');
      return;
    }

    try {
      const created = await db.createPachanga({
        ...newPachanga,
        date: new Date(newPachanga.date)
      });
      setPachangas([...pachangas, created]);
      setSelectedPachangaId(created.id);
      alert('¡Pachanga creada con éxito!');
    } catch (e: any) {
      console.error('Error detallado al crear pachanga:', e);
      const detail = e?.message || e?.error_description || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      alert(`Error de Supabase (${e?.code || '401'}): ${detail}`);
    }
  };

  const currentPachanga = pachangas.find(p => p.id === selectedPachangaId);

  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <a href="/" className="text-sm text-blue-600 hover:underline">← Volver al Dashboard</a>
      </div>

      {!isConfigured && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <p className="font-semibold">⚠️ Variables de Supabase no detectadas</p>
          <p className="text-sm mt-1">
            Configura <code className="bg-red-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y <code className="bg-red-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en los Settings de Vercel y haz un Redeploy.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 p-6 rounded-lg mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Pachanga</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <input
            type="date"
            className="border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-blue-500"
            value={newPachanga.date}
            onChange={(e) => setNewPachanga({...newPachanga, date: e.target.value})}
          />
          <input
            type="number"
            className="border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-blue-500"
            value={newPachanga.format}
            onChange={(e) => setNewPachanga({...newPachanga, format: parseInt(e.target.value)})}
            placeholder="Players per team"
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white font-medium p-2 rounded hover:bg-blue-700 transition-colors"
          >
            Create Pachanga
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Active Pachangas</h2>
      <div className="grid gap-4 mb-8">
        {pachangas.map(p => (
          <div key={p.id} className="border border-gray-200 bg-white p-4 rounded-lg shadow-sm flex justify-between items-center text-gray-900">
            <div className="cursor-pointer" onClick={() => setSelectedPachangaId(p.id)}>
              <p className="font-bold text-gray-900">{new Date(p.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Status: {p.status} | Format: {p.format}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await db.updatePachangaStatus(p.id, 'open');
                  setPachangas(pachangas.map(x => x.id === p.id ? {...x, status: 'open'} : x));
                }}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Open
              </button>
              <button
                onClick={async () => {
                  await db.updatePachangaStatus(p.id, 'closed');
                  setPachangas(pachangas.map(x => x.id === p.id ? {...x, status: 'closed'} : x));
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPachangaId && currentPachanga && (
        <div className="space-y-12">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">Pachanga: {currentPachanga.id}</h2>
            <p className="text-gray-600">Status: {currentPachanga.status}</p>
          </div>

          <AttendanceManager
            pachangaId={selectedPachangaId}
            pachangas={pachangas}
            members={members}
          />

          {currentPachanga.status === 'open' && (
            <FantasySelection
              pachangaId={selectedPachangaId}
              members={members}
            />
          )}

          {currentPachanga.status === 'closed' && (
            <StatsRegistration pachangaId={selectedPachangaId} />
          )}

          <div className="mt-12 border-t pt-8">
            <RankingBoard />
          </div>
        </div>
      )}
    </div>
  );
}
