"use client";

import React, { useState, useEffect } from 'react';
import { Player, PachangaMatch, UserAccount } from '../types';
import { egolDb } from '../lib/db';
import { ShieldAlert, PlusCircle, Clock, Calendar, Users, Award, UserPlus, CheckCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminView({
  players,
  onRefresh
}: {
  players: Player[];
  onRefresh: () => void;
}) {
  const [matches, setMatches] = useState<PachangaMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);

  const loadData = async () => {
    try {
      const [mData, aData] = await Promise.all([
        egolDb.getMatches(),
        egolDb.getLeaderboard()
      ]);
      setMatches(mData);
      setAccounts(aData);
      if (mData.length > 0 && !selectedMatchId) {
        setSelectedMatchId(mData[0].id);
      }
    } catch (e) {
      console.error(e);
      alert('Error al cargar datos de administración.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
  }>>({});

  const currentMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  useEffect(() => {
    if (currentMatch) {
      setScoreA(currentMatch.scoreA ?? 0);
      setScoreB(currentMatch.scoreB ?? 0);
      const st: any = {};
      const allIds = [...(currentMatch.teamA || []), ...(currentMatch.teamB || [])];
      allIds.forEach(id => {
        const saved = currentMatch.playerStats?.[id];
        st[id] = {
          goals: saved?.goals || 0,
          assists: saved?.assists || 0,
          ownGoals: saved?.ownGoals || 0,
          saves: saved?.saves || 0
        };
      });
      setMatchStats(st);
    }
  }, [currentMatch]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await egolDb.createMatch({ date, startTime, endTime, format });
      await loadData();
      setSelectedMatchId(created.id);
      onRefresh();
      alert('Partido creado con éxito.');
    } catch (e) {
      console.error(e);
      alert('Error al crear el partido.');
    }
  };

  const handleAddPlayerToTeam = async (playerId: string, team: 'A' | 'B') => {
    if (!currentMatch) return;
    const teamA = currentMatch.teamA || [];
    const teamB = currentMatch.teamB || [];

    let newA = teamA.filter(id => id !== playerId);
    let newB = teamB.filter(id => id !== playerId);

    if (team === 'A') newA.push(playerId);
    if (team === 'B') newB.push(playerId);

    try {
      await egolDb.updateMatchTeams(currentMatch.id, newA, newB);
      await loadData();
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al asignar el jugador al equipo.');
    }
  };

  const handleRemoveFromMatch = async (playerId: string) => {
    if (!currentMatch) return;
    const newA = (currentMatch.teamA || []).filter(id => id !== playerId);
    const newB = (currentMatch.teamB || []).filter(id => id !== playerId);

    try {
      await egolDb.updateMatchTeams(currentMatch.id, newA, newB);
      await loadData();
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al quitar al jugador del partido.');
    }
  };

  const handleCreateNewPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    try {
      await egolDb.addPlayer(newPlayerName.trim(), isGuest);
      setNewPlayerName('');
      setIsGuest(false);
      onRefresh();
      alert('Jugador registrado en el sistema.');
    } catch (e) {
      console.error(e);
      alert('Error al registrar nuevo jugador.');
    }
  };

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists' | 'ownGoals' | 'saves', value: number) => {
    setMatchStats(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, assists: 0, ownGoals: 0, saves: 0 }),
        [field]: value
      }
    }));
  };

  // Cuadre automático (Sección 5 de EGOL_FANTASY.md)
  // Goles atribuidos a un equipo + autogoles del rival = marcador del equipo
  const teamAPlayers = currentMatch?.teamA || [];
  const teamBPlayers = currentMatch?.teamB || [];

  const attributedA = teamAPlayers.reduce((sum, id) => sum + (matchStats[id]?.goals || 0), 0) +
                      teamBPlayers.reduce((sum, id) => sum + (matchStats[id]?.ownGoals || 0), 0);

  const attributedB = teamBPlayers.reduce((sum, id) => sum + (matchStats[id]?.goals || 0), 0) +
                      teamAPlayers.reduce((sum, id) => sum + (matchStats[id]?.ownGoals || 0), 0);

  const diffA = scoreA - attributedA;
  const diffB = scoreB - attributedB;
  const isBalanced = diffA === 0 && diffB === 0;

  const handleSaveActa = async () => {
    if (!currentMatch) return;
    if (!isBalanced) {
      alert(`No se puede cerrar el acta: los goles no cuadran con el marcador.\nEquipo A: faltan/sobran ${diffA} goles.\nEquipo B: faltan/sobran ${diffB} goles.`);
      return;
    }

    if (!confirm('¿Deseas cerrar el acta del partido? Se abrirá la fase de votaciones de los convocados y la ventana de corrección.')) {
      return;
    }

    try {
      const res = await egolDb.recordMatchActa(currentMatch.id, scoreA, scoreB, matchStats as any);
      if (res.success) {
        alert('¡Acta guardada con éxito! Se han actualizado las estadísticas del partido.');
        await loadData();
        onRefresh();
      } else {
        alert('Error al registrar el acta.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar el acta del partido.');
    }
  };

  const handleReopenMatch = async () => {
    if (!currentMatch) return;
    if (!confirm('¿Deseas reabrir este partido para corregir el acta? Podrás modificar los eventos y volver a cerrarlo.')) return;
    try {
      const res = await egolDb.reopenMatch(currentMatch.id);
      if (res.success) {
        alert(res.message);
        await loadData();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
      alert('Error al reabrir partido.');
    }
  };

  const handlePublishResults = async () => {
    if (!currentMatch) return;
    if (!confirm('¿Deseas calcular y publicar los resultados oficiales definitivos? Se actualizarán los precios de mercado y los puntos de todos los mánagers.')) return;

    try {
      const res = await egolDb.publishFinalMatchResults(currentMatch.id);
      if (res.success) {
        alert(res.message);
        await loadData();
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al publicar resultados.');
    }
  };

  const handleReviewCorrection = async (corrId: string, status: 'approved' | 'rejected') => {
    if (!currentMatch) return;
    try {
      const res = await egolDb.reviewCorrectionRequest(currentMatch.id, corrId, status);
      if (res.success) {
        await loadData();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLink = async (userId: string, playerId: string | null, status: 'approved' | 'pending' | 'none') => {
    const res = await egolDb.updateAccountLink(userId, playerId, status);
    if (res.success) {
      await loadData();
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  const currentMatchPlayers = players.filter(p => currentMatch && [...(currentMatch.teamA || []), ...(currentMatch.teamB || [])].includes(p.id));

  return (
    <div className="space-y-6 sm:space-y-8 text-white max-w-5xl mx-auto">
      {/* Header Admin */}
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h2 className="text-lg sm:text-xl font-black text-white">Panel de Administración</h2>
        </div>
        <span className="text-xs bg-amber-400/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-400/20">
          Admin: Pagusa (Gutsens)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. CREAR NUEVO PARTIDO CON HORARIO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-amber-400" />
            Crear Partido
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
                Formato estimado (ej. 5v5, 6v6, 7v7)
              </label>
              <input
                type="number"
                min="3"
                max="11"
                value={format}
                onChange={(e) => setFormat(parseInt(e.target.value) || 5)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase transition"
            >
              Publicar Partido
            </button>
          </form>
        </div>

        {/* 2. REGISTRAR JUGADOR O INVITADO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-amber-400" />
            Añadir Jugador
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

            <p className="text-[11px] text-neutral-500">Valor inicial: 20 M€ (20.000 K€). Disponible en el mercado automáticamente.</p>

            <button
              type="submit"
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-black rounded-xl text-xs uppercase transition"
            >
              + Añadir al Sistema
            </button>
          </form>
        </div>
      </div>

      {/* 3. VÍNCULOS CUENTA - JUGADOR (SECCIÓN 2) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Vínculos Cuenta — Jugador de Pachanga
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cada cuenta puede vincularse a un jugador real para tener derecho a voto cuando esté convocado.
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-bold">{accounts.length} cuentas registradas</span>
        </div>

        <div className="divide-y divide-neutral-800/80">
          {accounts.map(acc => {
            const linkedPlayer = players.find(p => p.id === acc.linkedPlayerId);
            const isPagusa = acc.username.toLowerCase() === 'pagusa';

            return (
              <div key={acc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{acc.username}</span>
                  <span className="text-[11px] text-neutral-400">
                    Rol: {acc.role} · Saldo: {acc.budget} K€
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {acc.linkStatus === 'pending' && (
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                      Pendiente de aprobación: {linkedPlayer ? linkedPlayer.name : 'Jugador'}
                    </span>
                  )}
                  {acc.linkStatus === 'approved' && linkedPlayer && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Vinculado a {linkedPlayer.name}
                    </span>
                  )}
                  {(!acc.linkStatus || acc.linkStatus === 'none') && (
                    <span className="text-neutral-500 text-[11px]">Solo fantasy (sin jugador)</span>
                  )}

                  {acc.linkStatus === 'pending' && (
                    <button
                      onClick={() => handleUpdateLink(acc.id, acc.linkedPlayerId || null, 'approved')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase transition"
                    >
                      Aprobar
                    </button>
                  )}

                  {!isPagusa && (
                    <select
                      value={acc.linkedPlayerId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateLink(acc.id, val || null, val ? 'approved' : 'none');
                      }}
                      className="bg-neutral-950 border border-neutral-800 text-white p-1 rounded-lg text-xs"
                    >
                      <option value="">Cambiar vínculo...</option>
                      <option value="">(Desvincular)</option>
                      {players.filter(p => !p.isGuest).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CONVOCATORIAS Y ASIGNACIÓN EQUIPOS (A vs B) */}
      {currentMatch && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-400" />
                Convocatoria — {currentMatch.date}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {currentMatch.startTime} – {currentMatch.endTime} · Formato abierto (desigual permitido)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-400">Partido:</span>
              <select
                value={currentMatch.id}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-white text-xs p-2 rounded-xl focus:outline-none"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.date} ({m.startTime} - {m.endTime}) · {m.status}
                  </option>
                ))}
              </select>

              {(currentMatch.status === 'scored' || currentMatch.status === 'published') && (
                <button
                  onClick={handleReopenMatch}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reabrir Acta
                </button>
              )}

              {currentMatch.status === 'voting' && (
                <button
                  onClick={handlePublishResults}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md"
                >
                  <Award className="h-3.5 w-3.5" />
                  Publicar Resultados Finales
                </button>
              )}
            </div>
          </div>

          {/* Información de fase de votaciones y correcciones */}
          {currentMatch.status === 'voting' && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Award className="h-4 w-4" />
                  Votaciones en curso
                </span>
                <span className="text-neutral-400">
                  {Object.keys(currentMatch.rawVotes || {}).length} rankings emitidos
                </span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                Los convocados tienen 48h para ordenar a los demás jugadores. Cuando hayan votado o finalice el plazo, pulsa "Publicar Resultados Finales" para repartir puntos y actualizar precios.
              </p>
            </div>
          )}

          {/* Peticiones de corrección recibidas (Sección 5) */}
          {currentMatch.corrections && currentMatch.corrections.length > 0 && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Peticiones de Corrección de Jugadores ({currentMatch.corrections.length})
              </h4>
              <div className="divide-y divide-neutral-800">
                {currentMatch.corrections.map(corr => {
                  const p = players.find(item => item.id === corr.playerId);
                  return (
                    <div key={corr.id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <div>
                        <span className="font-bold text-white mr-2">{p ? p.name : corr.playerId}:</span>
                        <span className="text-neutral-300 italic">"{corr.description}"</span>
                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          corr.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          corr.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {corr.status === 'approved' ? 'Aprobada' : corr.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                        </span>
                      </div>
                      {corr.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleReviewCorrection(corr.id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase transition"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleReviewCorrection(corr.id, 'rejected')}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white font-bold rounded-lg text-[10px] uppercase transition"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de selección de jugadores para convocar */}
          <div>
            <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">
              Toca para convocar a un equipo (número libre y desigual permitido):
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

          {/* 5. ACTA DEL PARTIDO CON CUADRE AUTOMÁTICO (SECCIÓN 5) */}
          <div className="pt-6 border-t border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  Acta del Partido
                </h3>
                <p className="text-xs text-neutral-500">
                  Cuadre automático: los goles de cada equipo más los autogoles rivales deben coincidir con el marcador.
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

            {/* Banner de Cuadre Automático */}
            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
              isBalanced ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-red-950/40 border-red-500/40 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {isBalanced ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>
                  {isBalanced
                    ? 'Cuadre perfecto: Los goles y autogoles atribuidos coinciden exactamente con el marcador final.'
                    : `Goles sin cuadrar — Equipo A: ${diffA > 0 ? `faltan ${diffA}` : diffA < 0 ? `sobran ${Math.abs(diffA)}` : 'cuadrado'} · Equipo B: ${diffB > 0 ? `faltan ${diffB}` : diffB < 0 ? `sobran ${Math.abs(diffB)}` : 'cuadrado'}`}
                </span>
              </div>
            </div>

            {/* Tabla de Jugadores Convocados */}
            {currentMatchPlayers.length === 0 ? (
              <p className="p-4 text-center text-xs text-neutral-500 italic">
                Convoca al menos un jugador a los equipos para rellenar el acta.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-950 text-neutral-400 uppercase font-black border-b border-neutral-800">
                      <th className="p-3">Jugador</th>
                      <th className="p-3 text-center">Goles (+3) ⚽</th>
                      <th className="p-3 text-center">Asistencias (+1) 👟</th>
                      <th className="p-3 text-center">Autogol (-2) ❌</th>
                      <th className="p-3 text-center">Salvada (+2, máx 3) 🧤</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {currentMatchPlayers.map(player => {
                      const st = matchStats[player.id] || { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
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
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-white font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.assists}
                              onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-white font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={st.ownGoals}
                              onChange={(e) => updatePlayerStat(player.id, 'ownGoals', parseInt(e.target.value) || 0)}
                              className="w-12 bg-neutral-950 border border-neutral-800 text-center text-white font-bold p-1 rounded-lg"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="3"
                              value={st.saves}
                              onChange={(e) => updatePlayerStat(player.id, 'saves', Math.min(3, parseInt(e.target.value) || 0))}
                              className="w-12 bg-neutral-950 border border-amber-500/40 text-center text-amber-400 font-bold p-1 rounded-lg"
                              title="Salvadas puntuales que evitaron gol claro (máx 3)"
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
              disabled={!isBalanced}
              className={`w-full py-3 font-black rounded-xl text-xs uppercase tracking-wider transition ${
                isBalanced
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isBalanced ? 'Cerrar Acta y Abrir Votaciones' : 'Corrige los goles para que cuadre el acta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
