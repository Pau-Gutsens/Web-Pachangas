"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UserAccount, PachangaMatch, Player } from '../types';
import { egolDb } from '../lib/db';
import { Flame, Star, Trophy, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatPoints } from '../lib/utils';

export default function LeaderboardView({ currentUser }: { currentUser?: UserAccount | null }) {
  const [tab, setTab] = useState<'general' | 'ultima'>('general');
  const [subTab, setSubTab] = useState<'jugadores' | 'managers'>('jugadores');
  const [standings, setStandings] = useState<UserAccount[]>([]);
  const [matches, setMatches] = useState<PachangaMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [expandedManagerId, setExpandedManagerId] = useState<string | null>(null);

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
        if (mData.length > 0) {
          const finished = mData.find(m => m.status === 'scored' || m.status === 'published');
          setSelectedMatchId(finished ? finished.id : mData[0].id);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        alert('Error al cargar la información.');
      }
    };
    fetchData();
  }, []);

  // Empates comparten posición (Sección 8)
  const standingsWithRank = useMemo(() => {
    let currentRank = 1;
    return standings.map((user, idx) => {
      if (idx > 0 && user.totalPoints < standings[idx - 1].totalPoints) {
        currentRank = idx + 1;
      }
      return { ...user, displayRank: currentRank };
    });
  }, [standings]);

  const myPosition = useMemo(() => {
    if (!currentUser) return 0;
    const item = standingsWithRank.find(
      u => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    return item ? item.displayRank : 0;
  }, [standingsWithRank, currentUser]);

  const currentMatch = useMemo(() => {
    return matches.find(m => m.id === selectedMatchId) || matches[0];
  }, [matches, selectedMatchId]);

  const isMatchPublished = currentMatch && (currentMatch.status === 'scored' || currentMatch.status === 'published');

  // Jugadores del partido seleccionado
  const convokedRanking = useMemo(() => {
    if (!currentMatch || !players.length) return [];

    const scoreA = currentMatch.scoreA ?? 0;
    const scoreB = currentMatch.scoreB ?? 0;
    const isFinished = currentMatch.status === 'scored' || currentMatch.status === 'published';
    const isDraw = isFinished && scoreA === scoreB;
    const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : (isDraw ? 'draw' : null);

    const list: any[] = [];
    const allConvoked: { id: string; team: 'A' | 'B' }[] = [
      ...(currentMatch.teamA || []).map(id => ({ id, team: 'A' as const })),
      ...(currentMatch.teamB || []).map(id => ({ id, team: 'B' as const }))
    ];

    allConvoked.forEach(({ id, team }) => {
      const p = players.find(item => item.id === id);
      if (!p) return;

      const st = currentMatch.playerStats?.[id] || { goals: 0, assists: 0, ownGoals: 0, saves: 0, rating: 0 };
      const votesPoints = Number(st.rating || 0);

      // Estadísticas
      let bruto = (st.goals * 3) + (st.assists * 1) - (st.ownGoals * 2);
      bruto += Math.min(3, st.saves || 0) * 2;
      if (winner === team) bruto += 3;
      else if (winner === 'draw') bruto += 1;

      const statsPoints = Math.max(0, Math.min(10, (Math.max(0, bruto) / 20) * 10));
      const totalPoints = Math.floor(statsPoints + votesPoints + 0.5);

      list.push({
        player: p,
        team,
        goals: st.goals || 0,
        assists: st.assists || 0,
        ownGoals: st.ownGoals || 0,
        votesPoints,
        statsPoints,
        totalPoints
      });
    });

    return list.sort((a, b) => b.totalPoints - a.totalPoints || b.votesPoints - a.votesPoints || b.goals - a.goals);
  }, [currentMatch, players]);

  return (
    <div className="space-y-4 text-white">
      {/* Cabecera con selector compacto ajustado */}
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {tab === 'general' ? 'Clasificación General' : 'Jornada'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {tab === 'general'
              ? 'Puntuación acumulada de la temporada actual de todos los mánagers'
              : 'Desglose y rendimiento de la jornada seleccionada'}
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
        <div className="space-y-4">
          {currentUser && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm flex-shrink-0">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-sm truncate">{currentUser.username}</span>
                    <span className="text-[9px] bg-amber-400/10 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-400/20">
                      TÚ
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 block mt-0.5">
                    Posición actual: <strong className="text-amber-400 font-bold">{myPosition > 0 ? `${myPosition}º` : 'En la lista'}</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-right flex-shrink-0">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Puntos</span>
                  <span className="text-sm font-black text-amber-400">{currentUser.totalPoints} pts</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Presupuesto</span>
                  <span className="text-sm font-black text-white">{formatCurrency(currentUser.budget)}</span>
                </div>
              </div>
            </div>
          )}

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
                  {standingsWithRank.map((user) => {
                    const isFirst = user.displayRank === 1 && user.totalPoints > 0;
                    const isSecond = user.displayRank === 2 && user.totalPoints > 0;
                    const isThird = user.displayRank === 3 && user.totalPoints > 0;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-neutral-800/40 transition-colors ${isFirst ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className="py-3 px-2 sm:p-4 text-center font-black text-xs sm:text-sm">
                          {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : (
                            <span className="text-neutral-500">{user.displayRank}º</span>
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
        </div>
      ) : (
        /* Pestaña: Última Jornada con selector y desglose */
        <div className="space-y-4">
          {matches.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-neutral-400 uppercase">Jornada:</span>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-white text-xs p-1.5 rounded-lg font-bold focus:outline-none focus:border-amber-400"
                >
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.date} ({m.startTime} - {m.endTime}) {m.status === 'published' || m.status === 'scored' ? '✓ Oficial' : '• ' + m.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-pestañas: Jugadores / Managers */}
              <div className="inline-flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
                <button
                  onClick={() => setSubTab('jugadores')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    subTab === 'jugadores' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Jugadores
                </button>
                <button
                  onClick={() => setSubTab('managers')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    subTab === 'managers' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Mánagers
                </button>
              </div>
            </div>
          )}

          {currentMatch ? (
            <>
              {/* Tarjeta resumen del partido */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3 mb-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="font-bold text-white">
                      {currentMatch.date
                        ? new Date(currentMatch.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                        : 'Fecha pendiente'}
                    </span>
                    <span>• {currentMatch.startTime} - {currentMatch.endTime}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded ${
                    isMatchPublished
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isMatchPublished ? '✓ Publicado' : 'Pendiente de votos'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 sm:gap-8 py-2">
                  <div className="text-center flex-1 max-w-[140px]">
                    <span className="text-xs font-bold text-blue-400 uppercase block mb-0.5">Equipo A</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">{currentMatch.scoreA ?? '-'}</span>
                  </div>
                  <span className="text-xs font-black uppercase text-neutral-600 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                    VS
                  </span>
                  <div className="text-center flex-1 max-w-[140px]">
                    <span className="text-xs font-bold text-red-400 uppercase block mb-0.5">Equipo B</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">{currentMatch.scoreB ?? '-'}</span>
                  </div>
                </div>
              </div>

              {!isMatchPublished ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-amber-400 text-xs font-bold">
                  ⭐ Este partido está pendiente de cierre de acta y votaciones de los convocados. Los puntos se publicarán en cuanto finalice.
                </div>
              ) : subTab === 'jugadores' ? (
                /* Rendimiento de Jugadores */
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        Puntuación de Jugadores
                      </h3>
                    </div>
                    <span className="text-xs text-neutral-400 font-bold">
                      {convokedRanking.length} jugadores
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-neutral-950 text-neutral-500 text-xs uppercase font-bold border-b border-neutral-800">
                        <tr className="py-3 px-3 sm:px-4">
                          <th className="text-center w-12 sm:w-16">Pos</th>
                          <th className="text-left">Jugador</th>
                          <th className="text-center w-16 sm:w-20">Equipo</th>
                          <th className="text-center w-14 sm:w-16">G / A</th>
                          <th className="text-center w-20 sm:w-24">Votos (0-10)</th>
                          <th className="text-center w-20 sm:w-24">Stats (0-10)</th>
                          <th className="text-center w-20 sm:w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {convokedRanking.map((item, idx) => (
                          <tr key={item.player.id} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="py-3 px-3 sm:px-4 text-center font-black text-xs sm:text-sm">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                            </td>
                            <td className="py-3 px-3 sm:px-4 font-bold text-white text-left">
                              <span className="block text-xs sm:text-sm text-white">
                                {item.player.name} {item.player.isGuest && <span className="text-neutral-500 font-normal text-[10px]">(invitado)</span>}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                item.team === 'A'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
                              }`}>
                                Eq {item.team}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center text-xs font-bold text-neutral-300">
                              {item.goals} / {item.assists}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center text-xs font-bold text-amber-400">
                              {item.votesPoints.toFixed(1)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center text-xs font-bold text-neutral-300">
                              {item.statsPoints.toFixed(1)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center font-black text-amber-400 text-xs sm:text-sm">
                              +{item.totalPoints} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Rendimiento de Mánagers con Desglose desplegable */
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-neutral-800">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Puntuación de los Mánagers en esta Jornada
                    </h3>
                  </div>

                  <div className="divide-y divide-neutral-800">
                    {standings.map((user, idx) => {
                      const isExpanded = expandedManagerId === user.id;
                      return (
                        <div key={user.id} className="p-3.5 hover:bg-neutral-800/30 transition">
                          <button
                            onClick={() => setExpandedManagerId(isExpanded ? null : user.id)}
                            className="w-full flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-xs text-neutral-500 w-6 text-center">{idx + 1}º</span>
                              <span className="font-bold text-sm text-white">{user.username}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-amber-400 text-sm">
                                {user.lastMatchPoints || 0} pts
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-neutral-800/60 pl-8 space-y-1.5 text-xs">
                              <span className="text-[11px] uppercase font-bold text-neutral-500 block mb-1">
                                Alineación titular:
                              </span>
                              {user.starterPlayerIds.length === 0 ? (
                                <p className="text-neutral-500 italic">Sin jugadores alineados en esta jornada.</p>
                              ) : (
                                user.starterPlayerIds.map(pId => {
                                  const p = players.find(x => x.id === pId);
                                  const sc = convokedRanking.find(x => x.player.id === pId);
                                  const isCap = (pId === user.captainId);
                                  const pts = sc ? sc.totalPoints * (isCap ? 2 : 1) : 0;
                                  return (
                                    <div key={pId} className="flex items-center justify-between py-0.5 text-neutral-300">
                                      <span>
                                        {p ? p.name : pId} {isCap && <strong className="text-amber-400 font-black ml-1">(Capitán ×2)</strong>}
                                      </span>
                                      <span className="font-bold text-amber-400">+{pts} pts</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
