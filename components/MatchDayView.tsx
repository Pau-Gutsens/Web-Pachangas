"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, Player, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { Calendar, Clock, Star, CheckCircle, Award } from 'lucide-react';

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

  useEffect(() => {
    if (!selectedMatch || !user) return;
    const existing = egolDb.getUserRatingsForMatch(selectedMatch.id, user.username);
    if (Object.keys(existing).length > 0) {
      setRatings(existing);
      setHasVoted(true);
    } else {
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
    if (!user) { onOpenAuth(); return; }
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center max-w-lg mx-auto text-white">
        <Calendar className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-1">No hay partidos programados</h3>
      </div>
    );
  }

  const currentMatch = selectedMatch || matches[0];
  const teamAPlayers = players.filter(p => currentMatch.teamA?.includes(p.id));
  const teamBPlayers = players.filter(p => currentMatch.teamB?.includes(p.id));
  const matchAttendees = [...teamAPlayers, ...teamBPlayers];

  // Hay partidos previos jugados (scored/voting) ANTES del partido actual
  const hasPlayedMatches = matches.some(m =>
    (m.status === 'voting' || m.status === 'scored') && m.id !== currentMatch.id
  );

  const statusLabel = currentMatch.status === 'voting'
    ? 'Votaciones abiertas'
    : currentMatch.status === 'scored'
    ? 'Finalizado'
    : 'Programado';

  return (
    <div className="space-y-6 text-white">
      {/* Cabecera del Partido */}
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {currentMatch.date
              ? new Date(currentMatch.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Fecha pendiente'}
          </span>
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {currentMatch.startTime || '17:00'} – {currentMatch.endTime || '18:30'}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            currentMatch.status === 'voting' ? 'bg-amber-500/20 text-amber-400' :
            currentMatch.status === 'scored' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-neutral-800 text-neutral-400'
          }`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-white">Partido de la Jornada</h2>
          {currentMatch.scoreA !== undefined && currentMatch.scoreB !== undefined && (
            <div className="flex items-center gap-3 font-black text-lg">
              <span className="text-blue-400">{currentMatch.scoreA}</span>
              <span className="text-neutral-500 text-sm">vs</span>
              <span className="text-red-400">{currentMatch.scoreB}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selector de partido si hay varios */}
      {matches.length > 1 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-neutral-400 uppercase">Historial de Partidos</span>
          </div>
          <div className="divide-y divide-neutral-800">
            {matches.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition ${
                  m.id === currentMatch.id ? 'bg-neutral-800 font-bold text-white' : 'text-neutral-400 hover:bg-neutral-800/40'
                }`}
              >
                <span>{m.date} ({m.startTime} - {m.endTime})</span>
                <span className={`font-bold ${
                  m.status === 'voting' ? 'text-amber-400' :
                  m.status === 'scored' ? 'text-emerald-400' : 'text-neutral-500'
                }`}>{m.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alineaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equipo A */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800">
            <h3 className="font-black text-sm text-blue-400">Equipo A ({teamAPlayers.length})</h3>
          </div>
          <div className="divide-y divide-neutral-800">
            {teamAPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                    <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    {player.name}
                    {player.isGuest && <span className="text-neutral-500 font-normal ml-1">(invitado)</span>}
                  </span>
                </div>
                {hasPlayedMatches && player.ratingsCount > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {player.averageRating}
                  </span>
                )}
              </div>
            ))}
            {teamAPlayers.length === 0 && (
              <p className="p-4 text-center text-xs text-neutral-500">Sin jugadores asignados.</p>
            )}
          </div>
        </div>

        {/* Equipo B */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800">
            <h3 className="font-black text-sm text-red-400">Equipo B ({teamBPlayers.length})</h3>
          </div>
          <div className="divide-y divide-neutral-800">
            {teamBPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                    <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    {player.name}
                    {player.isGuest && <span className="text-neutral-500 font-normal ml-1">(invitado)</span>}
                  </span>
                </div>
                {hasPlayedMatches && player.ratingsCount > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {player.averageRating}
                  </span>
                )}
              </div>
            ))}
            {teamBPlayers.length === 0 && (
              <p className="p-4 text-center text-xs text-neutral-500">Sin jugadores asignados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Votaciones */}
      {(currentMatch.status === 'voting' || currentMatch.status === 'scored') && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              Calificaciones Post-Partido (1–10)
            </h3>
            {hasVoted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
                Guardado
              </span>
            )}
          </div>

          {successMsg && (
            <div className="mx-4 my-3 p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-bold">
              {successMsg}
            </div>
          )}

          {matchAttendees.length === 0 ? (
            <p className="p-6 text-center text-xs text-neutral-500">
              El administrador debe convocar jugadores para poder votar.
            </p>
          ) : (
            <div>
              <div className="divide-y divide-neutral-800">
                {matchAttendees.map(player => {
                  const currentRating = ratings[player.id] ?? 7;
                  return (
                    <div key={player.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                        <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-white block truncate">
                          {player.name}
                          {player.isGuest && <span className="text-neutral-500 font-normal ml-1">(invitado)</span>}
                        </span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={currentRating}
                          onChange={(e) => handleRatingChange(player.id, parseFloat(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer h-1.5 mt-1.5"
                        />
                      </div>
                      <div className="font-black text-sm text-amber-400 w-8 text-right flex-shrink-0">
                        {currentRating}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-4 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={handleSubmitVotes}
                  disabled={savingVote}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-xs uppercase transition"
                >
                  {savingVote ? 'Guardando...' : hasVoted ? 'Actualizar votos' : 'Enviar calificaciones'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
