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
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">Clasificación General</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Ranking acumulado de puntos de la liga</p>
        </div>
      </div>

      {/* Tabla Mobile-Friendly y Alineada */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 text-xs uppercase font-bold border-b border-neutral-800">
                <th className="py-3 px-2 sm:p-4 text-center w-12 sm:w-16">Pos</th>
                <th className="py-3 px-2 sm:p-4 text-left">Mánager</th>
                <th className="py-3 px-2 sm:p-4 text-center w-24 sm:w-28">Puntos</th>
                <th className="py-3 px-2 sm:p-4 text-center w-20 sm:w-24 hidden xs:table-cell">Último</th>
                <th className="py-3 px-2 sm:p-4 text-center w-24 sm:w-28 hidden sm:table-cell">Presupuesto</th>
                <th className="py-3 px-2 sm:p-4 text-center w-20 sm:w-24 hidden md:table-cell">Plantilla</th>
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
                    <td className="py-3 px-2 sm:p-4 text-center font-black text-xs sm:text-sm">
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : (
                        <span className="text-neutral-500">{idx + 1}º</span>
                      )}
                    </td>

                    <td className="py-3 px-2 sm:p-4 font-bold text-white text-left">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-amber-400 font-black flex-shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px] xs:max-w-none text-xs sm:text-sm">{user.username}</span>
                        {isFirst && (
                          <span className="text-[8px] sm:text-[9px] uppercase font-black bg-amber-400 text-neutral-950 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">
                            LÍDER
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-2 sm:p-4 text-center font-black text-amber-400 text-xs sm:text-sm whitespace-nowrap">
                      {user.totalPoints} pts
                    </td>

                    <td className="py-3 px-2 sm:p-4 text-center font-semibold text-neutral-300 hidden xs:table-cell text-xs sm:text-sm">
                      {user.lastMatchPoints && user.lastMatchPoints > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1 text-neutral-300 font-bold">
                          <Flame className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                          +{user.lastMatchPoints}
                        </span>
                      ) : (
                        <span className="text-neutral-600 font-normal">0 pts</span>
                      )}
                    </td>

                    <td className="py-3 px-2 sm:p-4 text-center font-bold text-white hidden sm:table-cell text-xs sm:text-sm">
                      {user.budget}M€
                    </td>

                    <td className="py-3 px-2 sm:p-4 text-center text-xs font-semibold text-neutral-400 hidden md:table-cell">
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
