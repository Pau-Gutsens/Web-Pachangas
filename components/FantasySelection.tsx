import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { calculatePrice } from '../../lib/constants';

export default function FantasySelection({ pachangaId, members }: { pachangaId: string; members: any[] }) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [budget, setBudget] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);

  useEffect(() => {
    // Mock loading attendees and calculating initial budget
    const p = db.getPachangas().find(p => p.id === pachangaId);
    if (p) {
      setAttendees(p.attendees);
      // Example budget calculation: N * average price
      const avgPrice = 11.4;
      setBudget(Math.round(p.format * avgPrice));
      setCurrentBudget(Math.round(p.format * avgPrice));
    }
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

  return (
    <div className="p-6 border rounded bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Choose your Team</h3>
      <div className="flex justify-between mb-6">
        <p>Budget: <span className="font-bold">{currentBudget}</span> / {budget}</p>
        <p>Slots: {selectedIds.length} / {Math.floor(budget / 10)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Available Players</h4>
          {attendees.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(a.memberId || a.guestId)}
                onChange={() => togglePlayer(a.memberId || a.guestId)}
              />
              <span>{members.find(m => m.id === a.memberId)?.name || 'Guest'}</span>
              <span className="text-gray-400">($10)</span>
            </div>
          ))}
        </div>

        <div className="border-l pl-4">
          <h4 className="font-semibold mb-4">Your Team</h4>
          <ul className="space-y-2">
            {selectedIds.map(id => (
              <li key={id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="captain"
                  checked={captainId === id}
                  onChange={() => handleCaptainChange(id)}
                />
                <span>{members.find(m => m.id === id)?.name}</span>
                {captainId === id && <span className="bg-yellow-400 text-xs px-1 rounded">CAPTAIN</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
