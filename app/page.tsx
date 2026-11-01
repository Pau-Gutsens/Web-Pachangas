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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Pachangas Dashboard</h1>
        <p className="text-gray-600">Welcome to the official Pachanga tracker.</p>
      </header>

      <main>
        {pachangas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">No pachangas found. Check the database or contact an admin.</p>
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
