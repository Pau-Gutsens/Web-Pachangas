"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { Flame } from 'lucide-react';
import { formatCurrency, formatPoints } from '../lib/utils';

export default function LeaderboardView() {
  const [tab, setTab] = useState<'general' | 'ultima'>('general');
  const [standings, setStandings] = useState<UserAccount[]>([]);
  const [matches, setMatches] = useState<PachangaMatch[]>([]);

  useEffect(() => {
    const fetchologicalData = async () => {
      try {
        const [sData, mData] = await Promise.all([
          egolDb.getLeaderboard(),
          egolDb.getMatches()
        ]);
        setStandings(sData);
        setMatches(mData);
      } catch (e) {
        console.error('Error fetching data:', e);
        alert('Error al cargar la información.');
      }
    };
    fetchologicalData();
  }, []);

  const lastMatch = matches.find(m => m.status === 'scored' || m.status === 'voting') || matches[0];

  return (
    <div className="space-y-4 text-white">
      {/* Cabecera */}
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {tab === 'general' ? 'Clasificación General' : 'Última Jornada'}
          </h2>
          <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setTab('general')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${tab === 'general' ? 'bg-amber-500 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              General
            </button>
            <button
              onClick={() => setTab('ultima')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${tab === 'ultima' ? 'bg-amber-500 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              Última
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {tab === 'general' ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-neutral-950 text-neutral-500 text-xs uppercase font-bold border-b border-neutral-800">
                <tr className="py-3 px-2 sm:p-4">
                  <th className="text-center w-12 sm:w-16">Pos</th>
                  <th className="text-left">Mánager</th>
                  <th className="text-center w-24 sm:w-28">Puntos</th>
                  <th className="text-center w-20 sm:w-24 hidden xs:table-cell">Último</th>
                  <th className="text-center w-24 sm:w-28 hidden sm:table-cell">Presupuesto</th>
                  <th className="text-center w-20 sm:w-24 hidden md:table-cell">Plantilla</th>
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
                        {formatPoints(user.totalPoints)}
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
                        {lastMatch && lastMatch.status === 'voting' && (
                          <span className="ml-2 text-[8px] bg-blue-600 px-1 rounded">VOTANDO</span>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:p-4 text-center font-bold text-white hidden sm:table-cell text-xs sm:text-sm">
                        {formatCurrency(user.budget)}
                      </td>
                      <td className="py-3 px-2 sm:p-4 text-center text-xs font-semibold text-neutral-400 hidden md:table-cell">
                        {user.ownedPlayerIds.length} / 6
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              {lastMatch ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-black mb-2">{lastMatch.date}</h3>
                    <p className="text-neutral-400 text-sm">{lastMatch.status.toUpperCase()}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                      <div className="text-sm text-neutral-400 mb-1">Equipo A</div>
                      <div className="text-3xl font-black text-amber-400">{lastMatch.scoreA}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {lastMatch.teamA.length > 3 ? lastMatch.teamA.slice(0, 3).join(', ') + '...' : lastMatch.teamA.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-black text-neutral-600">{lastMatch.status === 'draw' ? 'Empate' : 'vs'}</div>
                    </div>
                    <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                      <div className="text-sm text-neutral-400 mb-1">Equipo B</div>
                      <div className="text-3xl font-black text-amber-400">{lastMatch.scoreB}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {lastMatch.teamB.length > 3 ? lastMatch.teamB.slice(0, 3).join(', ') + '...' : lastMatch.teamB.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setTab('general')}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition"
                    >
                      Volver a Clasificación
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-neutral-500">No hay partidos registrados.</p>
              )}
            </div>
          ) }
        </div>
      </div>
    </div>
  );
}
