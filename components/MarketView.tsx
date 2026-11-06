"use client";

import React, { useState } from 'react';
import { UserAccount, Player } from '../types';
import { egolDb } from '../lib/db';
import { TrendingUp, TrendingDown, Star, Search, Check } from 'lucide-react';

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

  // ¿Ha habido algún partido ya jugado?
  const hasPlayedMatches = egolDb.getMatches().some(m => m.status === 'voting' || m.status === 'scored');

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuy = (playerId: string) => {
    if (!user) {
      alert('Debes iniciar sesión para comprar jugadores.');
      return;
    }
    const res = egolDb.buyPlayer(user.id, playerId);
    if (res.success) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(''), 3000);
      onUpdateUser();
    } else {
      alert(res.message);
    }
  };

  const handleSell = (playerId: string) => {
    if (!user) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    if (!confirm(`¿Vender a ${player.name} por ${player.currentPrice}M€?`)) return;

    const res = egolDb.sellPlayer(user.id, playerId);
    if (res.success) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(''), 3000);
      onUpdateUser();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Cabecera */}
      <div className="border-b border-neutral-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-black text-white">Mercado de Fichajes</h2>

        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-400">Presupuesto: <span className="font-black text-emerald-400">{user.budget}M€</span></span>
            <span className="text-neutral-400">Fichajes: <span className="font-black text-amber-400">{user.ownedPlayerIds.length} / 6</span></span>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold text-center">
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
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
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${isOwned ? 'bg-amber-500/5' : 'hover:bg-neutral-800/40'} transition-colors`}
                >
                  {/* Nombre y tipo */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                      <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-white truncate block">
                        {player.name}
                        {player.isGuest && <span className="text-neutral-500 font-normal text-xs ml-1">(invitado)</span>}
                        {isOwned && (
                          <span className="ml-2 text-[10px] font-black text-amber-400 uppercase">
                            {isStarter ? '· Titular' : '· Plantilla'}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span>PJ: {player.stats.matchesPlayed}</span>
                        <span>G: {player.stats.goals}</span>
                        <span>A: {player.stats.assists}</span>
                        {hasPlayedMatches && player.ratingsCount > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {player.averageRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Precio y variación */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-black text-amber-400 text-sm block">{player.currentPrice}M€</span>
                      {hasIncreased ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold">
                          <TrendingUp className="h-3 w-3" />+{player.priceChangePct}%
                        </span>
                      ) : hasDecreased ? (
                        <span className="inline-flex items-center gap-0.5 text-red-400 text-[10px] font-bold">
                          <TrendingDown className="h-3 w-3" />{player.priceChangePct}%
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-[10px]">—</span>
                      )}
                    </div>

                    {/* Botón */}
                    {isOwned ? (
                      <button
                        onClick={() => handleSell(player.id)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-red-900/60 text-red-300 font-bold rounded-lg text-xs transition"
                      >
                        Vender
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(player.id)}
                        disabled={!user || isTeamFull || !canAfford}
                        className={`px-3 py-1.5 font-black rounded-lg text-xs transition ${
                          !user || isTeamFull || !canAfford
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                        }`}
                      >
                        {!user
                          ? 'Inicia sesión'
                          : isTeamFull
                          ? 'Llena'
                          : !canAfford
                          ? 'Sin saldo'
                          : `Fichar`}
                      </button>
                    )}
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
