import React from 'react';
import { db } from '../../lib/db';

export default function RankingBoard() {
  const rankings = db.getPachangas().map(p => ({
    pachangaId: p.id,
    score: 100, // Mock score
  }));

  return (
    <div className="p-6 border rounded bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Season Ranking</h3>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="p-2">Manager</th>
            <th className="p-2">Total Points</th>
            <th className="p-2">Last Match</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{i + 1}. Manager {r.pachangaId.substring(0, 4)}</td>
              <td className="p-2">{r.score}</td>
              <td className="p-2">100</td>
            </tr>
          </di>
        </tbody>
      </table>
    </div>
  );
}
