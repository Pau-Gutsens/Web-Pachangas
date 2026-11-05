"use client";

import React from 'react';
import { UserAccount, Player } from '../types';
import { egolDb } from '../lib/db';
import { Shield, Coins, PlusCircle, ArrowLeftRight, Trash2, Star, CheckCircle, AlertCircle } from 'lucide-react';

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
  if (!user) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center max-w-lg mx-auto text-white">
        <Shield className="h-12 w-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Inicia sesión para gestionar tu equipo</h3>
        <p className="text-sm text-neutral-400 mb-6">
          Empiezas con 100M€ para fichar hasta 6 jugadores (5 titulares y 1 reserva).
        </p>
      </div>
    );
  }

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
      // Pasar a reserva
      newStarters = user.starterPlayerIds.filter(id => id !== playerId);
    } else {
      // Intentar pasar a titular
      if (user.starterPlayerIds.length >= 5) {
        alert('Solo puedes alinear como máximo 5 jugadores titulares en el partido.');
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

  return (
    <div className="space-y-8 text-white">
      {/* Resumen de Presupuesto y Plantilla */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Plantilla Permanente de {user.username}
          </span>
          <h2 className="text-2xl font-black mt-2 text-white">Mi Equipo EGOL Fantasy</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Mantienes este equipo entre partidos. Vende y compra en el mercado para renovarlo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Plantilla</span>
            <span className="text-base font-black text-amber-400">
              {ownedPlayers.length} / 6 <span className="text-xs text-neutral-400 font-normal">jugadores</span>
            </span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Presupuesto</span>
            <span className="text-base font-black text-emerald-400">{user.budget}M€</span>
          </div>
        </div>
      </div>

      {/* Titulares (5 puestos) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              Titulares para el Partido ({starters.length} / 5)
            </h3>
            <p className="text-xs text-neutral-400">
              Estos 5 futbolistas puntuarán con sus goles, asistencias y paradas en la próxima pachanga.
            </p>
          </div>

          {ownedPlayers.length < 6 && (
            <button
              onClick={onGoToMarket}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase transition flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Fichar en el Mercado
            </button>
          )}
        </div>

        {starters.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl">
            <Shield className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-300">No tienes jugadores titulares</p>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Ve al mercado para fichar jugadores con tus 100M€ iniciales.
            </p>
            <button
              onClick={onGoToMarket}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs uppercase"
            >
              Explorar Mercado
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {starters.map(player => (
              <div
                key={player.id}
                className="bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Foto del Jugador */}
                  <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-neutral-800">
                    <img
                      src={player.avatarUrl || '/logo.png'}
                      alt={player.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-emerald-500 text-neutral-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                      TITULAR
                    </span>
                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-amber-400 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {player.averageRating}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white truncate">
                    {player.name} {player.isGuest && <span className="text-neutral-400 font-normal text-xs">(invitado)</span>}
                  </h4>

                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-neutral-400">Valor actual:</span>
                    <span className="font-bold text-amber-400">{player.currentPrice}M€</span>
                  </div>

                  {/* Stats del jugador */}
                  <div className="grid grid-cols-3 gap-1 bg-neutral-900/60 p-2 rounded-xl mt-3 text-[11px] text-center border border-neutral-800/80">
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Goles</span>
                      <span className="font-black text-amber-400">{player.stats.goals}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Asist</span>
                      <span className="font-black text-indigo-400">{player.stats.assists}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Paradas</span>
                      <span className="font-black text-emerald-400">{player.stats.saves}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStarter(player.id)}
                    title="Pasar al banquillo de reserva"
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Banquillo
                  </button>

                  <button
                    onClick={() => handleSell(player.id)}
                    title={`Vender por ${player.currentPrice}M€`}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Vender
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banquillo de Reserva (1 plaza) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Banquillo de Reserva ({reserves.length} / 1)
          </h3>
          <p className="text-xs text-neutral-400">
            Puedes tener 1 jugador en el banquillo. Si no juega uno de tus titulares, puedes darle entrada antes de la jornada.
          </p>
        </div>

        {reserves.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-neutral-800 rounded-2xl text-xs text-neutral-500 italic">
            No tienes ningún jugador en el banquillo. Puedes fichar hasta 6 jugadores en total.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {reserves.map(player => (
              <div
                key={player.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-neutral-900">
                    <img src={player.avatarUrl || '/logo.png'} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs text-white truncate">
                    {player.name} {player.isGuest && <span className="text-neutral-400 font-normal">(invitado)</span>}
                  </h4>
                  <p className="text-[11px] text-amber-400 font-bold">{player.currentPrice}M€</p>
                </div>

                <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleToggleStarter(player.id)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Poner Titular
                  </button>
                  <button
                    onClick={() => handleSell(player.id)}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 transition"
                  >
                    Vender
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
