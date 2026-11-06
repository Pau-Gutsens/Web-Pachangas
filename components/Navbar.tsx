"use client";

import React from 'react';
import { UserAccount } from '../types';
import { Trophy, Calendar, Shield, ShoppingBag, ShieldAlert, User as UserIcon, LogOut, Coins } from 'lucide-react';

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
    <>
      {/* Top Header - En móvil muestra logo y balance; en desktop muestra logo, nav y balance */}
      <header className="bg-neutral-950/90 border-b border-neutral-800 sticky top-0 z-40 text-white backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo y Marca Oficial */}
          <div
            onClick={() => onSelectTab(user ? 'team' : 'standings')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group flex-shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 relative flex-shrink-0">
              <img src="/logo.png" alt="EGOL" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-wider text-amber-400 group-hover:text-amber-300 transition">
                EGOL
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase bg-neutral-900 text-amber-400 border border-neutral-800 font-bold px-1.5 py-0.5 rounded hidden xs:inline-block">
                FANTASY
              </span>
            </div>
          </div>

          {/* Navegación Desktop / Tablet ÚNICAMENTE (Oculta en móvil con hidden sm:flex) */}
          <nav className="hidden sm:flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => onSelectTab('standings')}
              title="Clasificación"
              aria-label="Clasificación"
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                activeTab === 'standings'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Trophy className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => onSelectTab('matchday')}
              title="Partido y Votaciones"
              aria-label="Partido y Votaciones"
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                activeTab === 'matchday'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => onSelectTab('team')}
              title="Mi Equipo"
              aria-label="Mi Equipo"
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                activeTab === 'team'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => onSelectTab('market')}
              title="Mercado"
              aria-label="Mercado"
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                activeTab === 'market'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
            </button>

            {!user && (
              <button
                onClick={() => onSelectTab('auth')}
                title="Iniciar Sesión / Registro"
                aria-label="Iniciar Sesión / Registro"
                className={`p-2 rounded-lg transition flex items-center justify-center ${
                  activeTab === 'auth'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <UserIcon className="h-4.5 w-4.5" />
              </button>
            )}

            {user && user.role === 'admin' && (
              <button
                onClick={() => onSelectTab('admin')}
                title="Panel de Administrador"
                aria-label="Panel de Administrador"
                className={`p-2 rounded-lg transition flex items-center justify-center ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-red-400 hover:text-red-300 hover:bg-neutral-800'
                }`}
              >
                <ShieldAlert className="h-4.5 w-4.5" />
              </button>
            )}
          </nav>

          {/* Información del usuario / Estado de sesión */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Saldo Presupuesto */}
                <div className="bg-neutral-900 border border-neutral-800 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 text-xs">
                  <Coins className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-black text-white">{user.budget}M€</span>
                </div>

                {/* Puntos acumulados */}
                <div className="bg-neutral-900 border border-neutral-800 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg flex items-center gap-1 text-xs">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                  <span className="font-black text-white">{user.totalPoints}<span className="text-[10px] text-neutral-400 font-medium hidden sm:inline ml-0.5">pts</span></span>
                </div>

                {/* Usuario y Logout */}
                <div className="flex items-center gap-1 pl-0.5">
                  <span className="text-xs font-bold text-neutral-300 hidden md:inline max-w-[100px] truncate">{user.username}</span>
                  <button
                    onClick={onLogout}
                    title="Cerrar Sesión"
                    aria-label="Cerrar Sesión"
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSelectTab('auth')}
                title="Iniciar Sesión"
                aria-label="Iniciar Sesión"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-bold ${
                  activeTab === 'auth'
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barra de navegación inferior móvil fija (Mobile Friendly Bottom Bar con iconos y micro-etiquetas) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 border-t border-neutral-800/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around backdrop-blur-md shadow-2xl">
        <button
          onClick={() => onSelectTab('standings')}
          className={`flex-1 py-1 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 min-w-[56px] ${
            activeTab === 'standings' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Liga</span>
        </button>

        <button
          onClick={() => onSelectTab('matchday')}
          className={`flex-1 py-1 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 min-w-[56px] ${
            activeTab === 'matchday' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Partido</span>
        </button>

        <button
          onClick={() => onSelectTab('team')}
          className={`flex-1 py-1 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 min-w-[56px] ${
            activeTab === 'team' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Equipo</span>
        </button>

        <button
          onClick={() => onSelectTab('market')}
          className={`flex-1 py-1 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 min-w-[56px] ${
            activeTab === 'market' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Mercado</span>
        </button>

        {!user ? (
          <button
            onClick={() => onSelectTab('auth')}
            className={`flex-1 py-1 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 min-w-[56px] ${
              activeTab === 'auth' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] tracking-tight">Entrar</span>
          </button>
        ) : user.role === 'admin' ? (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex-1 py-1 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 min-w-[56px] ${
              activeTab === 'admin' ? 'text-red-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="h-5 w-5" />
            <span className="text-[10px] tracking-tight">Admin</span>
          </button>
        ) : null}
      </nav>
    </>
  );
}
