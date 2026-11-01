"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { RefreshCw, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const [pachangas, setPachangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPachangas() {
      try {
        const data = await db.getPachangas();
        setPachangas(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchPachangas();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl">Loading Pachangas...</span>
      </div>
    );
  }

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Pachangas Dashboard</h1>
          <p className="text-gray-600">Bienvenido al gestor oficial de Pachangas.</p>
        </div>
        <a
          href="/admin"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          Panel Admin / Crear Pachanga
        </a>
      </header>

      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <p className="font-semibold">⚠️ Variables de entorno de Supabase no detectadas</p>
          <p className="text-sm mt-1">
            Asegúrate de agregar <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en los Settings de Vercel.
          </p>
        </div>
      )}

      <main>
        {pachangas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay pachangas registradas</h3>
            <p className="text-gray-500 mb-6">
              Aún no existen pachangas en la base de datos o están por programar.
            </p>
            <a
              href="/admin"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Crear una nueva pachanga en el Admin
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pachangas.map((p: any) => (
              <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{p.date ? new Date(p.date).toLocaleDateString() : 'Date TBD'}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    p.status === 'open' ? 'bg-green-100 text-green-800' :
                    p.status === 'closed' ? 'bg-red-100 text-red-800' :
                    p.status === 'scored' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">Format: {p.format}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">ID: {p.id}</span>
                  <a
                    href={`/admin?id=${p.id}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                  >
                    Manage <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
