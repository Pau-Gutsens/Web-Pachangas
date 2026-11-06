"use client";

import React, { useState } from 'react';
import { egolDb } from '../lib/db';
import { Eye, EyeOff, Lock, User, KeyRound, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'login') {
      const res = egolDb.login(username, password);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Error al iniciar sesión.');
      }
    } else if (mode === 'signup') {
      const res = egolDb.signup(username, password);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Error al registrarte.');
      }
    } else if (mode === 'forgot') {
      const res = egolDb.resetPassword(username, password);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setMode('login'), 2000);
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-md w-full relative text-white">
        {/* Logo EGOL */}
        <div className="text-center mb-6">
          <div className="w-16 h-20 mx-auto relative mb-3">
            <img
              src="/logo.png"
              alt="EGOL Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-black text-white uppercase">
            {mode === 'login' ? 'Iniciar Sesión' : mode === 'signup' ? 'Crear Cuenta' : 'Recuperar Contraseña'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-neutral-800 border border-neutral-700 text-red-300 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Pagusa, Marcos..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-neutral-400" />
              {mode === 'forgot' ? 'Nueva Contraseña' : 'Contraseña'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 pr-10 rounded-xl focus:outline-none focus:border-amber-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase tracking-wider rounded-xl transition text-xs mt-2"
          >
            {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear Cuenta' : 'Guardar Nueva Contraseña'}
          </button>
        </form>

        {/* Links para cambiar de modo */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-col gap-2 text-center text-xs text-neutral-400">
          {mode === 'login' ? (
            <>
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className="hover:text-white transition"
              >
                ¿No tienes cuenta? <strong className="text-amber-400">Regístrate</strong>
              </button>
              <button
                onClick={() => { setMode('forgot'); setError(''); }}
                className="text-neutral-500 hover:text-neutral-300 transition"
              >
                ¿Has olvidado la contraseña?
              </button>
            </>
          ) : mode === 'signup' ? (
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="hover:text-white transition"
            >
              ¿Ya tienes cuenta? <strong className="text-amber-400">Inicia sesión</strong>
            </button>
          ) : (
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="hover:text-white transition"
            >
              ← Volver a Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

