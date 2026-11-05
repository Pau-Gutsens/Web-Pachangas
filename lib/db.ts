import { UserAccount, Player, PachangaMatch, PlayerRatingVote } from '../types';
import { INITIAL_PLAYERS } from './seed';

const PREFIX = 'egol_fantasy_';

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

// Initial Admin User (Pau)
const DEFAULT_USERS: Record<string, { password: string; account: UserAccount }> = {
  pau: {
    password: '123',
    account: {
      id: 'u-pau',
      username: 'Pau',
      role: 'admin',
      budget: 100, // 100 Millones
      ownedPlayerIds: [],
      starterPlayerIds: [],
      totalPoints: 0,
      lastMatchPoints: 0
    }
  }
};

export const egolDb = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  getCurrentUser(): UserAccount | null {
    return getStorage<UserAccount | null>('session_user', null);
  },

  login(username: string, password: string): { success: boolean; user?: UserAccount; message?: string } {
    const cleanUser = username.trim().toLowerCase();
    const users = getStorage('users', DEFAULT_USERS);

    if (!users[cleanUser]) {
      return { success: false, message: 'Usuario no encontrado. Regístrate primero.' };
    }

    if (users[cleanUser].password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    const user = users[cleanUser].account;
    setStorage('session_user', user);
    return { success: true, user };
  },

  signup(username: string, password: string): { success: boolean; user?: UserAccount; message?: string } {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      return { success: false, message: 'Rellena usuario y contraseña.' };
    }

    const users = getStorage('users', DEFAULT_USERS);
    if (users[cleanUser]) {
      return { success: false, message: 'Este nombre de usuario ya existe. Inicia sesión.' };
    }

    const isAdmin = cleanUser === 'pau';

    const newAccount: UserAccount = {
      id: 'u-' + Math.random().toString(36).substring(2, 9),
      username: username.trim(),
      role: isAdmin ? 'admin' : 'user',
      budget: 100, // Cada usuario empieza con 100 millones
      ownedPlayerIds: [],
      starterPlayerIds: [],
      totalPoints: 0,
      lastMatchPoints: 0
    };

    users[cleanUser] = {
      password,
      account: newAccount
    };

    setStorage('users', users);
    setStorage('session_user', newAccount);
    return { success: true, user: newAccount };
  },

  resetPassword(username: string, newPassword: string): { success: boolean; message: string } {
    const cleanUser = username.trim().toLowerCase();
    const users = getStorage('users', DEFAULT_USERS);

    if (!users[cleanUser]) {
      return { success: false, message: 'No existe ningún usuario con ese nombre.' };
    }

    users[cleanUser].password = newPassword;
    setStorage('users', users);
    return { success: true, message: 'Contraseña cambiada con éxito. Ya puedes iniciar sesión.' };
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREFIX + 'session_user');
    }
  },

  // ==========================================
  // PLAYERS & MARKET
  // ==========================================
  getPlayers(): Player[] {
    return getStorage<Player[]>('players', INITIAL_PLAYERS);
  },

  savePlayer(player: Player): void {
    const players = this.getPlayers();
    const idx = players.findIndex(p => p.id === player.id);
    if (idx >= 0) players[idx] = player;
    else players.push(player);
    setStorage('players', players);
  },

  addPlayer(name: string, isGuest: boolean, avatarUrl?: string): Player {
    const players = this.getPlayers();
    const newPlayer: Player = {
      id: 'p-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      isGuest,
      avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80`,
      currentPrice: 20, // 20 Millones iniciales
      previousPrice: 20,
      priceChangePct: 0,
      averageRating: 7.0,
      ratingsCount: 0,
      stats: { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 }
    };

    players.push(newPlayer);
    setStorage('players', players);
    return newPlayer;
  },

  // ==========================================
  // USER TEAM: BUY / SELL / STARTERS
  // ==========================================
  buyPlayer(userId: string, playerId: string): { success: boolean; message: string; user?: UserAccount } {
    const users = getStorage('users', DEFAULT_USERS);
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Jugador no encontrado.' };

    if (currentUser.ownedPlayerIds.includes(playerId)) {
      return { success: false, message: 'Ya tienes a este jugador en tu plantilla.' };
    }

    if (currentUser.ownedPlayerIds.length >= 6) {
      return { success: false, message: 'Límite alcanzado: máximo 6 jugadores comprados en total (5 titulares + 1 reserva).' };
    }

    if (currentUser.budget < player.currentPrice) {
      return { success: false, message: `Presupuesto insuficiente. Tienes ${currentUser.budget}M€ y cuesta ${player.currentPrice}M€.` };
    }

    currentUser.budget = Math.round((currentUser.budget - player.currentPrice) * 10) / 10;
    currentUser.ownedPlayerIds.push(playerId);

    // Si tiene menos de 5 titulares, añadirlo a titulares automáticamente
    if (currentUser.starterPlayerIds.length < 5) {
      currentUser.starterPlayerIds.push(playerId);
    }

    // Guardar usuario
    const cleanUser = currentUser.username.toLowerCase();
    users[cleanUser].account = currentUser;
    setStorage('users', users);
    setStorage('session_user', currentUser);

    return { success: true, message: `¡Has fichado a ${player.name} por ${player.currentPrice}M€!`, user: currentUser };
  },

  sellPlayer(userId: string, playerId: string): { success: boolean; message: string; user?: UserAccount } {
    const users = getStorage('users', DEFAULT_USERS);
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Jugador no encontrado.' };

    if (!currentUser.ownedPlayerIds.includes(playerId)) {
      return { success: false, message: 'No tienes a este jugador en tu plantilla.' };
    }

    currentUser.budget = Math.round((currentUser.budget + player.currentPrice) * 10) / 10;
    currentUser.ownedPlayerIds = currentUser.ownedPlayerIds.filter(id => id !== playerId);
    currentUser.starterPlayerIds = currentUser.starterPlayerIds.filter(id => id !== playerId);

    // Guardar usuario
    const cleanUser = currentUser.username.toLowerCase();
    users[cleanUser].account = currentUser;
    setStorage('users', users);
    setStorage('session_user', currentUser);

    return { success: true, message: `Has vendido a ${player.name} por ${player.currentPrice}M€.`, user: currentUser };
  },

  setStarters(starterIds: string[]): { success: boolean; message: string; user?: UserAccount } {
    const users = getStorage('users', DEFAULT_USERS);
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    if (starterIds.length > 5) {
      return { success: false, message: 'Solo puedes tener como máximo 5 jugadores titulares en el partido.' };
    }

    currentUser.starterPlayerIds = starterIds;
    const cleanUser = currentUser.username.toLowerCase();
    users[cleanUser].account = currentUser;
    setStorage('users', users);
    setStorage('session_user', currentUser);

    return { success: true, message: 'Alineación de titulares actualizada.', user: currentUser };
  },

  // ==========================================
  // MATCHES & CONVOCATORIAS
  // ==========================================
  getMatches(): PachangaMatch[] {
    return getStorage<PachangaMatch[]>('matches', []);
  },

  getMatch(id: string): PachangaMatch | undefined {
    return this.getMatches().find(m => m.id === id);
  },

  createMatch(payload: { date: string; startTime: string; endTime: string; format: number }): PachangaMatch {
    const matches = this.getMatches();
    const newMatch: PachangaMatch = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      date: payload.date,
      startTime: payload.startTime, // ej: "17:00"
      endTime: payload.endTime,     // ej: "18:30"
      format: payload.format || 5,
      status: 'upcoming',
      teamA: [],
      teamB: []
    };

    matches.unshift(newMatch);
    setStorage('matches', matches);
    return newMatch;
  },

  updateMatchTeams(matchId: string, teamA: string[], teamB: string[]): PachangaMatch | undefined {
    const matches = this.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return undefined;

    match.teamA = teamA;
    match.teamB = teamB;
    setStorage('matches', matches);
    return match;
  },

  updateMatchStatus(matchId: string, status: PachangaMatch['status']): PachangaMatch | undefined {
    const matches = this.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return undefined;

    match.status = status;
    setStorage('matches', matches);
    return match;
  },

  // ==========================================
  // MATCH ACTA & POST-MATCH SCORING
  // ==========================================
  recordMatchActa(
    matchId: string,
    scoreA: number,
    scoreB: number,
    stats: Record<string, {
      goals: number;
      assists: number;
      ownGoals: number;
      saves: number;
      goalsAgainst: number;
    }>
  ): { success: boolean; match?: PachangaMatch } {
    const matches = this.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false };

    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.playerStats = stats;
    match.status = 'voting'; // Abre las votaciones 1-10
    setStorage('matches', matches);

    // Actualizar estadísticas acumuladas de jugadores
    const players = this.getPlayers();
    Object.entries(stats).forEach(([pId, st]) => {
      const p = players.find(pl => pl.id === pId);
      if (p) {
        p.stats.goals += st.goals;
        p.stats.assists += st.assists;
        p.stats.ownGoals += st.ownGoals;
        p.stats.saves += st.saves;
        p.stats.goalsAgainst += st.goalsAgainst;
        p.stats.matchesPlayed += 1;

        // Actualización dinámica de precio y porcentaje
        const pointsPerformance = (st.goals * 1.5) + (st.assists * 1.0) + (st.saves * 0.5) - (st.ownGoals * 1.0) - (st.goalsAgainst * 0.3);
        const changePercent = Math.min(25, Math.max(-20, pointsPerformance * 2));
        p.previousPrice = p.currentPrice;
        const newPrice = Math.max(8, Math.round((p.currentPrice * (1 + changePercent / 100)) * 10) / 10);
        p.priceChangePct = Math.round(((newPrice - p.previousPrice) / p.previousPrice) * 1000) / 10;
        p.currentPrice = newPrice;
      }
    });
    setStorage('players', players);

    // Calcular puntos de fantasy para los usuarios según sus titulares
    const winnerTeam = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw';
    const users = getStorage('users', DEFAULT_USERS);

    Object.values(users).forEach(u => {
      let matchPoints = 0;
      u.account.starterPlayerIds.forEach(pId => {
        const playerStat = stats[pId];
        if (playerStat) {
          // Goles +3, Asistencias +2, Paradas +1, Goles en contra -0.5, Autogol -2
          let pts = (playerStat.goals * 3) + (playerStat.assists * 2) + (playerStat.saves * 1) - (playerStat.ownGoals * 2) - (playerStat.goalsAgainst * 0.5);

          // Bono por victoria si su equipo ganó
          if (winnerTeam === 'A' && match.teamA.includes(pId)) pts += 2;
          if (winnerTeam === 'B' && match.teamB.includes(pId)) pts += 2;

          matchPoints += pts;
        }
      });

      u.account.lastMatchPoints = Math.round(matchPoints);
      u.account.totalPoints += Math.round(matchPoints);
    });
    setStorage('users', users);

    // Actualizar sesión actual
    const currentSession = this.getCurrentUser();
    if (currentSession && users[currentSession.username.toLowerCase()]) {
      setStorage('session_user', users[currentSession.username.toLowerCase()].account);
    }

    return { success: true, match };
  },

  // ==========================================
  // COMMUNITY PLAYER RATINGS (1 al 10)
  // ==========================================
  submitRatings(matchId: string, voterUsername: string, ratings: Record<string, number>): { success: boolean; message: string } {
    const allVotes = getStorage<PlayerRatingVote[]>('rating_votes', []);
    
    // Filtrar votos previos de este votante en este partido para no duplicar
    const filtered = allVotes.filter(v => !(v.pachangaId === matchId && v.voterUsername.toLowerCase() === voterUsername.toLowerCase()));

    Object.entries(ratings).forEach(([targetPlayerId, val]) => {
      filtered.push({
        id: 'v-' + Math.random().toString(36).substring(2, 9),
        pachangaId: matchId,
        voterUsername,
        targetPlayerId,
        rating: Math.min(10, Math.max(1, Number(val)))
      });
    });

    setStorage('rating_votes', filtered);

    // Recalcular medias en los jugadores
    const players = this.getPlayers();
    players.forEach(p => {
      const playerVotes = filtered.filter(v => v.targetPlayerId === p.id);
      if (playerVotes.length > 0) {
        const avg = playerVotes.reduce((sum, v) => sum + v.rating, 0) / playerVotes.length;
        p.averageRating = Math.round(avg * 10) / 10;
        p.ratingsCount = playerVotes.length;
      }
    });
    setStorage('players', players);

    return { success: true, message: '¡Calificaciones guardadas! La nota media de los jugadores ha sido actualizada.' };
  },

  getUserRatingsForMatch(matchId: string, voterUsername: string): Record<string, number> {
    const allVotes = getStorage<PlayerRatingVote[]>('rating_votes', []);
    const userVotes = allVotes.filter(v => v.pachangaId === matchId && v.voterUsername.toLowerCase() === voterUsername.toLowerCase());
    const res: Record<string, number> = {};
    userVotes.forEach(v => {
      res[v.targetPlayerId] = v.rating;
    });
    return res;
  },

  // ==========================================
  // LEADERBOARD
  // ==========================================
  getLeaderboard(): UserAccount[] {
    const users = getStorage('users', DEFAULT_USERS);
    return Object.values(users)
      .map(u => u.account)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }
};
