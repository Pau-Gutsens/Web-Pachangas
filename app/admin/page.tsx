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
    setPachangas(db.getPachangas());
    setMembers(db.getMembers());
  }, []);

  useEffect(() => {
    setPachangas(db.getPachangas());
  }, [selectedPachangaId]);

  const handleCreate = () => {
    const created = db.createPachanga({
      ...newPachanga,
      date: new Date(newPachanga.date)
    });
    setPachangas([...pachangas, created]);
    setSelectedPachangaId(created.id);
    alert('Pachanga created!');
  };

  const currentPachanga = pachangas.find(p => p.id === selectedPachangaId);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Pachanga</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <input
            type="date"
            className="border p-2 rounded"
            value={newPachanga.date}
            onChange={(e) => setNewPachanga({...newPachanga, date: e.target.value})}
          />
          <input
            type="number"
            className="border p-2 rounded"
            value={newPachanga.format}
            onChange={(e) => setNewPachanga({...newPachanga, format: parseInt(e.target.value)})}
            placeholder="Players per team"
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Create Pachanga
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Active Pachangas</h2>
      <div className="grid gap-4 mb-8">
        {pachangas.map(p => (
          <div key={p.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
            <div className="cursor-pointer" onClick={() => setSelectedPachangaId(p.id)}>
              <p className="font-bold">{new Date(p.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Status: {p.status} | Format: {p.format}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  db.updatePachangaStatus(p.id, 'open');
                  setPachangas(pachangas.map(x => x.id === p.id ? {...x, status: 'open'} : x));
                }}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Open
              </button>
              <button
                onClick={() => {
                  db.updatePachangaStatus(p.id, 'closed');
                  setPachangas(pachangas.map(x => x.id === p.id ? {...x, status: 'closed'} : x));
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
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
