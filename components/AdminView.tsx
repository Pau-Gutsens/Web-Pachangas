"use client";

import React, { useState, useEffect } from 'react';
import { Player, PachangaMatch, UserAccount, MatchEvent } from '../types';
import { egolDb, isMarketOrLineupLocked } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { ShieldAlert, PlusCircle, Clock, Calendar, Users, Award, UserPlus, CheckCircle, RotateCcw, AlertTriangle, ShieldCheck, XCircle, Undo2, Play, Flame, ChevronDown, ChevronUp } from 'lucide-react';

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
      const validMatches = mData.filter(m => m.status !== 'cancelled');
      setMatches(validMatches);
      setAccounts(aData);

      // Solo seleccionar por defecto si hay un partido ACTIVO en curso (upcoming, live o voting)
      const activeMatch = validMatches.find(m => m.status === 'upcoming' || m.status === 'live' || m.status === 'voting');
      if (activeMatch) {
        setSelectedMatchId(activeMatch.id);
      } else if (selectedMatchId && validMatches.some(m => m.id === selectedMatchId)) {
        // Mantener selección manual previa del usuario si sigue existiendo
      } else {
        setSelectedMatchId('');
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

  // Modo Directo (En Vivo)
  const [directGoalModal, setDirectGoalModal] = useState<{ team: 'A' | 'B'; scorerId?: string; step: 'scorer' | 'assist' } | null>(null);
  const [directOwnGoalModal, setDirectOwnGoalModal] = useState(false);
  const [directSaveModal, setDirectSaveModal] = useState(false);
  const [isEventLoading, setIsEventLoading] = useState(false);
  const [showManualTable, setShowManualTable] = useState(false);

  const currentMatch = matches.find(m => m.id === selectedMatchId) || null;

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

  const handleCancelMatch = async () => {
    if (!currentMatch) return;
    const isLocked = isMarketOrLineupLocked([currentMatch]).isLocked;
    const confirmText = isLocked
      ? `¿Estás seguro de que deseas cancelar este partido (${currentMatch.date})?\n\nActualmente está bloqueando el mercado o las alineaciones. Al cancelarlo se desbloquearán inmediatamente.`
      : `¿Estás seguro de que deseas cancelar este partido (${currentMatch.date})?`;

    if (!confirm(confirmText)) return;

    try {
      const matchIdToCancel = currentMatch.id;
      const res = await egolDb.cancelMatch(matchIdToCancel);
      if (res.success) {
        alert(res.message);
        setSelectedMatchId('');
        setMatches(prev => prev.filter(m => m.id !== matchIdToCancel));
        await loadData();
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error al cancelar partido.');
    }
  };

  const handleStartMatchLive = async () => {
    if (!currentMatch) return;
    try {
      await egolDb.setMatchLive(currentMatch.id);
      await loadData();
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al iniciar partido.');
    }
  };

  const handleRecordGoal = async (scorerId: string, assistantId?: string) => {
    if (!currentMatch || !directGoalModal) return;
    setIsEventLoading(true);
    try {
      const targetTeam = directGoalModal.team;
      const teamArr = targetTeam === 'A' ? (currentMatch.teamA || []) : (currentMatch.teamB || []);
      if (!teamArr.includes(scorerId)) {
        await egolDb.addPlayerToMatchTeam(currentMatch.id, scorerId, targetTeam);
      }
      if (assistantId && !teamArr.includes(assistantId)) {
        await egolDb.addPlayerToMatchTeam(currentMatch.id, assistantId, targetTeam);
      }

      const res = await egolDb.addMatchEvent(currentMatch.id, {
        type: 'goal',
        team: directGoalModal.team,
        playerId: scorerId,
        assistantId: assistantId || undefined
      });
      if (res.success) {
        setDirectGoalModal(null);
        await loadData();
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al registrar gol.');
    } finally {
      setIsEventLoading(false);
    }
  };

  const handleRecordOwnGoal = async (playerId: string) => {
    if (!currentMatch) return;
    setIsEventLoading(true);
    try {
      const isTeamA = currentMatch.teamA?.includes(playerId);
      const res = await egolDb.addMatchEvent(currentMatch.id, {
        type: 'own_goal',
        team: isTeamA ? 'A' : 'B',
        playerId
      });
      if (res.success) {
        setDirectOwnGoalModal(false);
        await loadData();
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al registrar autogol.');
    } finally {
      setIsEventLoading(false);
    }
  };

  const handleRecordSave = async (playerId: string) => {
    if (!currentMatch) return;
    setIsEventLoading(true);
    try {
      const isTeamA = currentMatch.teamA?.includes(playerId);
      const res = await egolDb.addMatchEvent(currentMatch.id, {
        type: 'save',
        team: isTeamA ? 'A' : 'B',
        playerId
      });
      if (res.success) {
        setDirectSaveModal(false);
        await loadData();
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al registrar salvada.');
    } finally {
      setIsEventLoading(false);
    }
  };

  const handleUndoEvent = async () => {
    if (!currentMatch) return;
    if (!confirm('¿Deshacer el último evento registrado?')) return;
    setIsEventLoading(true);
    try {
      const res = await egolDb.undoLastMatchEvent(currentMatch.id);
      if (res.success) {
        await loadData();
        onRefresh();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al deshacer evento.');
    } finally {
      setIsEventLoading(false);
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
            const isPagusa = acc.username.toLowerCase() === 'pagusa';
            const gutsensPlayer = players.find(p => p.name.toLowerCase() === 'gutsens');
            const linkedPlayer = players.find(p => p.id === acc.linkedPlayerId) || (isPagusa ? gutsensPlayer : null);
            const isApproved = acc.linkStatus === 'approved' || (isPagusa && linkedPlayer);

            return (
              <div key={acc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{acc.username}</span>
                  <span className="text-[11px] text-neutral-400">
                    Rol: {acc.role} · Saldo: {formatCurrency(acc.budget)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {acc.linkStatus === 'pending' && (
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                      Pendiente de aprobación: {linkedPlayer ? linkedPlayer.name : 'Jugador'}
                    </span>
                  )}
                  {isApproved && linkedPlayer && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Vinculado a {linkedPlayer.name} {isPagusa ? '(Admin)' : ''}
                    </span>
                  )}
                  {(!isApproved && (!acc.linkStatus || acc.linkStatus === 'none' || !linkedPlayer)) && (
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

                  <select
                    value={acc.linkedPlayerId || (isPagusa && gutsensPlayer ? gutsensPlayer.id : '')}
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
                <option value="">(Cerrar selección de partido)</option>
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

              <button
                onClick={handleCancelMatch}
                className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Cancela este partido y desbloquea el mercado y las alineaciones"
              >
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                Cancelar Partido
              </button>
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

          {/* 5. MODO DIRECTO (EN VIVO) Y ACTA DEL PARTIDO (SECCIÓN 5) */}
          <div className="pt-6 border-t border-neutral-800 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-400" />
                  Modo Directo (Apuntar Partido en Vivo)
                </h3>
                <p className="text-xs text-neutral-400">
                  Dos toques por gol (goleador + asistente). Deshacer siempre visible. Sincroniza al instante.
                </p>
              </div>

              {currentMatch.status === 'upcoming' && (
                <button
                  onClick={handleStartMatchLive}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Comenzar Partido (Poner En Juego)
                </button>
              )}
            </div>

            {/* MARCADOR GIGANTE EN DIRECTO */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-inner">
              <div className="grid grid-cols-3 items-center text-center">
                <div>
                  <span className="text-xs font-black uppercase text-blue-400 block mb-1">
                    Equipo A ({currentMatch.teamA?.length || 0})
                  </span>
                  <span className="text-4xl sm:text-6xl font-black text-white">
                    {currentMatch.scoreA ?? scoreA}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border mb-1.5 ${
                    currentMatch.status === 'live'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                      : currentMatch.status === 'voting'
                      ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}>
                    {currentMatch.status === 'live' ? '● En Juego' : currentMatch.status === 'voting' ? 'Votación' : 'Activo'}
                  </span>
                  <span className="text-neutral-600 text-xs font-black uppercase">VS</span>
                </div>

                <div>
                  <span className="text-xs font-black uppercase text-red-400 block mb-1">
                    Equipo B ({currentMatch.teamB?.length || 0})
                  </span>
                  <span className="text-4xl sm:text-6xl font-black text-white">
                    {currentMatch.scoreB ?? scoreB}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTONES GIGANTES DE GOL (MODO DIRECTO) - SOLO SI EL PARTIDO ESTÁ EN CURSO */}
            {(currentMatch.status === 'upcoming' || currentMatch.status === 'live') ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setDirectGoalModal({ team: 'A', step: 'scorer' })}
                    disabled={isEventLoading}
                    className="py-4 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black rounded-2xl text-base uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>⚽ Gol Equipo A</span>
                  </button>

                  <button
                    onClick={() => setDirectGoalModal({ team: 'B', step: 'scorer' })}
                    disabled={isEventLoading}
                    className="py-4 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black rounded-2xl text-base uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>⚽ Gol Equipo B</span>
                  </button>
                </div>

                {/* ACCIONES SECUNDARIAS (AUTOGOL, SALVADA, DESHACER) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setDirectOwnGoalModal(true)}
                    disabled={isEventLoading}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>❌ Autogol</span>
                  </button>

                  <button
                    onClick={() => setDirectSaveModal(true)}
                    disabled={isEventLoading}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>🧤 Salvada (+2 pts, máx 3)</span>
                  </button>

                  <button
                    onClick={handleUndoEvent}
                    disabled={isEventLoading || !currentMatch.events || currentMatch.events.length === 0}
                    className={`ml-auto px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      currentMatch.events && currentMatch.events.length > 0
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600 shadow-sm cursor-pointer'
                        : 'bg-neutral-950 text-neutral-600 border-neutral-800 cursor-not-allowed'
                    }`}
                    title="Deshacer el último gol o evento apuntado"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    <span>Deshacer Último ({currentMatch.events?.length || 0})</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Partido finalizado con resultados oficiales publicados. El modo directo en vivo está cerrado.</span>
                </div>
                <button
                  onClick={handleReopenMatch}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reabrir Acta
                </button>
              </div>
            )}

            {/* MODAL DE REGISTRO DE GOL (2 TOQUES: GOLEADOR + ASISTENCIA) */}
            {directGoalModal && (
              <div className="p-4 bg-neutral-950 border border-amber-400/40 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-black text-sm text-amber-400 uppercase">
                    {directGoalModal.step === 'scorer'
                      ? `⚽ Paso 1: ¿Quién marcó para el Equipo ${directGoalModal.team}?`
                      : `👟 Paso 2: ¿Quién dio la asistencia?`}
                  </span>
                  <button
                    onClick={() => setDirectGoalModal(null)}
                    className="text-neutral-500 hover:text-white text-xs px-2 py-0.5"
                  >
                    Cancelar ✕
                  </button>
                </div>

                {directGoalModal.step === 'scorer' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(() => {
                      const teamFilter = directGoalModal.team === 'A' ? currentMatch.teamA : currentMatch.teamB;
                      const availablePlayers = teamFilter && teamFilter.length > 0
                        ? players.filter(p => teamFilter.includes(p.id))
                        : players;
                      return availablePlayers.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setDirectGoalModal(prev => prev ? { ...prev, scorerId: p.id, step: 'assist' } : null)}
                          className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                            <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="truncate">{p.name}</span>
                        </button>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(() => {
                        const teamFilter = directGoalModal.team === 'A' ? currentMatch.teamA : currentMatch.teamB;
                        const availableAssistants = teamFilter && teamFilter.length > 0
                          ? players.filter(p => teamFilter.includes(p.id) && p.id !== directGoalModal.scorerId)
                          : players.filter(p => p.id !== directGoalModal.scorerId);
                        return availableAssistants.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleRecordGoal(directGoalModal.scorerId!, p.id)}
                            className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                              <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate">{p.name}</span>
                          </button>
                        ));
                      })()}
                    </div>

                    <button
                      onClick={() => handleRecordGoal(directGoalModal.scorerId!, undefined)}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase transition shadow-md"
                    >
                      ⚽ Gol sin Asistencia (Jugada Individual)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MODAL DE AUTOGOL */}
            {directOwnGoalModal && (
              <div className="p-4 bg-neutral-950 border border-red-500/40 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-black text-sm text-red-400 uppercase">
                    ❌ ¿Quién metió el autogol? (Suma gol al rival)
                  </span>
                  <button
                    onClick={() => setDirectOwnGoalModal(false)}
                    className="text-neutral-500 hover:text-white text-xs px-2 py-0.5"
                  >
                    Cancelar ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentMatchPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleRecordOwnGoal(p.id)}
                      className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL DE SALVADA */}
            {directSaveModal && (
              <div className="p-4 bg-neutral-950 border border-amber-500/40 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-black text-sm text-amber-400 uppercase">
                    🧤 ¿Quién hizo la salvada? (Evitó gol claro, máx 3)
                  </span>
                  <button
                    onClick={() => setDirectSaveModal(false)}
                    className="text-neutral-500 hover:text-white text-xs px-2 py-0.5"
                  >
                    Cancelar ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentMatchPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleRecordSave(p.id)}
                      className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TIMELINE DE EVENTOS EN DIRECTO */}
            {currentMatch.events && currentMatch.events.length > 0 && (
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-black uppercase text-neutral-400 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  Eventos del Partido ({currentMatch.events.length})
                </span>
                <div className="divide-y divide-neutral-900 max-h-40 overflow-y-auto">
                  {[...currentMatch.events].reverse().map((ev, idx) => {
                    const p = players.find(item => item.id === ev.playerId);
                    const asst = ev.assistantId ? players.find(item => item.id === ev.assistantId) : null;
                    const num = currentMatch.events!.length - idx;

                    return (
                      <div key={ev.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-neutral-500 font-mono text-[10px]">#{num}</span>
                          <span className="font-bold text-white">
                            {ev.type === 'goal' ? '⚽ Gol de ' : ev.type === 'own_goal' ? '❌ Autogol de ' : '🧤 Salvada de '}
                            {p ? p.name : 'Jugador'}
                          </span>
                          {asst && (
                            <span className="text-neutral-400 text-[11px]">
                              (asistencia: <strong className="text-neutral-200">{asst.name}</strong>)
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          ev.team === 'A' ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          Equipo {ev.team}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BOTÓN PARA FINALIZAR Y CERRAR ACTA */}
            <div className="pt-2">
              <button
                onClick={handleSaveActa}
                disabled={!isBalanced}
                className={`w-full py-3.5 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg ${
                  isBalanced
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isBalanced
                  ? 'Cerrar Acta y Abrir Votaciones (48 Horas)'
                  : `Cuadra los goles para cerrar el acta (${diffA !== 0 ? `Equipo A: ${diffA}` : ''} ${diffB !== 0 ? `Equipo B: ${diffB}` : ''})`}
              </button>
            </div>

            {/* ACORDEÓN PARA TABLA MANUAL DE NÚMEROS */}
            <div className="pt-2">
              <button
                onClick={() => setShowManualTable(!showManualTable)}
                className="w-full py-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 rounded-xl text-xs font-bold text-neutral-400 flex items-center justify-center gap-2 transition"
              >
                <span>{showManualTable ? 'Ocultar tabla manual de números' : 'Ver / Editar tabla manual detallada'}</span>
                {showManualTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showManualTable && (
                <div className="mt-3 space-y-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                  {/* Banner de Cuadre Automático */}
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
                    isBalanced ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-red-950/40 border-red-500/40 text-red-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isBalanced ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <span>
                        {isBalanced
                          ? 'Cuadre perfecto: Los goles y autogoles coinciden con el marcador.'
                          : `Goles sin cuadrar — Equipo A: ${diffA > 0 ? `faltan ${diffA}` : diffA < 0 ? `sobran ${Math.abs(diffA)}` : 'cuadrado'} · Equipo B: ${diffB > 0 ? `faltan ${diffB}` : diffB < 0 ? `sobran ${Math.abs(diffB)}` : 'cuadrado'}`}
                      </span>
                    </div>
                  </div>

                  {currentMatchPlayers.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-900 text-neutral-400 uppercase font-black border-b border-neutral-800">
                            <th className="p-2.5">Jugador</th>
                            <th className="p-2.5 text-center">Goles (+3) ⚽</th>
                            <th className="p-2.5 text-center">Asist (+1) 👟</th>
                            <th className="p-2.5 text-center">Autogol (-2) ❌</th>
                            <th className="p-2.5 text-center">Salvada (máx 3) 🧤</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {currentMatchPlayers.map(player => {
                            const st = matchStats[player.id] || { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
                            const team = currentMatch.teamA?.includes(player.id) ? 'Equipo A' : 'Equipo B';

                            return (
                              <tr key={player.id} className="hover:bg-neutral-900/50">
                                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                                  <span>{player.name} {player.isGuest && <span className="text-neutral-400 font-normal">(invitado)</span>}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    team === 'Equipo A' ? 'bg-blue-950 text-blue-400' : 'bg-red-950 text-red-400'
                                  }`}>
                                    {team}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={st.goals}
                                    onChange={(e) => updatePlayerStat(player.id, 'goals', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-white font-bold p-1 rounded-lg"
                                  />
                                </td>
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={st.assists}
                                    onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-white font-bold p-1 rounded-lg"
                                  />
                                </td>
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={st.ownGoals}
                                    onChange={(e) => updatePlayerStat(player.id, 'ownGoals', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-neutral-900 border border-neutral-800 text-center text-white font-bold p-1 rounded-lg"
                                  />
                                </td>
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={st.saves}
                                    onChange={(e) => updatePlayerStat(player.id, 'saves', Math.min(3, parseInt(e.target.value) || 0))}
                                    className="w-12 bg-neutral-900 border border-amber-500/40 text-center text-amber-400 font-bold p-1 rounded-lg"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Si no hay partido activo seleccionado */}
      {!currentMatch && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-center text-neutral-400 space-y-3">
          <Calendar className="h-9 w-9 text-amber-400 mx-auto opacity-80" />
          <h3 className="font-bold text-sm sm:text-base text-white">No hay ninguna jornada activa pendiente de apuntar</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            El partido del 6 de noviembre ya está finalizado y publicado oficialmente. Crea un nuevo partido con el formulario de arriba cuando vayáis a jugar la siguiente pachanga.
          </p>
          {matches.length > 0 && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Consultar o reabrir acta anterior:</span>
              <select
                value=""
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-white text-xs p-2 rounded-xl focus:outline-none"
              >
                <option value="">Seleccionar partido...</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.date} ({m.startTime} - {m.endTime}) · {m.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
