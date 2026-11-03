"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Member } from '../types';
import { UserPlus, UserX, ArrowLeftRight, Users, ShieldCheck, Sparkles } from 'lucide-react';

export default function AttendanceManager({
  pachangaId,
  pachangas,
  members,
  onUpdate
}: {
  pachangaId: string;
  pachangas: any[];
  members: Member[];
  onUpdate?: () => void;
}) {
  const [selectedPachanga, setSelectedPachanga] = useState<any>(null);
  const [targetTeam, setTargetTeam] = useState<'A' | 'B'>('A');
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const details = await db.getPachangaDetails(pachangaId);
      setSelectedPachanga(details);
    } catch (e) {
      console.error('Error fetching pachanga details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [pachangaId]);

  if (loading && !selectedPachanga) {
    return <div className="p-8 text-center text-gray-500">Cargando asistentes...</div>;
  }

  if (!selectedPachanga) {
    return <div className="p-8 text-center text-gray-500">Pachanga no encontrada.</div>;
  }

  const attendees: any[] = selectedPachanga.pachanga_attendees || [];
  const format = selectedPachanga.format || 5;

  const teamA = attendees.filter((a: any) => a.team === 'A');
  const teamB = attendees.filter((a: any) => a.team === 'B');

  // Comprobar qué miembros ya están asignados
  const assignedMemberIds = new Set(attendees.map(a => a.member_id).filter(Boolean));

  const handleAddMember = async (memberId: string) => {
    if (assignedMemberIds.has(memberId)) {
      alert('Este jugador ya está asignado a un equipo.');
      return;
    }
    setActionLoading(true);
    try {
      await db.addAttendee(pachangaId, memberId, null, targetTeam);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(`Error al añadir jugador: ${e?.message || e}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGuest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guestName.trim()) {
      alert('Escribe el nombre del invitado.');
      return;
    }
    setActionLoading(true);
    try {
      const guestUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
      await db.addAttendee(pachangaId, null, guestUuid || null, targetTeam, guestName.trim());
      setGuestName('');
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(`Error al añadir invitado: ${e?.message || e}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (attendeeId: string) => {
    if (!confirm('¿Eliminar a este jugador de la pachanga?')) return;
    setActionLoading(true);
    try {
      await db.removeAttendee(attendeeId, pachangaId);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(`Error al quitar jugador: ${e?.message || e}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTeam = async (attendeeId: string, currentTeam: 'A' | 'B') => {
    const nextTeam = currentTeam === 'A' ? 'B' : 'A';
    setActionLoading(true);
    try {
      await db.updateAttendeeTeam(attendeeId, pachangaId, nextTeam);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(`Error al cambiar de equipo: ${e?.message || e}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getPlayerDisplayName = (attendee: any) => {
    if (attendee.member_id) {
      const member = members.find(m => m.id === attendee.member_id);
      return member ? member.name : `Miembro (${attendee.member_id.substring(0, 4)})`;
    }
    if (attendee.guest_name) return `${attendee.guest_name} (Invitado)`;
    if (attendee.guest_id) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`pachangas_cache_guest_name_${attendee.guest_id}`);
        if (cached) return `${JSON.parse(cached)} (Invitado)`;
      }
      return `Invitado (${attendee.guest_id.substring(0, 4)})`;
    }
    return 'Invitado';
  };

  return (
    <div className="mt-8 p-4 md:p-6 border border-gray-200 rounded-xl bg-white shadow-sm text-gray-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Asistencia y Equipos de la Pachanga
          </h3>
          <p className="text-sm text-gray-600">
            Formato: <strong>{format} vs {format}</strong> (Objetivo: {format * 2} jugadores en total).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Asignar al:</span>
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            <button
              onClick={() => setTargetTeam('A')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                targetTeam === 'A' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:text-black'
              }`}
            >
              Equipo A
            </button>
            <button
              onClick={() => setTargetTeam('B')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                targetTeam === 'B' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-700 hover:text-black'
              }`}
            >
              Equipo B
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Selector de Miembros */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              1. Seleccionar Miembros del Grupo
            </h4>
            <span className="text-xs text-gray-500">
              {assignedMemberIds.size} / {members.length} convocados
            </span>
          </div>

          {members.length === 0 ? (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-3">No hay miembros registrados todavía.</p>
              <button
                onClick={async () => {
                  await db.seedInitialMembers();
                  if (onUpdate) onUpdate();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition"
              >
                <Sparkles className="h-4 w-4" /> Cargar 15 Miembros del Grupo
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
              {members.map(m => {
                const isAssigned = assignedMemberIds.has(m.id);
                const currentAttendee = attendees.find(a => a.member_id === m.id);
                return (
                  <button
                    key={m.id}
                    disabled={isAssigned || actionLoading}
                    onClick={() => handleAddMember(m.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium border transition-all ${
                      isAssigned
                        ? currentAttendee?.team === 'A'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 opacity-80 cursor-default'
                          : 'bg-red-100 text-red-800 border-red-300 opacity-80 cursor-default'
                        : targetTeam === 'A'
                        ? 'bg-white hover:bg-blue-50 text-gray-800 border-gray-300 hover:border-blue-400'
                        : 'bg-white hover:bg-red-50 text-gray-800 border-gray-300 hover:border-red-400'
                    }`}
                  >
                    {m.name}
                    {isAssigned && ` (Eq. ${currentAttendee?.team})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Añadir Invitado */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 flex items-center gap-1.5">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            2. Añadir Invitado Puntual
          </h4>
          <form onSubmit={handleAddGuest} className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del invitado (ej: Carlos)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg flex-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={actionLoading}
              className={`text-white font-medium px-5 py-2.5 rounded-lg transition-colors ${
                targetTeam === 'A' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              + Añadir a Eq. {targetTeam}
            </button>
          </form>
          <p className="text-xs text-gray-500">
            Los invitados completan el partido, pero no suman puntos para la clasificación general del Fantasy.
          </p>
        </div>
      </div>

      {/* Visualización de los dos Equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta Equipo A */}
        <div className="border border-blue-200 rounded-xl bg-blue-50/70 p-5">
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-blue-200">
            <h4 className="font-bold text-lg text-blue-900">Equipo A</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              teamA.length === format ? 'bg-green-100 text-green-800' :
              teamA.length > format ? 'bg-amber-100 text-amber-800' :
              'bg-blue-200 text-blue-900'
            }`}>
              {teamA.length} / {format} jugadores
            </span>
          </div>

          <ul className="space-y-2">
            {teamA.map((a: any) => (
              <li
                key={a.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{getPlayerDisplayName(a)}</span>
                  {a.guest_id && (
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                      Invitado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleTeam(a.id, 'A')}
                    title="Pasar al Equipo B"
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(a.id)}
                    title="Eliminar jugador"
                    className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {teamA.length === 0 && (
              <li className="p-4 text-center text-sm text-gray-500 italic">
                Aún no hay jugadores en el Equipo A.
              </li>
            )}
          </ul>
        </div>

        {/* Tarjeta Equipo B */}
        <div className="border border-red-200 rounded-xl bg-red-50/70 p-5">
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-red-200">
            <h4 className="font-bold text-lg text-red-900">Equipo B</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              teamB.length === format ? 'bg-green-100 text-green-800' :
              teamB.length > format ? 'bg-amber-100 text-amber-800' :
              'bg-red-200 text-red-900'
            }`}>
              {teamB.length} / {format} jugadores
            </span>
          </div>

          <ul className="space-y-2">
            {teamB.map((a: any) => (
              <li
                key={a.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-100 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{getPlayerDisplayName(a)}</span>
                  {a.guest_id && (
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                      Invitado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleTeam(a.id, 'B')}
                    title="Pasar al Equipo A"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(a.id)}
                    title="Eliminar jugador"
                    className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {teamB.length === 0 && (
              <li className="p-4 text-center text-sm text-gray-500 italic">
                Aún no hay jugadores en el Equipo B.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
