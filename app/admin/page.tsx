"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Member } from '../../types';
import AttendanceManager from '../../components/AttendanceManager';
import StatsRegistration from '../../components/StatsRegistration';
import FantasySelection from '../../components/FantasySelection';
import RankingBoard from '../../components/RankingBoard';
import { Calendar, Users, Trophy, Award, PlusCircle, Sparkles, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
  const [pachangas, setPachangas] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedPachangaId, setSelectedPachangaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'fantasy' | 'stats' | 'ranking'>('attendance');

  const [newPachanga, setNewPachanga] = useState({
    date: new Date().toISOString().split('T')[0],
    format: 5,
    status: 'draft'
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const loadData = async () => {
    try {
      const pData = await db.getPachangas();
      const mData = await db.getMembers();
      setPachangas(pData || []);
      setMembers(mData || []);

      // Si no hay seleccionada ninguna, seleccionar la primera
      if (pData && pData.length > 0 && !selectedPachangaId) {
        setSelectedPachangaId(pData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newPachanga.date) {
      alert('Por favor selecciona una fecha para la pachanga.');
      return;
    }

    try {
      const created = await db.createPachanga({
        date: newPachanga.date,
        format: Number(newPachanga.format) || 5,
        status: 'draft'
      });
      setPachangas([created, ...pachangas]);
      setSelectedPachangaId(created.id);
      alert('¡Pachanga creada con éxito!');
    } catch (e: any) {
      console.error('Error al crear pachanga:', e);
      alert(`Error al crear pachanga: ${e?.message || e}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await db.updatePachangaStatus(id, newStatus);
      setPachangas(pachangas.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (newStatus === 'open') setActiveTab('fantasy');
      if (newStatus === 'closed') setActiveTab('stats');
    } catch (e: any) {
      alert(`Error al cambiar estado: ${e?.message || e}`);
    }
  };

  const handleSeedMembers = async () => {
    setIsSeeding(true);
    try {
      const seeded = await db.seedInitialMembers();
      setMembers(seeded);
      alert('¡15 miembros iniciales cargados con éxito!');
    } catch (e: any) {
      alert(`Error cargando miembros: ${e?.message || e}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      const m = await db.createMember(newMemberName.trim());
      setMembers([...members, m]);
      setNewMemberName('');
      alert(`Miembro ${m.name} añadido.`);
    } catch (e: any) {
      alert(`Error creando miembro: ${e?.message || e}`);
    }
  };

  const currentPachanga = pachangas.find(p => p.id === selectedPachangaId);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel de Administración</h1>
          <p className="text-sm text-gray-600">
            Control de partidos, convocatorias, alineaciones Fantasy y acta de resultados.
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition text-sm"
        >
          ← Volver a la Web Principal
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Formulario Crear Pachanga */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-600" />
            Nueva Pachanga
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Fecha del Partido
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newPachanga.date}
                onChange={(e) => setNewPachanga({ ...newPachanga, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Formato (Jugadores por equipo)
              </label>
              <select
                className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newPachanga.format}
                onChange={(e) => setNewPachanga({ ...newPachanga, format: parseInt(e.target.value) || 5 })}
              >
                <option value={5}>Fútbol 5 (5 vs 5 - 10 jugadores)</option>
                <option value={6}>Fútbol 6 (6 vs 6 - 12 jugadores)</option>
                <option value={7}>Fútbol 7 (7 vs 7 - 14 jugadores)</option>
                <option value={8}>Fútbol 8 (8 vs 8 - 16 jugadores)</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition shadow-sm"
            >
              Crear Pachanga
            </button>
          </div>
        </div>

        {/* Lista de Pachangas */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Pachangas Registradas ({pachangas.length})
          </h2>

          {pachangas.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No hay ninguna pachanga creada aún.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pachangas.map(p => {
                const isSelected = p.id === selectedPachangaId;
                return (
                  <div
                    key={p.id}
                    className={`border p-4 rounded-xl transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                      isSelected ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => setSelectedPachangaId(p.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">
                          {p.date ? new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha por definir'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          p.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'closed' ? 'bg-amber-100 text-amber-800' :
                          p.status === 'scored' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Formato: {p.format} vs {p.format} | ID: {p.id.substring(0, 8)}...
                      </p>
                    </div>

                    {/* Botones de acción de estado */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleStatusChange(p.id, 'draft')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          p.status === 'draft' ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        Borrador
                      </button>
                      <button
                        onClick={() => handleStatusChange(p.id, 'open')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          p.status === 'open' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        Abrir Fantasy
                      </button>
                      <button
                        onClick={() => handleStatusChange(p.id, 'closed')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          p.status === 'closed' ? 'bg-amber-600 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        }`}
                      >
                        Cerrar (Jugar)
                      </button>
                      <button
                        onClick={() => handleStatusChange(p.id, 'scored')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          p.status === 'scored' ? 'bg-blue-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                      >
                        Puntuar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Gestión de Miembros */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Gestión de Miembros del Grupo ({members.length})
            </h3>
            <p className="text-xs text-gray-500">
              Son los 15 participantes fijos que juegan y compiten como managers en el Fantasy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {members.length < 15 && (
              <button
                onClick={handleSeedMembers}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isSeeding ? 'Cargando...' : 'Cargar 15 Miembros del Grupo'}
              </button>
            )}
          </div>
        </div>

        {/* Añadir nuevo miembro */}
        <form onSubmit={handleCreateMember} className="flex gap-2 max-w-md mb-4">
          <input
            type="text"
            placeholder="Nombre del nuevo miembro"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="border border-gray-300 bg-white text-gray-900 text-sm p-2 rounded-lg flex-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            + Añadir
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-lg border border-gray-200"
            >
              {m.name}
              {m.role === 'admin' && (
                <span className="text-[10px] text-blue-600 font-bold ml-0.5">Admin</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Zona de Trabajo de la Pachanga Seleccionada */}
      {selectedPachangaId && currentPachanga ? (
        <div className="space-y-6">
          {/* Navegación por Pestañas */}
          <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'attendance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Users className="h-4 w-4" />
              1. Asistencias y Equipos
            </button>
            <button
              onClick={() => setActiveTab('fantasy')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'fantasy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Trophy className="h-4 w-4" />
              2. Elección Fantasy
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Award className="h-4 w-4" />
              3. Registro de Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'ranking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              4. Clasificación General
            </button>
          </div>

          {/* Contenido de la pestaña activa */}
          {activeTab === 'attendance' && (
            <AttendanceManager
              pachangaId={selectedPachangaId}
              pachangas={pachangas}
              members={members}
              onUpdate={loadData}
            />
          )}

          {activeTab === 'fantasy' && (
            <FantasySelection
              pachangaId={selectedPachangaId}
              members={members}
              onSave={loadData}
            />
          )}

          {activeTab === 'stats' && (
            <StatsRegistration
              pachangaId={selectedPachangaId}
              members={members}
              onScored={loadData}
            />
          )}

          {activeTab === 'ranking' && (
            <RankingBoard />
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          Selecciona o crea una pachanga para gestionar sus asistentes, elecciones y estadísticas.
        </div>
      )}
    </div>
  );
}
