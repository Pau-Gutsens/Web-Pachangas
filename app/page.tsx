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
  const [activeTab, setActiveTab] = useState<'team' | 'market' | 'matchday' | 'standings' | 'admin'>('standings');
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      const user = egolDb.getCurrentUser();
      setCurrentUser(user);
      const fetchedPlayers = await egolDb.getPlayers();
      setPlayers(fetchedPlayers);
    } catch (e) {
      console.error(e);
      alert('Error al cargar datos de la aplicación.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse text-amber-400 font-bold">Cargando...</div>
      </div>
    );
  }

  const handleLogout = () => {
    egolDb.logout();
    setCurrentUser(null);
    setActiveTab('standings');
  };

  const handleLoginSuccess = async (user: UserAccount) => {
    setCurrentUser(user);
    await refreshData();
    setActiveTab('standings');
  };

  // SI NO HAY SESIÓN INICIADA: Pantalla obligatoria de Iniciar Sesión / Registrarse
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center px-4 py-8 selection:bg-amber-400 selection:text-neutral-950">
        <div className="w-full max-w-md">
          <AuthView onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Navbar Superior */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-24 sm:pb-8">
        {/* 1. Mi Equipo */}
        {activeTab === 'team' && (
          <MyTeamView
            user={currentUser}
            players={players}
            onUpdateUser={refreshData}
            onGoToMarket={() => setActiveTab('market')}
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
            onOpenAuth={() => {}}
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
      </main>
    </div>
  );
}
