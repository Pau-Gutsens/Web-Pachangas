"use client";

import React, { useState, useEffect } from 'react';
import { egolDb } from '../lib/db';
import { UserAccount, Player, UserNotification } from '../types';
import { Bell, CheckCircle } from 'lucide-react';
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
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'team' | 'market' | 'matchday' | 'standings' | 'admin'>('standings');
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      const user = await egolDb.syncCurrentUser();
      setCurrentUser(user);
      const fetchedPlayers = await egolDb.getPlayers();
      setPlayers(fetchedPlayers);
      if (user) {
        const notifs = await egolDb.getUserNotifications(user.id);
        setNotifications(notifs.filter(n => !n.read));
      }
    } catch (e) {
      console.error(e);
      alert('Error al cargar datos de la aplicación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissNotification = async (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    await egolDb.markNotificationAsRead(notifId);
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
        {/* Notificaciones Oficiales para el Usuario */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map(notif => {
              const isPositive = (notif.amount ?? 0) >= 0;
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
                    isPositive
                      ? 'bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/40 border-emerald-500/50'
                      : 'bg-gradient-to-r from-red-950/80 via-neutral-900 to-red-950/40 border-red-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-white">{notif.title}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isPositive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          Notificación Oficial
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissNotification(notif.id)}
                    className="self-end sm:self-center px-4 py-2 bg-neutral-800 hover:bg-neutral-700 hover:text-white text-neutral-300 font-bold rounded-xl text-xs uppercase transition shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Entendido</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
          <LeaderboardView currentUser={currentUser} />
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
