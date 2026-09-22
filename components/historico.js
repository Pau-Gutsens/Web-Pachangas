// ============================================================
//  COMPONENTS/HISTORICO.JS — Histórico Completo de Pachangas
// ============================================================

window.HistoricoComponent = {
  expandedMatchId: null,

  render(container) {
    if (!container) return;
    const dataStore = window.PachangasData;
    const matches = dataStore.matches;

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-emoji">⚽</span>
          <h3>Aún no hay pachangas registradas</h3>
          <p>Cuando juguéis un partido, pulsa en "Registrar" o "Equipos" para guardarlo en menos de 1 minuto.</p>
          <button class="btn btn-primary" onclick="window.App.navigateTo('registro')">Registrar Primer Partido</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="historico-view">
        <div class="historico-header">
          <div class="title-with-badge">
            <h3>Partidos Jugados</h3>
            <span class="count-badge">${matches.length}</span>
          </div>
          <button class="btn-sm btn-outline" onclick="window.App.navigateTo('registro')">
            + Nuevo Partido
          </button>
        </div>

        <div class="matches-timeline">
          ${matches.map(m => this.renderMatchCard(m)).join('')}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderMatchCard(match) {
    const dataStore = window.PachangasData;
    const isExpanded = this.expandedMatchId === match.id;
    const mvpPlayer = match.mvp ? dataStore.players.find(p => p.id === match.mvp) : null;
    const totalPlayers = (match.teamA.players?.length || 0) + (match.teamB.players?.length || 0);

    // Formatear fecha
    let dateStr = match.date;
    try {
      const d = new Date(match.date + 'T12:00:00');
      dateStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {}

    // Resumen de goleadores
    const scorersA = [];
    const scorersB = [];
    Object.entries(match.playerStats || {}).forEach(([pId, st]) => {
      const p = dataStore.players.find(pl => pl.id === pId);
      if (!p) return;
      if (st.goals > 0) {
        const txt = `${p.name}${st.goals > 1 ? ` (${st.goals})` : ''}`;
        if (st.team === 'A') scorersA.push(txt);
        else scorersB.push(txt);
      }
    });

    return `
      <div class="match-history-card ${isExpanded ? 'expanded' : ''}" data-match-id="${match.id}">
        <!-- Cabecera de la tarjeta -->
        <div class="card-summary" data-toggle-id="${match.id}">
          <div class="card-date-line">
            <span class="match-date">📅 ${dateStr}</span>
            <span class="match-attendees-pill">👥 ${totalPlayers} amigos</span>
          </div>

          <div class="card-score-row">
            <div class="team-meta team-meta-a ${match.teamA.score > match.teamB.score ? 'winner' : ''}">
              <span class="team-dot a">🎽</span>
              <span class="team-name">${match.teamA.name}</span>
            </div>

            <div class="score-display">
              <span class="score-num ${match.teamA.score > match.teamB.score ? 'win' : ''}">${match.teamA.score}</span>
              <span class="score-dash">-</span>
              <span class="score-num ${match.teamB.score > match.teamA.score ? 'win' : ''}">${match.teamB.score}</span>
            </div>

            <div class="team-meta team-meta-b ${match.teamB.score > match.teamA.score ? 'winner' : ''}">
              <span class="team-name">${match.teamB.name}</span>
              <span class="team-dot b">👕</span>
            </div>
          </div>

          <!-- MVP Badge -->
          <div class="card-mvp-row">
            ${mvpPlayer ? `
              <div class="mvp-tag">
                <span>👑 MVP: <strong>${mvpPlayer.name}</strong> ${mvpPlayer.emoji} (+1 SR)</span>
              </div>
            ` : `
              <div class="mvp-tag pending">
                <span>⚠️ MVP sin votar</span>
              </div>
            `}
            <span class="expand-arrow">${isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <!-- Detalle Expandido -->
        ${isExpanded ? `
          <div class="card-details-dropdown">
            <div class="details-grid">
              <!-- Goleadores A -->
              <div class="details-team-col">
                <span class="details-team-title">${match.teamA.name}</span>
                <div class="scorers-list">
                  ⚽ ${scorersA.length > 0 ? scorersA.join(', ') : 'Sin goles anotados'}
                </div>
              </div>

              <!-- Goleadores B -->
              <div class="details-team-col">
                <span class="details-team-title">${match.teamB.name}</span>
                <div class="scorers-list">
                  ⚽ ${scorersB.length > 0 ? scorersB.join(', ') : 'Sin goles anotados'}
                </div>
              </div>
            </div>

            <!-- Tabla detallada de puntos y stats de cada asistente -->
            <div class="details-table-wrap">
              <h5>Desglose de Puntos SR de este partido</h5>
              <div class="details-players-list">
                ${Object.entries(match.playerStats || {}).map(([pId, st]) => {
                  const p = dataStore.players.find(pl => pl.id === pId);
                  if (!p) return '';
                  const calc = dataStore.calculateMatchPointsForPlayer(pId, match);
                  return `
                    <div class="details-player-line">
                      <div class="line-left">
                        <span class="line-emoji">${p.emoji}</span>
                        <span class="line-name">${p.name} ${match.mvp === pId ? '👑' : ''}</span>
                        <span class="line-team-indicator ${st.team === 'A' ? 'a' : 'b'}">${st.team === 'A' ? 'Petos' : 'Sin peto'}</span>
                      </div>
                      <div class="line-mid">
                        ${st.goals > 0 ? `<span class="stat-mini">⚽${st.goals}</span>` : ''}
                        ${st.assists > 0 ? `<span class="stat-mini">👟${st.assists}</span>` : ''}
                        ${st.isGoalkeeper ? `<span class="stat-mini">🧤${st.saves} / 🥅-${st.goalsConceded}</span>` : ''}
                        ${st.ownGoals > 0 ? `<span class="stat-mini neg">⚠️-${st.ownGoals}</span>` : ''}
                        ${calc?.teamWon ? `<span class="stat-mini win">+1W</span>` : ''}
                        ${calc?.isMVP ? `<span class="stat-mini mvp">+1MVP</span>` : ''}
                      </div>
                      <div class="line-right">
                        <span class="match-pts-badge ${calc?.points >= 0 ? 'pos' : 'neg'}">
                          ${calc?.points >= 0 ? '+' : ''}${calc?.points} pts
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Acciones sobre el partido -->
            <div class="match-card-actions">
              <button class="btn-sm btn-outline" data-action-vote="${match.id}">
                🗳️ Votar / Cambiar MVP
              </button>
              <button class="btn-sm btn-danger-ghost" data-action-delete="${match.id}">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  bindEvents(container) {
    // Expandir/colapsar tarjeta
    const toggles = container.querySelectorAll('[data-toggle-id]');
    toggles.forEach(t => {
      t.addEventListener('click', () => {
        const id = t.dataset.toggleId;
        this.expandedMatchId = (this.expandedMatchId === id) ? null : id;
        this.render(container);
      });
    });

    // Votar MVP
    const voteBtns = container.querySelectorAll('[data-action-vote]');
    voteBtns.forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.dataset.actionVote;
        window.VotacionComponent.openVotingModal(id);
      });
    });

    // Eliminar partido
    const delBtns = container.querySelectorAll('[data-action-delete]');
    delBtns.forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.dataset.actionDelete;
        if (confirm('¿Seguro que quieres borrar este partido? Se recalculará el SR de todos los jugadores.')) {
          window.PachangasData.deleteMatch(id);
          window.App.showToast('Partido eliminado', 'info');
          this.render(container);
        }
      });
    });
  }
};
