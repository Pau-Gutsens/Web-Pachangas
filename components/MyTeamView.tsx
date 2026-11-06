"use client";

import React from 'react';
import { UserAccount, Player } from '../types';
import { egolDb } from '../lib/db';
import { Shield, ArrowLeftRight, Trash2, Star, PlusCircle } from 'lucide-react';

export default function MyTeamView({
  user,
  players,
  onUpdateUser,
  onGoToMarket,
  onGoToAuth
}: {
  user: UserAccount | null;
  players: Player[];
  onUpdateUser: () => void;
  onGoToMarket: () => void;
  onGoToAuth?: () => void;
}) {
  if (!user) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center max-w-lg mx-auto text-white">
        <Shield className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-3">Inicia sesión para gestionar tu equipo</h3>
        {onGoToAuth && (
          <button
            onClick={onGoToAuth}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase"
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    );
  }

  // ¿Ha habido algún partido ya jugado?
  const hasPlayedMatches = egolDb.getMatches().some(m => m.status === 'voting' || m.status === 'scored');

  const ownedPlayers = players.filter(p => user.ownedPlayerIds.includes(p.id));
  const starters = ownedPlayers.filter(p => user.starterPlayerIds.includes(p.id));
  const reserves = ownedPlayers.filter(p => !user.starterPlayerIds.includes(p.id));

  const handleSell = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    if (!confirm(`¿Vender a ${player.name} por ${player.currentPrice}M€?`)) return;

    const res = egolDb.sellPlayer(user.id, playerId);
    if (res.success) {
      onUpdateUser();
    } else {
      alert(res.message);
    }
  };

  const handleToggleStarter = (playerId: string) => {
    let newStarters: string[] = [];
    if (user.starterPlayerIds.includes(playerId)) {
      newStarters = user.starterPlayerIds.filter(id => id !== playerId);
    } else {
      if (user.starterPlayerIds.length >= 5) {
        alert('Solo puedes alinear como máximo 5 jugadores titulares.');
        return;
      }
      newStarters = [...user.starterPlayerIds, playerId];
    }

    const res = egolDb.setStarters(newStarters);
    if (res.success) {
      onUpdateUser();
    } else {
      alert(res.message);
    }
  };

  const PlayerRow = ({ player, isStarter }: { player: Player; isStarter: boolean }) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
          <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-sm text-white truncate block">
            {player.name}
            {player.isGuest && <span className="text-neutral-500 font-normal text-xs ml-1">(invitado)</span>}
          </span>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
            <span className="font-bold text-amber-400">{player.currentPrice}M€</span>
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

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => handleToggleStarter(player.id)}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-lg text-xs transition flex items-center gap-1"
        >
          <ArrowLeftRight className="h-3 w-3" />
          {isStarter ? 'Banquillo' : 'Titular'}
        </button>
        <button
          onClick={() => handleSell(player.id)}
          className="px-3 py-1.5 text-neutral-400 hover:bg-neutral-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Vender
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-white">
      {/* Cabecera */}
      <div className="border-b border-neutral-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-black text-white">Mi Equipo — {user.username}</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-400">Plantilla: <span className="font-black text-amber-400">{ownedPlayers.length} / 6</span></span>
          <span className="text-neutral-400">Presupuesto: <span className="font-black text-white">{user.budget}M€</span></span>
        </div>
      </div>

      {/* Titulares */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h3 className="font-black text-sm text-white">
            Titulares <span className="text-neutral-500 font-normal">({starters.length} / 5)</span>
          </h3>
          {ownedPlayers.length < 6 && (
            <button
              onClick={onGoToMarket}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-xs transition flex items-center gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Fichar
            </button>
          )}
        </div>

        {starters.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500">No tienes titulares. Ve al mercado para fichar.</p>
            <button
              onClick={onGoToMarket}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-xs"
            >
              Ir al Mercado
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {starters.map(player => (
              <PlayerRow key={player.id} player={player} isStarter={true} />
            ))}
          </div>
        )}
      </div>

      {/* Banquillo */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800">
          <h3 className="font-black text-sm text-white">
            Banquillo <span className="text-neutral-500 font-normal">({reserves.length} / 1)</span>
          </h3>
        </div>

        {reserves.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            Sin jugadores en el banquillo.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {reserves.map(player => (
              <PlayerRow key={player.id} player={player} isStarter={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
