// ============================================================
//  APP.JS — Controlador Principal de la Web de Pachangas
// ============================================================

window.App = {
  currentPage: 'ranking',

  init() {
    console.log('⚽ Iniciando Web Pachangas...');

    // Inicializar componentes que requieren setup
    if (window.EquiposComponent?.init) window.EquiposComponent.init();
    if (window.RegistroComponent?.init) window.RegistroComponent.init();

    // Enlazar navegación de pestañas
    this.bindNavigation();

    // Modal global
    this.bindModalEvents();

    // Escuchar cambios de datos reactivos
    window.PachangasData.subscribe(() => {
      this.refreshCurrentPage();
    });

    // Cargar página inicial
    this.navigateTo('ranking');
  },

  navigateTo(pageName) {
    this.currentPage = pageName;

    // Actualizar nav items
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    // Actualizar vistas
    document.querySelectorAll('.app-page').forEach(pageEl => {
      pageEl.classList.toggle('active', pageEl.id === `view-${pageName}`);
    });

    // Título y badge en cabecera
    this.updateHeader(pageName);

    // Renderizar componente en su contenedor
    const container = document.getElementById(`view-${pageName}`);
    if (container) {
      if (pageName === 'ranking' && window.RankingComponent) {
        window.RankingComponent.render(container);
      } else if (pageName === 'equipos' && window.EquiposComponent) {
        window.EquiposComponent.render(container);
      } else if (pageName === 'registro' && window.RegistroComponent) {
        window.RegistroComponent.render(container);
      } else if (pageName === 'historico' && window.HistoricoComponent) {
        window.HistoricoComponent.render(container);
      } else if (pageName === 'jugadores' && window.JugadoresComponent) {
        window.JugadoresComponent.render(container);
      }
    }

    // Scroll arriba suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  refreshCurrentPage() {
    this.navigateTo(this.currentPage);
  },

  updateHeader(pageName) {
    const titles = {
      ranking: '🏆 Ranking Pachanguero',
      equipos: '🎽 Formador de Equipos',
      registro: '📝 Registrar Pachanga',
      historico: '📜 Histórico de Partidos',
      jugadores: '👥 Colegas del Grupo'
    };

    const headerTitle = document.getElementById('app-header-title');
    if (headerTitle) {
      headerTitle.textContent = titles[pageName] || '⚽ Pachangas FC';
    }
  },

  bindNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const page = item.dataset.page;
        if (page) this.navigateTo(page);
      });
    });
  },

  // -----------------------------------------------------------
  //  MODALES Y TOASTS
  // -----------------------------------------------------------
  bindModalEvents() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeModal());
    }
  },

  openCustomModal(htmlContent, onMounted) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');

    if (!overlay || !container || !content) return;

    content.innerHTML = htmlContent;
    overlay.classList.add('visible');
    container.classList.add('visible');
    document.body.classList.add('modal-open');

    if (onMounted) {
      onMounted(content);
    }
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    if (overlay) overlay.classList.remove('visible');
    if (container) container.classList.remove('visible');
    document.body.classList.remove('modal-open');
  },

  openPlayerModal(playerId) {
    const dataStore = window.PachangasData;
    const player = dataStore.getPlayerStats(playerId);
    if (!player) return;

    const posBadges = (player.positions || []).map(pos => {
      const cfg = POSITION_LABELS[pos] || { label: pos, emoji: '' };
      return `<span class="pos-badge pos-${pos}">${cfg.emoji} ${cfg.label}</span>`;
    }).join(' ');

    const html = `
      <div class="player-detail-modal">
        <div class="modal-player-header">
          <div class="modal-player-avatar">${player.emoji}</div>
          <div class="modal-player-title">
            <h3>${player.name}</h3>
            <div class="modal-positions">${posBadges}</div>
          </div>
          <div class="modal-sr-box">
            <span class="sr-label">SR</span>
            <span class="sr-val ${player.sr >= 0 ? 'pos' : 'neg'}">${player.sr >= 0 ? '+' : ''}${player.sr.toFixed(2)}</span>
          </div>
        </div>

        <div class="player-stats-matrix">
          <div class="matrix-card">
            <span class="m-val">${player.matchesPlayed}</span>
            <span class="m-lbl">Partidos</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">${player.wins}W - ${player.draws}D - ${player.losses}L</span>
            <span class="m-lbl">${player.winRate}% Vic.</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">⚽ ${player.goals}</span>
            <span class="m-lbl">Goles</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">👟 ${player.assists}</span>
            <span class="m-lbl">Asistencias</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">🧤 ${player.saves}</span>
            <span class="m-lbl">Paradas</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">🥅 ${player.goalsConceded}</span>
            <span class="m-lbl">Goles Encajados</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">⚠️ ${player.ownGoals}</span>
            <span class="m-lbl">Autogoles</span>
          </div>
          <div class="matrix-card highlight">
            <span class="m-val">👑 ${player.mvpCount}</span>
            <span class="m-lbl">Veces MVP</span>
          </div>
          <div class="matrix-card">
            <span class="m-val">📊 ${player.attendanceRate}%</span>
            <span class="m-lbl">Asistencia</span>
          </div>
        </div>

        <div class="sr-breakdown-explanation">
          <h4>Desglose de SR</h4>
          <p>Puntos totales acumulados: <strong>${player.totalPoints}</strong> en <strong>${player.matchesPlayed}</strong> partidos = <strong>${player.sr.toFixed(2)} SR promedio</strong>.</p>
        </div>

        <div class="modal-footer-btns">
          <button class="btn btn-outline btn-block" onclick="window.App.closeModal()">Cerrar</button>
        </div>
      </div>
    `;

    this.openCustomModal(html);
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: '⚽'
    };

    toast.className = `toast toast-${type} visible`;
    toast.innerHTML = `<span>${icons[type] || '⚽'}</span> <span>${message}</span>`;

    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }
};

// Arrancar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
