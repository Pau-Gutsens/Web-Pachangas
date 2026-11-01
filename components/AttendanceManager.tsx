import React, { useState } from 'react';
import { db } from '../../lib/db';
import { Member } from '../../types';

export default function AttendanceManager({ pachangaId, pachangas, members }: {
  pachangaId: string;
  pachangas: any[];
  members: Member[]
}) {
  const [selectedPachanga, setSelectedPachanga] = useState<any>(null);
  const [newAttendee, setNewAttendee] = useState({
    memberId: '',
    guestId: '',
    team: 'A' as 'A' | 'B'
  });

  useEffect(() => {
    const p = pachangas.find(p => p.id === pachangaId);
    setSelectedPachanga(p);
  }, [pachangaId, pachangas]);

  if (!selectedPachanga) return <p>Loading...</p>;

  const handleAddMember = (memberId: string) => {
    db.addAttendee(pachangaId, memberId, '', 'A');
    // Refresh local state
    const updated = db.getPachangas().find(p => p.id === pachangaId);
    setSelectedPachanga(updated);
  };

  const handleAddGuest = (name: string) => {
    const guestId = Math.random().toString(36).substring(2, 15);
    db.addAttendee(pachangaId, null, guestId, 'B');
    // Refresh local state
    const updated = db.getPachangas().find(p => p.id === pachangaId);
    setSelectedPachanga(updated);
  };

  return (
    <div className="mt-8 p-6 border rounded bg-white shadow-sm">
      <h3 className="text-lg font-bold mb-4">Manage Attendance for {selectedPachanga.id}</h3>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold mb-2">Add Member</h4>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => handleAddMember(m.id)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-blue-500 hover:text-white"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Add Guest</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Guest Name"
              className="border p-2 rounded"
              onChange={(e) => setNewAttendee({...newAttendee, guestId: e.target.value})}
            />
            <button
              onClick={() => handleAddGuest(newAttendee.guestId)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-semibold mb-2">Current Attendees</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-4 rounded bg-blue-50">
            <p className="font-bold border-b mb-2">Team A</p>
            <ul className="list-disc ml-4">
              {selectedPachanga.attendees
                .filter(a => a.team === 'A')
                .map((a, i) => (
                  <li key={i}>
                    {members.find(m => m.id === a.memberId)?.name || 'Guest'}
                  </li>
                ))}
            </ul>
          </div>
          <div className="border p-4 rounded bg-red-50">
            <p className="font-bold border-b mb-2">Team B</p>
            <ul className="list-disc ml-4">
              {selectedPachanga.attendees
                .filter(a => a.team === 'B')
                .map((a, i) => (
                  <li key={i}>
                    {members.find(m => m.id === a.memberId)?.name || 'Guest'}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
