"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Member } from '../types';
import { Award, CheckCircle, Calculator, AlertTriangle } from 'lucide-react';

interface PlayerRowStat {
  playerId: string;
  name: string;
  team: 'A' | 'B';
  isMember: boolean;
  goals: number;
  assists: number;
  ownGoals: number;
  saves: number;
  goalsAgainst: number;
  isGoalkeeper: boolean;
  isMvp: boolean;
}

export default function StatsRegistration({
  pachangaId,
  members,
  onScored
}: {
  pachangaId: string;
  members?: Member[];
  onScored?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<any>(null);

  // Marcador del partido
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);

  // Filas de estadísticas por jugador
  const [playerRows, setPlayerRows] = useState<PlayerRowStat[]>([]);
  const [resultSummary, setResultSummary] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const d = await db.getPachangaDetails(pachangaId);
        setDetails(d);

        const attendees = d?.pachanga_attendees || [];
        const memberList = members || await db.getMembers();

        // Inicializar filas de jugadores asistentes
        const rows: PlayerRowStat[] = attendees.map((a: any) => {
          const playerId = a.member_id || a.guest_id;
          let name = 'Jugador';
          if (a.member_id) {
            const m = memberList.find(mem => mem.id === a.member_id);
            name = m ? m.name : `Miembro (${a.member_id.substring(0, 4)})`;
          } else if (a.guest_name) {
            name = `${a.guest_name} (Invitado)`;
          } else if (a.guest_id) {
            name = `Invitado (${a.guest_id.substring(0, 4)})`;
          }

          return {
            playerId,
            name,
            team: a.team,
            isMember: Boolean(a.member_id),
            goals: 0,
            assists: 0,
            ownGoals: 0,
            saves: 0,
            goalsAgainst: 0,
            isGoalkeeper: false,
            isMvp: false
          };
        });

        setPlayerRows(rows);

        // Si ya está puntuada, cargar el resultado existente
        if (d?.pachanga_results) {
          setScoreA(d.pachanga_results.score_team_a || 0);
          setScoreB(d.pachanga_results.score_team_b || 0);
          setResultSummary(d.pachanga_results);
        }
      } catch (e) {
        console.error('Error loading stats registration:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [pachangaId, members]);

  const updateStat = (playerId: string, field: keyof PlayerRowStat, value: any) => {
    setPlayerRows(prev => prev.map(row => {
      if (row.playerId !== playerId) return row;
      return { ...row, [field]: value };
    }));
  };

  const handleScoreAndFinish = async () => {
    if (!confirm('¿Deseas calcular las puntuaciones oficiales de la pachanga? Esto actualizará la clasificación general.')) {
      return;
    }

    setSaving(true);
    try {
      // Determinar ganador
      let winner: 'A' | 'B' | 'draw' = 'draw';
      if (scoreA > scoreB) winner = 'A';
      else if (scoreB > scoreA) winner = 'B';

      // Transformar filas a array de stats individuales
      const rawStats: any[] = [];

      playerRows.forEach(row => {
        if (row.goals > 0) {
          rawStats.push({ playerId: row.playerId, type: 'goal', value: row.goals });
        }
        if (row.assists > 0) {
          rawStats.push({ playerId: row.playerId, type: 'assist', value: row.assists });
        }
        if (row.ownGoals > 0) {
          rawStats.push({ playerId: row.playerId, type: 'own_goal', value: row.ownGoals });
        }
        if (row.isGoalkeeper) {
          if (row.saves > 0) {
            rawStats.push({ playerId: row.playerId, type: 'save', value: row.saves, isGoalkeeper: true });
          }
          if (row.goalsAgainst > 0) {
            rawStats.push({ playerId: row.playerId, type: 'goal_against', value: row.goalsAgainst, isGoalkeeper: true });
          }
        }
        if (row.isMvp) {
          rawStats.push({ playerId: row.playerId, type: 'mvp', value: 1 });
        }
      });

      const res = await db.scorePachanga(
        pachangaId,
        { scoreA, scoreB, winner },
        rawStats
      );

      setResultSummary(res);
      alert('¡Pachanga puntuada con éxito! Las puntuaciones del Fantasy han sido registradas.');
      if (onScored) onScored();
    } catch (e: any) {
      alert(`Error al puntuar pachanga: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando datos del partido...</div>;
  }

  const teamAPlayers = playerRows.filter(p => p.team === 'A');
  const teamBPlayers = playerRows.filter(p => p.team === 'B');

  return (
    <div className="mt-8 p-4 md:p-6 border border-gray-200 rounded-xl bg-white shadow-sm text-gray-900">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="h-6 w-6 text-emerald-600" />
          Registro de Estadísticas y Acta del Partido
        </h3>
        <p className="text-sm text-gray-600">
          Introduce el resultado final y los goles/asistencias de cada jugador para calcular automáticamente los puntos del Fantasy.
        </p>
      </div>

      {/* Marcador Final */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
        <h4 className="font-bold text-gray-800 text-center mb-4 uppercase tracking-wider text-xs">
          Resultado Final del Partido
        </h4>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <span className="block font-bold text-blue-900 mb-1">Equipo A</span>
            <input
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 h-16 text-3xl font-black text-center border-2 border-blue-400 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <span className="text-2xl font-black text-gray-400">VS</span>

          <div className="text-center">
            <span className="block font-bold text-red-900 mb-1">Equipo B</span>
            <input
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 h-16 text-3xl font-black text-center border-2 border-red-400 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-3">
          {scoreA > scoreB ? '🏆 Ganador: Equipo A (+1 pto de victoria para sus jugadores)' :
           scoreB > scoreA ? '🏆 Ganador: Equipo B (+1 pto de victoria para sus jugadores)' :
           '🤝 Empate'}
        </p>
      </div>

      {/* Tabla de Jugadores por Equipo */}
      <div className="space-y-6 mb-8">
        {/* Jugadores Equipo A */}
        <div>
          <h5 className="font-bold text-blue-900 mb-2 flex items-center justify-between">
            <span>Jugadores Equipo A ({teamAPlayers.length})</span>
          </h5>
          <div className="border border-blue-100 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50 text-blue-950 font-bold border-b border-blue-100">
                <tr>
                  <th className="p-3">Jugador</th>
                  <th className="p-3 text-center">Goles</th>
                  <th className="p-3 text-center">Asistencias</th>
                  <th className="p-3 text-center">Autogol</th>
                  <th className="p-3 text-center">Portero</th>
                  <th className="p-3 text-center">MVP ⭐</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamAPlayers.map(player => (
                  <tr key={player.playerId} className="hover:bg-blue-50/30">
                    <td className="p-3 font-semibold text-gray-900">{player.name}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={player.goals}
                        onChange={(e) => updateStat(player.playerId, 'goals', parseInt(e.target.value) || 0)}
                        className="w-14 p-1 border rounded text-center bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={player.assists}
                        onChange={(e) => updateStat(player.playerId, 'assists', parseInt(e.target.value) || 0)}
                        className="w-14 p-1 border rounded text-center bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={player.ownGoals}
                        onChange={(e) => updateStat(player.playerId, 'ownGoals', parseInt(e.target.value) || 0)}
                        className="w-14 p-1 border rounded text-center bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={player.isGoalkeeper}
                        onChange={(e) => updateStat(player.playerId, 'isGoalkeeper', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={player.isMvp}
                        onChange={(e) => updateStat(player.playerId, 'isMvp', e.target.checked)}
                        className="h-4 w-4 text-amber-500 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jugadores Equipo B */}
        <div>
          <h5 className="font-bold text-red-900 mb-2 flex items-center justify-between">
            <span>Jugadores Equipo B ({teamBPlayers.length})</span>
          </h5>
          <div className="border border-red-100 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-red-50 text-red-950 font-bold border-b border-red-100">
                <tr>
                  <th className="p-3">Jugador</th>
                  <th className="p-3 text-center">Goles</th>
                  <th className="p-3 text-center">Asistencias</th>
                  <th className="p-3 text-center">Autogol</th>
                  <th className="p-3 text-center">Portero</th>
                  <th className="p-3 text-center">MVP ⭐</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamBPlayers.map(player => (
                  <tr key={player.playerId} className="hover:bg-red-50/30">
                    <td className="p-3 font-semibold text-gray-900">{player.name}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={player.goals}
                        onChange={(e) => updateStat(player.playerId, 'goals', parseInt(e.target.value) || 0)}
                        className="w-14 p-1 border rounded text-center bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={player.assists}
                        onChange={(e) => updateStat(player.playerId, 'assists', parseInt(e.target.value) || 0)}
                        className="w-14 p-1 border rounded text-center bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={player.ownGoals}
                        onChange={(e) => updateStat(player.playerId, 'ownGoals', parseInt(e.target.value) || 0)}
                        className="w-14 p-1 border rounded text-center bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={player.isGoalkeeper}
                        onChange={(e) => updateStat(player.playerId, 'isGoalkeeper', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={player.isMvp}
                        onChange={(e) => updateStat(player.playerId, 'isMvp', e.target.checked)}
                        className="h-4 w-4 text-amber-500 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Botón de Guardado y Puntuación */}
      <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-500">
          Reglas: Gol +1 | Asistencia +1 | Autogol -1 | Victoria +1 | MVP +1 | Capitán puntúa x2.
        </p>
        <button
          onClick={handleScoreAndFinish}
          disabled={saving || playerRows.length === 0}
          className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
        >
          {saving ? 'Calculando y guardando...' : (
            <>
              <Calculator className="h-5 w-5" />
              Finalizar y Puntuar Pachanga
            </>
          )}
        </button>
      </div>

      {/* Resumen de puntuaciones si ya está puntuada */}
      {resultSummary && resultSummary.manager_points && (
        <div className="mt-8 p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <h4 className="font-bold text-emerald-950 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Puntuaciones del Fantasy Calculadas para esta Pachanga
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(resultSummary.manager_points).map(([mId, pts]) => {
              const mem = members?.find(m => m.id === mId);
              return (
                <div key={mId} className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm text-center">
                  <p className="text-xs text-gray-500 truncate">{mem?.name || `Manager ${mId.substring(0, 4)}`}</p>
                  <p className="text-xl font-bold text-emerald-700">{Number(pts)} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
