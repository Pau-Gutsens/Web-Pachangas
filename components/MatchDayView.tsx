"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, Player, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { Calendar, Clock, Star, CheckCircle, Award, ChevronDown, ChevronUp, Users, ArrowUp, ArrowDown, HelpCircle, AlertCircle, Flame, Play, Undo2, XCircle, ShieldAlert } from 'lucide-react';

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
  const [orderedRanking, setOrderedRanking] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [savingVote, setSavingVote] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Petición de corrección (ventana de 24h)
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionDesc, setCorrectionDesc] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionMsg, setCorrectionMsg] = useState('');

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

  // Partido activo que se vaya a celebrar o esté en votación/juego/verificación
  const activeMatch = matches.find(m => m.status === 'upcoming' || m.status === 'live' || m.status === 'closed' || m.status === 'voting');

  // Historial de partidos (únicamente partidos finalizados con acta publicada, nunca cancelados)
  const historyMatches = matches.filter(m => m.id !== activeMatch?.id && m.status !== 'cancelled' && (m.status === 'scored' || m.status === 'published'));

  // Modo Directo (Accesible para todos durante el partido en juego)
  const [directGoalModal, setDirectGoalModal] = useState<{ team: 'A' | 'B'; scorerId?: string; step: 'scorer' | 'assist' } | null>(null);
  const [directOwnGoalModal, setDirectOwnGoalModal] = useState(false);
  const [directSaveModal, setDirectSaveModal] = useState(false);
  const [isEventLoading, setIsEventLoading] = useState(false);

  // Botón único para iniciar partido (admin) o cerrar sesión (todos)
  const handleStartMatchLive = async () => {
    if (!activeMatch) return;

    // Verificar si el usuario está vinculado a un jugador
    const userLinkedPlayerId = (user?.linkStatus === 'approved' && user?.linkedPlayerId) ? user.linkedPlayerId : null;

    if (!user || !userLinkedPlayerId) {
      alert('Para activar el modo directo, necesitas iniciar sesión con tu cuenta vinculada.');
      onOpenAuth();
      return;
    }

    try {
      // Verificar si el jugador está convocado en este partido
      const allConvocados = [...(activeMatch.teamA || []), ...(activeMatch.teamB || [])];
      if (!allConvocados.includes(userLinkedPlayerId)) {
        alert('Tu jugador no está convocado en este partido. El administrador lo habrá de añadir manualmente.');
        return;
      }

      // Registrar el gol automáticamente
      await egolDb.addMatchEvent(activeMatch.id, {
        type: 'goal',
        team: activeMatch.teamA?.includes(userLinkedPlayerId) ? 'A' : 'B',
        playerId: userLinkedPlayerId,
        createdByUserId: user.id,
        createdByUsername: user.username,
        deviceTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      alert('¡Partido en vivo! Tu jugador ha marcado el primer gol.');
      await loadMatches();
    } catch (e) {
      console.error(e);
      alert('Error al iniciar partido.');
    }
  };

  // El botón de "Finalizar Partido" se eliminó del panel admin
  const handleFinishMatch = async () => {
    if (!activeMatch) return;
    try {
      await egolDb.finishMatchForVerification(activeMatch.id);
      alert('Partido finalizado y enviado a verificación.');
      await loadMatches();
    } catch (e) {
      console.error(e);
      alert('Error al finalizar el partido.');
    }
  };

  // Registro de eventos individual se mantiene para debugging pero con lógica simplificada
  const handleRecordGoal = async (scorerId: string, assistantId?: string) => {
    if (!activeMatch || !directGoalModal) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    setIsEventLoading(true);
    try {
      const res = await egolDb.addMatchEvent(activeMatch.id, {
        type: 'goal',
        team: 'A' as 'A' | 'B', // DirectGoalModal.team se usa como referencia
        playerId: scorerId,
        assistantId: assistantId || undefined,
        createdByUserId: user.id,
        createdByUsername: user.username,
        deviceTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      if (res.success) {
        setDirectGoalModal(null);
        await loadMatches();
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
    if (!activeMatch) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    setIsEventLoading(true);
    try {
      const isTeamA = activeMatch.teamA?.includes(playerId);
      const res = await egolDb.addMatchEvent(activeMatch.id, {
        type: 'own_goal',
        team: isTeamA ? 'A' : 'B',
        playerId,
        createdByUserId: user.id,
        createdByUsername: user.username,
        deviceTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      if (res.success) {
        setDirectOwnGoalModal(false);
        await loadMatches();
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
    if (!activeMatch) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    setIsEventLoading(true);
    try {
      const isTeamA = activeMatch.teamA?.includes(playerId);
      const res = await egolDb.addMatchEvent(activeMatch.id, {
        type: 'save',
        team: isTeamA ? 'A' : 'B',
        playerId,
        createdByUserId: user.id,
        createdByUsername: user.username,
        deviceTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      if (res.success) {
        setDirectSaveModal(false);
        await loadMatches();
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
    if (!activeMatch) return;
    if (!confirm('¿Deshacer el último evento registrado?')) return;
    setIsEventLoading(true);
    try {
      const res = await egolDb.undoLastMatchEvent(activeMatch.id);
      if (res.success) {
        await loadMatches();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al deshacer evento.');
    } finally {
      setIsEventLoading(false);
    }
  };

  const handleCancelMatch = async () => {
    if (!activeMatch) return;
    if (!confirm('¿Seguro que quieres cancelar este partido? El mercado y las alineaciones se desbloquearán inmediatamente.')) return;
    try {
      const matchIdToCancel = activeMatch.id;
      const res = await egolDb.cancelMatch(matchIdToCancel);
      if (res.success) {
        alert(res.message);
        setMatches(prev => prev.filter(m => m.id !== matchIdToCancel));
        await loadMatches();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error al cancelar partido.');
    }
  };

  const userLinkedPlayerId = (user?.linkStatus === 'approved' && user?.linkedPlayerId) ? user.linkedPlayerId : null;
  const allConvocados = activeMatch ? [...(activeMatch.teamA || []), ...(activeMatch.teamB || [])] : [];
  const isConvoked = userLinkedPlayerId ? allConvocados.includes(userLinkedPlayerId) : false;
  const otherConvocados = allConvocados.filter(id => id !== userLinkedPlayerId);

  // Cargar ranking previo o inicializar con los demás participantes
  useEffect(() => {
    if (!activeMatch || activeMatch.status !== 'voting' || !user || !userLinkedPlayerId || !isConvoked) {
      return;
    }

    const fetchRanking = async () => {
      try {
        const existing = await egolDb.getRankingVoteForUser(activeMatch.id, userLinkedPlayerId);
        if (existing && existing.length > 0) {
          // Filtrar por si alguien ya no estuviera convocado y añadir los que falten
          const validExisting = existing.filter(id => otherConvocados.includes(id));
          const missing = otherConvocados.filter(id => !validExisting.includes(id));
          setOrderedRanking([...validExisting, ...missing]);
          setHasVoted(true);
        } else {
          setOrderedRanking([...otherConvocados]);
          setHasVoted(false);
        }
      } catch (e) {
        console.error('Error fetching ranking vote:', e);
        setOrderedRanking([...otherConvocados]);
      }
    };

    fetchRanking();
    setSuccessMsg('');
  }, [activeMatch?.id, activeMatch?.status, user?.id, userLinkedPlayerId, isConvoked]);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setOrderedRanking(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index >= orderedRanking.length - 1) return;
    setOrderedRanking(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleSubmitRanking = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!userLinkedPlayerId || !isConvoked) {
      alert('Solo los jugadores convocados con cuenta vinculada pueden votar.');
      return;
    }
    if (!activeMatch) return;

    setSavingVote(true);
    try {
      const res = await egolDb.submitRankingVote(activeMatch.id, userLinkedPlayerId, orderedRanking);
      if (res.success) {
        setHasVoted(true);
        setSuccessMsg(res.message);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error al guardar el ranking.');
    } finally {
      setSavingVote(false);
    }
  };

  const handleSendCorrection = async () => {
    if (!user || !userLinkedPlayerId || !activeMatch) return;
    if (!correctionDesc.trim()) {
      alert('Escribe los detalles de la corrección.');
      return;
    }

    setSavingCorrection(true);
    try {
      const res = await egolDb.submitCorrectionRequest(
        activeMatch.id,
        user.id,
        userLinkedPlayerId,
        correctionDesc.trim()
      );
      if (res.success) {
        setCorrectionMsg(res.message);
        setCorrectionDesc('');
        setTimeout(() => setShowCorrectionForm(false), 2000);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Error al enviar corrección.');
    } finally {
      setSavingCorrection(false);
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
      {/* 1. SECCIÓN: PARTIDO ACTIVO / PRÓXIMO PARTIDO */}
      {activeMatch ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          {/* Cabecera del partido activo */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 border-b border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                activeMatch.status === 'live'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                  : activeMatch.status === 'closed'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : activeMatch.status === 'voting'
                  ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {activeMatch.status === 'live'
                  ? '● En Juego'
                  : activeMatch.status === 'closed'
                  ? '📋 Verificación de Acta'
                  : activeMatch.status === 'voting'
                  ? '⭐ Votaciones Abiertas (48h)'
                  : 'Próximo Encuentro'}
              </span>

              <span className="text-xs text-neutral-400 font-semibold">
                Formato libre ({activeMatch.teamA?.length || 0} vs {activeMatch.teamB?.length || 0})
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

              {/* Marcador en vivo */}
              <div className="flex items-center gap-3 self-start sm:self-auto bg-neutral-950 border border-neutral-800 px-5 py-2.5 rounded-2xl font-black shadow-inner">
                <div className="text-center">
                  <span className="text-[10px] text-blue-400 uppercase font-black block">Eq. A</span>
                  <span className="text-2xl sm:text-3xl text-white">{activeMatch.scoreA ?? 0}</span>
                </div>
                <span className="text-neutral-600 text-xs font-black uppercase px-1">VS</span>
                <div className="text-center">
                  <span className="text-[10px] text-red-400 uppercase font-black block">Eq. B</span>
                  <span className="text-2xl sm:text-3xl text-white">{activeMatch.scoreB ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BANNER / CONTROLES CUANDO EL PARTIDO ES UPCOMING */}
          {activeMatch.status === 'upcoming' && (
            <div className="p-4 sm:p-5 bg-neutral-950/90 border-b border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Partido Programado
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  El mercado y las alineaciones permanecen abiertos. El modo directo y los bloqueos se activarán cuando comience el encuentro.
                </p>
              </div>

              {user?.role === 'admin' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleStartMatchLive}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Comenzar Partido (Poner En Juego)
                  </button>

                  <button
                    onClick={handleCancelMatch}
                    className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    title="Cancela este partido y desbloquea el mercado y las alineaciones"
                  >
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                    Cancelar Partido
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BANNER CUANDO EL PARTIDO ESTÁ EN FASE DE VERIFICACIÓN (CLOSED) */}
          {activeMatch.status === 'closed' && (
            <div className="p-4 sm:p-5 bg-purple-950/30 border-b border-purple-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-purple-200">
                    Partido Finalizado — Acta en Verificación
                  </h3>
                  <p className="text-purple-300/80 mt-0.5 text-xs">
                    El modo directo se ha cerrado. El administrador está revisando los goles, asistencias y salvadas registradas para verificar su validez antes de abrir las votaciones.
                  </p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <span className="bg-purple-500/20 text-purple-300 font-bold px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs">
                  Revisa los eventos en el Panel de Admin
                </span>
              )}
            </div>
          )}

          {/* MODO DIRECTO EN VIVO — ACCESIBLE PARA TODOS LOS USUARIOS CUANDO EL PARTIDO ESTÁ EN JUEGO */}
          {activeMatch.status === 'live' && (
            <div className="p-4 sm:p-5 bg-neutral-950/90 border-b border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Modo Directo (Apuntar en Vivo)
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/30 animate-pulse">
                        En Juego
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Cualquier jugador puede apuntar goles y salvadas. Cada acción se registra con tu usuario y la hora del móvil para su posterior verificación.
                    </p>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleFinishMatch}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>⏹ Finalizar Partido (Pasar a Verificación)</span>
                    </button>

                    <button
                      onClick={handleCancelMatch}
                      className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Cancela este partido y desbloquea el mercado y las alineaciones"
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* BOTONES GIGANTES DE GOL (MODO DIRECTO) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setDirectGoalModal({ team: 'A', step: 'scorer' })}
                  disabled={isEventLoading}
                  className="py-3.5 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>⚽ Gol Equipo A ({activeMatch.teamA?.length || 0})</span>
                </button>

                <button
                  onClick={() => setDirectGoalModal({ team: 'B', step: 'scorer' })}
                  disabled={isEventLoading}
                  className="py-3.5 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>⚽ Gol Equipo B ({activeMatch.teamB?.length || 0})</span>
                </button>
              </div>

              {/* ACCIONES SECUNDARIAS (AUTOGOL, SALVADA, DESHACER) */}
              <div className="flex flex-wrap gap-2 pt-1 items-center">
                <button
                  onClick={() => setDirectOwnGoalModal(true)}
                  disabled={isEventLoading}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>❌ Autogol</span>
                </button>

                <button
                  onClick={() => setDirectSaveModal(true)}
                  disabled={isEventLoading}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🧤 Salvada (+2 pts, máx 3)</span>
                </button>

                <button
                  onClick={handleUndoEvent}
                  disabled={isEventLoading || !activeMatch.events || activeMatch.events.length === 0}
                  className={`ml-auto px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    activeMatch.events && activeMatch.events.length > 0
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600 shadow-sm cursor-pointer'
                      : 'bg-neutral-950 text-neutral-600 border-neutral-800 cursor-not-allowed'
                  }`}
                  title="Deshacer el último gol o evento apuntado"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Deshacer Último ({activeMatch.events?.length || 0})</span>
                </button>
              </div>

              {/* MODAL DIRECTO GOL (2 TOQUES: GOLEADOR + ASISTENCIA) */}
              {directGoalModal && (
                <div className="p-4 bg-neutral-900 border border-amber-400/40 rounded-2xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black text-xs sm:text-sm text-amber-400 uppercase">
                      {directGoalModal.step === 'scorer'
                        ? `⚽ ¿Quién marcó para el Equipo ${directGoalModal.team}?`
                        : `👟 ¿Quién dio la asistencia?`}
                    </span>
                    <button
                      onClick={() => setDirectGoalModal(null)}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                    >
                      Cancelar ✕
                    </button>
                  </div>

                  {directGoalModal.step === 'scorer' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(() => {
                        const teamFilter = directGoalModal.team === 'A' ? activeMatch.teamA : activeMatch.teamB;
                        const available = teamFilter && teamFilter.length > 0
                          ? players.filter(p => teamFilter.includes(p.id))
                          : players;
                        return available.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setDirectGoalModal(prev => prev ? { ...prev, scorerId: p.id, step: 'assist' } : null)}
                            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
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
                          const teamFilter = directGoalModal.team === 'A' ? activeMatch.teamA : activeMatch.teamB;
                          const availableAssist = teamFilter && teamFilter.length > 0
                            ? players.filter(p => teamFilter.includes(p.id) && p.id !== directGoalModal.scorerId)
                            : players.filter(p => p.id !== directGoalModal.scorerId);
                          return availableAssist.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleRecordGoal(directGoalModal.scorerId!, p.id)}
                              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
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
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase transition shadow-md cursor-pointer"
                      >
                        ⚽ Gol sin Asistencia (Jugada Individual)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL AUTOGOL */}
              {directOwnGoalModal && (
                <div className="p-4 bg-neutral-900 border border-red-500/40 rounded-2xl space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black text-xs sm:text-sm text-red-400 uppercase">
                      ❌ ¿Quién cometió el Autogol? (-2 pts para el jugador)
                    </span>
                    <button
                      onClick={() => setDirectOwnGoalModal(false)}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                    >
                      Cancelar ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(() => {
                      const allConvs = [...(activeMatch.teamA || []), ...(activeMatch.teamB || [])];
                      const available = allConvs.length > 0 ? players.filter(p => allConvs.includes(p.id)) : players;
                      return available.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleRecordOwnGoal(p.id)}
                          className="p-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                        >
                          <span className="truncate">{p.name}</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* MODAL SALVADA */}
              {directSaveModal && (
                <div className="p-4 bg-neutral-900 border border-amber-400/40 rounded-2xl space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black text-xs sm:text-sm text-amber-400 uppercase">
                      🧤 ¿Quién realizó la Salvada? (+2 pts, máx 3 por jugador)
                    </span>
                    <button
                      onClick={() => setDirectSaveModal(false)}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                    >
                      Cancelar ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(() => {
                      const allConvs = [...(activeMatch.teamA || []), ...(activeMatch.teamB || [])];
                      const available = allConvs.length > 0 ? players.filter(p => allConvs.includes(p.id)) : players;
                      return available.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleRecordSave(p.id)}
                          className="p-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                        >
                          <span className="truncate">{p.name}</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE EN DIRECTO DE EVENTOS (VISIBLE PARA TODOS) */}
          {activeMatch.events && activeMatch.events.length > 0 && (
            <div className="px-4 py-3 bg-neutral-950/60 border-b border-neutral-800/80">
              <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5 mb-2">
                <Flame className="h-3.5 w-3.5" />
                Línea de Tiempo del Partido ({activeMatch.events.length} acciones)
              </span>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {[...activeMatch.events].reverse().map((ev, i) => {
                  const p = players.find(x => x.id === ev.playerId);
                  const a = ev.assistantId ? players.find(x => x.id === ev.assistantId) : null;
                  return (
                    <div
                      key={ev.id || i}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                        ev.type === 'goal'
                          ? ev.team === 'A'
                            ? 'bg-blue-950/60 border-blue-500/40 text-blue-200'
                            : 'bg-red-950/60 border-red-500/40 text-red-200'
                          : ev.type === 'own_goal'
                          ? 'bg-neutral-900 border-red-500/50 text-red-300'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <span>
                        {ev.type === 'goal' && '⚽'}
                        {ev.type === 'own_goal' && '❌'}
                        {ev.type === 'save' && '🧤'}
                      </span>
                      <span>{p ? p.name : 'Jugador'}</span>
                      {a && <span className="text-[10px] text-neutral-400">(asist. {a.name})</span>}
                      {ev.type === 'own_goal' && <span className="text-[10px] text-red-400">(autogol)</span>}
                      {ev.type === 'save' && <span className="text-[10px] text-amber-400">(salvada)</span>}
                      {ev.createdByUsername && (
                        <span className="text-[9px] text-neutral-400/80 font-normal ml-0.5 border-l border-neutral-700/60 pl-1.5">
                          por {ev.createdByUsername} {ev.deviceTime ? `· ${ev.deviceTime}` : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

            {/* SECCIÓN 6.2: VOTACIÓN POR RANKING ENTRE PARTICIPANTES */}
            {activeMatch.status === 'voting' && (
              <div className="mt-5 bg-neutral-950 border border-neutral-800 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-neutral-800 pb-3">
                  <div>
                    <h4 className="font-black text-sm text-amber-400 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Votación de Participantes (Ranking de Mejor a Peor)
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Ordena a todos los demás participantes de este partido. El 1º es el mejor; el último es el peor. Tu voto es 100% anónimo.
                    </p>
                  </div>
                  {hasVoted && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 self-start sm:self-auto bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Ranking guardado
                    </span>
                  )}
                </div>

                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {successMsg}
                  </div>
                )}

                {!user ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-neutral-400 mb-3">
                      Inicia sesión con tu cuenta vinculada para emitir tu ranking de votos.
                    </p>
                    <button
                      onClick={onOpenAuth}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase transition shadow-md"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                ) : !userLinkedPlayerId || !isConvoked ? (
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-400 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">Votación exclusiva de participantes</span>
                      <span>
                        Solo los futbolistas convocados que jugaron este partido tienen derecho a voto.
                        Tu cuenta {user.linkedPlayerId ? 'está vinculada a un jugador no convocado en este encuentro' : 'no tiene ningún jugador vinculado'}.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {orderedRanking.map((pId, idx) => {
                        const p = players.find(item => item.id === pId);
                        if (!p) return null;
                        const isTeamA = activeMatch.teamA?.includes(pId);

                        return (
                          <div
                            key={pId}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                              idx === 0
                                ? 'bg-amber-500/10 border-amber-400/40'
                                : 'bg-neutral-900 border-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-neutral-950'
                                  : idx === 1
                                  ? 'bg-neutral-300 text-neutral-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {idx + 1}º
                              </span>

                              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                                <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-white truncate">{p.name}</span>
                                  {p.isGuest && (
                                    <span className="text-[10px] text-neutral-500 font-normal">(invitado)</span>
                                  )}
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                    isTeamA ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'
                                  }`}>
                                    {isTeamA ? 'Equipo A' : 'Equipo B'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-neutral-400">
                                  {idx === 0 ? '⭐ Mejor del partido (Top 1)' : idx === orderedRanking.length - 1 ? 'Última posición' : `Posición ${idx + 1}`}
                                </span>
                              </div>
                            </div>

                            {/* Botones para subir / bajar */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => moveUp(idx)}
                                disabled={idx === 0}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                                  idx === 0
                                    ? 'bg-neutral-950 text-neutral-700 cursor-not-allowed'
                                    : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400'
                                }`}
                                title="Subir de puesto"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => moveDown(idx)}
                                disabled={idx === orderedRanking.length - 1}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                                  idx === orderedRanking.length - 1
                                    ? 'bg-neutral-950 text-neutral-700 cursor-not-allowed'
                                    : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400'
                                }`}
                                title="Bajar de puesto"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-[11px] text-neutral-500">
                        {orderedRanking.length} participantes ordenados · Cada posición debe ser única y sin vacíos.
                      </span>

                      <button
                        onClick={handleSubmitRanking}
                        disabled={savingVote}
                        className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md"
                      >
                        {savingVote ? 'Guardando ranking...' : hasVoted ? 'Actualizar mi ranking' : 'Enviar mi ranking'}
                      </button>
                    </div>

                    {/* VENTANA DE CORRECCIÓN (SECCIÓN 5) */}
                    <div className="mt-6 pt-4 border-t border-neutral-800/80">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                          className="text-xs text-amber-400 hover:underline flex items-center gap-1.5 font-bold"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          ¿Tus estadísticas de este partido no son correctas? Pedir corrección (24h)
                        </button>
                      </div>

                      {showCorrectionForm && (
                        <div className="mt-3 p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                          <p className="text-[11px] text-neutral-400">
                            Describe qué dato falta o es erróneo en el acta (ej: "di una asistencia en el segundo gol", "el autogol fue del rival"). El administrador lo revisará.
                          </p>
                          <textarea
                            value={correctionDesc}
                            onChange={(e) => setCorrectionDesc(e.target.value)}
                            placeholder="Detalles de la corrección..."
                            rows={2}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-lg text-xs focus:ring-1 focus:ring-amber-400"
                          />
                          {correctionMsg && (
                            <p className="text-xs text-emerald-400 font-bold">{correctionMsg}</p>
                          )}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowCorrectionForm(false)}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSendCorrection}
                              disabled={savingCorrection}
                              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-lg text-xs uppercase transition"
                            >
                              {savingCorrection ? 'Enviando...' : 'Enviar petición'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

      {/* 2. SECCIÓN: HISTORIAL DE PARTIDOS */}
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
                  {/* Fila principal del historial: SOLO día, mes y hora del partido */}
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

                  {/* Detalle expandido: SOLO AL TOCAR */}
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
                                  <th className="py-2 px-2 text-center">Salvada</th>
                                  <th className="py-2 px-2 text-center">Nota ⭐</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-800">
                                {allMatchPlayers.map(player => {
                                  const st = m.playerStats?.[player.id] || { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
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
                                      <td className="py-2 px-2 text-center font-bold text-neutral-300">
                                        {(st.saves || 0) > 0 ? <span className="text-amber-300">🧤 {st.saves}</span> : '0'}
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
