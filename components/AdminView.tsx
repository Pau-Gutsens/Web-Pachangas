"use client";

import React, { useState } from 'react';
import { Player, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { ShieldAlert, PlusCircle, Clock, Calendar, Users, Award, UserPlus, CheckCircle } from 'lucide-react';

export default function AdminView({
  players,
  onRefresh
}: {
  players: Player[];
  onRefresh: () => void;
}) {
  const matches = egolDb.getMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || '');

  // Formulario Crear Partido
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:30');
  const [format, setFormat] = useState(5);

  // Formulario Nuevo Jugador / Invitado
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  // Acta del partido
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [matchStats, setMatchStats] = useState<Record<string, {
    goals: number;
    assists: number;
    ownGoals: number;
    saves: number;
    goalsAgainst: number;
  }>>({});

  const currentMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const created = egolDb.createMatch({ date, startTime, endTime, format });
    setSelectedMatchId(created.id);
    onRefresh();
    alert('Partido creado con éxito.');
  };

  const handleAddPlayerToTeam = (playerId: string, team: 'A' | 'B') => {
    if (!currentMatch) return;
    const teamA = currentMatch.teamA || [];
    const teamB = currentMatch.teamB || [];

    let newA = teamA.filter(id => id !== playerId);
    let newB = teamB.filter(id => id !== playerId);

    if (team === 'A') newA.push(playerId);
    if (team === 'B') newB.push(playerId);

    egolDb.updateMatchTeams(currentMatch.id, newA, newB);
    onRefresh();
  };

  const handleRemoveFromMatch = (playerId: string) => {
    if (!currentMatch) return;
    const newA = (currentMatch.teamA || []).filter(id => id !== playerId);
    const newB = (currentMatch.teamB || []).filter(id => id !== playerId);
    egolDb.updateMatchTeams(currentMatch.id, newA, newB);
    onRefresh();
  };

  const handleCreateNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    egolDb.addPlayer(newPlayerName.trim(), isGuest);
    setNewPlayerName('');
    setIsGuest(false);
    onRefresh();
    alert('Jugador registrado en el sistema.');
  };

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists' | 'ownGoals' | 'saves' | 'goalsAgainst', value: number) => {
    setMatchStats(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0 }),
        [field]: Math.max(0, value)
      }
    }));
  };

  const handleSaveActa = () => {
    if (!currentMatch) return;
    if (!confirm('¿Deseas cerrar el partido y publicar el acta con estas estadísticas? Se actualizarán los precios y se abrirán las votaciones 1-10.')) {
      return;
    }

    const res = egolDb.recordMatchActa(currentMatch.id, scoreA, scoreB, matchStats);
    if (res.success) {
      alert('¡Acta publicada con éxito! Puntos sumados y votaciones 1-10 abiertas.');
      onRefresh();
    }
  };

  const currentMatchPlayers = players.filter(p => currentMatch && [...(currentMatch.teamA || []), ...(currentMatch.teamB || [])].includes(p.id));

  return (
    <div className="space-y-8 text-white max-w-5xl mx-auto">
      {/* Header Admin */}
      <div className="bg-red-950/40 border border-red-500/30 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1.5 w-fit">
            <ShieldAlert className="h-3.5 w-3.5" />
            Acceso Exclusivo de Administrador (Pau)
          </span>
          <h2 className="text-2xl font-black mt-2 text-white">Panel de Control EGOL</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Crea partidos con horario, convoca los equipos y rellena el acta estadística post-partido.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. CREAR NUEVO PARTIDO CON HORARIO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-black text-amber-400 flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-amber-400" />
            1. Crear Partido con Horario
          </h3>

          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Fecha del Partido
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Hora Inicio
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Hora Fin (Votaciones)
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Formato del Partido
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(parseInt(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
              >
                <option value={5}>Fútbol 5 (5 vs 5)</option>
                <option value={6}>Fútbol 6 (6 vs 6)</option>
                <option value={7}>Fútbol 7 (7 vs 7)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase transition shadow-sm"
            >
              Publicar Partido
            </button>
          </form>
        </div>

        {/* 2. REGISTRAR JUGADOR O INVITADO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-black text-amber-400 flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-amber-400" />
            2. Añadir Jugador o Invitado
          </h3>

          <form onSubmit={handleCreateNewPlayer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Nombre del Jugador
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Marcos, David, etc..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isGuest"
                checked={isGuest}
                onChange={(e) => setIsGuest(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <label htmlFor="isGuest" className="text-xs font-semibold text-neutral-300 cursor-pointer">
                Es un <strong>Invitado</strong> (se añadirá automáticamente <em>(invitado)</em> al lado de su nombre)
              </label>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Todos los jugadores empiezan con un valor base de 20M€ y están disponibles en el mercado.
            </p>

            <button
              type="submit"
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-black rounded-xl text-xs uppercase transition"
            >
              + Añadir al Sistema (20M€)
            </button>
          </form>
        </div>
      </div>

      {/* 3. CONVOCATORIAS Y ASIGNACIÓN EQUIPOS (A vs B) */}
      {currentMatch && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                3. Convocatoria del Partido ({currentMatch.date})
              </h3>
              <p className="text-xs text-neutral-400">
                Horario: {currentMatch.startTime} a {currentMatch.endTime} | Formato: {currentMatch.format} vs {currentMatch.format}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Seleccionar Partido:</span>
              <select
                value={currentMatch.id}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-white text-xs p-2 rounded-xl focus:outline-none"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.date} ({m.startTime} - {m.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de selección de jugadores para convocar */}
          <div>
            <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">
              Toca para convocar a un equipo:
            </h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {players.map(p => {
                const inA = currentMatch.teamA?.includes(p.id);
                const inB = currentMatch.teamB?.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                      inA ? 'bg-blue-950/80 border-blue-500/50 text-blue-300' :
                      inB ? 'bg-red-950/80 border-red-500/50 text-red-300' :
                      'bg-neutral-950 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <span>{p.name} {p.isGuest && <span className="text-[10px] text-neutral-400">(invitado)</span>}</span>
                    <div className="flex items-center gap-1 ml-1 border-l border-neutral-700/80 pl-1.5">
                      <button
                        onClick={() => handleAddPlayerToTeam(p.id, 'A')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${inA ? 'bg-blue-600 text-white' : 'hover:bg-blue-600 hover:text-white'}`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => handleAddPlayerToTeam(p.id, 'B')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${inB ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'}`}
                      >
                        B
                      </button>
                      {(inA || inB) && (
                        <button
                          onClick={() => handleRemoveFromMatch(p.id)}
                          className="text-neutral-500 hover:text-red-400 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. ACTA DEL PARTIDO: SIN CHECKBOX DE PORTERO */}
          <div className="pt-6 border-t border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  4. Acta del Partido (Goles, Paradas, Asistencias)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cualquier jugador puede tener paradas o goles encajados (sin restricción de portero).
                </p>
              </div>

              {/* Marcador final */}
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-2 rounded-2xl">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-blue-400 block">Equipo A</span>
                  <input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                    className="w-14 bg-neutral-900 border border-neutral-700 text-center font-black text-white text-lg rounded-xl p-1"
                  />
                </div>
                <span className="font-black text-neutral-500 text-xs">-</span>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-red-400 block">Equipo B</span>
                  <input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                    className="w-14 bg-neutral-900 border border-neutral-700 text-center font-black text-white text-lg rounded-xl p-1"
                  />
                </div>
              </div>
            </div>

            {/* Tabla de Jugadores Convocados */}
            {currentMatchPlayers.length === 0 ? (
              <p className="p-4 text-center text-xs text-neutral-500 italic">
                Convoca al menos un jugador a los equipos para rellenar el acta.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-950 text-neutral-400 uppercase font-black border-b border-neutral-800">
                      <th className="p-3">Jugador</th>
                      <th className="p-3 text-center">Goles ⚽</th>
                      <th className="p-3 text-center">Asistencias 👟</th>
                      <th className="p-3 text-center">Paradas 🧤</th>
                      <th className="p-3 text-center">Goles Encajados 🥅</th>
                      <th className="p-3 text-center">Autogol ❌</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {currentMatchPlayers.map(player => {
                      const st = matchStats[player.id] || { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0 };
                      const team = currentMatch.teamA?.includes(player.id) ? 'Equipo A' : 'Equipo B';

                      return (
                        <tr key={player.id} className="hover:bg-neutral-800/30">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span>{player.name} {player.isGuest && <span className="text-neutral-400 font-normal">(invitado)</span>}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              team === 'Equipo A' ? 'bg-blue-950 text-blue-400' : 'bg-red-950 text-red-400'
                            }`}>
                              {team}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.goals}
                              onChange={(e) => updatePlayerStat(player.id, 'goals', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-amber-400 font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.assists}
                              onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-indigo-400 font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.saves}
                              onChange={(e) => updatePlayerStat(player.id, 'saves', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-emerald-400 font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.goalsAgainst}
                              onChange={(e) => updatePlayerStat(player.id, 'goalsAgainst', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-red-400 font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.ownGoals}
                              onChange={(e) => updatePlayerStat(player.id, 'ownGoals', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-red-500 font-bold p-1 rounded-lg"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={handleSaveActa}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
            >
              Publicar Acta y Abrir Votaciones (1-10)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

