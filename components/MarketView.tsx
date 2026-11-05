"use client";

import React, { useState } from 'react';
import { UserAccount, Player } from '../types';
import { egolDb } from '../lib/db';
import { Coins, TrendingUp, TrendingDown, Star, Search, ShieldCheck, Check, ShoppingBag } from 'lucide-react';

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
  const [filterType, setFilterType] = useState<'all' | 'members' | 'guests'>('all');
  const [toastMessage, setToastMessage] = useState<string>('');

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'members') return !p.isGuest;
    if (filterType === 'guests') return p.isGuest;
    return true;
  });

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
    <div className="space-y-6 text-white">
      {/* Cabecera del Mercado */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Mercado Abierto 24/7
          </span>
          <h2 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-amber-400" />
            Mercado de Fichajes EGOL
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Todos los jugadores e invitados están disponibles. Compra y vende para ajustar tu plantilla.
          </p>
        </div>

        {user && (
          <div className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-2xl flex items-center gap-4">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Tu Presupuesto</span>
              <span className="text-lg font-black text-emerald-400">{user.budget}M€</span>
            </div>
            <div className="border-l border-neutral-800 pl-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Fichajes</span>
              <span className="text-lg font-black text-amber-400">{user.ownedPlayerIds.length} / 6</span>
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold text-center animate-fade-in shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs p-3 pl-9 rounded-2xl focus:outline-none focus:border-amber-400"
          />
          <Search className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="inline-flex rounded-2xl border border-neutral-800 bg-neutral-900 p-1 text-xs font-bold w-full sm:w-auto justify-center">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'all' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({players.length})
          </button>
          <button
            onClick={() => setFilterType('members')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'members' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Miembros ({players.filter(p => !p.isGuest).length})
          </button>
          <button
            onClick={() => setFilterType('guests')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'guests' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Invitados ({players.filter(p => p.isGuest).length})
          </button>
        </div>
      </div>

      {/* Grid de Jugadores del Mercado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              className={`bg-neutral-900 border rounded-3xl p-4 transition-all flex flex-col justify-between group shadow-sm ${
                isOwned
                  ? 'border-amber-500/50 bg-neutral-900/90 ring-1 ring-amber-500/30'
                  : 'border-neutral-800 hover:border-amber-500/30'
              }`}
            >
              <div>
                {/* Foto y Badges */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-neutral-950 border border-neutral-800">
                  <img
                    src={player.avatarUrl || '/logo.png'}
                    alt={player.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Badge de variación de precio (%) */}
                  <div className="absolute top-2.5 left-2.5">
                    {hasIncreased ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-neutral-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-md">
                        <TrendingUp className="h-3 w-3" />
                        +{player.priceChangePct}%
                      </span>
                    ) : hasDecreased ? (
                      <span className="inline-flex items-center gap-1 bg-red-500/90 text-white font-black text-[11px] px-2 py-0.5 rounded-full shadow-md">
                        <TrendingDown className="h-3 w-3" />
                        {player.priceChangePct}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 bg-neutral-800/90 text-neutral-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        0.0%
                      </span>
                    )}
                  </div>

                  {/* Nota Media Calificación */}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-amber-400 font-black text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    {player.averageRating}
                  </div>

                  {/* Badge si ya está en tu equipo */}
                  {isOwned && (
                    <div className="absolute top-2.5 right-2.5 bg-amber-400 text-neutral-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1">
                      <Check className="h-3 w-3 stroke-[3]" />
                      {isStarter ? 'Titular' : 'En Plantilla'}
                    </div>
                  )}
                </div>

                {/* Nombre y tipo */}
                <h3 className="font-black text-base text-white truncate flex items-center gap-1.5">
                  {player.name}
                  {player.isGuest && (
                    <span className="text-xs text-neutral-400 font-semibold">(invitado)</span>
                  )}
                </h3>

                {/* Precio actual y anterior */}
                <div className="flex justify-between items-baseline mt-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">Precio Actual</span>
                    <span className="text-xl font-black text-amber-400">{player.currentPrice}M€</span>
                  </div>
                  {player.previousPrice !== player.currentPrice && (
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 line-through">{player.previousPrice}M€</span>
                    </div>
                  )}
                </div>

                {/* Resumen de Estadísticas */}
                <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-2 rounded-xl mt-3 text-center border border-neutral-800 text-[10px]">
                  <div>
                    <span className="text-neutral-500 block uppercase">PJ</span>
                    <span className="font-bold text-white">{player.stats.matchesPlayed}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase">Goles</span>
                    <span className="font-bold text-amber-400">{player.stats.goals}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase">Asist</span>
                    <span className="font-bold text-indigo-400">{player.stats.assists}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase">Paradas</span>
                    <span className="font-bold text-emerald-400">{player.stats.saves}</span>
                  </div>
                </div>
              </div>

              {/* Botón Comprar / Vender */}
              <div className="pt-4 mt-4 border-t border-neutral-800">
                {isOwned ? (
                  <button
                    onClick={() => handleSell(player.id)}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-red-900/60 text-red-300 font-bold rounded-xl text-xs uppercase transition"
                  >
                    Vender (+{player.currentPrice}M€)
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(player.id)}
                    disabled={!user || isTeamFull || !canAfford}
                    className={`w-full py-2.5 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm ${
                      !user
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : isTeamFull
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : !canAfford
                        ? 'bg-neutral-800 text-red-400/80 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950'
                    }`}
                  >
                    {!user
                      ? 'Inicia Sesión'
                      : isTeamFull
                      ? 'Plantilla Llena (6/6)'
                      : !canAfford
                      ? 'Saldo Insuficiente'
                      : `Fichar por ${player.currentPrice}M€`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

