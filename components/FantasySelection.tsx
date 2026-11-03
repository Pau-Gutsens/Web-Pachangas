"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Member } from '../types';
import { calculatePrice, DEFAULT_GROUP_AVERAGE } from '../lib/constants';
import { Trophy, Star, CheckCircle, AlertCircle, Coins, UserCheck, Sparkles } from 'lucide-react';

export default function FantasySelection({
  pachangaId,
  members,
  onSave
}: {
  pachangaId: string;
  members: Member[];
  onSave?: () => void;
}) {
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [format, setFormat] = useState<number>(5);
  const [budget, setBudget] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [existingPicks, setExistingPicks] = useState<any[]>([]);

  // Precios calculados por jugador asistente
  const [playerPrices, setPlayerPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const details = await db.getPachangaDetails(pachangaId);
        const attList = details?.pachanga_attendees || [];
        setAttendees(attList);
        setFormat(details?.format || 5);
        setExistingPicks(details?.fantasy_picks || []);

        // Calcular precio de cada asistente elegible (solo miembros)
        const eligibleAttendees = attList.filter((a: any) => a.member_id);
        const prices: Record<string, number> = {};

        eligibleAttendees.forEach((a: any) => {
          // Si no hay histórico aún, precio estándar basado en DEFAULT_GROUP_AVERAGE (~11 pts)
          const price = calculatePrice(DEFAULT_GROUP_AVERAGE);
          prices[a.member_id] = price;
        });

        setPlayerPrices(prices);

        // Presupuesto de la jornada = format * precio_medio
        const priceValues = Object.values(prices);
        const avgPrice = priceValues.length > 0
          ? priceValues.reduce((acc, p) => acc + p, 0) / priceValues.length
          : 11;
        const totalBudget = Math.round((details?.format || 5) * avgPrice);
        setBudget(totalBudget);

        // Preseleccionar el primer manager si no hay seleccionado
        if (!selectedManagerId && members.length > 0) {
          setSelectedManagerId(members[0].id);
        }
      } catch (e) {
        console.error('Error loading fantasy selection data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [pachangaId, members]);

  // Cuando cambia el manager seleccionado, cargar sus picks si ya existen
  useEffect(() => {
    if (!selectedManagerId) return;
    const currentPick = existingPicks.find((p: any) => p.manager_id === selectedManagerId);
    if (currentPick) {
      setSelectedIds(currentPick.selected_player_ids || []);
      setCaptainId(currentPick.captain_id || '');
    } else {
      setSelectedIds([]);
      setCaptainId('');
    }
    setSuccessMessage('');
  }, [selectedManagerId, existingPicks]);

  // Cálculo de presupuesto gastado
  const spentBudget = selectedIds.reduce((sum, id) => sum + (playerPrices[id] || 11), 0);
  const remainingBudget = budget - spentBudget;
  const slotsRemaining = format - selectedIds.length;

  // Filtrar solo los asistentes que son miembros del grupo (regla oficial: invitados no se eligen)
  const eligiblePlayers = attendees
    .filter((a: any) => a.member_id)
    .map((a: any) => {
      const member = members.find(m => m.id === a.member_id);
      return {
        id: a.member_id,
        name: member ? member.name : `Jugador (${a.member_id.substring(0, 4)})`,
        team: a.team,
        price: playerPrices[a.member_id] || 11
      };
    });

  const togglePlayer = (id: string, price: number) => {
    setSuccessMessage('');
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pId => pId !== id));
      if (captainId === id) setCaptainId('');
    } else {
      if (selectedIds.length >= format) {
        alert(`Ya has completado tu alineación de ${format} jugadores.`);
        return;
      }
      if (remainingBudget < price) {
        alert(`No tienes suficiente presupuesto. Este jugador cuesta ${price} y te quedan ${remainingBudget}.`);
        return;
      }
      const newSelected = [...selectedIds, id];
      setSelectedIds(newSelected);
      // Si es el primer jugador elegido y no hay capitán, hacerlo capitán automáticamente
      if (!captainId) setCaptainId(id);
    }
  };

  const handleSavePick = async () => {
    if (!selectedManagerId) {
      alert('Por favor selecciona qué manager eres.');
      return;
    }
    if (selectedIds.length !== format) {
      alert(`Debes seleccionar exactamente ${format} jugadores (llevas ${selectedIds.length}).`);
      return;
    }
    if (!captainId || !selectedIds.includes(captainId)) {
      alert('Por favor selecciona a un Capitán de tu equipo (puntúa x2).');
      return;
    }
    if (remainingBudget < 0) {
      alert('Has excedido el presupuesto disponible.');
      return;
    }

    setSaving(true);
    try {
      await db.saveFantasyPick(pachangaId, selectedManagerId, selectedIds, captainId);
      setSuccessMessage('¡Alineación guardada con éxito!');
      const updatedDetails = await db.getPachangaDetails(pachangaId);
      setExistingPicks(updatedDetails?.fantasy_picks || []);
      if (onSave) onSave();
    } catch (e: any) {
      alert(`Error al guardar selección: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando selección de Fantasy...</div>;
  }

  const selectedManagerObj = members.find(m => m.id === selectedManagerId);

  return (
    <div className="mt-8 p-4 md:p-6 border border-gray-200 rounded-xl bg-white shadow-sm text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Alineación Fantasy
          </h3>
          <p className="text-sm text-gray-600">
            Arma tu equipo virtual para esta jornada. Cada gol, asistencia y victoria sumará puntos.
          </p>
        </div>

        {/* Selector de Manager */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            ¿Quién eres?:
          </label>
          <select
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
            className="border border-gray-300 bg-white text-gray-900 text-sm font-medium rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {existingPicks.some(p => p.manager_id === m.id) ? '✓ (Enviado)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjeta de estado de presupuesto y plazas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
          <Coins className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-800 font-semibold uppercase">Presupuesto</p>
            <p className="text-xl font-bold text-blue-950">
              {remainingBudget} <span className="text-sm font-normal text-blue-800">/ {budget} pts</span>
            </p>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-indigo-800 font-semibold uppercase">Plazas de Jugadores</p>
            <p className="text-xl font-bold text-indigo-950">
              {selectedIds.length} <span className="text-sm font-normal text-indigo-800">/ {format} elegidos</span>
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
          <Star className="h-8 w-8 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-amber-800 font-semibold uppercase">Capitán (Puntúa x2)</p>
            <p className="text-sm font-bold text-amber-950 truncate max-w-[150px]">
              {captainId
                ? eligiblePlayers.find(p => p.id === captainId)?.name || 'Seleccionado'
                : 'Pendiente de elegir'}
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {eligiblePlayers.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-800">No hay miembros convocados aún</p>
          <p className="text-sm text-gray-500 mt-1">
            El administrador debe convocar jugadores en la pestaña de Asistencia antes de poder elegir equipo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda: Jugadores disponibles */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-gray-800">Jugadores Asistentes ({eligiblePlayers.length})</h4>
              <span className="text-xs text-gray-500">Toca para añadir o quitar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {eligiblePlayers.map(player => {
                const isSelected = selectedIds.includes(player.id);
                const isCaptain = captainId === player.id;
                const canAfford = remainingBudget >= player.price;

                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id, player.price)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : !canAfford && slotsRemaining > 0
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-sm leading-snug">{player.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        Eq. {player.team}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-black/10">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        Precio:
                      </span>
                      <span className="font-bold text-sm">{player.price} pts</span>
                    </div>

                    {isCaptain && (
                      <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-950" /> CAP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Tu equipo seleccionado */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">
                  Equipo de {selectedManagerObj?.name || 'Manager'} ({selectedIds.length}/{format})
                </h4>
                <span className="text-xs text-amber-700 font-medium">
                  Marca la estrella para elegir Capitán
                </span>
              </div>

              {selectedIds.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic border border-dashed border-gray-200 rounded-xl">
                  Selecciona jugadores de la izquierda para armar tu equipo.
                </div>
              ) : (
                <ul className="space-y-2 mb-4">
                  {selectedIds.map(id => {
                    const player = eligiblePlayers.find(p => p.id === id);
                    const isCaptain = captainId === id;
                    return (
                      <li
                        key={id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border bg-white shadow-sm ${
                          isCaptain ? 'border-amber-400 ring-1 ring-amber-400' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCaptainId(id)}
                            title="Hacer Capitán (Puntos dobles)"
                            className={`p-1 rounded-md transition ${
                              isCaptain ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-500'
                            }`}
                          >
                            <Star className={`h-5 w-5 ${isCaptain ? 'fill-amber-400' : ''}`} />
                          </button>
                          <div>
                            <span className="font-medium text-gray-900">{player?.name || 'Jugador'}</span>
                            {isCaptain && (
                              <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                CAPITÁN (x2)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-600">{player?.price || 11} pts</span>
                          <button
                            onClick={() => togglePlayer(id, player?.price || 11)}
                            className="text-gray-400 hover:text-red-600 text-sm font-bold px-1.5"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSavePick}
                disabled={saving || selectedIds.length !== format || !captainId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                {saving ? 'Guardando...' : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Guardar mi Equipo Fantasy
                  </>
                )}
              </button>
              {selectedIds.length !== format && (
                <p className="text-xs text-center text-amber-700 mt-2">
                  Te faltan {format - selectedIds.length} jugadores para completar la alineación.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
