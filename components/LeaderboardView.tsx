"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, PachangaMatch, Player } from '../types';
import { egolDb } from '../lib/db';
import { Flame, Star, Trophy, Calendar } from 'lucide-react';
import { formatCurrency, formatPoints } from '../lib/utils';

interface ConvokedPlayerRank {
  player: Player;
  team: 'A' | 'B';
  goals: number;
  assists: number;
  ownGoals: number;
  rating: number;
  fantasyPoints: number;
}

export default function LeaderboardView() {
  const [tab, setTab] = useState<'general' | 'ultima'>('general');
  const [standings, setStandings] = useState<UserAccount[]>([]);
  const [matches, setMatches] = useState<PachangaMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sData, mData, pData] = await Promise.all([
          egolDb.getLeaderboard(),
          egolDb.getMatches(),
          egolDb.getPlayers()
        ]);
        setStandings(sData);
        setMatches(mData);
        setPlayers(pData);
      } catch (e) {
        console.error('Error fetching data:', e);
        alert('Error al cargar la información.');
      }
    };
    fetchData();
  }, []);

  const lastMatch = matches.find(m => m.status === 'scored' || m.status === 'voting') || matches[0];

  // Calcular ranking de jugadores convocados en el último partido
  const convokedRanking: ConvokedPlayerRank[] = React.useMemo(() => {
    if (!lastMatch || !players.length) return [];

    const scoreA = lastMatch.scoreA ?? 0;
    const scoreB = lastMatch.scoreB ?? 0;
    const isFinished = lastMatch.status === 'scored';
    const isDraw = isFinished && scoreA === scoreB;
    const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : (isDraw ? 'draw' : null);

    const list: ConvokedPlayerRank[] = [];
    const allConvoked: { id: string; team: 'A' | 'B' }[] = [
      ...(lastMatch.teamA || []).map(id => ({ id, team: 'A' as const })),
      ...(lastMatch.teamB || []).map(id => ({ id, team: 'B' as const }))
    ];

    allConvoked.forEach(({ id, team }) => {
      const p = players.find(item => item.id === id);
      if (!p) return;

      const st = lastMatch.playerStats?.[id] || { goals: 0, assists: 0, ownGoals: 0, rating: 0 };
      const rating = Number(st.rating || 0);
      let pts = (st.goals * 3) + (st.assists * 1) - (st.ownGoals * 2);
      if (rating > 0) pts += rating;
      if (winner === team) pts += 3;
      else if (winner === 'draw') pts += 1;

      list.push({
        player: p,
        team,
        goals: st.goals || 0,
        assists: st.assists || 0,
        ownGoals: st.ownGoals || 0,
        rating,
        fantasyPoints: Math.max(0, Math.round(pts * 10) / 10)
      });
    });

    return list.sort((a, b) => b.fantasyPoints - a.fantasyPoints || b.rating - a.rating || b.goals - a.goals);
  }, [lastMatch, players]);

  return (
    <div className="space-y-4 text-white">
      {/* Cabecera con selector compacto ajustado */}
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {tab === 'general' ? 'Clasificación General' : 'Última Jornada'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {tab === 'general'
              ? 'Puntuación acumulada de todos los mánagers'
              : 'Clasificación y rendimiento de los jugadores en la última pachanga'}
          </p>
        </div>

        {/* Botones ajustados sin espacio sobrante */}
        <div className="inline-flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-fit self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setTab('general')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              tab === 'general'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setTab('ultima')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              tab === 'ultima'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Última
          </button>
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {tab === 'general' ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
          </div>
        </div>
      ) : (
        /* Pestaña: Última Jornada con clasificación ordenada de convocados */
        <div className="space-y-4">
          {lastMatch ? (
            <>
              {/* Tarjeta resumen del partido */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3 mb-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Calendar className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span className="font-bold text-white">
                      {lastMatch.date
                        ? new Date(lastMatch.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                        : 'Fecha pendiente'}
                    </span>
                    <span>• {lastMatch.startTime} - {lastMatch.endTime}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    lastMatch.status === 'scored'
                      ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/20'
                      : lastMatch.status === 'voting'
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {lastMatch.status === 'scored' ? 'Finalizado' : lastMatch.status === 'voting' ? 'Votación' : 'Programado'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 sm:gap-8 py-2">
                  <div className="text-center flex-1 max-w-[140px]">
                    <span className="text-xs font-bold text-blue-400 uppercase block mb-0.5">Equipo A</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">{lastMatch.scoreA ?? '-'}</span>
                  </div>
                  <span className="text-xs font-black uppercase text-neutral-600 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                    VS
                  </span>
                  <div className="text-center flex-1 max-w-[140px]">
                    <span className="text-xs font-bold text-red-400 uppercase block mb-0.5">Equipo B</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">{lastMatch.scoreB ?? '-'}</span>
                  </div>
                </div>
              </div>

              {/* Tabla de clasificación por orden de cada jugador convocado */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Rendimiento de los Convocados
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-400 font-bold">
                    {convokedRanking.length} jugadores
                  </span>
                </div>

                {convokedRanking.length === 0 ? (
                  <p className="p-8 text-center text-xs text-neutral-500">
                    No hay jugadores convocados o puntuados en este partido.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-neutral-950 text-neutral-500 text-xs uppercase font-bold border-b border-neutral-800">
                        <tr className="py-3 px-3 sm:px-4">
                          <th className="text-center w-12 sm:w-16">Pos</th>
                          <th className="text-left">Jugador</th>
                          <th className="text-center w-16 sm:w-20">Equipo</th>
                          <th className="text-center w-14 sm:w-16">Goles</th>
                          <th className="text-center w-14 sm:w-16">Asist</th>
                          <th className="text-center w-14 sm:w-16">Nota ⭐</th>
                          <th className="text-center w-20 sm:w-24">Puntos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {convokedRanking.map((item, idx) => {
                          const isFirst = idx === 0 && item.fantasyPoints > 0;
                          const isSecond = idx === 1 && item.fantasyPoints > 0;
                          const isThird = idx === 2 && item.fantasyPoints > 0;

                          return (
                            <tr
                              key={item.player.id}
                              className={`hover:bg-neutral-800/40 transition-colors ${isFirst ? 'bg-amber-500/5' : ''}`}
                            >
                              <td className="py-3 px-3 sm:px-4 text-center font-black text-xs sm:text-sm">
                                {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : (
                                  <span className="text-neutral-500">{idx + 1}º</span>
                                )}
                              </td>
                              <td className="py-3 px-3 sm:px-4 font-bold text-white text-left">
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                                    <img
                                      src={item.player.avatarUrl || '/logo.png'}
                                      alt={item.player.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="truncate block text-xs sm:text-sm text-white">
                                      {item.player.name}
                                    </span>
                                    {item.player.isGuest && (
                                      <span className="text-[10px] text-neutral-500 font-normal">
                                        (invitado)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 sm:px-4 text-center">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                  item.team === 'A'
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                                }`}>
                                  Equipo {item.team}
                                </span>
                              </td>
                              <td className="py-3 px-3 sm:px-4 text-center text-xs font-bold text-neutral-300">
                                {item.goals > 0 ? (
                                  <span className="text-amber-400 font-black">⚽ {item.goals}</span>
                                ) : (
                                  <span className="text-neutral-600">0</span>
                                )}
                              </td>
                              <td className="py-3 px-3 sm:px-4 text-center text-xs font-bold text-neutral-300">
                                {item.assists > 0 ? (
                                  <span className="text-emerald-400 font-black">👟 {item.assists}</span>
                                ) : (
                                  <span className="text-neutral-600">0</span>
                                )}
                              </td>
                              <td className="py-3 px-3 sm:px-4 text-center text-xs font-black">
                                {item.rating > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-amber-400">
                                    <Star className="h-3 w-3 fill-amber-400" />
                                    {item.rating}
                                  </span>
                                ) : (
                                  <span className="text-neutral-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-400 text-xs sm:text-sm whitespace-nowrap">
                                +{item.fantasyPoints} <span className="text-[10px] text-neutral-400">pts</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-xs">
              No hay partidos registrados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
