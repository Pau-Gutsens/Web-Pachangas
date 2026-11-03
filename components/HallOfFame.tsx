"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Trophy, Flame, Skull, Shield, Award, Sparkles, RefreshCw, Star, Users } from 'lucide-react';

export default function HallOfFame() {
  const [data, setData] = useState<{
    players: any[];
    awards: {
      pichichi: any;
      topAssister: any;
      topMvp: any;
      bestKeeper: any;
      wallOfShame: any;
      topWinRate: any;
    };
  }>({
    players: [],
    awards: {
      pichichi: null,
      topAssister: null,
      topMvp: null,
      bestKeeper: null,
      wallOfShame: null,
      topWinRate: null
    }
  });

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'goals' | 'assists' | 'wins' | 'losses' | 'mvps'>('goals');
  const [filterQuery, setFilterQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await db.getHallOfFame();
      setData(res);
    } catch (e) {
      console.error('Error loading Hall of Fame:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { players, awards } = data;

  const sortedPlayers = [...players]
    .filter(p => p.name.toLowerCase().includes(filterQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'goals') return b.goals - a.goals || b.wins - a.wins;
      if (sortBy === 'assists') return b.assists - a.assists || b.goals - a.goals;
      if (sortBy === 'wins') return b.wins - a.wins || b.winRate - a.winRate;
      if (sortBy === 'losses') return b.losses - a.losses || b.matchesPlayed - a.matchesPlayed;
      if (sortBy === 'mvps') return b.mvps - a.mvps || b.goals - a.goals;
      return 0;
    });

  const hasData = players.some(p => p.matchesPlayed > 0);

  return (
    <div className="space-y-8 text-gray-900">
      {/* Cabecera del Salón de la Fama */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">
            👑 Estadísticas Históricas Reales
          </span>
          <h2 className="text-3xl font-black tracking-tight">Salón de la Fama & Trofeos</h2>
          <p className="text-amber-100 text-sm mt-1 max-w-xl">
            Récords acumulados, pichichis, reyes de la asistencia y el temido Muro de las Lamentaciones.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white flex items-center gap-2 text-sm font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Récords
        </button>
      </div>

      {loading && !hasData ? (
        <div className="p-12 text-center text-gray-500">Cargando el Salón de la Fama...</div>
      ) : !hasData ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Aún no hay pachangas puntuadas</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Cuando se cierre y puntúe el primer partido, aquí se entregarán la Bota de Oro, el Rey de las Asistencias y el Muro de las Lamentaciones.
          </p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Trofeos Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Pichichi */}
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-wider text-amber-800 uppercase bg-amber-100 px-2.5 py-1 rounded-md">
                  ⚽ Bota de Oro
                </span>
                <span className="text-2xl">🥇</span>
              </div>
              <h4 className="text-xl font-black text-gray-900 truncate">
                {awards.pichichi ? awards.pichichi.name : 'Sin goles aún'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {awards.pichichi ? (
                  <>
                    <strong className="text-amber-600 text-lg font-black">{awards.pichichi.goals}</strong> goles en{' '}
                    {awards.pichichi.matchesPlayed} partido(s)
                  </>
                ) : (
                  'Esperando primer goleador'
                )}
              </p>
            </div>

            {/* 2. Máximo Asistente */}
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-wider text-indigo-800 uppercase bg-indigo-100 px-2.5 py-1 rounded-md">
                  👟 El Arquitecto
                </span>
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-xl font-black text-gray-900 truncate">
                {awards.topAssister ? awards.topAssister.name : 'Sin asistencias aún'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {awards.topAssister ? (
                  <>
                    <strong className="text-indigo-600 text-lg font-black">{awards.topAssister.assists}</strong> asistencias
                  </>
                ) : (
                  'Esperando asistencias'
                )}
              </p>
            </div>

            {/* 3. El Galáctico (MVP) */}
            <div className="bg-white border-2 border-yellow-300 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-wider text-yellow-900 uppercase bg-yellow-100 px-2.5 py-1 rounded-md">
                  ⭐ El Galáctico
                </span>
                <span className="text-2xl">🌟</span>
              </div>
              <h4 className="text-xl font-black text-gray-900 truncate">
                {awards.topMvp ? awards.topMvp.name : 'Sin MVP aún'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {awards.topMvp ? (
                  <>
                    <strong className="text-yellow-700 text-lg font-black">{awards.topMvp.mvps}</strong> veces elegido MVP
                  </>
                ) : (
                  'Esperando votaciones'
                )}
              </p>
            </div>

            {/* 4. Guante de Oro / El Muro */}
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-wider text-emerald-800 uppercase bg-emerald-100 px-2.5 py-1 rounded-md">
                  🧤 El Cerrojazo
                </span>
                <span className="text-2xl">🛡️</span>
              </div>
              <h4 className="text-xl font-black text-gray-900 truncate">
                {awards.bestKeeper ? awards.bestKeeper.name : 'Sin paradas registradas'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {awards.bestKeeper ? (
                  <>
                    <strong className="text-emerald-600 text-lg font-black">{awards.bestKeeper.saves}</strong> paradas salvadoras
                  </>
                ) : (
                  'Mejor portero de la liga'
                )}
              </p>
            </div>

            {/* 5. Muro de las Lamentaciones (Más derrotas) */}
            <div className="bg-white border-2 border-red-300 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-wider text-red-900 uppercase bg-red-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Skull className="h-3.5 w-3.5" /> Muro de Lamentaciones
                </span>
                <span className="text-2xl">📉</span>
              </div>
              <h4 className="text-xl font-black text-gray-900 truncate">
                {awards.wallOfShame ? awards.wallOfShame.name : 'Nadie pierde aún'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {awards.wallOfShame ? (
                  <>
                    <strong className="text-red-600 text-lg font-black">{awards.wallOfShame.losses}</strong> derrotas acumuladas
                  </>
                ) : (
                  'El gafe de las pachangas'
                )}
              </p>
            </div>

            {/* 6. Rey de Copas (% Victorias) */}
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-wider text-blue-900 uppercase bg-blue-100 px-2.5 py-1 rounded-md">
                  👑 Talismán del Grupo
                </span>
                <span className="text-2xl">🔥</span>
              </div>
              <h4 className="text-xl font-black text-gray-900 truncate">
                {awards.topWinRate ? awards.topWinRate.name : 'Sin partidos'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {awards.topWinRate ? (
                  <>
                    <strong className="text-blue-600 text-lg font-black">{awards.topWinRate.winRate}%</strong> de victorias ({awards.topWinRate.wins}G / {awards.topWinRate.matchesPlayed}PJ)
                  </>
                ) : (
                  'Mayor porcentaje de triunfos'
                )}
              </p>
            </div>
          </div>

          {/* Tabla General de Rendimiento Individual */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900">Estadísticas Individuales Acumuladas</h3>
                <p className="text-xs text-gray-500">Rendimiento en el campo de todos los jugadores.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                <input
                  type="text"
                  placeholder="Buscar jugador..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="border border-gray-300 text-sm p-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 sm:w-44"
                />

                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 text-xs font-semibold">
                  <button
                    onClick={() => setSortBy('goals')}
                    className={`px-2.5 py-1 rounded-md transition ${sortBy === 'goals' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
                  >
                    ⚽ Goles
                  </button>
                  <button
                    onClick={() => setSortBy('assists')}
                    className={`px-2.5 py-1 rounded-md transition ${sortBy === 'assists' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
                  >
                    👟 Asist.
                  </button>
                  <button
                    onClick={() => setSortBy('wins')}
                    className={`px-2.5 py-1 rounded-md transition ${sortBy === 'wins' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
                  >
                    🏆 Victorias
                  </button>
                  <button
                    onClick={() => setSortBy('losses')}
                    className={`px-2.5 py-1 rounded-md transition ${sortBy === 'losses' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
                  >
                    💀 Derrotas
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                    <th className="p-3">Jugador</th>
                    <th className="p-3 text-center">Partidos</th>
                    <th className="p-3 text-center text-blue-700">PG</th>
                    <th className="p-3 text-center text-gray-500">PE</th>
                    <th className="p-3 text-center text-red-700">PP</th>
                    <th className="p-3 text-center text-amber-700 font-extrabold">Goles ⚽</th>
                    <th className="p-3 text-center text-indigo-700 font-extrabold">Asist. 👟</th>
                    <th className="p-3 text-center">Paradas 🧤</th>
                    <th className="p-3 text-center">MVPs ⭐</th>
                    <th className="p-3 text-center">% Victorias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3 font-semibold text-gray-900 flex items-center gap-1.5">
                        {player.name}
                        {!player.isMember && (
                          <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1 py-0.2 rounded">
                            Invitado
                          </span>
                        )}
                        {awards.pichichi?.id === player.id && <span title="Bota de Oro">🥇</span>}
                        {awards.wallOfShame?.id === player.id && <span title="Muro de Lamentaciones">💀</span>}
                      </td>
                      <td className="p-3 text-center font-medium text-gray-600">{player.matchesPlayed}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{player.wins}</td>
                      <td className="p-3 text-center text-gray-500">{player.draws}</td>
                      <td className="p-3 text-center font-bold text-red-600">{player.losses}</td>
                      <td className="p-3 text-center font-black text-amber-600 text-base">{player.goals}</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{player.assists}</td>
                      <td className="p-3 text-center text-gray-700">{player.saves}</td>
                      <td className="p-3 text-center font-bold text-yellow-600">{player.mvps}</td>
                      <td className="p-3 text-center font-semibold text-gray-800">
                        {player.winRate}%
                      </td>
                    </tr>
                  ))}
                  {sortedPlayers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-gray-400 italic">
                        No se encontraron jugadores con ese nombre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
