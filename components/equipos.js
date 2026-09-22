// ============================================================
//  COMPONENTS/EQUIPOS.JS — Formación y Balanceador de Equipos
// ============================================================

window.EquiposComponent = {
  mode: 'auto', // 'auto' | 'manual'
  selectedPlayerIds: [],
  teamA: [],
  teamB: [],

  init() {
    const dataStore = window.PachangasData;
    // Por defecto seleccionar los primeros 10 jugadores para un 5 vs 5
    if (this.selectedPlayerIds.length === 0) {
      this.selectedPlayerIds = dataStore.players.slice(0, 10).map(p => p.id);
    }
    this.recalculateTeams();
  },

  recalculateTeams() {
    const dataStore = window.PachangasData;
    if (this.selectedPlayerIds.length < 2) {
      this.teamA = [...this.selectedPlayerIds];
      this.teamB = [];
      return;
    }

    const balanced = dataStore.balanceTeams(this.selectedPlayerIds);
    this.teamA = balanced.teamA;
    this.teamB = balanced.teamB;
  },

  render(container) {
    if (!container) return;
    const dataStore = window.PachangasData;

    // Calcular promedios actuales de SR
    const teamAStats = this.teamA.map(id => dataStore.getPlayerStats(id)).filter(Boolean);
    const teamBStats = this.teamB.map(id => dataStore.getPlayerStats(id)).filter(Boolean);

    const avgSRA = teamAStats.length > 0 
      ? (teamAStats.reduce((acc, p) => acc + p.sr, 0) / teamAStats.length).toFixed(2) 
      : '0.00';
    const avgSRB = teamBStats.length > 0 
      ? (teamBStats.reduce((acc, p) => acc + p.sr, 0) / teamBStats.length).toFixed(2) 
      : '0.00';
    const diffSR = Math.abs(parseFloat(avgSRA) - parseFloat(avgSRB)).toFixed(2);

    let balanceBadge = '';
    if (parseFloat(diffSR) <= 0.25) {
      balanceBadge = '<span class="balance-tag perfect">⚖️ Partido muy igualado</span>';
    } else if (parseFloat(diffSR) <= 0.6) {
      balanceBadge = '<span class="balance-tag good">👍 Equilibrio aceptable</span>';
    } else {
      balanceBadge = '<span class="balance-tag warn">⚠️ Descompensado</span>';
    }

    container.innerHTML = `
      <div class="equipos-view">
        <!-- Paso 1: Convocatoria del día -->
        <div class="convocatoria-card">
          <div class="convocatoria-header">
            <div>
              <h3>¿Quiénes juegan hoy?</h3>
              <p class="subtitle">${this.selectedPlayerIds.length} jugadores convocados (${this.teamA.length} vs ${this.teamB.length})</p>
            </div>
            <div class="convocatoria-actions">
              <button class="btn-sm btn-ghost" id="btn-select-all">Todos</button>
              <button class="btn-sm btn-ghost" id="btn-clear-all">Limpiar</button>
            </div>
          </div>

          <div class="players-selector-grid">
            ${dataStore.players.map(p => {
              const isSelected = this.selectedPlayerIds.includes(p.id);
              const stats = dataStore.getPlayerStats(p.id);
              return `
                <div class="player-chip ${isSelected ? 'selected' : ''}" data-player-id="${p.id}">
                  <span class="chip-avatar">${p.emoji}</span>
                  <div class="chip-info">
                    <span class="chip-name">${p.name}</span>
                    <span class="chip-sr">${stats.sr >= 0 ? '+' : ''}${stats.sr.toFixed(1)} SR</span>
                  </div>
                  <span class="chip-check">${isSelected ? '✓' : '+'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Selector de Modo: Automático vs Manual -->
        <div class="mode-switch-card">
          <div class="mode-tabs">
            <button class="mode-tab ${this.mode === 'auto' ? 'active' : ''}" id="tab-mode-auto">
              🤖 Reparto Automático
            </button>
            <button class="mode-tab ${this.mode === 'manual' ? 'active' : ''}" id="tab-mode-manual">
              🖐️ Ajuste Manual
            </button>
          </div>
          <p class="mode-hint">
            ${this.mode === 'auto' 
              ? 'El algoritmo reparte buscando igualar el SR total y respetando los porteros y posiciones preferidas.' 
              : 'Pulsa el botón de mover en cualquier jugador para pasarlo de equipo al instante.'}
          </p>
        </div>

        <!-- Comparativa de SR de los Equipos -->
        <div class="teams-comparison-bar">
          <div class="team-bar-side team-a">
            <span class="team-label">PETOS</span>
            <span class="team-sr-val">${avgSRA} SR</span>
          </div>
          <div class="team-bar-center">
            ${balanceBadge}
            <span class="diff-text">Dif: ${diffSR}</span>
          </div>
          <div class="team-bar-side team-b">
            <span class="team-label">SIN PETO</span>
            <span class="team-sr-val">${avgSRB} SR</span>
          </div>
        </div>

        <!-- Los Dos Equipos Formados -->
        <div class="teams-columns-grid">
          <!-- EQUIPO A (Petos) -->
          <div class="team-card team-card-a" id="dropzone-team-a">
            <div class="team-card-header">
              <div class="team-title-row">
                <span class="team-color-indicator a">🎽</span>
                <span class="team-name-text">Equipo Petos</span>
              </div>
              <span class="team-count-badge">${this.teamA.length} jug.</span>
            </div>
            <div class="team-players-list">
              ${teamAStats.map(p => this.renderTeamPlayerRow(p, 'A')).join('')}
              ${teamAStats.length === 0 ? '<div class="empty-team-placeholder">Sin jugadores asignados</div>' : ''}
            </div>
          </div>

          <!-- EQUIPO B (Sin Peto) -->
          <div class="team-card team-card-b" id="dropzone-team-b">
            <div class="team-card-header">
              <div class="team-title-row">
                <span class="team-color-indicator b">👕</span>
                <span class="team-name-text">Equipo Sin Peto</span>
              </div>
              <span class="team-count-badge">${this.teamB.length} jug.</span>
            </div>
            <div class="team-players-list">
              ${teamBStats.map(p => this.renderTeamPlayerRow(p, 'B')).join('')}
              ${teamBStats.length === 0 ? '<div class="empty-team-placeholder">Sin jugadores asignados</div>' : ''}
            </div>
          </div>
        </div>

        <!-- Botón para Iniciar / Registrar Partido con estos Equipos -->
        <div class="equipos-cta-container">
          <button class="btn btn-primary btn-block btn-lg" id="btn-start-match-with-teams" ${this.selectedPlayerIds.length < 2 ? 'disabled' : ''}>
            ⚽ ¡A Jugar! Registrar Partido con estos Equipos
          </button>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderTeamPlayerRow(player, currentTeam) {
    const isGK = player.positions.includes('portero');
    const posLabel = isGK ? '🧤 Portero' : (POSITION_LABELS[player.positions[0]]?.short || 'JUG');
    const targetTeam = currentTeam === 'A' ? 'B' : 'A';
    const moveIcon = currentTeam === 'A' ? '➔' : '⬅';

    return `
      <div class="team-player-row ${isGK ? 'is-goalkeeper' : ''}" data-player-id="${player.id}">
        <div class="player-left">
          <span class="player-emoji">${player.emoji}</span>
          <div class="player-meta">
            <span class="player-name">${player.name}</span>
            <span class="player-pos-tag ${isGK ? 'tag-gk' : ''}">${posLabel}</span>
          </div>
        </div>
        <div class="player-right">
          <span class="player-sr">${player.sr >= 0 ? '+' : ''}${player.sr.toFixed(1)}</span>
          <button class="btn-move-team" title="Pasar a Equipo ${targetTeam}" data-move-id="${player.id}" data-from="${currentTeam}">
            ${moveIcon}
          </button>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // Selección individual de convocados
    const chips = container.querySelectorAll('.player-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const pId = chip.dataset.playerId;
        if (!pId) return;

        if (this.selectedPlayerIds.includes(pId)) {
          this.selectedPlayerIds = this.selectedPlayerIds.filter(id => id !== pId);
          this.teamA = this.teamA.filter(id => id !== pId);
          this.teamB = this.teamB.filter(id => id !== pId);
        } else {
          this.selectedPlayerIds.push(pId);
          // Si estamos en manual, meter en el equipo con menos gente
          if (this.mode === 'manual') {
            if (this.teamA.length <= this.teamB.length) this.teamA.push(pId);
            else this.teamB.push(pId);
          }
        }

        if (this.mode === 'auto') {
          this.recalculateTeams();
        }
        this.render(container);
      });
    });

    // Convocatoria rápida
    const btnSelectAll = container.querySelector('#btn-select-all');
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        this.selectedPlayerIds = window.PachangasData.players.map(p => p.id);
        this.recalculateTeams();
        this.render(container);
      });
    }

    const btnClearAll = container.querySelector('#btn-clear-all');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        this.selectedPlayerIds = [];
        this.teamA = [];
        this.teamB = [];
        this.render(container);
      });
    }

    // Modo selector
    const tabAuto = container.querySelector('#tab-mode-auto');
    if (tabAuto) {
      tabAuto.addEventListener('click', () => {
        this.mode = 'auto';
        this.recalculateTeams();
        this.render(container);
      });
    }

    const tabManual = container.querySelector('#tab-mode-manual');
    if (tabManual) {
      tabManual.addEventListener('click', () => {
        this.mode = 'manual';
        this.render(container);
      });
    }

    // Botones de mover jugador entre equipos
    const moveButtons = container.querySelectorAll('.btn-move-team');
    moveButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.dataset.moveId;
        const from = btn.dataset.from;
        if (!pId || !from) return;

        if (from === 'A') {
          this.teamA = this.teamA.filter(id => id !== pId);
          this.teamB.push(pId);
        } else {
          this.teamB = this.teamB.filter(id => id !== pId);
          this.teamA.push(pId);
        }
        this.mode = 'manual'; // Al tocar a mano se queda en manual
        this.render(container);
      });
    });

    // Iniciar partido con estos equipos
    const btnStart = container.querySelector('#btn-start-match-with-teams');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (this.selectedPlayerIds.length < 2) return;
        window.RegistroComponent.prefillFromTeams({
          teamA: {
            name: 'Equipo Petos',
            players: [...this.teamA]
          },
          teamB: {
            name: 'Equipo Sin Peto',
            players: [...this.teamB]
          }
        });
        window.App.navigateTo('registro');
      });
    }
  }
};
