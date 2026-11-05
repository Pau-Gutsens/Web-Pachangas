"use client";

import React, { useState, useEffect } from 'react';
import { egolDb } from '../../lib/db';
import { UserAccount, Player } from '../../types';
import AdminView from '../../components/AdminView';
import AuthModal from '../../components/AuthModal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const refresh = () => {
    setCurrentUser(egolDb.getCurrentUser());
    setPlayers(egolDb.getPlayers());
  };

  useEffect(() => {
    setIsClient(true);
    refresh();
  }, []);

  if (!isClient) return null;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a EGOL Fantasy
        </a>
      </div>

      {!isAdmin ? (
        <div className="max-w-md mx-auto bg-neutral-900 border border-red-500/30 rounded-3xl p-8 text-center mt-12 shadow-2xl">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-white mb-2">Acceso Restringido a Administradores</h2>
          <p className="text-xs text-neutral-400 mb-6">
            Solo el administrador (Pau) puede crear partidos, gestionar convocatorias y publicar actas.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase"
          >
            Iniciar Sesión como Admin
          </button>
        </div>
      ) : (
        <AdminView players={players} onRefresh={refresh} />
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
