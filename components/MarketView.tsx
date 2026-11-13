"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, Player } from '../types';
import { egolDb } from '../lib/db';
import { formatCurrency } from '../lib/utils';ide-react';

export default function MarketView({
  user,
  players,
  onUpdateUser
}: {
  user: UserAccount | null;
  players: Player[];
  onUpdateUser: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [hasPlayedMatches, setHasPlayedMatches] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matches = await egolDb.getMatches();
        setHasPlayedMatches(matches.some(m => m.status === 'voting' || m.status === 'scored'));
      } catch (e) {
        console.error('Error fetching matches:', e);
      }
    };
    fetchMatches();
  }, []);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuy = async (playerId: string) => {
    if (!user) return;
    try {
      const res = await egolDb.buyPlayer(user.id, playerId);
      if (res.success) {
        setToastMessage(res.message);
        setTimeout(() => setToastMessage(''), 3000);
        onUpdateUser();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error al realizar la compra.');
    }
  };

  const handleSell = async (playerId: string) => {
    if (!user) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    if (!confirm(`¿Vender a ${player.name} por ${formatCurrency(player.currentPrice)}?`)) return;

    try {
      const res = await egolDb.sellPlayer(user.id, playerId);
      if (res.success) {
        setToastMessage(res.message);
        setTimeout(() => setToastMessage(''), 3000);
        onUpdateUser();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error al realizar la venta.');
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Cabecera */}
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">Mercado de Fichajes</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Compra y venta de jugadores 24/7</p>
        </div>

        {user && (
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="text-neutral-400">Presupuesto: <span className="font-black text-white">{user.budget}M€</span></span>
            <span className="text-neutral-400">Plantilla: <span className="font-black text-amber-400">{user.ownedPlayerIds.length} / 6</span></span>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="p-3 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-bold text-center">
          {toastMessage}
        </div>
      )}

      {/* Buscador */}
      <div className="relative w-full sm:w-72">
        <input
          type="text"
          placeholder="Buscar jugador..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs p-2.5 pl-9 rounded-xl focus:outline-none focus:border-amber-400"
        />
        <Search className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Lista de Jugadores */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {filteredPlayers.length === 0 ? (
          <p className="p-6 text-center text-xs text-neutral-500">No se encontraron jugadores.</p>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredPlayers.map(player => {
              const isOwned = user ? user.ownedPlayerIds.includes(player.id) : false;
              const isStarter = user ? user.starterPlayerIds.includes(player.id) : false;
              const canAfford = user ? user.budget >= player.currentPrice : false;
              const isTeamFull = user ? user.ownedPlayerIds.length >= 6 : false;
              const hasIncreased = player.priceChangePct > 0;
              const hasDecreased = player.priceChangePct < 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 ${isOwned ? 'bg-amber-500/5' : 'hover:bg-neutral-800/40'} transition-colors`}
                >
                  {/* Nombre y datos del jugador */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                      <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px] xs:max-w-none">
                          {player.name}
                        </span>
                        {player.isGuest && <span className="text-neutral-500 font-normal text-[10px] sm:text-[11px]">(invitado)</span>}
                        {isOwned && (
                          <span className="text-[9px] font-black text-amber-400 uppercase bg-amber-400/10 px-1 py-0.2 rounded">
                            {isStarter ? 'Titular' : 'Plantilla'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                        <span>PJ: {player.stats.matchesPlayed}</span>
                        <span>G: {player.stats.goals}</span>
                        <span>A: {player.stats.assists}</span>
                        {hasPlayedMatches && player.ratingsCount > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {player.averageRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloque Precio y Variación (Ancho fijo para alineación exacta) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                    <div className="w-16 sm:w-20 text-right">
                      <span className="font-black text-amber-400 text-xs sm:text-sm block whitespace-nowrap">
                        {formatCurrency(player.currentPrice)}
                      </span>
                      {hasIncreased ? (
                        <span className="inline-flex items-center justify-end gap-0.5 text-emerald-400 text-[10px] font-bold">
                          <TrendingUp className="h-3 w-3" />+{player.priceChangePct}%
                        </span>
                      ) : hasDecreased ? (
                        <span className="inline-flex items-center justify-end gap-0.5 text-red-400 text-[10px] font-bold">
                          <TrendingDown className="h-3 w-3" />{player.priceChangePct}%
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[10px] font-bold block">
                          0%
                        </span>
                      )}
                    </div>

                    {/* Bloque Botón (Ancho fijo para alineación exacta en toda la lista) */}
                    <div className="w-20 sm:w-24 flex justify-end">
                      {isOwned ? (
                        <button
                          onClick={() => handleSell(player.id)}
                          className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-lg text-xs transition text-center"
                        >
                          Vender
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(player.id)}
                          disabled={!user || isTeamFull || !canAfford}
                          className={`w-full py-1.5 font-black rounded-lg text-xs transition text-center ${
                            !user || isTeamFull || !canAfford
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm'
                          }`}
                        >
                          {isTeamFull
                            ? 'Llena'
                            : !canAfford
                            ? 'Sin saldo'
                            : 'Fichar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
