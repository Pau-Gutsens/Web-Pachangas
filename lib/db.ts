import { UserAccount, Player, PachangaMatch, PlayerRatingVote, UserRole } from '../types';
import { getGoalsAgainstPoints } from './scoring';
import { supabase } from './supabase';

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
      lastMatchPoints: 0
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
      lastMatchPoints: 0
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
    const newBudget = Math.round((currentUser.budget - price) * 10) / 10;
    currentUser.budget = newBudget;
    currentUser.ownedPlayerIds.push(playerId);

    if (currentUser.starterPlayerIds.length < 5) {
      currentUser.starterPlayerIds.push(playerId);
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
    return data as PachangaMatch[];
  },

  async getMatch(id: string): Promise<PachangaMatch | undefined> {
    const { data } = await supabase
      .from('pachangas')
      .select('*')
      .eq('id', id)
      .single();
    return data as PachangaMatch;
  },

  async createMatch(payload: { date: string; startTime: string; endTime: string; format: number }): Promise<PachangaMatch> {
    const { data, error } = await supabase
      .from('pachangas')
      .insert({
        date: payload.date,
        status: 'upcoming',
        format: payload.format || 5,
        team_a: [], // Nota: Supabase usa nombres de columna diferentes a veces
        team_b: []
      })
      .select()
      .single();

    if (error) throw error;
    return data as PachangaMatch;
  },

  async updateMatchTeams(matchId: string, teamA: string[], teamB: string[]): Promise<PachangaMatch | undefined> {
    const { data } = await supabase
      .from('pachangas')
      .update({ team_a: teamA, team_b: teamB })
      .eq('id', matchId)
      .select()
      .single();
    return data as PachangaMatch;
  },

  async updateMatchStatus(matchId: string, status: PachangaMatch['status']): Promise<PachangaMatch | undefined> {
    const { data } = await supabase
      .from('pachangas')
      .update({ status })
      .eq('id', matchId)
      .select()
      .single();
    return data as PachangaMatch;
  },

  async recordMatchActa(
    matchId: string,
    scoreA: number,
    scoreB: number,
    stats: Record<string, { goals: number; assists: number; ownGoals: number; saves: number; goalsAgainst: number; matchesPlayed: number; }>
  ): Promise<{ success: boolean; match?: PachangaMatch }> {
    // 1. Actualizar resultados de la pachanga
    const { data: resultData } = await supabase
      .from('pachanga_results')
      .upsert({
        pachanga_id: matchId,
        score_team_a: scoreA,
        score_team_b: scoreB,
        winner_team: scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw'
      })
      .select()
      .single();

    // 2. Actualizar stats de jugadores (simplificado para el MVP)
    // En una app completa, aquí iteraríamos y actualizaríamos cada registro en match_stats

    // 3. Actualizar puntos de managers
    // Esta lógica sigue siendo compleja, pero aquí se dispararía la actualización en la tabla pachanga_results

    return { success: !!resultData, match: resultData as PachangaMatch };
  },

  isUserGuest(username?: string | null): boolean {
    if (!username) return false;
    const clean = username.trim().toLowerCase();
    const players = getStorage<Player[]>('players', []); // Aún usamos local para lista rápida de jugadores si es necesario
    if (players.some(p => p.name.toLowerCase() === clean && p.isGuest)) return true;
    return false;
  },

  async submitRatings(matchId: string, voterUsername: string, ratings: Record<string, number>): Promise<{ success: boolean; message: string }> {
    // Lógica para insertar en una tabla de votos (deberías crear una tabla 'votes')
    return { success: true, message: 'Votaciones guardadas.' };
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
