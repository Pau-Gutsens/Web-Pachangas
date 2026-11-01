import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Member } from '../types';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const details = await db.getPachangaDetails(pachangaId);
        setSelectedPachanga(details);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [pachangaId]);

  if (loading) return <div className="p-4">Loading details...</div>;
  if (!selectedPachanga) return <div className="p-4">No pachanga selected.</div>;

  const handleAddMember = async (memberId: string) => {
    try {
      await db.addAttendee(pachangaId, memberId, null, 'A');
      const updated = await db.getPachangaDetails(pachangaId);
      setSelectedPachanga(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGuest = async (name: string) => {
    try {
      const guestId = Math.random().toString(36).substring(2, 15);
      await db.addAttendee(pachangaId, null, guestId, 'B');
      const updated = await db.getPachangaDetails(pachangaId);
      setSelectedPachanga(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-8 p-4 md:p-6 border rounded bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Manage Attendance for {selectedPachanga.id}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="font-semibold">Add Member</h4>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => handleAddMember(m.id)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-blue-500 hover:text-white transition-colors"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Add Guest</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Guest Name"
              className="border p-2 rounded flex-1"
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
        <h4 className="font-semibold mb-4">Current Attendees</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded bg-blue-50">
            <p className="font-bold border-b mb-2">Team A</p>
            <ul className="list-disc ml-4">
              {selectedPachanga.pachanga_attendees
                .filter(a => a.team === 'A')
                .map((a, i) => (
                  <li key={i}>
                    {members.find(m => m.id === a.member_id)?.name || 'Guest'}
                  </li>
                ))}
            </ul>
          </div>
          <div className="border p-4 rounded bg-red-50">
            <p className="font-bold border-b mb-2">Team B</p>
            <ul className="list-disc ml-4">
              {selectedPachanga.pachanga_attendees
                .filter(a => a.team === 'B')
                .map((a, i) => (
                  <li key={i}>
                    {members.find(m => m.id === a.member_id)?.name || 'Guest'}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
