"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { egolDb } from '../lib/db';
import { Flame } from 'lucide-react';

export default function LeaderboardView() {
  const [standings, setStandings] = useState<UserAccount[]>([]);

  useEffect(() => {
    setStandings(egolDb.getLeaderboard());
  }, []);

  return (
    <div className="space-y-4 text-white">
      {/* Cabecera */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-black text-white">Clasificación General</h2>
      </div>

      {/* Tabla */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 text-xs uppercase font-bold border-b border-neutral-800">
                <th className="p-4 text-center w-14">Pos</th>
                <th className="p-4">Mánager</th>
                <th className="p-4 text-center">Puntos</th>
                <th className="p-4 text-center">Último</th>
                <th className="p-4 text-center">Presupuesto</th>
                <th className="p-4 text-center">Plantilla</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {standings.map((user, idx) => {
                const isFirst = idx === 0 && user.totalPoints > 0;
                const isSecond = idx === 1 && user.totalPoints > 0;
                const isThird = idx === 2 && user.totalPoints > 0;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${isFirst ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="p-4 text-center font-black text-sm">
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : (
                        <span className="text-neutral-500">{idx + 1}º</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-amber-400 font-black flex-shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.username}</span>
                        {isFirst && (
                          <span className="text-[9px] uppercase font-black bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded">
                            LÍDER
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center font-black text-amber-400">
                      {user.totalPoints} pts
                    </td>

                    <td className="p-4 text-center font-semibold text-neutral-300">
                      {user.lastMatchPoints && user.lastMatchPoints > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                          +{user.lastMatchPoints}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>

                    <td className="p-4 text-center font-bold text-emerald-400">
                      {user.budget}M€
                    </td>

                    <td className="p-4 text-center text-xs font-semibold text-neutral-400">
                      {user.ownedPlayerIds.length} / 6
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
