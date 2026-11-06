"use client";

import React from 'react';
import { UserAccount } from '../types';
import { Coins, Trophy, LogOut, ShieldAlert, User as UserIcon } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  onOpenAuth,
  activeTab,
  onSelectTab
}: {
  user: UserAccount | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
}) {
  return (
    <header className="bg-neutral-950 border-b border-amber-500/20 sticky top-0 z-40 text-white backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('team')}>
          <div className="w-10 h-12 relative flex-shrink-0">
            <img src="/logo.png" alt="EGOL" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-amber-400 tracking-wider">EGOL</span>
            <span className="text-xs uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded">
              FANTASY
            </span>
          </div>
        </div>

        {/* Navigation Tabs for Regular Users */}
        <nav className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-2xl overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectTab('standings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'standings'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Clasificación
          </button>
          <button
            onClick={() => onSelectTab('matchday')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'matchday'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Partido y Votos
          </button>
          <button
            onClick={() => onSelectTab('team')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Mi Equipo
          </button>
          <button
            onClick={() => onSelectTab('market')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'market'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Mercado
          </button>
          {user && user.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'admin'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin
            </button>
          )}
        </nav>

        {/* User Info / Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Presupuesto */}
              <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase leading-none">Saldo</p>
                  <p className="text-sm font-black text-white leading-tight">{user.budget}M€</p>
                </div>
              </div>

              {/* Puntos */}
              <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase leading-none">Puntos</p>
                  <p className="text-sm font-black text-white leading-tight">{user.totalPoints} pts</p>
                </div>
              </div>

              {/* Profile / Logout */}
              <div className="flex items-center gap-1 pl-1">
                <span className="text-xs font-bold text-neutral-300">{user.username}</span>
                <button
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition"
            >
              Entrar / Registro
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

