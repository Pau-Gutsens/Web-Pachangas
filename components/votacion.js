// ============================================================
//  COMPONENTS/VOTACION.JS — Votación Post-Partido de MVP
// ============================================================

window.VotacionComponent = {
  currentMatchId: null,

  openVotingModal(matchId) {
    this.currentMatchId = matchId;
    const dataStore = window.PachangasData;
    const match = dataStore.matches.find(m => m.id === matchId);
    if (!match) return;

    this.renderModalContent();
  },

  renderModalContent() {
    const dataStore = window.PachangasData;
    const match = dataStore.matches.find(m => m.id === this.currentMatchId);
    if (!match) return;

    const attendeesIds = [...match.teamA.players, ...match.teamB.players];
    const attendees = attendeesIds.map(id => {
      const p = dataStore.players.find(pl => pl.id === id);
      const st = match.playerStats[id] || {};
      return { ...p, stats: st };
    }).filter(Boolean);

    // Contabilizar votos existentes
    const votesTally = {};
    attendeesIds.forEach(id => { votesTally[id] = 0; });
    if (match.mvpVotes) {
      Object.values(match.mvpVotes).forEach(candId => {
        votesTally[candId] = (votesTally[candId] || 0) + 1;
      });
    }

    const totalVotes = match.mvpVotes ? Object.keys(match.mvpVotes).length : 0;
    const currentMvpPlayer = match.mvp ? dataStore.players.find(p => p.id === match.mvp) : null;

    const html = `
      <div class="voting-modal-box">
        <div class="voting-header">
          <div class="crown-badge">👑</div>
          <h3>Votación MVP del Partido</h3>
          <p class="subtitle">
            ${match.teamA.name} <strong>${match.teamA.score} - ${match.teamB.score}</strong> ${match.teamB.name} (${match.date})
          </p>
        </div>

        ${currentMvpPlayer ? `
          <div class="current-mvp-banner">
            <span class="mvp-banner-icon">🏆</span>
            <div>
              <span class="mvp-banner-title">MVP Actual: <strong>${currentMvpPlayer.name}</strong> ${currentMvpPlayer.emoji}</span>
              <span class="mvp-banner-sub">+1 punto extra sumado a su SR</span>
            </div>
          </div>
        ` : `
          <p class="voting-instruction">
            Cada asistente tiene 1 voto. ¡Elige quién fue el mejor de la pachanga!
          </p>
        `}

        <!-- Progreso de votos -->
        <div class="votes-progress-bar-wrap">
          <div class="votes-count-label">
            <span>Votos emitidos: <strong>${totalVotes} / ${attendeesIds.length}</strong></span>
          </div>
        </div>

        <!-- Lista de Candidatos -->
        <div class="mvp-candidates-list">
          ${attendees.map(player => {
            const vCount = votesTally[player.id] || 0;
            const isWinner = match.mvp === player.id;
            const statText = [
              player.stats.goals > 0 ? `${player.stats.goals} ⚽` : '',
              player.stats.assists > 0 ? `${player.stats.assists} 👟` : '',
              player.stats.saves > 0 ? `${player.stats.saves} 🧤` : ''
            ].filter(Boolean).join(' · ');

            return `
              <div class="candidate-card ${isWinner ? 'is-mvp-winner' : ''}" data-candidate-id="${player.id}">
                <div class="candidate-left">
                  <span class="candidate-emoji">${player.emoji}</span>
                  <div class="candidate-meta">
                    <span class="candidate-name">${player.name} ${isWinner ? '👑' : ''}</span>
                    <span class="candidate-stats">${statText || 'Buen despliegue'}</span>
                  </div>
                </div>

                <div class="candidate-right">
                  <span class="votes-counter-badge">${vCount} voto${vCount === 1 ? '' : 's'}</span>
                  <button class="btn-vote-candidate" data-vote-for="${player.id}">
                    ${isWinner ? 'Ganador' : 'Votar'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Acciones Rápidas -->
        <div class="voting-footer-actions">
          <button class="btn btn-secondary btn-block" id="btn-close-voting">
            Listo / Ir al Ranking
          </button>
        </div>
      </div>
    `;

    window.App.openCustomModal(html, (modalEl) => {
      // Evento votar por un candidato
      const voteBtns = modalEl.querySelectorAll('[data-vote-for]');
      voteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const candId = btn.dataset.voteFor;
          this.castVote(candId);
        });
      });

      // Cerrar y refrescar
      const btnClose = modalEl.querySelector('#btn-close-voting');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          window.App.closeModal();
          window.App.navigateTo('ranking');
        });
      }
    });
  },

  castVote(candidateId) {
    const dataStore = window.PachangasData;
    const match = dataStore.matches.find(m => m.id === this.currentMatchId);
    if (!match) return;

    // Asignar voto o designación directa de MVP
    // Para facilitar la experiencia entre amigos sin requerir logins complejos,
    // cada toque a "Votar" suma un voto. Si se desea consagrar, el que tenga más votos queda como MVP.
    const voterFakeId = 'voter_' + Date.now();
    dataStore.recordMvpVote(this.currentMatchId, voterFakeId, candidateId);

    const winner = dataStore.players.find(p => p.id === candidateId);
    window.App.showToast(`¡Voto registrado para ${winner ? winner.name : 'jugador'}!`, 'success');

    // Re-renderizar modal con los nuevos votos
    this.renderModalContent();
  }
};
