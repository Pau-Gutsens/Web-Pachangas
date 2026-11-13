"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, Player, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { Calendar, Clock, Star, CheckCircle, Award, ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function MatchDayView({
  user,
  players,
  onOpenAuth
}: {
  user: UserAccount | null;
  players: Player[];
  onOpenAuth: () => void;
}) {
  const [matches, setMatches] = useState<PachangaMatch[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [savingVote, setSavingVote] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isUserGuest = user ? egolDb.isUserGuest(user.username) : false;

  const loadMatches = async () => {
    try {
      const list = await egolDb.getMatches();
      setMatches(list);
    } catch (e) {
      console.error('Error fetching matches:', e);
      alert('Error al cargar la lista de partidos.');
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  // Partido activo que se vaya a celebrar o esté en votación/juego
  const activeMatch = matches.find(m => m.status === 'upcoming' || m.status === 'live' || m.status === 'voting');

  // Historial de partidos (todos los partidos que están finalizados o archivados)
  const historyMatches = matches.filter(m => m.id !== activeMatch?.id);

  // Cargar calificaciones si el partido activo está en votación
  useEffect(() => {
    if (!activeMatch || activeMatch.status !== 'voting' || !user || isUserGuest) return;

    const fetchUserRatings = async () => {
      try {
        const existing = await egolDb.getUserRatingsForMatch(activeMatch.id, user.username);
        if (Object.keys(existing).length > 0) {
          setRatings(existing);
          setHasVoted(true);
        } else {
          const initial: Record<string, number> = {};
          const allAtts = [...(activeMatch.teamA || []), ...(activeMatch.teamB || [])];
          allAtts.forEach(id => {
            const saved = activeMatch.playerStats?.[id]?.rating;
            initial[id] = saved && Number(saved) > 0 ? Number(saved) : 7;
          });
          setRatings(initial);
          setHasVoted(false);
        }
      } catch (e) {
        console.error('Error fetching ratings:', e);
      }
    };

    fetchUserRatings();
    setSuccessMsg('');
  }, [activeMatch, user, isUserGuest]);

  const handleRatingChange = (playerId: string, value: number) => {
    if (isUserGuest) return;
    setRatings(prev => ({ ...prev, [playerId]: value }));
  };

  const handleSubmitVotes = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (isUserGuest) {
      alert('Los invitados no pueden votar en el partido.');
      return;
    }
    if (!activeMatch) return;

    setSavingVote(true);
    try {
      const res = await egolDb.submitRatings(activeMatch.id, user.username, ratings);
      if (res.success) {
        setHasVoted(true);
        setSuccessMsg(res.message);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error al guardar notas.');
    } finally {
      setSavingVote(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMatchId(prev => (prev === id ? null : id));
  };

  const getDurationText = (start?: string, end?: string): string => {
    if (!start || !end) return '90 min';
    try {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diffMin <= 0) return '90 min';
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
      if (hours > 0) return `${hours}h`;
      return `${mins} min`;
    } catch {
      return '90 min';
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* 1. SECCIÓN: PARTIDO ACTIVO / PRÓXIMO PARTIDO QUE SE VA A CELEBRAR */}
      {activeMatch ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          {/* Cabecera del partido activo */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 border-b border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                activeMatch.status === 'live'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                  : activeMatch.status === 'voting'
                  ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {activeMatch.status === 'live'
                  ? '● En Juego'
                  : activeMatch.status === 'voting'
                  ? '⭐ Votaciones Abiertas'
                  : 'Próximo Encuentro'}
              </span>

              <span className="text-xs text-neutral-400 font-semibold">
                Formato {activeMatch.format || 5} vs {activeMatch.format || 5}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Partido de la Jornada
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-300">
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    {activeMatch.date
                      ? new Date(activeMatch.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Fecha a determinar'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-neutral-400">
                    <Clock className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                    {activeMatch.startTime || '17:00'} – {activeMatch.endTime || '18:30'}
                    <span className="text-neutral-500">
                      (Duración: {getDurationText(activeMatch.startTime, activeMatch.endTime)})
                    </span>
                  </span>
                </div>
              </div>

              {/* Si ya hay marcador provisional o de acta */}
              {activeMatch.scoreA !== undefined && activeMatch.scoreB !== undefined && (
                <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-xl font-black text-lg">
                  <span className="text-blue-400">{activeMatch.scoreA}</span>
                  <span className="text-neutral-600 text-xs uppercase">VS</span>
                  <span className="text-red-400">{activeMatch.scoreB}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información de los dos equipos y futbolistas convocados */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Equipo A */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="font-black text-xs sm:text-sm text-blue-400 uppercase tracking-wide">
                      Equipo A
                    </h3>
                  </div>
                  <span className="text-xs text-blue-300 font-bold">
                    {(activeMatch.teamA || []).length} jugadores
                  </span>
                </div>
                <div className="p-2 divide-y divide-neutral-900">
                  {(activeMatch.teamA || []).map(pId => {
                    const player = players.find(p => p.id === pId);
                    if (!player) return null;
                    return (
                      <div key={pId} className="flex items-center justify-between py-2 px-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                            <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-xs text-white truncate">
                            {player.name}
                            {player.isGuest && (
                              <span className="text-neutral-500 font-normal ml-1 text-[10px]">(invitado)</span>
                            )}
                          </span>
                        </div>
                        {player.averageRating > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {player.averageRating}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(!activeMatch.teamA || activeMatch.teamA.length === 0) && (
                    <p className="p-4 text-center text-xs text-neutral-500">Sin jugadores asignados al Equipo A.</p>
                  )}
                </div>
              </div>

              {/* Equipo B */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <h3 className="font-black text-xs sm:text-sm text-red-400 uppercase tracking-wide">
                      Equipo B
                    </h3>
                  </div>
                  <span className="text-xs text-red-300 font-bold">
                    {(activeMatch.teamB || []).length} jugadores
                  </span>
                </div>
                <div className="p-2 divide-y divide-neutral-900">
                  {(activeMatch.teamB || []).map(pId => {
                    const player = players.find(p => p.id === pId);
                    if (!player) return null;
                    return (
                      <div key={pId} className="flex items-center justify-between py-2 px-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                            <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-xs text-white truncate">
                            {player.name}
                            {player.isGuest && (
                              <span className="text-neutral-500 font-normal ml-1 text-[10px]">(invitado)</span>
                            )}
                          </span>
                        </div>
                        {player.averageRating > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {player.averageRating}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(!activeMatch.teamB || activeMatch.teamB.length === 0) && (
                    <p className="p-4 text-center text-xs text-neutral-500">Sin jugadores asignados al Equipo B.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Votación interactiva si el partido está en fase de votación */}
            {activeMatch.status === 'voting' && (
              <div className="mt-5 bg-neutral-950 border border-neutral-800 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2.5">
                  <h4 className="font-black text-sm text-amber-400 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Vota el rendimiento de los jugadores (1 al 10)
                  </h4>
                  {hasVoted && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Guardado
                    </span>
                  )}
                </div>

                {successMsg && (
                  <div className="mb-3 p-3 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-bold">
                    {successMsg}
                  </div>
                )}

                <div className="divide-y divide-neutral-900">
                  {[...(activeMatch.teamA || []), ...(activeMatch.teamB || [])].map(pId => {
                    const p = players.find(item => item.id === pId);
                    if (!p) return null;
                    const curRating = ratings[pId] ?? 7;

                    return (
                      <div key={pId} className="py-2.5 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                          <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-white truncate block">{p.name}</span>
                          {!isUserGuest && user && (
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={curRating}
                              onChange={(e) => handleRatingChange(pId, parseFloat(e.target.value))}
                              className="w-full accent-amber-400 cursor-pointer h-2 mt-1"
                            />
                          )}
                        </div>
                        <span className="font-black text-xs text-amber-400 w-8 text-right flex-shrink-0">
                          {curRating}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-end">
                  {!user ? (
                    <button
                      onClick={onOpenAuth}
                      className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase transition"
                    >
                      Inicia sesión para votar
                    </button>
                  ) : isUserGuest ? (
                    <span className="text-xs text-neutral-500">Los invitados no pueden emitir votos</span>
                  ) : (
                    <button
                      onClick={handleSubmitVotes}
                      disabled={savingVote}
                      className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase transition"
                    >
                      {savingVote ? 'Guardando...' : hasVoted ? 'Actualizar notas' : 'Enviar notas'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-neutral-400">
          <Calendar className="h-8 w-8 text-amber-400 mx-auto mb-2 opacity-80" />
          <h3 className="font-bold text-sm text-white mb-1">No hay ningún partido activo programado</h3>
          <p className="text-xs text-neutral-500">
            El administrador creará la próxima convocatoria pronto.
          </p>
        </div>
      )}

      {/* 2. SECCIÓN: HISTORIAL DE PARTIDOS (SOLO MUESTRA FECHA Y HORA; SE DESPLIEGA AL DARLE) */}
      <div className="space-y-3">
        <div className="border-b border-neutral-800 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Historial de Partidos
            </h3>
          </div>
          <span className="text-xs text-neutral-500">
            {historyMatches.length} partidos jugados
          </span>
        </div>

        {historyMatches.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center text-xs text-neutral-500">
            Aún no hay partidos anteriores registrados en el historial.
          </div>
        ) : (
          <div className="space-y-2.5">
            {historyMatches.map(m => {
              const isExpanded = expandedMatchId === m.id;
              const teamAPlayers = players.filter(p => m.teamA?.includes(p.id));
              const teamBPlayers = players.filter(p => m.teamB?.includes(p.id));
              const allMatchPlayers = [...teamAPlayers, ...teamBPlayers];

              return (
                <div
                  key={m.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  {/* Fila principal del historial: SOLO día, mes y hora del partido (+ flecha) */}
                  <button
                    onClick={() => toggleExpand(m.id)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-neutral-800/40 transition gap-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-white block capitalize truncate">
                          {m.date
                            ? new Date(m.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                            : 'Fecha pendiente'}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-neutral-500 flex-shrink-0" />
                          {m.startTime || '17:00'} – {m.endTime || '18:30'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {m.scoreA !== undefined && m.scoreB !== undefined ? (
                        <div className="font-black text-xs sm:text-sm bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-md">
                          <span className="text-blue-400">{m.scoreA}</span>
                          <span className="text-neutral-500 mx-1">-</span>
                          <span className="text-red-400">{m.scoreB}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded">
                          {m.status}
                        </span>
                      )}

                      <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-400">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Detalle expandido: SOLO AL DARLE */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 p-4 sm:p-5 bg-neutral-950/60 space-y-4">
                      {/* Marcador final */}
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-center flex items-center justify-center gap-6">
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase text-blue-400 block mb-0.5">Equipo A</span>
                          <span className="text-2xl font-black text-white">{m.scoreA ?? '-'}</span>
                        </div>
                        <span className="text-xs font-black uppercase text-neutral-600 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          VS
                        </span>
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase text-red-400 block mb-0.5">Equipo B</span>
                          <span className="text-2xl font-black text-white">{m.scoreB ?? '-'}</span>
                        </div>
                      </div>

                      {/* Equipos convocados */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                          <span className="font-black text-blue-400 uppercase text-[11px] block mb-1.5">
                            Equipo A ({teamAPlayers.length})
                          </span>
                          <div className="space-y-1">
                            {teamAPlayers.map(p => (
                              <div key={p.id} className="flex items-center justify-between text-neutral-300 py-0.5">
                                <span className="truncate">{p.name} {p.isGuest ? '(invitado)' : ''}</span>
                                {m.playerStats?.[p.id]?.rating ? (
                                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                                    {m.playerStats[p.id].rating}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                            {teamAPlayers.length === 0 && <span className="text-neutral-600">Sin jugadores</span>}
                          </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                          <span className="font-black text-red-400 uppercase text-[11px] block mb-1.5">
                            Equipo B ({teamBPlayers.length})
                          </span>
                          <div className="space-y-1">
                            {teamBPlayers.map(p => (
                              <div key={p.id} className="flex items-center justify-between text-neutral-300 py-0.5">
                                <span className="truncate">{p.name} {p.isGuest ? '(invitado)' : ''}</span>
                                {m.playerStats?.[p.id]?.rating ? (
                                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                                    {m.playerStats[p.id].rating}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                            {teamBPlayers.length === 0 && <span className="text-neutral-600">Sin jugadores</span>}
                          </div>
                        </div>
                      </div>

                      {/* Estadísticas individuales de cada jugador en ese partido */}
                      {allMatchPlayers.length > 0 && m.playerStats && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-neutral-950 border-b border-neutral-800">
                            <span className="text-[11px] font-black uppercase text-neutral-400">
                              Estadísticas Individuales del Partido
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-neutral-950/80 text-neutral-500 uppercase font-bold border-b border-neutral-800 text-[10px]">
                                <tr>
                                  <th className="py-2 px-3 text-left">Jugador</th>
                                  <th className="py-2 px-2 text-center">Equipo</th>
                                  <th className="py-2 px-2 text-center">Goles</th>
                                  <th className="py-2 px-2 text-center">Asist</th>
                                  <th className="py-2 px-2 text-center">Autogol</th>
                                  <th className="py-2 px-2 text-center">Nota ⭐</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-800">
                                {allMatchPlayers.map(player => {
                                  const st = m.playerStats?.[player.id] || { goals: 0, assists: 0, ownGoals: 0 };
                                  const isTeamA = m.teamA?.includes(player.id);

                                  return (
                                    <tr key={player.id} className="hover:bg-neutral-800/30">
                                      <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                                          <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="truncate">{player.name}</span>
                                      </td>
                                      <td className="py-2 px-2 text-center">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                          isTeamA ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'
                                        }`}>
                                          {isTeamA ? 'A' : 'B'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-center font-bold text-neutral-300">
                                        {st.goals > 0 ? <span className="text-amber-400">⚽ {st.goals}</span> : '0'}
                                      </td>
                                      <td className="py-2 px-2 text-center font-bold text-neutral-300">
                                        {st.assists > 0 ? <span className="text-emerald-400">👟 {st.assists}</span> : '0'}
                                      </td>
                                      <td className="py-2 px-2 text-center font-bold text-neutral-300">
                                        {st.ownGoals > 0 ? <span className="text-red-400">❌ {st.ownGoals}</span> : '0'}
                                      </td>
                                      <td className="py-2 px-2 text-center font-black">
                                        {st.rating && Number(st.rating) > 0 ? (
                                          <span className="inline-flex items-center gap-0.5 text-amber-400">
                                            <Star className="h-3 w-3 fill-amber-400" />
                                            {st.rating}
                                          </span>
                                        ) : (
                                          <span className="text-neutral-600">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
