"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Member } from '../types';
import RankingBoard from '../components/RankingBoard';
import FantasySelection from '../components/FantasySelection';
import { RefreshCw, ExternalLink, Trophy, Calendar, BookOpen, Settings, Play, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [pachangas, setPachangas] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pachangas' | 'ranking' | 'rules'>('pachangas');
  const [playingPachangaId, setPlayingPachangaId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const pData = await db.getPachangas();
      const mData = await db.getMembers();
      setPachangas(pData || []);
      setMembers(mData || []);

      // Si hay alguna pachanga abierta para fantasy, preseleccionarla para jugar
      const openPachanga = pData?.find(p => p.status === 'open');
      if (openPachanga) {
        setPlayingPachangaId(openPachanga.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-3 text-lg font-medium text-gray-700">Cargando Web-Pachangas...</span>
      </div>
    );
  }

  const openPachanga = pachangas.find(p => p.status === 'open');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* Barra superior de navegación */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
              ⚽
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">Web-Pachangas</h1>
              <p className="text-xs text-gray-500">Gestor oficial y liga Fantasy del grupo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <a
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition shadow-xs w-full sm:w-auto"
            >
              <Settings className="h-4 w-4" />
              Panel Admin
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Banner destacado si hay una pachanga abierta */}
        {openPachanga && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-white/20 text-white text-xs font-black uppercase px-2.5 py-1 rounded-full mb-2 inline-block">
                ⚡ ¡Jornada en Curso!
              </span>
              <h2 className="text-2xl font-black">Pachanga Abierta para Fantasy</h2>
              <p className="text-blue-100 text-sm mt-1">
                Partido programado para el{' '}
                <strong>
                  {new Date(openPachanga.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </strong>.
                ¡Haz tu alineación antes de que empiece el partido!
              </p>
            </div>
            <button
              onClick={() => {
                setPlayingPachangaId(openPachanga.id);
                setActiveTab('pachangas');
              }}
              className="px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 font-black rounded-xl transition shadow flex items-center gap-2 whitespace-nowrap"
            >
              <Play className="h-5 w-5 fill-blue-900" />
              Hacer mi Equipo Fantasy
            </button>
          </div>
        )}

        {/* Pestañas principales */}
        <div className="flex border-b border-gray-200 mb-8 gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pachangas')}
            className={`py-3 px-2 font-bold text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'pachangas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Partidos y Fantasy
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`py-3 px-2 font-bold text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'ranking'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Trophy className="h-4 w-4" />
            Clasificación General
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-2 font-bold text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Reglas del Fantasy
          </button>
        </div>

        {/* Tab 1: Partidos y Fantasy */}
        {activeTab === 'pachangas' && (
          <div>
            {/* Si el usuario ha pulsado en jugar Fantasy de una pachanga */}
            {playingPachangaId && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-gray-900">
                    Alineación para la Pachanga seleccionada
                  </h3>
                  <button
                    onClick={() => setPlayingPachangaId(null)}
                    className="text-sm text-gray-500 hover:text-black underline"
                  >
                    Ocultar selector
                  </button>
                </div>
                <FantasySelection
                  pachangaId={playingPachangaId}
                  members={members}
                  onSave={fetchData}
                />
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Todas las Pachangas ({pachangas.length})</h3>
              <a href="/admin" className="text-sm font-semibold text-blue-600 hover:underline">
                + Crear en Admin
              </a>
            </div>

            {pachangas.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                  ⚽
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No hay pachangas programadas</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Crea la primera pachanga desde el panel de administración para empezar a convocar jugadores y jugar al Fantasy.
                </p>
                <a
                  href="/admin"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm"
                >
                  Ir al Panel de Administración
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pachangas.map((p: any) => {
                  const dateStr = p.date ? new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Fecha pendiente';
                  return (
                    <div
                      key={p.id}
                      className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-bold text-gray-900 capitalize">{dateStr}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            p.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'closed' ? 'bg-amber-100 text-amber-800' :
                            p.status === 'scored' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                          Formato: <strong>{p.format} vs {p.format}</strong> ({p.format * 2} jugadores)
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                        {p.status === 'open' ? (
                          <button
                            onClick={() => setPlayingPachangaId(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                          >
                            <Play className="h-3.5 w-3.5 fill-white" /> Elegir Fantasy
                          </button>
                        ) : p.status === 'scored' ? (
                          <button
                            onClick={() => setActiveTab('ranking')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Ver Puntuaciones
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">En preparación</span>
                        )}

                        <a
                          href={`/admin`}
                          className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                        >
                          Gestionar <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Clasificación General */}
        {activeTab === 'ranking' && (
          <RankingBoard />
        )}

        {/* Tab 3: Reglas del Fantasy */}
        {activeTab === 'rules' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Reglas y Sistema de Puntuación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-base border-b pb-2">1. Elección de tu Equipo Fantasy</h4>
                <ul className="space-y-2 text-gray-700 list-disc ml-4">
                  <li>Cada jornada eliges un equipo virtual con <strong>N jugadores</strong> (según el formato del partido, ej: 5).</li>
                  <li>Solo puedes elegir entre los miembros que <strong>asisten a esa pachanga</strong>.</li>
                  <li>Los <strong>invitados</strong> no son elegibles para el Fantasy.</li>
                  <li>Un manager <strong>puede elegirse a sí mismo</strong> si asiste al partido.</li>
                  <li>Cuentas con un <strong>presupuesto limitado</strong>. El precio de cada jugador varía según su rendimiento previo.</li>
                  <li>Eliges un <strong>Capitán</strong>: ¡sus puntos puntuarán <strong>doble (x2)</strong>!</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-base border-b pb-2">2. Puntuación por Partido</h4>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b pb-1"><span>Gol</span><span className="font-bold text-emerald-600">+1 pto</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Asistencia</span><span className="font-bold text-emerald-600">+1 pto</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Victoria de su equipo</span><span className="font-bold text-emerald-600">+1 pto</span></div>
                  <div className="flex justify-between border-b pb-1"><span>MVP de la pachanga</span><span className="font-bold text-amber-600">+1 pto extra</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Parada (solo portero)</span><span className="font-bold text-emerald-600">+1 pto</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Gol encajado (solo portero)</span><span className="font-bold text-red-600">-1 pto</span></div>
                  <div className="flex justify-between"><span>Autogol</span><span className="font-bold text-red-600">-1 pto</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
