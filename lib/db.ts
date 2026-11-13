import { UserAccount, Player, PachangaMatch, PlayerRatingVote, UserRole } from '../types';
import { getGoalsAgainstPoints } from './scoring';
import { supabase } from './supabase';
import { PESO_VOTOS, PESO_STATS, TOPE_OBJ, OBJETIVO_MODO, REDONDEO, PRECIO_COMPRA_INICIAL_MODO, COMPRAS_INICIALES, PRECIO_COMPRA_INICIAL, PRECIO_REDONDEO } from './config';

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

export const egolDb = {
  getCurrentUser(): UserAccount | null {
    const user = getStorage<UserAccount | null>('session_user', null);
    if (user && user.username.toLowerCase() === 'pau') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PREFIX + 'session_user');
      }
      return null;
    }
    return user;
  },

  async getUsers(): Promise<Record<string, { password: string; account: UserAccount }>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      return {};
    }

    const users: Record<string, { password: string; account: UserAccount }> = {};
    data?.forEach((profile: any) => {
      // Como la tabla profiles no tiene password (por seguridad),
      // manejamos esto con cuidado. Para este MVP, asumimos que la
      // lógica de login se validará mediante una clave de acceso.
      users[profile.name.toLowerCase()] = {
        password: '', // En un entorno real, usaríamos Supabase Auth
        account: {
          id: profile.id,
          username: profile.name,
          role: profile.role,
          budget: 100,
          ownedPlayerIds: [],
          starterPlayerIds: [],
          totalPoints: 0,
          lastMatchPoints: 0
        }
      };
    });
    return users;
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
    const cleanUser = username.trim().toLowerCase();

    // En este modelo simplificado, buscamos el perfil en Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', username.trim())
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: 'Usuario no encontrado. Asegúrate de registrarte si es tu primera vez.' };
    }

    const role: UserRole = (data.role === 'admin' || cleanUser === 'pagusa') ? 'admin' : (data.role || 'member');

    const user: UserAccount = {
      id: data.id,
      username: data.name,
      role: role,
      budget: 100,
      ownedPlayerIds: [],
      starterPlayerIds: [],
      totalPoints: data.total_points || 0,
      lastMatchPoints: 0,
      compras_iniciales: 0
    };


    setStorage('session_user', user);
    return { success: true, user };
  },

  async signup(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      return { success: false, message: 'Rellena usuario y contraseña.' };
    }

    // Comprobar si ya existe un perfil con ese nombre en Supabase
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', username.trim())
      .maybeSingle();

    if (existing) {
      const role: UserRole = (existing.role === 'admin' || cleanUser === 'pagusa') ? 'admin' : (existing.role || 'member');
      const user: UserAccount = {
        id: existing.id,
        username: existing.name,
        role: role,
        budget: 100,
        ownedPlayerIds: [],
        starterPlayerIds: [],
        totalPoints: existing.total_points || 0,
        lastMatchPoints: 0
      };
      setStorage('session_user', user);
      return { success: true, user };
    }

    // El check constraint en PostgreSQL profiles_role_check requiere 'admin' o 'member'
    const role = cleanUser === 'pagusa' ? 'admin' : 'member';

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: username.trim(),
        role: role,
        alias: username.trim()
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: 'Error al registrar: ' + error.message };
    }

    const newAccount: UserAccount = {
      id: data.id,
      username: data.name,
      role: data.role,
      budget: 100,
      ownedPlayerIds: [],
      starterPlayerIds: [],
      totalPoints: 0,
      lastMatchPoints: 0,
      compras_iniciales: 0
    };


    setStorage('session_user', newAccount);
    return { success: true, user: newAccount };
  },

  async resetPassword(username: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Nota: En una app real con Supabase Auth, esto sería un flujo de recuperación de email
    return { success: false, message: 'Recuperación de contraseña no disponible en este modo.' };
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREFIX + 'session_user');
    }
  },

  async getPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      isGuest: p.is_guest ?? p.isGuest ?? false,
      avatarUrl: p.avatar_url ?? p.avatarUrl ?? `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80`,
      currentPrice: Number(p.current_price ?? p.currentPrice ?? 20),
      previousPrice: Number(p.previous_price ?? p.previousPrice ?? 20),
      priceChangePct: Number(p.price_change_pct ?? p.priceChangePct ?? 0),
      averageRating: Number(p.average_rating ?? p.averageRating ?? 0),
      ratingsCount: Number(p.ratings_count ?? p.ratingsCount ?? 0),
      stats: p.stats ?? { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 }
    }));
  },

  async savePlayer(player: Player): Promise<void> {
    const { error } = await supabase
      .from('players')
      .upsert({
        id: player.id,
        name: player.name,
        is_guest: player.isGuest,
        avatar_url: player.avatarUrl,
        current_price: player.currentPrice,
        previous_price: player.previousPrice,
        price_change_pct: player.priceChangePct,
        average_rating: player.averageRating,
        ratings_count: player.ratingsCount,
        stats: player.stats
      });
    if (error) console.error('Error saving player:', error);
  },

  async addPlayer(name: string, isGuest: boolean, avatarUrl?: string): Promise<Player> {
    const defaultAvatar = isGuest
      ? `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80`
      : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80`;

    const { data, error } = await supabase
      .from('players')
      .insert({
        name: name.trim(),
        is_guest: isGuest,
        avatar_url: avatarUrl || defaultAvatar,
        current_price: 20,
        previous_price: 20,
        price_change_pct: 0,
        average_rating: 0,
        ratings_count: 0,
        stats: { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 }
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      isGuest: data.is_guest ?? isGuest,
      avatarUrl: data.avatar_url,
      currentPrice: Number(data.current_price ?? 20),
      previousPrice: Number(data.previous_price ?? 20),
      priceChangePct: Number(data.price_change_pct ?? 0),
      averageRating: Number(data.average_rating ?? 0),
      ratingsCount: Number(data.ratings_count ?? 0),
      stats: data.stats || { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 }
    };
  },

  async buyPlayer(userId: string, playerId: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (!player) return { success: false, message: 'Jugador no encontrado.' };

    const price = Number(player.current_price ?? player.currentPrice ?? 20);

    if (currentUser.ownedPlayerIds.includes(playerId)) {
      return { success: false, message: 'Ya tienes a este jugador en tu plantilla.' };
    }

    if (currentUser.ownedPlayerIds.length >= 6) {
      return { success: false, message: 'Límite alcanzado.' };
    }

    if (currentUser.budget < price) {
      return { success: false, message: 'Presupuesto insuficiente.' };
    }

    // Actualizar presupuesto y propiedad
    let actualPrice = price;
    if (currentUser.compras_iniciales < COMPRAS_INICIALES) {
      actualPrice = PRECIO_COMPRA_INICIAL;
    }

    const newBudget = Math.round((currentUser.budget - actualPrice) * 10) / 10;
    currentUser.budget = newBudget;
    currentUser.ownedPlayerIds.push(playerId);

    if (currentUser.starterPlayerIds.length < 5) {
      currentUser.starterPlayerIds.push(playerId);
    }

    if (currentUser.compras_iniciales < COMPRAS_INICIALES) {
      currentUser.compras_iniciales += 1;
    }

    setStorage('session_user', currentUser);
    return { success: true, message: `¡Has fichado a ${player.name}!`, user: currentUser };

  },

  async sellPlayer(userId: string, playerId: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (!player) return { success: false, message: 'Jugador no encontrado.' };

    if (!currentUser.ownedPlayerIds.includes(playerId)) {
      return { success: false, message: 'No tienes a este jugador en tu plantilla.' };
    }

    const price = Number(player.current_price ?? player.currentPrice ?? 20);
    currentUser.budget = Math.round((currentUser.budget + price) * 10) / 10;
    currentUser.ownedPlayerIds = currentUser.ownedPlayerIds.filter(id => id !== playerId);
    currentUser.starterPlayerIds = currentUser.starterPlayerIds.filter(id => id !== playerId);

    setStorage('session_user', currentUser);
    return { success: true, message: `Has vendido a ${player.name}.`, user: currentUser };
  },

  async setStarters(starterIds: string[]): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    if (starterIds.length > 5) {
      return { success: false, message: 'Solo puedes tener como máximo 5 jugadores titulares.' };
    }

    currentUser.starterPlayerIds = starterIds;
    setStorage('session_user', currentUser);
    return { success: true, message: 'Alineación de titulares actualizada.', user: currentUser };
  },

  async getMatches(): Promise<PachangaMatch[]> {
    const { data, error } = await supabase
      .from('pachangas')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      date: m.date ? (typeof m.date === 'string' ? m.date.split('T')[0] : new Date(m.date).toISOString().split('T')[0]) : '',
      startTime: m.start_time || m.startTime || '17:00',
      endTime: m.end_time || m.endTime || '18:30',
      format: m.format || 5,
      status: (m.status as any) || 'upcoming',
      teamA: Array.isArray(m.team_a) ? m.team_a : (Array.isArray(m.teamA) ? m.teamA : []),
      teamB: Array.isArray(m.team_b) ? m.team_b : (Array.isArray(m.teamB) ? m.teamB : []),
      scoreA: m.score_a !== undefined ? m.score_a : m.scoreA,
      scoreB: m.score_b !== undefined ? m.score_b : m.scoreB,
      playerStats: m.player_stats || m.playerStats || {}
    }));
  },

  async getMatch(id: string): Promise<PachangaMatch | undefined> {
    const { data, error } = await supabase
      .from('pachangas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      id: data.id,
      date: data.date ? (typeof data.date === 'string' ? data.date.split('T')[0] : new Date(data.date).toISOString().split('T')[0]) : '',
      startTime: data.start_time || data.startTime || '17:00',
      endTime: data.end_time || data.endTime || '18:30',
      format: data.format || 5,
      status: data.status || 'upcoming',
      teamA: Array.isArray(data.team_a) ? data.team_a : (Array.isArray(data.teamA) ? data.teamA : []),
      teamB: Array.isArray(data.team_b) ? data.team_b : (Array.isArray(data.teamB) ? data.teamB : []),
      scoreA: data.score_a !== undefined ? data.score_a : data.scoreA,
      scoreB: data.score_b !== undefined ? data.score_b : data.scoreB,
      playerStats: data.player_stats || data.playerStats || {}
    };
  },

  async createMatch(payload: { date: string; startTime: string; endTime: string; format: number }): Promise<PachangaMatch> {
    const { data, error } = await supabase
      .from('pachangas')
      .insert({
        date: payload.date,
        start_time: payload.startTime,
        end_time: payload.endTime,
        status: 'upcoming',
        format: payload.format || 5,
        team_a: [],
        team_b: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      throw error;
    }

    return {
      id: data.id,
      date: data.date ? data.date.split('T')[0] : payload.date,
      startTime: data.start_time || payload.startTime,
      endTime: data.end_time || payload.endTime,
      format: data.format || payload.format || 5,
      status: data.status || 'upcoming',
      teamA: [],
      teamB: []
    };
  },

  async updateMatchTeams(matchId: string, teamA: string[], teamB: string[]): Promise<PachangaMatch | undefined> {
    const { data, error } = await supabase
      .from('pachangas')
      .update({ team_a: teamA, team_b: teamB })
      .eq('id', matchId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating match teams:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      date: data.date ? data.date.split('T')[0] : '',
      startTime: data.start_time || '17:00',
      endTime: data.end_time || '18:30',
      format: data.format || 5,
      status: data.status || 'upcoming',
      teamA: data.team_a || teamA,
      teamB: data.team_b || teamB,
      scoreA: data.score_a,
      scoreB: data.score_b
    };
  },

  async updateMatchStatus(matchId: string, status: PachangaMatch['status']): Promise<PachangaMatch | undefined> {
    const { data, error } = await supabase
      .from('pachangas')
      .update({ status })
      .eq('id', matchId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating match status:', error);
      throw error;
    }

    if (!data) return undefined;
    return {
      id: data.id,
      date: data.date ? data.date.split('T')[0] : '',
      startTime: data.start_time || '17:00',
      endTime: data.end_time || '18:30',
      format: data.format || 5,
      status: data.status,
      teamA: data.team_a || [],
      teamB: data.team_b || []
    };
  },

  async recordMatchActa(
    matchId: string,
    scoreA: number,
    scoreB: number,
    stats: Record<string, { goals: number; assists: number; ownGoals: number; rating?: number; saves?: number; goalsAgainst?: number; matchesPlayed?: number; }>
  ): Promise<{ success: boolean; match?: PachangaMatch }> {
    const hasRatings = Object.values(stats).some(st => st.rating !== undefined && Number(st.rating) > 0);
    const newStatus = hasRatings ? 'scored' : 'voting';

    // 1. Actualizar resultado y estado en la tabla pachangas
    const { data: updatedMatch, error: matchErr } = await supabase
      .from('pachangas')
      .update({
        score_a: scoreA,
        score_b: scoreB,
        player_stats: stats,
        status: newStatus
      })
      .eq('id', matchId)
      .select()
      .maybeSingle();

    if (matchErr) {
      console.error('Error updating match with acta:', matchErr);
    }

    // 2. Actualizar estadísticas, nota y precio de cada jugador en la tabla players de Supabase
    try {
      const { data: currentPlayers } = await supabase.from('players').select('*');
      if (currentPlayers) {
        for (const [pId, st] of Object.entries(stats)) {
          const p = currentPlayers.find((item: any) => item.id === pId);
          if (p) {
            const currentStats = p.stats || { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 };
            const newStats = {
              ...currentStats,
              goals: (currentStats.goals || 0) + (st.goals || 0),
              assists: (currentStats.assists || 0) + (st.assists || 0),
              ownGoals: (currentStats.ownGoals || 0) + (st.ownGoals || 0),
              matchesPlayed: (currentStats.matchesPlayed || 0) + 1
            };

            const ratingVal = st.rating !== undefined && Number(st.rating) > 0 ? Number(st.rating) : 0;
            let newRatingsCount = p.ratings_count || 0;
            let newAvgRating = p.average_rating || 0;

            if (ratingVal > 0) {
              const prevTotal = (p.average_rating || 0) * (p.ratings_count || 0);
              newRatingsCount += 1;
              newAvgRating = Math.round(((prevTotal + ratingVal) / newRatingsCount) * 10) / 10;
            }

            // Variación de precio (-15% a +15%)
            const playerPoints = (st.goals * 3) + (st.assists * 1) - (st.ownGoals * 2) + (st.rating > 0 ? st.rating : 6);
            const obj = Math.round(Math.min(TOPE_OBJ, Math.max(0, playerPoints)) / TOPE_OBJ * 10);
            const subj = Math.round(st.rating > 0 ? st.rating : 5);
            const total = obj + subj;

            const allPoints = Object.values(stats).map(s => {
              const pPts = (s.goals * 3) + (s.assists * 1) - (s.ownGoals * 2) + (s.rating > 0 ? s.rating : 6);
              const pObj = Math.round(Math.min(TOPE_OBJ, Math.max(0, pPts)) / TOPE_OBJ * 10);
              const pSubj = Math.round(s.rating > 0 ? s.rating : 5);
              return pObj + pSubj;
            });
            const media_de_la_jornada = allPoints.reduce((a, b) => a + b, 0) / allPoints.length;

            const changePct = Math.min(15, Math.max(-15, Math.round(2.5 * (total - media_de_la_jornada))));
            const currentPrice = Number(p.current_price ?? 20);
            const newPrice = Math.max(8, Math.round((currentPrice * (1 + changePct / 100)) / PRECIO_REDONDEO) * PRECIO_REDONDEO);



            await supabase
              .from('players')
              .update({
                stats: newStats,
                average_rating: newAvgRating,
                ratings_count: newRatingsCount,
                previous_price: currentPrice,
                current_price: newPrice,
                price_change_pct: changePct
              })
              .eq('id', pId);
          }
        }
      }
    } catch (e) {
      console.error('Error updating player stats in Supabase:', e);
    }

    // 3. Actualizar puntos del manager en la sesión actual
    try {
      const winnerTeam = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw';
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.starterPlayerIds && updatedMatch) {
        let matchPoints = 0;
        currentUser.starterPlayerIds.forEach(pId => {
          const st = stats[pId];
          if (st) {
            let pts = (st.goals * 3) + (st.assists * 1) - (st.ownGoals * 2);
            if (st.rating && st.rating > 0) pts += Number(st.rating);
            if (winnerTeam === 'A' && updatedMatch.team_a?.includes(pId)) pts += 3;
            if (winnerTeam === 'B' && updatedMatch.team_b?.includes(pId)) pts += 3;
            if (winnerTeam === 'draw') pts += 1;
            matchPoints += Math.max(0, Math.round(pts));
          }
        });
        currentUser.lastMatchPoints = matchPoints;
        currentUser.totalPoints = (currentUser.totalPoints || 0) + matchPoints;
        setStorage('session_user', currentUser);
      }
    } catch (e) {
      console.warn('Error calculating manager points:', e);
    }

    return { success: !matchErr, match: updatedMatch as any };
  },

  isUserGuest(username?: string | null): boolean {
    if (!username) return false;
    const clean = username.trim().toLowerCase();
    const players = getStorage<Player[]>('players', []);
    if (players.some(p => p.name.toLowerCase() === clean && p.isGuest)) return true;
    return false;
  },

  async submitRatings(matchId: string, voterUsername: string, ratings: Record<string, number>): Promise<{ success: boolean; message: string }> {
    try {
      const { data: currentPlayers } = await supabase.from('players').select('*');
      if (currentPlayers) {
        for (const [pId, ratingVal] of Object.entries(ratings)) {
          const p = currentPlayers.find((item: any) => item.id === pId);
          if (p && Number(ratingVal) > 0) {
            if (p.name.toLowerCase() === voterUsername.toLowerCase()) {
              throw new Error('No puedes votar por ti mismo.');
            }
            const prevTotal = (p.average_rating || 0) * (p.ratings_count || 0);
            const newCount = (p.ratings_count || 0) + 1;
            const newAvg = Math.round(((prevTotal + Number(ratingVal)) / newCount) * 10) / 10;

            await supabase
              .from('players')
              .update({
                average_rating: newAvg,
                ratings_count: newCount
              })
              .eq('id', pId);
          }
        }
      }
      return { success: true, message: '¡Calificaciones guardadas exitosamente!' };
    } catch (e: any) {
      console.error('Error submitting ratings:', e);
      return { success: false, message: 'Error al guardar calificaciones.' };
    }
  },

  async getUserRatingsForMatch(matchId: string, voterUsername: string): Promise<Record<string, number>> {
    return {};
  },

  async getLeaderboard(): Promise<UserAccount[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      username: p.name,
      role: p.role,
      budget: 100,
      ownedPlayerIds: [],
      starterPlayerIds: [],
      totalPoints: p.total_points || 0,
      lastMatchPoints: 0
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  }
};
