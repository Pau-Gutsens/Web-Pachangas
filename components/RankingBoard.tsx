"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Trophy, Medal, RefreshCw, Calendar, Flame } from 'lucide-react';

export default function RankingBoard() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await db.getRankings();
      setRankings(data || []);
    } catch (e) {
      console.error('Error loading rankings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-xl bg-white shadow-sm text-gray-900">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Clasificación General Fantasy
          </h3>
          <p className="text-sm text-gray-600">
            Tabla de posiciones acumulada de todos los managers durante la temporada.
          </p>
        </div>
        <button
          onClick={loadRankings}
          disabled={loading}
          title="Actualizar clasificación"
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {loading && rankings.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Cargando clasificación...</div>
      ) : rankings.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-gray-50 border border-dashed border-gray-300">
          <Medal className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-700">Aún no hay puntuaciones registradas</p>
          <p className="text-sm text-gray-500 mt-1">
            Una vez finalizada y puntuada la primera pachanga, aquí aparecerá la tabla de clasificación.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                <th className="p-3 text-center w-16">Pos</th>
                <th className="p-3">Manager</th>
                <th className="p-3 text-center">Puntos Totales</th>
                <th className="p-3 text-center">Última Jornada</th>
                <th className="p-3 text-center">Partidos</th>
                <th className="p-3 text-center">Victorias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {rankings.map((r, index) => {
                const isFirst = index === 0 && r.totalPoints > 0;
                const isSecond = index === 1 && r.totalPoints > 0;
                const isThird = index === 2 && r.totalPoints > 0;

                return (
                  <tr
                    key={r.managerId}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isFirst ? 'bg-amber-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 text-center font-bold">
                      {isFirst ? (
                        <span className="text-xl" title="1º Lugar">🥇</span>
                      ) : isSecond ? (
                        <span className="text-xl" title="2º Lugar">🥈</span>
                      ) : isThird ? (
                        <span className="text-xl" title="3º Lugar">🥉</span>
                      ) : (
                        <span className="text-gray-500">{index + 1}º</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-gray-900 flex items-center gap-2">
                      {r.name}
                      {isFirst && (
                        <span className="text-[10px] uppercase font-black bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded shadow-sm">
                          LÍDER
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-extrabold text-blue-600 text-base">
                      {r.totalPoints} pts
                    </td>
                    <td className="p-3 text-center font-medium text-gray-600">
                      {r.lastMatchPoints > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                          <Flame className="h-3.5 w-3.5 text-orange-500" /> +{r.lastMatchPoints}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="p-3 text-center text-gray-600 font-medium">
                      {r.matchesPlayed}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-800">
                      {r.wins}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
