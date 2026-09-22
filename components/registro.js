// ============================================================
//  COMPONENTS/REGISTRO.JS — Registro Express de Partido (< 1 min)
// ============================================================

window.RegistroComponent = {
  matchState: null,

  init() {
    this.resetForm();
  },

  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    const dataStore = window.PachangasData;
    // Si no hay equipos previos, tomar los 10 primeros divididos 5 y 5
    const pIds = dataStore.players.slice(0, 10).map(p => p.id);
    const half = Math.ceil(pIds.length / 2);

    this.matchState = {
      date: today,
      teamA: {
        name: 'Equipo Petos',
        score: 0,
        players: pIds.slice(0, half)
      },
      teamB: {
        name: 'Equipo Sin Peto',
        score: 0,
        players: pIds.slice(half)
      },
      playerStats: {}
    };

    // Inicializar stats de cada jugador
    this.matchState.teamA.players.forEach(pId => this.initPlayerStat(pId, 'A'));
    this.matchState.teamB.players.forEach(pId => this.initPlayerStat(pId, 'B'));
  },

  initPlayerStat(pId, team) {
    if (!this.matchState.playerStats[pId]) {
      const player = window.PachangasData.players.find(p => p.id === pId);
      const isNaturalGK = player && player.positions.includes('portero');
      this.matchState.playerStats[pId] = {
        team,
        isGoalkeeper: isNaturalGK,
        goals: 0,
        assists: 0,
        saves: 0,
        goalsConceded: 0,
        ownGoals: 0
      };
    } else {
      this.matchState.playerStats[pId].team = team;
    }
  },

  prefillFromTeams(teamsData) {
    if (!this.matchState) this.resetForm();
    this.matchState.teamA.name = teamsData.teamA.name || 'Equipo Petos';
    this.matchState.teamA.players = [...teamsData.teamA.players];
    this.matchState.teamB.name = teamsData.teamB.name || 'Equipo Sin Peto';
    this.matchState.teamB.players = [...teamsData.teamB.players];

    // Reiniciar stats manteniendo jugadores
    this.matchState.playerStats = {};
    this.matchState.teamA.players.forEach(pId => this.initPlayerStat(pId, 'A'));
    this.matchState.teamB.players.forEach(pId => this.initPlayerStat(pId, 'B'));
  },

  render(container) {
    if (!container) return;
    if (!this.matchState) this.init();

    const dataStore = window.PachangasData;
    const ms = this.matchState;

    // Calcular suma de goles individuales por equipo para comprobación rápida
    let sumGoalsA = 0;
    let sumGoalsB = 0;
    ms.teamA.players.forEach(id => {
      sumGoalsA += (ms.playerStats[id]?.goals || 0) + (ms.playerStats[id]?.ownGoals || 0);
    });
    ms.teamB.players.forEach(id => {
      sumGoalsB += (ms.playerStats[id]?.goals || 0) + (ms.playerStats[id]?.ownGoals || 0);
    });

    container.innerHTML = `
      <div class="registro-view">
        <!-- Barra de Configuración de Fecha -->
        <div class="registro-top-bar">
          <div class="date-picker-wrapper">
            <span class="icon">📅</span>
            <input type="date" id="match-date-input" value="${ms.date}" class="input-date">
          </div>
          <button class="btn-sm btn-ghost" id="btn-reset-match-form" title="Reiniciar formulario">
            🔄 Limpiar
          </button>
        </div>

        <!-- Marcador Central Ultra Rápido -->
        <div class="scoreboard-card">
          <div class="score-team score-team-a">
            <input type="text" class="team-name-input" id="name-team-a" value="${ms.teamA.name}">
            <div class="score-controls">
              <button class="btn-score-dec" data-score-team="A">-</button>
              <span class="score-big-num">${ms.teamA.score}</span>
              <button class="btn-score-inc" data-score-team="A">+</button>
            </div>
            <span class="goals-tally ${sumGoalsA > ms.teamA.score ? 'warn' : ''}">
              ⚽ Registrados: ${sumGoalsA} / ${ms.teamA.score}
            </span>
          </div>

          <div class="score-vs">VS</div>

          <div class="score-team score-team-b">
            <input type="text" class="team-name-input" id="name-team-b" value="${ms.teamB.name}">
            <div class="score-controls">
              <button class="btn-score-dec" data-score-team="B">-</button>
              <span class="score-big-num">${ms.teamB.score}</span>
              <button class="btn-score-inc" data-score-team="B">+</button>
            </div>
            <span class="goals-tally ${sumGoalsB > ms.teamB.score ? 'warn' : ''}">
              ⚽ Registrados: ${sumGoalsB} / ${ms.teamB.score}
            </span>
          </div>
        </div>

        <!-- Desglose de Jugadores y Estadísticas -->
        <div class="match-stats-section">
          <!-- EQUIPO A -->
          <div class="team-roster-box team-a">
            <div class="roster-header">
              <div class="roster-title">
                <span class="roster-bullet a">🎽</span>
                <h4>${ms.teamA.name} (${ms.teamA.players.length})</h4>
              </div>
              <button class="btn-xs btn-outline" id="btn-add-player-a">+ Jugador</button>
            </div>

            <div class="players-stat-cards">
              ${ms.teamA.players.map(pId => this.renderPlayerStatRow(pId, 'A')).join('')}
              ${ms.teamA.players.length === 0 ? '<div class="empty-roster">No hay jugadores en este equipo</div>' : ''}
            </div>
          </div>

          <!-- EQUIPO B -->
          <div class="team-roster-box team-b">
            <div class="roster-header">
              <div class="roster-title">
                <span class="roster-bullet b">👕</span>
                <h4>${ms.teamB.name} (${ms.teamB.players.length})</h4>
              </div>
              <button class="btn-xs btn-outline" id="btn-add-player-b">+ Jugador</button>
            </div>

            <div class="players-stat-cards">
              ${ms.teamB.players.map(pId => this.renderPlayerStatRow(pId, 'B')).join('')}
              ${ms.teamB.players.length === 0 ? '<div class="empty-roster">No hay jugadores en este equipo</div>' : ''}
            </div>
          </div>
        </div>

        <!-- Botón Flotante / Footer de Guardado -->
        <div class="registro-submit-bar">
          <button class="btn btn-primary btn-block btn-lg" id="btn-save-match">
            💾 Guardar Pachanga y Abrir Votación MVP
          </button>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderPlayerStatRow(pId, team) {
    const dataStore = window.PachangasData;
    const player = dataStore.players.find(p => p.id === pId);
    if (!player) return '';

    const stat = this.matchState.playerStats[pId] || {
      isGoalkeeper: false, goals: 0, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0
    };

    // Calcular puntos provisionales
    const isTeamWon = (team === 'A' && this.matchState.teamA.score > this.matchState.teamB.score) ||
                      (team === 'B' && this.matchState.teamB.score > this.matchState.teamA.score);
    let pts = stat.goals + stat.assists + (isTeamWon ? 1 : 0) - stat.ownGoals;
    if (stat.isGoalkeeper) {
      pts += stat.saves - stat.goalsConceded;
    }

    return `
      <div class="player-stat-row" data-stat-id="${pId}">
        <div class="stat-row-top">
          <div class="player-identity">
            <span class="player-emoji">${player.emoji}</span>
            <span class="player-name">${player.name}</span>
          </div>
          <div class="stat-row-top-actions">
            <label class="toggle-gk-label">
              <input type="checkbox" class="chk-is-gk" data-pid="${pId}" ${stat.isGoalkeeper ? 'checked' : ''}>
              <span>🧤 Portero</span>
            </label>
            <span class="preview-pts ${pts >= 0 ? 'pos' : 'neg'}">${pts >= 0 ? '+' : ''}${pts} pts</span>
            <button class="btn-remove-from-match" data-remove-pid="${pId}" title="Quitar de este partido">×</button>
          </div>
        </div>

        <div class="steppers-grid">
          <!-- Goles -->
          <div class="stepper-item">
            <span class="stepper-label">⚽ Goles</span>
            <div class="stepper-control">
              <button class="step-btn" data-field="goals" data-pid="${pId}" data-delta="-1">-</button>
              <span class="step-val">${stat.goals}</span>
              <button class="step-btn" data-field="goals" data-pid="${pId}" data-delta="1">+</button>
            </div>
          </div>

          <!-- Asistencias -->
          <div class="stepper-item">
            <span class="stepper-label">👟 Asist.</span>
            <div class="stepper-control">
              <button class="step-btn" data-field="assists" data-pid="${pId}" data-delta="-1">-</button>
              <span class="step-val">${stat.assists}</span>
              <button class="step-btn" data-field="assists" data-pid="${pId}" data-delta="1">+</button>
            </div>
          </div>

          ${stat.isGoalkeeper ? `
            <!-- Paradas (Solo portero) -->
            <div class="stepper-item gk-item">
              <span class="stepper-label">🧤 Paradas</span>
              <div class="stepper-control">
                <button class="step-btn" data-field="saves" data-pid="${pId}" data-delta="-1">-</button>
                <span class="step-val">${stat.saves}</span>
                <button class="step-btn" data-field="saves" data-pid="${pId}" data-delta="1">+</button>
              </div>
            </div>

            <!-- Goles encajados (Solo portero) -->
            <div class="stepper-item gk-item">
              <span class="stepper-label">🥅 Encajados</span>
              <div class="stepper-control">
                <button class="step-btn" data-field="goalsConceded" data-pid="${pId}" data-delta="-1">-</button>
                <span class="step-val">${stat.goalsConceded}</span>
                <button class="step-btn" data-field="goalsConceded" data-pid="${pId}" data-delta="1">+</button>
              </div>
            </div>
          ` : ''}

          <!-- Autogoles -->
          <div class="stepper-item own-goal-item">
            <span class="stepper-label">⚠️ Autogol</span>
            <div class="stepper-control">
              <button class="step-btn" data-field="ownGoals" data-pid="${pId}" data-delta="-1">-</button>
              <span class="step-val">${stat.ownGoals}</span>
              <button class="step-btn" data-field="ownGoals" data-pid="${pId}" data-delta="1">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    const ms = this.matchState;

    // Fecha
    const dateInput = container.querySelector('#match-date-input');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        ms.date = e.target.value;
      });
    }

    // Nombres de equipos
    const nameA = container.querySelector('#name-team-a');
    if (nameA) {
      nameA.addEventListener('change', (e) => {
        ms.teamA.name = e.target.value.trim() || 'Equipo Petos';
      });
    }
    const nameB = container.querySelector('#name-team-b');
    if (nameB) {
      nameB.addEventListener('change', (e) => {
        ms.teamB.name = e.target.value.trim() || 'Equipo Sin Peto';
      });
    }

    // Marcador rápido (+/-)
    const scoreBtns = container.querySelectorAll('[data-score-team]');
    scoreBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const team = btn.dataset.scoreTeam;
        const isInc = btn.classList.contains('btn-score-inc');
        if (team === 'A') {
          ms.teamA.score = Math.max(0, ms.teamA.score + (isInc ? 1 : -1));
          // Auto-ajustar goles encajados del portero del equipo B si existe
          this.autoUpdateGkConceded('B', ms.teamA.score);
        } else {
          ms.teamB.score = Math.max(0, ms.teamB.score + (isInc ? 1 : -1));
          // Auto-ajustar goles encajados del portero del equipo A si existe
          this.autoUpdateGkConceded('A', ms.teamB.score);
        }
        this.render(container);
      });
    });

    // Checkbox Portero
    const gkCheckboxes = container.querySelectorAll('.chk-is-gk');
    gkCheckboxes.forEach(chk => {
      chk.addEventListener('change', (e) => {
        const pId = chk.dataset.pid;
        if (ms.playerStats[pId]) {
          ms.playerStats[pId].isGoalkeeper = chk.checked;
          if (chk.checked) {
            // Rellenar goles encajados por defecto según el marcador rival
            const team = ms.playerStats[pId].team;
            const rivalScore = team === 'A' ? ms.teamB.score : ms.teamA.score;
            if (ms.playerStats[pId].goalsConceded === 0 && rivalScore > 0) {
              ms.playerStats[pId].goalsConceded = rivalScore;
            }
          }
          this.render(container);
        }
      });
    });

    // Steppers de estadísticas
    const stepBtns = container.querySelectorAll('.step-btn');
    stepBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = btn.dataset.pid;
        const field = btn.dataset.field;
        const delta = parseInt(btn.dataset.delta, 10);
        if (ms.playerStats[pId] && field) {
          const currentVal = ms.playerStats[pId][field] || 0;
          ms.playerStats[pId][field] = Math.max(0, currentVal + delta);
          this.render(container);
        }
      });
    });

    // Quitar jugador del partido
    const removeBtns = container.querySelectorAll('.btn-remove-from-match');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = btn.dataset.removePid;
        ms.teamA.players = ms.teamA.players.filter(id => id !== pId);
        ms.teamB.players = ms.teamB.players.filter(id => id !== pId);
        delete ms.playerStats[pId];
        this.render(container);
      });
    });

    // Añadir jugador al Equipo A
    const btnAddA = container.querySelector('#btn-add-player-a');
    if (btnAddA) {
      btnAddA.addEventListener('click', () => {
        this.openAddPlayerToMatchModal('A', container);
      });
    }

    // Añadir jugador al Equipo B
    const btnAddB = container.querySelector('#btn-add-player-b');
    if (btnAddB) {
      btnAddB.addEventListener('click', () => {
        this.openAddPlayerToMatchModal('B', container);
      });
    }

    // Botón reiniciar
    const btnReset = container.querySelector('#btn-reset-match-form');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Quieres limpiar el formulario de partido?')) {
          this.resetForm();
          this.render(container);
        }
      });
    }

    // Guardar partido
    const btnSave = container.querySelector('#btn-save-match');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveMatch();
      });
    }
  },

  autoUpdateGkConceded(team, rivalScore) {
    const ms = this.matchState;
    const playerIds = team === 'A' ? ms.teamA.players : ms.teamB.players;
    playerIds.forEach(id => {
      if (ms.playerStats[id] && ms.playerStats[id].isGoalkeeper) {
        ms.playerStats[id].goalsConceded = rivalScore;
      }
    });
  },

  openAddPlayerToMatchModal(team, mainContainer) {
    const dataStore = window.PachangasData;
    const ms = this.matchState;
    const currentInMatch = [...ms.teamA.players, ...ms.teamB.players];
    const available = dataStore.players.filter(p => !currentInMatch.includes(p.id));

    if (available.length === 0) {
      window.App.showToast('Todos los jugadores ya están en el partido', 'info');
      return;
    }

    const modalContent = `
      <div class="modal-box">
        <h3>Añadir a ${team === 'A' ? ms.teamA.name : ms.teamB.name}</h3>
        <p class="subtitle">Selecciona un jugador del grupo:</p>
        <div class="add-player-list">
          ${available.map(p => `
            <div class="add-player-item" data-add-id="${p.id}">
              <span class="player-emoji">${p.emoji}</span>
              <span class="player-name">${p.name}</span>
              <button class="btn-xs btn-primary">+ Añadir</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    window.App.openCustomModal(modalContent, (modalEl) => {
      const items = modalEl.querySelectorAll('[data-add-id]');
      items.forEach(it => {
        it.addEventListener('click', () => {
          const pId = it.dataset.addId;
          if (team === 'A') ms.teamA.players.push(pId);
          else ms.teamB.players.push(pId);
          this.initPlayerStat(pId, team);
          window.App.closeModal();
          this.render(mainContainer);
        });
      });
    });
  },

  saveMatch() {
    const ms = this.matchState;
    const allParticipants = [...ms.teamA.players, ...ms.teamB.players];

    if (allParticipants.length < 2) {
      window.App.showToast('Debe haber al menos 2 jugadores en la pachanga', 'error');
      return;
    }

    // Guardar en el DataStore
    const newMatch = window.PachangasData.addMatch({
      date: ms.date,
      teamA: {
        name: ms.teamA.name,
        score: ms.teamA.score,
        players: ms.teamA.players
      },
      teamB: {
        name: ms.teamB.name,
        score: ms.teamB.score,
        players: ms.teamB.players
      },
      playerStats: ms.playerStats
    });

    window.App.showToast('¡Pachanga guardada con éxito! Recalculando SR...', 'success');

    // Resetear formulario para el próximo partido
    this.resetForm();

    // Abrir inmediatamente la votación de MVP
    window.VotacionComponent.openVotingModal(newMatch.id);
  }
};
