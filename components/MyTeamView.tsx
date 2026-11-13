"use client";

import React, { useState, useEffect } from 'react';
import { UserAccount, Player, PachangaMatch } from '../types';
import { egolDb } from '../lib/db';
import { Shield, ArrowLeftRight, Trash2, Star, PlusCircle } from 'lucide-react';

export default function MyTeamView({
  user,
  players,
  onUpdateUser,
  onGoToMarket
}: {
  user: UserAccount | null;
  players: Player[];
  onUpdateUser: () => void;
  onGoToMarket: () => void;
}) {
  if (!user) return null;

  const [matches, setMatches] = useState<PachangaMatch[]>([]);
  const [hasPlayedMatches, setHasPlayedMatches] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await egolDb.getMatches();
        setMatches(data);
        setHasPlayedMatches(data.some(m => m.status === 'voting' || m.status === 'scored'));
      } catch (e) {
        console.error('Error fetching matches:', e);
      }
    };
    fetchMatches();
  }, []);

  const ownedPlayers = players.filter(p => user.ownedPlayerIds.includes(p.id));
  const starters = ownedPlayers.filter(p => user.starterPlayerIds.includes(p.id));
  const reserves = ownedPlayers.filter(p => !user.starterPlayerIds.includes(p.id));

  const handleSell = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    if (!confirm(`¿Vender a ${player.name} por ${formatCurrency(player.currentPrice)}?`)) return;

    try {
      const res = await egolDb.sellPlayer(user.id, playerId);
      if (res.success) {
        onUpdateUser();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error al realizar la venta.');
    }
  };

  const handleToggleStarter = async (playerId: string) => {
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

    try {
      const res = await egolDb.setStarters(newStarters);
      if (res.success) {
        onUpdateUser();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar titulares.');
    }
  };

  const PlayerRow = ({ player, isStarter }: { player: Player; isStarter: boolean }) => (
    <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-neutral-800/40 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
          <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-bold text-xs sm:text-sm text-white truncate block max-w-[130px] xs:max-w-none">
            {player.name}
            {player.isGuest && <span className="text-neutral-500 font-normal text-[10px] sm:text-xs ml-1">(invitado)</span>}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-500 mt-0.5">
            <span className="font-bold text-amber-400">{formatCurrency(player.currentPrice)}</span>
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

      {/* Botones alineados con anchos fijos uniformes */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={() => handleToggleStarter(player.id)}
          className="w-20 sm:w-24 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
        >
          <ArrowLeftRight className="h-3 w-3 flex-shrink-0" />
          <span className="hidden xs:inline">{isStarter ? 'Banquillo' : 'Titular'}</span>
          <span className="xs:hidden">{isStarter ? 'Banq' : 'Tit'}</span>
        </button>
        <button
          onClick={() => handleSell(player.id)}
          className="w-16 sm:w-20 py-1.5 text-neutral-400 hover:bg-neutral-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
        >
          <Trash2 className="h-3 w-3 flex-shrink-0" />
          <span>Vender</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 text-white">
      {/* Cabecera */}
      <div className="border-b border-neutral-800 pb-3 sm:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">Mi Equipo — {user.username}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Alinea tus 5 titulares y 1 suplente</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <span className="text-neutral-400">Plantilla: <span className="font-black text-amber-400">{ownedPlayers.length} / 6</span></span>
          <span className="text-neutral-400">Presupuesto: <span className="font-black text-white">{user.budget}M€</span></span>
        </div>
      </div>

      {/* Titulares */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-neutral-800">
          <h3 className="font-black text-xs sm:text-sm text-white">
            Titulares <span className="text-neutral-500 font-normal">({starters.length} / 5)</span>
          </h3>
          {ownedPlayers.length < 6 && (
            <button
              onClick={onGoToMarket}
              className="px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-xs transition flex items-center gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Fichar</span>
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-3 sm:px-4 py-3 border-b border-neutral-800">
          <h3 className="font-black text-xs sm:text-sm text-white">
            Banquillo <span className="text-neutral-500 font-normal">({reserves.length} / 1)</span>
          </h3>
        </div>

        {reserves.length === 0 ? (
          <div className="p-5 text-center text-xs text-neutral-500">
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
