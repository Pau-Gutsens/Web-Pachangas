import React, { useState } from 'react';
import { db } from '../../lib/db';

export default function StatsRegistration({ pachangaId }: { pachangaId: string }) {
  const [stats, setStats] = useState<any[]>([]);
  const [currentStat, setCurrentStat] = useState({
    playerId: '',
    type: 'goal',
    value: 1
  });
  const [loading, setLoading] = useState(false);

  const addStat = () => {
    const newStats = [...stats, { ...currentStat }];
    setStats(newStats);
    setCurrentStat({ playerId: '', type: 'goal', value: 1 });
  };

  const submitStats = async () => {
    setLoading(true);
    try {
      // In a real app, this sends to the API
      // For now, we'll just log it
      console.log('Submitting stats:', stats);
      alert('Stats submitted successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-6 border rounded bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Register Match Stats</h3>
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2 rounded"
          value={currentStat.playerId}
          onChange={(e) => setCurrentStat({...currentStat, playerId: e.target.value})}
        >
          <option value="">Select Player</option>
          <option value="1">Member 1</option>
          <option value="2">Member 2</option>
          <option value="3">Member 3</option>
        </select>

        <select
          className="border p-2 rounded"
          value={currentStat.type}
          onChange={(e) => setCurrentStat({...currentStat, type: e.target.value})}
        >
          <option value="goal">Goal</option>
          <option value="assist">Assist</option>
          <option value="own_goal">Own Goal</option>
          <option value="save">Save</option>
          <option value="goal_against">Goal Against</option>
          <option value="mvp">MVP</option>
          <option value="win">Win</option>
        </select>

        <input
          type="number"
          className="border p-2 rounded w-16"
          value={currentStat.value}
          onChange={(e) => setCurrentStat({...currentStat, value: parseInt(e.target.value)})}
        />

        <button
          onClick={addStat}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Current Stats:</h4>
        <ul className="list-disc ml-4">
          {stats.map((s, i) => (
            <li key={i}>{s.playerId} - {s.type} ({s.value})</li>
          ))}
        </ul>
      </div>

      <button
        onClick={submitStats}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded font-bold disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Final Stats'}
      </button>
    </div>
  );
}
