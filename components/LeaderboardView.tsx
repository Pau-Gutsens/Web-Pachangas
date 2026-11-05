"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { egolDb } from '../lib/db';
import { Trophy, Medal, Coins, Flame, Users } from 'lucide-react';

export default function LeaderboardView() {
  const [standings, setStandings] = useState<UserAccount[]>([]);

  useEffect(() => {
    setStandings(egolDb.getLeaderboard());
  }, []);

  return (
    <div className="space-y-6 text-white">
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Temporada Oficial EGOL
          </span>
          <h2 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Clasificación General Fantasy
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Puntos acumulados por cada mánager con sus 5 jugadores titulares en cada jornada.
          </p>
        </div>
      </div>

      {/* Tabla de Clasificación */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-950 text-neutral-400 text-xs uppercase font-black border-b border-neutral-800">
                <th className="p-4 text-center w-16">Pos</th>
                <th className="p-4">Mánager</th>
                <th className="p-4 text-center">Puntos Totales</th>
                <th className="p-4 text-center">Último Partido</th>
                <th className="p-4 text-center">Presupuesto</th>
                <th className="p-4 text-center">Plantilla</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {standings.map((user, idx) => {
                const isFirst = idx === 0 && user.totalPoints > 0;
                const isSecond = idx === 1 && user.totalPoints > 0;
                const isThird = idx === 2 && user.totalPoints > 0;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isFirst ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="p-4 text-center font-black">
                      {isFirst ? (
                        <span className="text-2xl" title="1º Puesto">🥇</span>
                      ) : isSecond ? (
                        <span className="text-2xl" title="2º Puesto">🥈</span>
                      ) : isThird ? (
                        <span className="text-2xl" title="3º Puesto">🥉</span>
                      ) : (
                        <span className="text-neutral-500 text-base">{idx + 1}º</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-amber-400 font-black">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span>{user.username}</span>
                        {isFirst && (
                          <span className="ml-2 text-[9px] uppercase font-black bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded shadow-sm">
                            LÍDER
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center font-black text-amber-400 text-base">
                      {user.totalPoints} pts
                    </td>

                    <td className="p-4 text-center font-semibold text-neutral-300">
                      {user.lastMatchPoints && user.lastMatchPoints > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                          +{user.lastMatchPoints}
                        </span>
                      ) : (
                        <span className="text-neutral-500">0</span>
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

