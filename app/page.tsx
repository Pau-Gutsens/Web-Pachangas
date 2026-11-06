"use client";

import React, { useState, useEffect } from 'react';
import { egolDb } from '../lib/db';
import { UserAccount, Player } from '../types';
import Navbar from '../components/Navbar';
import AuthView from '../components/AuthView';
import MyTeamView from '../components/MyTeamView';
import MarketView from '../components/MarketView';
import MatchDayView from '../components/MatchDayView';
import LeaderboardView from '../components/LeaderboardView';
import AdminView from '../components/AdminView';

export default function EGOLApp() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<'team' | 'market' | 'matchday' | 'standings' | 'admin' | 'auth'>('standings');
  const [isClient, setIsClient] = useState(false);

  const refreshData = () => {
    setCurrentUser(egolDb.getCurrentUser());
    setPlayers(egolDb.getPlayers());
  };

  useEffect(() => {
    setIsClient(true);
    refreshData();
  }, []);

  if (!isClient) return null;

  const handleLogout = () => {
    egolDb.logout();
    setCurrentUser(null);
    setActiveTab('standings');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Navbar Superior */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setActiveTab('auth')}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin' && currentUser?.role !== 'admin') {
            alert('Acceso restringido solo para administradores.');
            return;
          }
          setActiveTab(tab);
        }}
      />

      {/* Contenido Principal según la pestaña seleccionada */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* 1. Mi Equipo */}
        {activeTab === 'team' && (
          <MyTeamView
            user={currentUser}
            players={players}
            onUpdateUser={refreshData}
            onGoToMarket={() => setActiveTab('market')}
            onGoToAuth={() => setActiveTab('auth')}
          />
        )}

        {/* 2. Mercado de Fichajes */}
        {activeTab === 'market' && (
          <MarketView
            user={currentUser}
            players={players}
            onUpdateUser={refreshData}
          />
        )}

        {/* 3. Partido del Día y Votaciones 1 al 10 */}
        {activeTab === 'matchday' && (
          <MatchDayView
            user={currentUser}
            players={players}
            onOpenAuth={() => setActiveTab('auth')}
          />
        )}

        {/* 4. Clasificación Total de Puntos */}
        {activeTab === 'standings' && (
          <LeaderboardView />
        )}

        {/* 5. Panel de Admin (Solo Pagusa / Admin) */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminView
            players={players}
            onRefresh={refreshData}
          />
        )}

        {/* 6. Pantalla de Autenticación (Pestaña / Pantalla Separada) */}
        {activeTab === 'auth' && (
          <AuthView
            onLoginSuccess={(user) => {
              refreshData();
              setActiveTab('team');
            }}
            onCancel={() => setActiveTab('standings')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-600">
        <p className="flex items-center justify-center gap-1.5 font-semibold text-neutral-400">
          <img src="/logo.png" alt="EGOL" className="h-4 w-4 object-contain inline" />
          EGOL FANTASY &bull; Liga Privada de Pachangas
        </p>
      </footer>
    </div>
  );
}
