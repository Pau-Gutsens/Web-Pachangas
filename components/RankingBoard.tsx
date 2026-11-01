import React from 'react';

export default function RankingBoard() {
  const rankings = []; // This would come from db in a real app

  if (rankings.length === 0) {
    return (
      <div className="p-8 text-center border rounded bg-gray-50">
        <p className="text-gray-500">No ranking data available yet.</p>
        <p className="text-sm text-gray-400">Once Pachangas are scored, the leaderboard will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Season Ranking</h3>
      <table className="w-full text-left">
        <thead className="bg-gray-50">
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
              <td className="p-2">{r.lastMatchPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
