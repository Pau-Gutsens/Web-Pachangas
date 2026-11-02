"use client";

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
    <div className="mt-8 p-4 md:p-6 border border-gray-200 rounded-lg bg-white shadow-sm text-gray-900">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Manage Attendance for {selectedPachanga.id}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Add Member</h4>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No registered members found in database.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleAddMember(m.id)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded hover:bg-blue-600 hover:text-white transition-colors border border-gray-300"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Add Guest</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Guest Name"
              className="border border-gray-300 bg-white text-gray-900 p-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setNewAttendee({...newAttendee, guestId: e.target.value})}
            />
            <button
              onClick={() => handleAddGuest(newAttendee.guestId)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-semibold mb-4 text-gray-800">Current Attendees</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-200 p-4 rounded-lg bg-blue-50 text-blue-950">
            <p className="font-bold border-b border-blue-200 pb-2 mb-2 text-blue-900">Team A</p>
            <ul className="list-disc ml-4 space-y-1 text-gray-800">
              {selectedPachanga.pachanga_attendees
                ?.filter((a: any) => a.team === 'A')
                .map((a: any, i: number) => (
                  <li key={i}>
                    {members.find(m => m.id === a.member_id)?.name || 'Guest'}
                  </li>
                ))}
              {(!selectedPachanga.pachanga_attendees || selectedPachanga.pachanga_attendees.filter((a: any) => a.team === 'A').length === 0) && (
                <li className="text-sm text-gray-500 italic list-none">No players assigned yet</li>
              )}
            </ul>
          </div>
          <div className="border border-red-200 p-4 rounded-lg bg-red-50 text-red-950">
            <p className="font-bold border-b border-red-200 pb-2 mb-2 text-red-900">Team B</p>
            <ul className="list-disc ml-4 space-y-1 text-gray-800">
              {selectedPachanga.pachanga_attendees
                ?.filter((a: any) => a.team === 'B')
                .map((a: any, i: number) => (
                  <li key={i}>
                    {members.find(m => m.id === a.member_id)?.name || 'Guest'}
                  </li>
                ))}
              {(!selectedPachanga.pachanga_attendees || selectedPachanga.pachanga_attendees.filter((a: any) => a.team === 'B').length === 0) && (
                <li className="text-sm text-gray-500 italic list-none">No players assigned yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
