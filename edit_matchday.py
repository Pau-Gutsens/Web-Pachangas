import re

filepath = r"C:\Users\pguts\OneDrive\Documentos\GitHub\Web-Pachangas\components\MatchDayView.tsx"

# Leer el archivo
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# REEMPLAZO 1: Eliminar todo el modal de "Modo Directo" (desde la sección en vivo hasta el final)
old_direct_mode_section = '''          {/* MODO DIRECTO EN VIVO — ACCESIBLE PARA TODOS LOS USUARIOS CUANDO EL PARTIDO ESTÁ EN JUEGO */}
          {activeMatch.status === 'live' && (
            <div className="p-4 sm:p-5 bg-neutral-950/90 border-b border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Modo Directo (Apuntar en Vivo)
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/30 animate-pulse">
                        En Juego
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Cualquier jugador puede apuntar goles y salvadas. Cada acción se registra con tu usuario y la hora del móvil para su posterior verificación.
                    </p>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleFinishMatch}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>⏹ Finalizar Partido (Pasar a Verificación)</span>
                    </button>

                    <button
                      onClick={handleCancelMatch}
                      className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Cancela este partido y desbloquea el mercado y las alineaciones"
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* BOTONES GIGANTES DE GOL (MODO DIRECTO) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setDirectGoalModal({ team: 'A', step: 'scorer' })}
                  disabled={isEventLoading}
                  className="py-3.5 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>⚽ Gol Equipo A ({activeMatch.teamA?.length || 0})</span>
                </button>

                <button
                  onClick={() => setDirectGoalModal({ team: 'B', step: 'scorer' })}
                  disabled={isEventLoading}
                  className="py-3.5 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>⚽ Gol Equipo B ({activeMatch.teamB?.length || 0})</span>
                </button>
              </div>

              {/* ACCIONES SECUNDARIAS (AUTOGOL, SALVADA, DESHACER) */}
              <div className="flex flex-wrap gap-2 pt-1 items-center">
                <button
                  onClick={() => setDirectOwnGoalModal(true)}
                  disabled={isEventLoading}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>❌ Autogol</span>
                </button>

                <button
                  onClick={() => setDirectSaveModal(true)}
                  disabled={isEventLoading}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🧤 Salvada (+2 pts, máx 3)</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={handleUndoEvent}
                    disabled={isEventLoading}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-700/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>↶ Deshacer Evento</span>
                  </button>
                )}
              </div>

              {/* MODAL DIRECTO GOL (2 TOQUES: GOLEADOR + ASISTENCIA) */}
              {directGoalModal && (
                <div className="p-4 bg-neutral-900 border border-amber-400/40 rounded-2xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black text-xs sm:text-sm text-amber-400 uppercase">
                      {directGoalModal.step === 'scorer'
                        ? `⚽ ¿Quién marcó para el Equipo ${directGoalModal.team}?`
                        : `👟 ¿Quién dio la asistencia?`}
                    </span>
                    <button
                      onClick={() => setDirectGoalModal(null)}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                    >
                      Cancelar ✕
                    </button>
                  </div>

                  {directGoalModal.step === 'scorer' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(() => {
                        const teamFilter = directGoalModal.team === 'A' ? activeMatch.teamA : activeMatch.teamB;
                        const available = teamFilter && teamFilter.length > 0
                          ? players.filter(p => teamFilter.includes(p.id))
                          : players;
                        return available.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setDirectGoalModal(prev => prev ? { ...prev, scorerId: p.id, step: 'assist' } : null)}
                            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                              <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate">{p.name}</span>
                          </button>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(() => {
                          const teamFilter = directGoalModal.team === 'A' ? activeMatch.teamA : activeMatch.teamB;
                          const availableAssist = teamFilter && teamFilter.length > 0
                            ? players.filter(p => teamFilter.includes(p.id) && p.id !== directGoalModal.scorerId)
                            : players.filter(p => p.id !== directGoalModal.scorerId);
                          return availableAssist.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleRecordGoal(directGoalModal.scorerId!, p.id)}
                              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                                <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="truncate">{p.name}</span>
                            </button>
                          ));
                        })()}

                      </div>
                      {(() => {
                        if (directGoalModal.step === 'assist') return null;
                        const available = activeMatch.teamA?.length > 0
                          ? players.filter(p => activeMatch.teamA!.includes(p.id))
                          : players;
                        return <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{available.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setDirectGoalModal(prev => prev ? { ...prev, scorerId: p.id, step: 'assist' } : null)}
                            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                              <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}</div>
                      })()}
                    </div>
                  )}

                  {directGoalModal.step === 'scorer' && (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {(() => {
                          const available = activeMatch.teamA?.length > 0
                            ? players.filter(p => activeMatch.teamA!.includes(p.id))
                            : players;
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {available.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => setDirectGoalModal(prev => prev ? { ...prev, scorerId: p.id, step: 'assist' } : null)}
                                  className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                                    <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="truncate">{p.name}</span>
                                </button>
                              ));
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}

                  {(() => {
                    if (directGoalModal.step === 'scorer') return null;
                    const available = activeMatch.teamA?.length > 0
                      ? players.filter(p => activeMatch.teamA!.includes(p.id))
                      : players;
                    return <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{available.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setDirectGoalModal(prev => prev ? { ...prev, scorerId: p.id, step: 'assist' } : null)}
                        className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                          <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}</div>
                  })()}

                  {/* BOTÓN FINALIZAR EVENTO */}
                  {(() => {
                    if (directGoalModal.step === 'scorer') return null;
                    const teamFilter = directGoalModal.team === 'A' ? activeMatch.teamA : activeMatch.teamB;
                    const availableAssist = teamFilter && teamFilter.length > 0
                      ? players.filter(p => teamFilter.includes(p.id) && p.id !== directGoalModal.scorerId)
                      : players.filter(p => p.id !== directGoalModal.scorerId);
                    return (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleRecordGoal(directGoalModal.scorerId!, undefined)}
                          disabled={isEventLoading}
                          className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs uppercase shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <span>⚽ Gol ({directGoalModal.team === 'A' ? 'Team A' : 'Team B'})</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* MODAL DIRECTO AUTOGOL */}
              {directOwnGoalModal && (
                <div className="p-4 bg-neutral-900 border border-red-500/60 rounded-2xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black text-xs sm:text-sm text-red-500 uppercase">
                      ❌ ¿Quién marcó un Autogol?
                    </span>
                    <button
                      onClick={() => setDirectOwnGoalModal(false)}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                    >
                      Cancelar ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    El jugador marcaría contra su propio equipo (−2 puntos)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleRecordOwnGoal(p.id)}
                        disabled={isEventLoading || p.isGuest}
                        className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                          <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL DIRECTO SALVADA */}
              {directSaveModal && (
                <div className="p-4 bg-neutral-900 border border-amber-500/60 rounded-2xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black text-xs sm:text-sm text-amber-500 uppercase">
                      🧤 ¿Quién realizó una Salvada (+2 pts)?
                    </span>
                    <button
                      onClick={() => setDirectSaveModal(false)}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                    >
                      Cancelar ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Máximo 3 salvadas por jugador en el partido
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleRecordSave(p.id)}
                        disabled={isEventLoading || p.isGuest}
                        className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                          <img src={p.avatarUrl || '/logo.png'} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}'''

new_direct_mode_section = '''          {/* ÚNICO BOTÓN: COMENZAR PARTIDO (admin) */}
          {activeMatch.status === 'live' && (
            <div className="p-4 sm:p-5 bg-neutral-950/90 border-b border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Partido en Vivo
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/30 animate-pulse">
                        En Juego
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      El modo directo se activará automáticamente para todos los participantes cuando el administrador pulse "Comenzar Partido".
                    </p>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <button
                    onClick={handleStartMatchLive}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg cursor-pointer active:scale-98 flex items-center gap-1.5"
                  >
                    <span>▶ Comenzar Partido</span>
                    <ArrowUp className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}'''

content = content.replace(old_direct_mode_section, new_direct_mode_section)

# Escribir el archivo modificado
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Archivo modificado correctamente")
