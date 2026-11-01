import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Member } from '../types';

export default function FantasySelection({ pachangaId, members }: { pachangaId: string; members: any[] }) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [budget, setBudget] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPachanga() {
      setLoading(true);
      try {
        const details = await db.getPachangaDetails(pachangaId);
        if (details && details.pachanga_attendees) {
          setAttendees(details.pachanga_attendees);
          // Example budget calculation: N * average price
          const avgPrice = 11.4;
          setBudget(Math.round(details.format * avgPrice));
          setCurrentBudget(Math.round(details.format * avgPrice));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPachanga();
  }, [pachangaId]);

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      const newSelection = selectedIds.filter(i => i !== id);
      // Calculate price of removed player (mock price)
      const removedPrice = 10;
      setCurrentBudget(prev => prev + removedPrice);
      setSelectedIds(newSelection);
    } else {
      const newSelection = [...selectedIds, id];
      const addedPrice = 10;
      setCurrentBudget(prev => prev - addedPrice);
      setSelectedIds(newSelection);
    }
  };

  const handleCaptainChange = (id: string) => {
    setCaptainId(id);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 md:p-6 border rounded bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Choose your Team</h3>
      <div className="flex justify-between mb-6">
        <p>Budget: <span className="font-bold">{currentBudget}</span> / {budget}</p>
        <p>Slots: {selectedIds.length} / {Math.floor(budget / 10)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <h4 className="font-semibold">Available Players</h4>
          <div className="grid grid-cols-2 gap-2">
            {attendees.map((a, i) => (
              <button
                key={i}
                onClick={() => togglePlayer(a.member_id || a.guest_id)}
                className={`p-3 text-left border rounded ${
                  selectedIds.includes(a.member_id || a.guest_id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50'
                }`}
              >
                {members.find(m => m.id === a.member_id)?.name || 'Guest'}
              </button>
            ))}
          </div>
        </div>

        <div className="border-l md:border-l-0 md:border-t pt-4 md:pt-0 md:pl-8">
          <h4 className="font-semibold mb-4">Your Team</h4>
          <ul className="space-y-2">
            {selectedIds.map(id => (
              <li key={id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                <input
                  type="radio"
                  name="captain"
                  checked={captainId === id}
                  onChange={() => handleCaptainChange(id)}
                  className="w-4 h-4"
                />
                <span className="flex-1">{members.find(m => m.id === id)?.name}</span>
                {captainId === id && <span className="bg-yellow-400 text-xs px-2 py-1 rounded font-bold">CAPTAIN</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
