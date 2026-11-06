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
      {/* Top Header - Sin logo ni nombre, solo stats y control */}
      <header className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-40 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Navegación por iconos (Flaticons sin palabras) - Desktop / Tablet */}
          <nav className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => onSelectTab('standings')}
              title="Clasificación"
              aria-label="Clasificación"
              className={`p-2.5 rounded-lg transition flex items-center justify-center ${
                activeTab === 'standings'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Trophy className="h-5 w-5" />
            </button>

            <button
              onClick={() => onSelectTab('matchday')}
              title="Partido y Votaciones"
              aria-label="Partido y Votaciones"
              className={`p-2.5 rounded-lg transition flex items-center justify-center ${
                activeTab === 'matchday'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Calendar className="h-5 w-5" />
            </button>

            <button
              onClick={() => onSelectTab('team')}
              title="Mi Equipo"
              aria-label="Mi Equipo"
              className={`p-2.5 rounded-lg transition flex items-center justify-center ${
                activeTab === 'team'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Shield className="h-5 w-5" />
            </button>

            <button
              onClick={() => onSelectTab('market')}
              title="Mercado"
              aria-label="Mercado"
              className={`p-2.5 rounded-lg transition flex items-center justify-center ${
                activeTab === 'market'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
            </button>

            {!user && (
              <button
                onClick={() => onSelectTab('auth')}
                title="Iniciar Sesión / Registro"
                aria-label="Iniciar Sesión / Registro"
                className={`p-2.5 rounded-lg transition flex items-center justify-center ${
                  activeTab === 'auth'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <UserIcon className="h-5 w-5" />
              </button>
            )}

            {user && user.role === 'admin' && (
              <button
                onClick={() => onSelectTab('admin')}
                title="Panel de Administrador"
                aria-label="Panel de Administrador"
                className={`p-2.5 rounded-lg transition flex items-center justify-center ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-red-400 hover:text-red-300 hover:bg-neutral-800'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </button>
            )}
          </nav>

          {/* Información del usuario / Estado de sesión */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Saldo Presupuesto */}
                <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-black text-white">{user.budget}M€</span>
                </div>

                {/* Puntos acumulados */}
                <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="font-black text-white">{user.totalPoints} pts</span>
                </div>

                {/* Usuario y Logout */}
                <div className="flex items-center gap-1 pl-1">
                  <span className="text-xs font-bold text-neutral-300 hidden sm:inline">{user.username}</span>
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
                className={`p-2 rounded-lg transition flex items-center gap-1.5 text-xs font-bold ${
                  activeTab === 'auth'
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barra de navegación inferior móvil fija (Mobile Friendly Flaticon Bar) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 border-t border-neutral-800 px-4 py-2 flex items-center justify-around backdrop-blur-md">
        <button
          onClick={() => onSelectTab('standings')}
          title="Clasificación"
          aria-label="Clasificación"
          className={`p-2.5 rounded-xl transition flex flex-col items-center justify-center ${
            activeTab === 'standings' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'
          }`}
        >
          <Trophy className="h-5 w-5" />
        </button>

        <button
          onClick={() => onSelectTab('matchday')}
          title="Partido y Votos"
          aria-label="Partido y Votos"
          className={`p-2.5 rounded-xl transition flex flex-col items-center justify-center ${
            activeTab === 'matchday' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'
          }`}
        >
          <Calendar className="h-5 w-5" />
        </button>

        <button
          onClick={() => onSelectTab('team')}
          title="Mi Equipo"
          aria-label="Mi Equipo"
          className={`p-2.5 rounded-xl transition flex flex-col items-center justify-center ${
            activeTab === 'team' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'
          }`}
        >
          <Shield className="h-5 w-5" />
        </button>

        <button
          onClick={() => onSelectTab('market')}
          title="Mercado"
          aria-label="Mercado"
          className={`p-2.5 rounded-xl transition flex flex-col items-center justify-center ${
            activeTab === 'market' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
        </button>

        {!user ? (
          <button
            onClick={() => onSelectTab('auth')}
            title="Iniciar Sesión"
            aria-label="Iniciar Sesión"
            className={`p-2.5 rounded-xl transition flex flex-col items-center justify-center ${
              activeTab === 'auth' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'
            }`}
          >
            <UserIcon className="h-5 w-5" />
          </button>
        ) : user.role === 'admin' ? (
          <button
            onClick={() => onSelectTab('admin')}
            title="Admin"
            aria-label="Admin"
            className={`p-2.5 rounded-xl transition flex flex-col items-center justify-center ${
              activeTab === 'admin' ? 'text-red-400 bg-neutral-900' : 'text-neutral-500'
            }`}
          >
            <ShieldAlert className="h-5 w-5" />
          </button>
        ) : null}
      </nav>
    </>
  );
}
