"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, Player, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { Calendar, Clock, Star, Users, CheckCircle, Award, Trophy, ThumbsUp } from 'lucide-react';

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
  const [selectedMatch, setSelectedMatch] = useState<PachangaMatch | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [savingVote, setSavingVote] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadMatches = () => {
    const list = egolDb.getMatches();
    setMatches(list);
    if (list.length > 0 && !selectedMatch) {
      setSelectedMatch(list[0]);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  // Cargar votos previos si el usuario ya votó en este partido
  useEffect(() => {
    if (!selectedMatch || !user) return;
    const existing = egolDb.getUserRatingsForMatch(selectedMatch.id, user.username);
    if (Object.keys(existing).length > 0) {
      setRatings(existing);
      setHasVoted(true);
    } else {
      // Inicializar con notas por defecto (ej: 7.0) para los que jugaron
      const initial: Record<string, number> = {};
      const allAtts = [...(selectedMatch.teamA || []), ...(selectedMatch.teamB || [])];
      allAtts.forEach(id => { initial[id] = 7; });
      setRatings(initial);
      setHasVoted(false);
    }
    setSuccessMsg('');
  }, [selectedMatch, user]);

  const handleRatingChange = (playerId: string, value: number) => {
    setRatings(prev => ({ ...prev, [playerId]: value }));
  };

  const handleSubmitVotes = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!selectedMatch) return;

    setSavingVote(true);
    try {
      const res = egolDb.submitRatings(selectedMatch.id, user.username, ratings);
      if (res.success) {
        setHasVoted(true);
        setSuccessMsg(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al guardar notas.');
    } finally {
      setSavingVote(false);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center max-w-lg mx-auto text-white">
        <Calendar className="h-12 w-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-1">No hay partidos programados</h3>
        <p className="text-xs text-neutral-400">
          El administrador publicará el próximo partido con la hora de inicio y fin.
        </p>
      </div>
    );
  }

  const currentMatch = selectedMatch || matches[0];
  const teamAPlayers = players.filter(p => currentMatch.teamA?.includes(p.id));
  const teamBPlayers = players.filter(p => currentMatch.teamB?.includes(p.id));
  const matchAttendees = [...teamAPlayers, ...teamBPlayers];

  return (
    <div className="space-y-8 text-white">
      {/* Cabecera del Partido */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {currentMatch.date ? new Date(currentMatch.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha pendiente'}
            </span>

            <span className="text-xs font-bold text-neutral-300 bg-neutral-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              De {currentMatch.startTime || '17:00'} a {currentMatch.endTime || '18:30'}
            </span>

            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
              currentMatch.status === 'voting' ? 'bg-amber-400 text-neutral-950 animate-pulse' :
              currentMatch.status === 'scored' ? 'bg-emerald-500 text-neutral-950' :
              'bg-blue-600 text-white'
            }`}>
              {currentMatch.status === 'voting' ? '⭐ Votaciones Abiertas' :
               currentMatch.status === 'scored' ? '✓ Partido Finalizado' :
               'Programado'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Partido de la Jornada
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Una vez finalizado el horario ({currentMatch.endTime}), todos los usuarios puntúan del 1 al 10 a los jugadores.
          </p>
        </div>

        {/* Marcador */}
        {currentMatch.scoreA !== undefined && currentMatch.scoreB !== undefined ? (
          <div className="bg-neutral-950 border border-neutral-800 px-6 py-4 rounded-3xl text-center shadow-lg">
            <span className="text-[10px] text-neutral-400 uppercase font-black block mb-1">Resultado Final</span>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-blue-400">{currentMatch.scoreA}</span>
              <span className="text-sm font-bold text-neutral-500">VS</span>
              <span className="text-3xl font-black text-red-400">{currentMatch.scoreB}</span>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-950 border border-neutral-800 px-5 py-3 rounded-2xl text-center">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Formato</span>
            <span className="text-lg font-black text-amber-400">{currentMatch.format} vs {currentMatch.format}</span>
          </div>
        )}
      </div>

      {/* Alineaciones Equipo A vs Equipo B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipo A */}
        <div className="bg-neutral-900 border border-blue-500/30 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-neutral-800">
            <h3 className="font-black text-lg text-blue-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Equipo A ({teamAPlayers.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {teamAPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-900 border border-neutral-700 flex-shrink-0">
                    <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">
                      {player.name} {player.isGuest && <span className="text-neutral-400 font-normal">(invitado)</span>}
                    </span>
                    <span className="text-[10px] text-neutral-500">Valor: {player.currentPrice}M€</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg text-xs font-bold text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {player.averageRating}
                </div>
              </div>
            ))}
            {teamAPlayers.length === 0 && (
              <p className="p-4 text-center text-xs text-neutral-500 italic">No hay jugadores asignados al Equipo A.</p>
            )}
          </div>
        </div>

        {/* Equipo B */}
        <div className="bg-neutral-900 border border-red-500/30 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-neutral-800">
            <h3 className="font-black text-lg text-red-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              Equipo B ({teamBPlayers.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {teamBPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-900 border border-neutral-700 flex-shrink-0">
                    <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">
                      {player.name} {player.isGuest && <span className="text-neutral-400 font-normal">(invitado)</span>}
                    </span>
                    <span className="text-[10px] text-neutral-500">Valor: {player.currentPrice}M€</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg text-xs font-bold text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {player.averageRating}
                </div>
              </div>
            ))}
            {teamBPlayers.length === 0 && (
              <p className="p-4 text-center text-xs text-neutral-500 italic">No hay jugadores asignados al Equipo B.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE VOTACIONES 1 AL 10 */}
      <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-400" />
              Votaciones Post-Partido (Califica del 1 al 10)
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              La media de todos los votos se convertirá en la nota oficial del jugador hasta su próximo partido.
            </p>
          </div>

          {hasVoted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
              <CheckCircle className="h-3.5 w-3.5" />
              Tus votos han sido guardados
            </span>
          )}
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold text-center">
            {successMsg}
          </div>
        )}

        {matchAttendees.length === 0 ? (
          <p className="p-6 text-center text-xs text-neutral-500 italic">
            El administrador debe convocar a los jugadores del partido para poder votar.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchAttendees.map(player => {
                const currentRating = ratings[player.id] ?? 7;
                return (
                  <div
                    key={player.id}
                    className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-900 border border-neutral-700 flex-shrink-0">
                          <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">
                            {player.name} {player.isGuest && <span className="text-neutral-400 font-normal text-xs">(invitado)</span>}
                          </h4>
                          <span className="text-[10px] text-neutral-500">
                            Nota media actual: <strong className="text-amber-400">{player.averageRating}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Nota asignada */}
                      <div className="flex items-center gap-1 bg-amber-400 text-neutral-950 font-black text-sm px-3 py-1 rounded-xl shadow-sm">
                        <span>{currentRating}</span>
                        <span className="text-[10px] text-neutral-800">/10</span>
                      </div>
                    </div>

                    {/* Selector de calificación 1 al 10 */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={currentRating}
                        onChange={(e) => handleRatingChange(player.id, parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-neutral-500">
                Puntúa el rendimiento general, actitud, paradas o goles de tus amigos.
              </p>
              <button
                onClick={handleSubmitVotes}
                disabled={savingVote}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
              >
                {savingVote ? 'Guardando...' : hasVoted ? 'Actualizar mis Votos' : 'Enviar Calificaciones (1-10)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
