// ============================================================
//  COMPONENTS/JUGADORES.JS — Gestión de Jugadores y Perfiles
// ============================================================

window.JugadoresComponent = {
  render(container) {
    if (!container) return;
    const dataStore = window.PachangasData;
    const players = dataStore.getAllPlayersWithStats();

    container.innerHTML = `
      <div class="jugadores-view">
        <div class="jugadores-header">
          <div>
            <h3>Colegas de la Pachanga</h3>
            <p class="subtitle">${players.length} jugadores en el grupo cerrado</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-add-new-player">
            + Añadir Amigo
          </button>
        </div>

        <!-- Lista de Tarjetas de Jugadores -->
        <div class="players-cards-grid">
          ${players.map(p => this.renderPlayerCard(p)).join('')}
        </div>

        <!-- Opciones de Backup y Datos -->
        <div class="data-management-card">
          <h4>💾 Copia de Seguridad y Datos</h4>
          <p class="text-muted">Todos los datos persisten automáticamente en este dispositivo. Puedes exportar o importar una copia para el grupo de WhatsApp.</p>
          <div class="data-actions-row">
            <button class="btn-sm btn-outline" id="btn-export-backup">📤 Exportar Datos (JSON)</button>
            <button class="btn-sm btn-outline" id="btn-import-backup">📥 Importar Datos</button>
            <button class="btn-sm btn-danger-ghost" id="btn-reset-defaults">⚠️ Restaurar Ejemplo</button>
          </div>
          <input type="file" id="file-import-input" style="display:none" accept=".json">
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderPlayerCard(player) {
    const posBadges = (player.positions || []).map(pos => {
      const cfg = POSITION_LABELS[pos] || { label: pos, emoji: '' };
      return `<span class="pos-badge pos-${pos}">${cfg.emoji} ${cfg.label}</span>`;
    }).join('');

    return `
      <div class="player-profile-card" data-profile-id="${player.id}">
        <div class="card-left">
          <div class="player-avatar-circle" onclick="window.App.openPlayerModal('${player.id}')">
            ${player.emoji}
          </div>
          <div class="player-main-data" onclick="window.App.openPlayerModal('${player.id}')">
            <div class="name-line">
              <span class="player-title-name">${player.name}</span>
              ${player.mvpCount > 0 ? `<span class="mvp-tag-small">👑 ${player.mvpCount} MVP</span>` : ''}
            </div>
            <div class="positions-list">
              ${posBadges}
            </div>
          </div>
        </div>

        <div class="card-right">
          <div class="sr-pill-wrap" onclick="window.App.openPlayerModal('${player.id}')">
            <span class="sr-label-mini">SR</span>
            <span class="sr-val-bold">${player.sr >= 0 ? '+' : ''}${player.sr.toFixed(2)}</span>
          </div>
          <button class="btn-edit-player" data-edit-id="${player.id}" title="Editar posiciones o nombre">
            ✏️
          </button>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // Añadir nuevo jugador
    const btnAdd = container.querySelector('#btn-add-new-player');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        this.openPlayerFormModal(null, container);
      });
    }

    // Editar jugador
    const editBtns = container.querySelectorAll('[data-edit-id]');
    editBtns.forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.dataset.editId;
        this.openPlayerFormModal(id, container);
      });
    });

    // Exportar Backup
    const btnExport = container.querySelector('#btn-export-backup');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const json = window.PachangasData.exportBackup();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pachangas_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.App.showToast('Copia exportada con éxito', 'success');
      });
    }

    // Importar Backup
    const btnImport = container.querySelector('#btn-import-backup');
    const fileInput = container.querySelector('#file-import-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = window.PachangasData.importBackup(event.target.result);
          if (success) {
            window.App.showToast('¡Datos importados correctamente!', 'success');
            this.render(container);
          } else {
            window.App.showToast('Error al importar el archivo JSON', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Restaurar valores por defecto
    const btnReset = container.querySelector('#btn-reset-defaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Restaurar los jugadores y partidos de ejemplo? Los datos actuales se sobreescribirán.')) {
          window.PachangasData.resetToDefaults();
          window.App.showToast('Datos de ejemplo restaurados', 'info');
          this.render(container);
        }
      });
    }
  },

  // Modal para Crear o Editar Jugador
  openPlayerFormModal(playerId, mainContainer) {
    const dataStore = window.PachangasData;
    const isEdit = !!playerId;
    const player = isEdit ? dataStore.players.find(p => p.id === playerId) : null;

    const emojis = ['⚽', '🔥', '⚡', '🧤', '🛡️', '⚙️', '🦁', '🧱', '🌪️', '🎯', '🚀', '💪', '🎩', '⭐', '🏆', '💎'];
    const currentEmoji = player?.emoji || emojis[0];
    const currentName = player?.name || '';
    const currentPositions = player?.positions || ['centrocampista'];

    const html = `
      <div class="modal-box">
        <h3>${isEdit ? 'Editar Jugador' : 'Añadir Nuevo Amigo'}</h3>
        <p class="subtitle">Configura su nombre y hasta 3 posiciones preferidas</p>

        <div class="form-group">
          <label>Nombre o Apodo:</label>
          <input type="text" id="player-form-name" class="input-text" value="${currentName}" placeholder="Ej: Pol, Xavi, Mágico...">
        </div>

        <div class="form-group">
          <label>Avatar / Emoji:</label>
          <div class="emoji-picker-grid">
            ${emojis.map(em => `
              <button class="emoji-opt-btn ${em === currentEmoji ? 'active' : ''}" data-emoji="${em}">${em}</button>
            `).join('')}
          </div>
          <input type="hidden" id="player-form-emoji" value="${currentEmoji}">
        </div>

        <div class="form-group">
          <label>Posiciones Preferidas (máximo 3):</label>
          <div class="positions-chk-group">
            ${Object.entries(POSITION_LABELS).map(([posKey, posData]) => {
              const isChecked = currentPositions.includes(posKey);
              return `
                <label class="pos-checkbox-label ${isChecked ? 'checked' : ''}">
                  <input type="checkbox" class="chk-pos-item" value="${posKey}" ${isChecked ? 'checked' : ''}>
                  <span>${posData.emoji} ${posData.label}</span>
                </label>
              `;
            }).join('')}
          </div>
          <small class="form-hint">El reparto automático usará estas posiciones para equilibrar los equipos.</small>
        </div>

        <div class="modal-form-actions">
          ${isEdit ? `
            <button class="btn btn-danger-ghost" id="btn-delete-player-action">Eliminar Amigo</button>
          ` : ''}
          <button class="btn btn-primary btn-block" id="btn-save-player-action">
            ${isEdit ? 'Guardar Cambios' : 'Crear Jugador'}
          </button>
        </div>
      </div>
    `;

    window.App.openCustomModal(html, (modalEl) => {
      // Selector de emoji
      let selectedEmoji = currentEmoji;
      const emojiBtns = modalEl.querySelectorAll('.emoji-opt-btn');
      emojiBtns.forEach(eb => {
        eb.addEventListener('click', () => {
          emojiBtns.forEach(b => b.classList.remove('active'));
          eb.classList.add('active');
          selectedEmoji = eb.dataset.emoji;
        });
      });

      // Límite de 3 posiciones
      const posCheckboxes = modalEl.querySelectorAll('.chk-pos-item');
      posCheckboxes.forEach(chk => {
        chk.addEventListener('change', () => {
          const checkedCount = modalEl.querySelectorAll('.chk-pos-item:checked').length;
          if (checkedCount > 3) {
            chk.checked = false;
            window.App.showToast('Máximo 3 posiciones preferidas', 'warning');
          }
          chk.closest('.pos-checkbox-label').classList.toggle('checked', chk.checked);
        });
      });

      // Guardar
      const btnSave = modalEl.querySelector('#btn-save-player-action');
      btnSave.addEventListener('click', () => {
        const nameVal = modalEl.querySelector('#player-form-name').value.trim();
        if (!nameVal) {
          window.App.showToast('Introduce un nombre para el jugador', 'error');
          return;
        }

        const selectedPositions = [];
        modalEl.querySelectorAll('.chk-pos-item:checked').forEach(c => {
          selectedPositions.push(c.value);
        });

        if (selectedPositions.length === 0) {
          selectedPositions.push('centrocampista');
        }

        if (isEdit) {
          dataStore.updatePlayer(playerId, {
            name: nameVal,
            emoji: selectedEmoji,
            positions: selectedPositions
          });
          window.App.showToast(`Jugador ${nameVal} actualizado`, 'success');
        } else {
          dataStore.addPlayer({
            name: nameVal,
            emoji: selectedEmoji,
            positions: selectedPositions
          });
          window.App.showToast(`¡${nameVal} añadido al grupo!`, 'success');
        }

        window.App.closeModal();
        this.render(mainContainer);
      });

      // Eliminar
      const btnDelete = modalEl.querySelector('#btn-delete-player-action');
      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          if (confirm(`¿Eliminar a ${player.name} del grupo? Sus estadísticas históricas se mantendrán en los partidos ya jugados.`)) {
            dataStore.deletePlayer(playerId);
            window.App.showToast('Jugador eliminado', 'info');
            window.App.closeModal();
            this.render(mainContainer);
          }
        });
      }
    });
  }
};
