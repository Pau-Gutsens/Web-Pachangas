import { UserAccount, Player, PachangaMatch, UserRole, CorrectionRequest, LineupSnapshot, MatchEvent } from '../types';
import { calculateMatchScores, calculateManagerPoints } from './scoring';
import { supabase } from './supabase';
import { TITULARES, MAX_PLANTILLA } from './config';

const PREFIX = 'egol_fantasy_';

export function computeStatsAndScoreFromEvents(
  events: MatchEvent[],
  allPlayerIds: string[]
): {
  scoreA: number;
  scoreB: number;
  stats: Record<string, { goals: number; assists: number; ownGoals: number; saves: number }>;
} {
  let scoreA = 0;
  let scoreB = 0;
  const stats: Record<string, { goals: number; assists: number; ownGoals: number; saves: number }> = {};

  for (const id of allPlayerIds) {
    stats[id] = { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
  }

  for (const ev of events) {
    if (!stats[ev.playerId]) {
      stats[ev.playerId] = { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
    }
    if (ev.assistantId && !stats[ev.assistantId]) {
      stats[ev.assistantId] = { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
    }

    if (ev.type === 'goal') {
      if (ev.team === 'A') scoreA++;
      else scoreB++;
      stats[ev.playerId].goals++;
      if (ev.assistantId) {
        stats[ev.assistantId].assists++;
      }
    } else if (ev.type === 'own_goal') {
      if (ev.team === 'A') scoreB++;
      else scoreA++;
      stats[ev.playerId].ownGoals++;
    } else if (ev.type === 'save') {
      stats[ev.playerId].saves = Math.min(3, (stats[ev.playerId].saves || 0) + 1);
    }
  }

  return { scoreA, scoreB, stats };
}

export function isMarketOrLineupLocked(matches: PachangaMatch[]): { isLocked: boolean; reason?: string } {
  // Los partidos cancelados nunca bloquean el mercado ni las alineaciones
  const validMatches = matches.filter(m => m.status !== ('cancelled' as any));
  const active = validMatches.find(m => m.status === 'live' || m.status === 'voting' || m.status === 'locked');
  if (active) {
    return {
      isLocked: true,
      reason: active.status === 'voting'
        ? 'Mercado y alineaciones bloqueados por votaciones en curso (hasta la publicación de resultados).'
        : 'Mercado y alineaciones bloqueados: partido en juego.'
    };
  }

  // Bloqueo a la hora de inicio (zona horaria Europe/Madrid)
  const now = new Date();
  for (const m of validMatches) {
    if (m.status === 'upcoming' && m.date && m.startTime) {
      try {
        const matchDateTime = new Date(`${m.date}T${m.startTime}:00`);
        if (now >= matchDateTime) {
          return {
            isLocked: true,
            reason: 'Mercado y alineaciones bloqueados: la hora de inicio del partido ha llegado.'
          };
        }
      } catch (e) {
        // ignore date parse issues
      }
    }
  }

  return { isLocked: false };
}


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

function mapProfileToUser(data: any): UserAccount {
  const cleanUser = (data.name || '').trim().toLowerCase();
  const isPagusa = cleanUser === 'pagusa';
  const role: UserRole = (data.role === 'admin' || isPagusa) ? 'admin' : (data.role || 'member');
  // Presupuesto en K€ (100.000 K€ = 100 M€)
  const rawBudget = data.budget !== undefined && data.budget !== null ? Number(data.budget) : 100;
  const budget = rawBudget <= 1000 ? rawBudget * 1000 : rawBudget;

  // Por especificación sección 2: Pagusa es la administradora y está vinculada a Gutsens
  const defaultLinkedId = isPagusa ? 'ce470862-4bac-49d5-becb-2abbe2cff860' : null;
  const linkedPlayerId = data.linked_player_id ?? data.linkedPlayerId ?? defaultLinkedId;
  const linkStatus = data.link_status ?? data.linkStatus ?? (isPagusa ? 'approved' : 'none');

  return {
    id: data.id,
    username: data.name,
    role: role,
    budget,
    ownedPlayerIds: Array.isArray(data.owned_player_ids) ? data.owned_player_ids : (Array.isArray(data.ownedPlayerIds) ? data.ownedPlayerIds : []),
    starterPlayerIds: Array.isArray(data.starter_player_ids) ? data.starter_player_ids : (Array.isArray(data.starterPlayerIds) ? data.starterPlayerIds : []),
    captainId: data.captain_id ?? data.captainId ?? null,
    linkedPlayerId,
    linkStatus,
    totalPoints: Number(data.total_points ?? data.totalPoints ?? 0),
    lastMatchPoints: Number(data.last_match_points ?? data.lastMatchPoints ?? 0),
  };
}

export function normalizeMatchStatus(s?: string): PachangaMatch['status'] {
  if (!s) return 'upcoming';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'open' || s === 'draft' || s === 'created') return 'upcoming';
  if (s === 'closed') return 'voting';
  if (s === 'locked') return 'live';
  if (s === 'published') return 'published';
  if (s === 'live' || s === 'voting' || s === 'scored' || s === 'published') {
    return s as PachangaMatch['status'];
  }
  return 'upcoming';
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

  async syncCurrentUser(): Promise<UserAccount | null> {
    const cached = this.getCurrentUser();
    if (!cached || !cached.id) return cached;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cached.id)
        .maybeSingle();

      if (!error && data) {
        const freshUser = mapProfileToUser(data);
        setStorage('session_user', freshUser);
        return freshUser;
      }
    } catch (e) {
      console.warn('Error syncing current user:', e);
    }
    return cached;
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
      users[profile.name.toLowerCase()] = {
        password: '',
        account: mapProfileToUser(profile)
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

    const user = mapProfileToUser(data);
    setStorage('session_user', user);
    return { success: true, user };
  },

  async signup(username: string, password: string, selectedPlayerId?: string): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
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
      const user = mapProfileToUser(existing);
      setStorage('session_user', user);
      return { success: true, user };
    }

    // El check constraint en PostgreSQL profiles_role_check requiere 'admin' o 'member'
    const role = cleanUser === 'pagusa' ? 'admin' : 'member';
    const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined;

    // Admin Pagusa vinculado a Gutsens automáticamente
    let linkedPlayerId: string | null = selectedPlayerId || null;
    let linkStatus: 'approved' | 'pending' | 'none' = selectedPlayerId ? 'pending' : 'none';

    if (role === 'admin') {
      try {
        const { data: gutsens } = await supabase.from('players').select('id').ilike('name', 'Gutsens').maybeSingle();
        if (gutsens) {
          linkedPlayerId = gutsens.id;
          linkStatus = 'approved';
        }
      } catch (e) {
        console.warn('Could not find player Gutsens for Pagusa:', e);
      }
    }

    let data: any = null;
    const fullPayload: any = {
      name: username.trim(),
      role: role,
      alias: username.trim(),
      budget: 100000, // 100 M€ en K€
      owned_player_ids: [],
      starter_player_ids: [],
      linked_player_id: linkedPlayerId,
      link_status: linkStatus,
      total_points: 0,
      last_match_points: 0,
    };
    if (generatedId) fullPayload.id = generatedId;

    const fullInsert = await supabase
      .from('profiles')
      .insert(fullPayload)
      .select()
      .maybeSingle();

    if (!fullInsert.error && fullInsert.data) {
      data = fullInsert.data;
    } else {
      console.warn('Full profiles insert failed, trying basic insert:', fullInsert.error);
      const basicPayload: any = {
        name: username.trim(),
        role: role,
        alias: username.trim()
      };
      if (generatedId) basicPayload.id = generatedId;

      const fallback = await supabase
        .from('profiles')
        .insert(basicPayload)
        .select()
        .maybeSingle();

      if (fallback.error) {
        console.error('Supabase registration error:', fallback.error);
        return {
          success: false,
          message: `Error al registrar en Supabase: ${fallback.error.message}. Por favor ejecuta el script SQL en Supabase para deshabilitar RLS y añadir columnas.`
        };
      }
      data = fallback.data;
    }

    if (!data) {
      return { success: false, message: 'No se pudo crear el perfil en la base de datos.' };
    }

    const newAccount = mapProfileToUser(data);
    setStorage('session_user', newAccount);
    return { success: true, user: newAccount };
  },

  async updateAccountLink(userId: string, playerId: string | null, linkStatus: 'approved' | 'pending' | 'none'): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          linked_player_id: playerId,
          link_status: linkStatus
        })
        .eq('id', userId);

      if (error) throw error;
      await this.syncCurrentUser();
      return { success: true, message: 'Vínculo actualizado con éxito.' };
    } catch (e: any) {
      console.error('Error updating account link:', e);
      return { success: false, message: e.message || 'Error al actualizar vínculo.' };
    }
  },

  async reopenMatch(matchId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('pachangas')
        .update({ status: 'voting' })
        .eq('id', matchId);

      if (error) throw error;
      return { success: true, message: 'Partido reabierto para corrección de acta.' };
    } catch (e: any) {
      console.error('Error reopening match:', e);
      return { success: false, message: e.message || 'Error al reabrir partido.' };
    }
  },

  async cancelMatch(matchId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Intentar marcar como 'cancelled'
      let { error } = await supabase
        .from('pachangas')
        .update({ status: 'cancelled' })
        .eq('id', matchId);

      // Si la base de datos tiene una restricción CHECK que no admite 'cancelled', eliminarlo de la tabla
      if (error && (error.code === '23514' || error.message?.includes('pachangas_status_check'))) {
        const delRes = await supabase
          .from('pachangas')
          .delete()
          .eq('id', matchId);
        if (!delRes.error) {
          error = null;
        }
      }

      if (error) throw error;
      return { success: true, message: 'Partido cancelado correctamente. El mercado y las alineaciones se han desbloqueado.' };
    } catch (e: any) {
      console.error('Error cancelling match:', e);
      return { success: false, message: e.message || 'Error al cancelar el partido.' };
    }
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
      stats: p.stats ?? { goals: 0, assists: 0, ownGoals: 0, saves: 0, matchesPlayed: 0 }
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
        current_price: 20000,
        previous_price: 20000,
        price_change_pct: 0,
        average_rating: 0,
        ratings_count: 0,
        stats: { goals: 0, assists: 0, ownGoals: 0, saves: 0, matchesPlayed: 0 }
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      isGuest: data.is_guest ?? isGuest,
      avatarUrl: data.avatar_url,
      currentPrice: Number(data.current_price ?? 20000),
      previousPrice: Number(data.previous_price ?? 20000),
      priceChangePct: Number(data.price_change_pct ?? 0),
      averageRating: Number(data.average_rating ?? 0),
      ratingsCount: Number(data.ratings_count ?? 0),
      stats: data.stats || { goals: 0, assists: 0, ownGoals: 0, saves: 0, matchesPlayed: 0 }
    };
  },

  async buyPlayer(userId: string, playerId: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const matches = await this.getMatches();
    const lock = isMarketOrLineupLocked(matches);
    if (lock.isLocked) {
      return { success: false, message: lock.reason || 'El mercado está bloqueado durante la jornada.' };
    }

    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (!player) return { success: false, message: 'Jugador no encontrado.' };

    const rawPrice = Number(player.current_price ?? player.currentPrice ?? 20000);
    // Convertir M€ → K€ si el precio parece estar en M€ (<=1000)
    const price = rawPrice <= 1000 ? rawPrice * 1000 : rawPrice;

    if (currentUser.ownedPlayerIds.includes(playerId)) {
      return { success: false, message: 'Ya tienes a este jugador en tu plantilla.' };
    }

    if (currentUser.ownedPlayerIds.length >= MAX_PLANTILLA) {
      return { success: false, message: 'Límite alcanzado.' };
    }

    if (currentUser.budget < price) {
      return { success: false, message: 'Presupuesto insuficiente.' };
    }

    // Todas las compras se pagan al precio real del jugador (sec. 7)
    const newBudget = Math.round((currentUser.budget - price) * 10) / 10;
    currentUser.budget = newBudget;
    currentUser.ownedPlayerIds.push(playerId);

    if (currentUser.starterPlayerIds.length < TITULARES) {
      currentUser.starterPlayerIds.push(playerId);
    }

    setStorage('session_user', currentUser);

    try {
      await supabase
        .from('profiles')
        .update({
          budget: currentUser.budget,
          owned_player_ids: currentUser.ownedPlayerIds,
          starter_player_ids: currentUser.starterPlayerIds,
        })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn('Could not sync profile to Supabase on buyPlayer:', e);
    }

    return { success: true, message: `¡Has fichado a ${player.name}!`, user: currentUser };

  },

  async sellPlayer(userId: string, playerId: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const matches = await this.getMatches();
    const lock = isMarketOrLineupLocked(matches);
    if (lock.isLocked) {
      return { success: false, message: lock.reason || 'El mercado está bloqueado durante la jornada.' };
    }

    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (!player) return { success: false, message: 'Jugador no encontrado.' };

    if (!currentUser.ownedPlayerIds.includes(playerId)) {
      return { success: false, message: 'No tienes a este jugador en tu plantilla.' };
    }

    const rawPrice = Number(player.current_price ?? player.currentPrice ?? 20000);
    // Convertir M€ → K€ si el precio parece estar en M€ (<=1000)
    const price = rawPrice <= 1000 ? rawPrice * 1000 : rawPrice;
    currentUser.budget = Math.round((currentUser.budget + price) * 10) / 10;
    currentUser.ownedPlayerIds = currentUser.ownedPlayerIds.filter(id => id !== playerId);
    currentUser.starterPlayerIds = currentUser.starterPlayerIds.filter(id => id !== playerId);

    setStorage('session_user', currentUser);

    try {
      await supabase
        .from('profiles')
        .update({
          budget: currentUser.budget,
          owned_player_ids: currentUser.ownedPlayerIds,
          starter_player_ids: currentUser.starterPlayerIds
        })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn('Could not sync profile to Supabase on sellPlayer:', e);
    }

    return { success: true, message: `Has vendido a ${player.name}.`, user: currentUser };
  },

  async setStarters(starterIds: string[]): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const matches = await this.getMatches();
    const lock = isMarketOrLineupLocked(matches);
    if (lock.isLocked) {
      return { success: false, message: lock.reason || 'Las alineaciones están bloqueadas durante la jornada.' };
    }

    if (starterIds.length > 5) {
      return { success: false, message: 'Solo puedes tener como máximo 5 jugadores titulares.' };
    }

    currentUser.starterPlayerIds = starterIds;
    // Si el capitán actual ya no está entre los titulares, quitarlo
    if (currentUser.captainId && !starterIds.includes(currentUser.captainId)) {
      currentUser.captainId = null;
    }
    setStorage('session_user', currentUser);

    try {
      await supabase
        .from('profiles')
        .update({
          starter_player_ids: currentUser.starterPlayerIds,
          captain_id: currentUser.captainId
        })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn('Could not sync starters to Supabase:', e);
    }

    return { success: true, message: 'Alineación de titulares actualizada.', user: currentUser };
  },

  async setCaptain(captainId: string | null): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Inicia sesión.' };

    const matches = await this.getMatches();
    const lock = isMarketOrLineupLocked(matches);
    if (lock.isLocked) {
      return { success: false, message: lock.reason || 'Las alineaciones están bloqueadas durante la jornada.' };
    }

    if (captainId && !currentUser.starterPlayerIds.includes(captainId)) {
      return { success: false, message: 'El capitán debe ser uno de los 5 titulares.' };
    }

    currentUser.captainId = captainId;
    setStorage('session_user', currentUser);

    try {
      await supabase
        .from('profiles')
        .update({ captain_id: captainId })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn('Could not sync captain to Supabase:', e);
    }

    return { success: true, message: 'Capitán actualizado con éxito.', user: currentUser };
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
      status: normalizeMatchStatus(m.status),
      teamA: Array.isArray(m.team_a) ? m.team_a : (Array.isArray(m.teamA) ? m.teamA : []),
      teamB: Array.isArray(m.team_b) ? m.team_b : (Array.isArray(m.teamB) ? m.teamB : []),
      scoreA: m.score_a !== undefined ? m.score_a : m.scoreA,
      scoreB: m.score_b !== undefined ? m.score_b : m.scoreB,
      playerStats: m.player_stats || m.playerStats || {},
      rawVotes: m.raw_votes || m.rawVotes || {},
      lineupSnapshots: m.lineup_snapshots || m.lineupSnapshots || {},
      corrections: m.corrections || [],
      events: Array.isArray(m.events) ? m.events : [],
      isOfficial: m.is_official ?? m.isOfficial ?? true
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
      status: normalizeMatchStatus(data.status),
      teamA: Array.isArray(data.team_a) ? data.team_a : (Array.isArray(data.teamA) ? data.teamA : []),
      teamB: Array.isArray(data.team_b) ? data.team_b : (Array.isArray(data.teamB) ? data.teamB : []),
      scoreA: data.score_a !== undefined ? data.score_a : data.scoreA,
      scoreB: data.score_b !== undefined ? data.score_b : data.scoreB,
      playerStats: data.player_stats || data.playerStats || {},
      rawVotes: data.raw_votes || data.rawVotes || {},
      lineupSnapshots: data.lineup_snapshots || data.lineupSnapshots || {},
      corrections: data.corrections || [],
      events: Array.isArray(data.events) ? data.events : [],
      isOfficial: data.is_official ?? data.isOfficial ?? true
    };
  },

  async createMatch(payload: { date: string; startTime: string; endTime: string; format: number }): Promise<PachangaMatch> {
    let { data, error } = await supabase
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

    if (error && (error.code === '23514' || error.message?.includes('pachangas_status_check'))) {
      console.warn('pachangas_status_check constraint triggered, retrying with status "open"...');
      const retry = await supabase
        .from('pachangas')
        .insert({
          date: payload.date,
          start_time: payload.startTime,
          end_time: payload.endTime,
          status: 'open',
          format: payload.format || 5,
          team_a: [],
          team_b: []
        })
        .select()
        .single();

      if (!retry.error && retry.data) {
        data = retry.data;
        error = null;
      } else if (retry.error) {
        const retryDraft = await supabase
          .from('pachangas')
          .insert({
            date: payload.date,
            start_time: payload.startTime,
            end_time: payload.endTime,
            status: 'draft',
            format: payload.format || 5,
            team_a: [],
            team_b: []
          })
          .select()
          .single();
        if (!retryDraft.error && retryDraft.data) {
          data = retryDraft.data;
          error = null;
        }
      }
    }

    if (error) {
      console.error('Error creating match:', error);
      throw error;
    }

    return {
      id: data.id,
      date: data.date ? (typeof data.date === 'string' ? data.date.split('T')[0] : new Date(data.date).toISOString().split('T')[0]) : payload.date,
      startTime: data.start_time || payload.startTime,
      endTime: data.end_time || payload.endTime,
      format: data.format || payload.format || 5,
      status: normalizeMatchStatus(data.status),
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
      date: data.date ? (typeof data.date === 'string' ? data.date.split('T')[0] : new Date(data.date).toISOString().split('T')[0]) : '',
      startTime: data.start_time || '17:00',
      endTime: data.end_time || '18:30',
      format: data.format || 5,
      status: normalizeMatchStatus(data.status),
      teamA: data.team_a || teamA,
      teamB: data.team_b || teamB,
      scoreA: data.score_a,
      scoreB: data.score_b
    };
  },

  async addPlayerToMatchTeam(matchId: string, playerId: string, team: 'A' | 'B'): Promise<void> {
    const match = await this.getMatch(matchId);
    if (!match) return;
    const teamA = (match.teamA || []).filter(id => id !== playerId);
    const teamB = (match.teamB || []).filter(id => id !== playerId);
    if (team === 'A') teamA.push(playerId);
    if (team === 'B') teamB.push(playerId);
    await this.updateMatchTeams(matchId, teamA, teamB);
  },

  async updateMatchStatus(matchId: string, status: PachangaMatch['status']): Promise<PachangaMatch | undefined> {
    let { data, error } = await supabase
      .from('pachangas')
      .update({ status })
      .eq('id', matchId)
      .select()
      .maybeSingle();

    if (error && (error.code === '23514' || error.message?.includes('pachangas_status_check'))) {
      const fallbackStatus = status === 'upcoming' ? 'open' : status === 'voting' ? 'closed' : status === 'scored' ? 'scored' : 'open';
      const retry = await supabase
        .from('pachangas')
        .update({ status: fallbackStatus })
        .eq('id', matchId)
        .select()
        .maybeSingle();

      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      console.error('Error updating match status:', error);
      throw error;
    }

    if (!data) return undefined;
    return {
      id: data.id,
      date: data.date ? (typeof data.date === 'string' ? data.date.split('T')[0] : new Date(data.date).toISOString().split('T')[0]) : '',
      startTime: data.start_time || '17:00',
      endTime: data.end_time || '18:30',
      format: data.format || 5,
      status: normalizeMatchStatus(data.status),
      teamA: data.team_a || [],
      teamB: data.team_b || []
    };
  },

  async recordMatchActa(
    matchId: string,
    scoreA: number,
    scoreB: number,
    stats: Record<string, { goals: number; assists: number; ownGoals: number; rating?: number; saves?: number; matchesPlayed?: number; }>
  ): Promise<{ success: boolean; match?: PachangaMatch }> {
    const hasRatings = Object.values(stats).some(st => st.rating !== undefined && Number(st.rating) > 0);
    const newStatus = hasRatings ? 'scored' : 'voting';

    // 1. Guardar fotos de alineaciones y actualizar resultado y estado en la tabla pachangas
    await this.takeLineupSnapshots(matchId);
    let { data: updatedMatch, error: matchErr } = await supabase
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

    if (matchErr && (matchErr.code === '23514' || matchErr.message?.includes('pachangas_status_check'))) {
      const fallbackStatus = newStatus === 'scored' ? 'scored' : 'closed';
      const retry = await supabase
        .from('pachangas')
        .update({
          score_a: scoreA,
          score_b: scoreB,
          player_stats: stats,
          status: fallbackStatus
        })
        .eq('id', matchId)
        .select()
        .maybeSingle();

      if (!retry.error) {
        updatedMatch = retry.data;
        matchErr = null;
      }
    }

    if (matchErr) {
      console.error('Error updating match with acta:', matchErr);
    }

    // 2. Actualizar estadísticas y precio de cada jugador usando scoring.ts (EGOL_FANTASY.md sec. 6 y 7)
    try {
      const { data: currentPlayers } = await supabase.from('players').select('*');
      if (currentPlayers) {
        // Preparar input para el motor de puntuación
        const teamA: string[] = Array.isArray(updatedMatch?.team_a) ? updatedMatch.team_a : [];
        const teamB: string[] = Array.isArray(updatedMatch?.team_b) ? updatedMatch.team_b : [];

        const statsInput: Record<string, any> = {};
        const currentPrices: Record<string, number> = {};

        for (const [pId, st] of Object.entries(stats)) {
          const p = currentPlayers.find((item: any) => item.id === pId);
          const rawPrice = Number(p?.current_price ?? 20);
          // Detectar y convertir precios en M€ a K€
          const price = rawPrice <= 1000 ? rawPrice * 1000 : rawPrice;
          currentPrices[pId] = price;

          statsInput[pId] = {
            playerId: pId,
            team: teamA.includes(pId) ? 'A' : 'B',
            goals: st.goals || 0,
            assists: st.assists || 0,
            ownGoals: st.ownGoals || 0,
            saves: st.saves || 0,
          };
        }

        const playerScores = calculateMatchScores({
          scoreA,
          scoreB,
          stats: statsInput,
          currentPrices,
        });

        for (const [pId, sc] of Object.entries(playerScores)) {
          const p = currentPlayers.find((item: any) => item.id === pId);
          if (!p) continue;

          const st = stats[pId];
          const currentStats = p.stats || { goals: 0, assists: 0, ownGoals: 0, saves: 0, matchesPlayed: 0 };
          const newStats = {
            ...currentStats,
            goals: (currentStats.goals || 0) + (st.goals || 0),
            assists: (currentStats.assists || 0) + (st.assists || 0),
            ownGoals: (currentStats.ownGoals || 0) + (st.ownGoals || 0),
            saves: (currentStats.saves || 0) + Math.min(3, st.saves || 0),
            matchesPlayed: (currentStats.matchesPlayed || 0) + 1
          };

          const rawCurrentPrice = Number(p.current_price ?? 20);
          const currentPrice = rawCurrentPrice <= 1000 ? rawCurrentPrice * 1000 : rawCurrentPrice;

          await supabase
            .from('players')
            .update({
              stats: newStats,
              previous_price: currentPrice,
              current_price: sc.newPrice,
              price_change_pct: sc.priceChangePct,
            })
            .eq('id', pId);
        }

        // 3. Actualizar puntos de TODOS los managers en Supabase
        const { data: allProfiles } = await supabase.from('profiles').select('*');
        if (allProfiles && allProfiles.length > 0) {
          for (const prof of allProfiles) {
            const starterIds: string[] = Array.isArray(prof.starter_player_ids)
              ? prof.starter_player_ids
              : (Array.isArray(prof.starterPlayerIds) ? prof.starterPlayerIds : []);
            const captainId = prof.captain_id ?? prof.captainId ?? null;

            const { totalPoints: matchPoints } = calculateManagerPoints(
              { starters: starterIds, captainId },
              playerScores
            );

            const currentTotal = Number(prof.total_points || 0);
            const newTotal = currentTotal + matchPoints;

            try {
              await supabase
                .from('profiles')
                .update({
                  last_match_points: matchPoints,
                  total_points: newTotal
                })
                .eq('id', prof.id);
            } catch (err) {
              console.warn(`Error updating points in Supabase for ${prof.name}:`, err);
            }
          }
        }

        await this.syncCurrentUser();
      }
    } catch (e) {
      console.error('Error updating player stats in Supabase:', e);
    }

    return { success: !matchErr, match: updatedMatch as any };
  },

  async takeLineupSnapshots(matchId: string): Promise<void> {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (!profiles) return;
      const snapshots: Record<string, LineupSnapshot> = {};
      for (const prof of profiles) {
        const starters = Array.isArray(prof.starter_player_ids)
          ? prof.starter_player_ids
          : (Array.isArray(prof.starterPlayerIds) ? prof.starterPlayerIds : []);
        snapshots[prof.id] = {
          starters,
          captainId: prof.captain_id ?? prof.captainId ?? null
        };
      }
      await supabase.from('pachangas').update({
        lineup_snapshots: snapshots
      }).eq('id', matchId);
    } catch (e) {
      console.warn('Error taking lineup snapshots:', e);
    }
  },

  async submitRankingVote(
    matchId: string,
    voterPlayerId: string,
    ranking: string[]
  ): Promise<{ success: boolean; message: string }> {
    const match = await this.getMatch(matchId);
    if (!match) return { success: false, message: 'Partido no encontrado.' };

    const convocados = [...(match.teamA || []), ...(match.teamB || [])];
    if (!convocados.includes(voterPlayerId)) {
      return { success: false, message: 'No estás convocado a este partido.' };
    }

    if (ranking.includes(voterPlayerId)) {
      return { success: false, message: 'No puedes votarte a ti mismo en el ranking.' };
    }

    const otherConvocados = convocados.filter(id => id !== voterPlayerId);
    const rankingSet = new Set(ranking);
    if (rankingSet.size !== ranking.length) {
      return { success: false, message: 'El ranking no puede tener posiciones repetidas.' };
    }
    if (ranking.length !== otherConvocados.length || !otherConvocados.every(id => rankingSet.has(id))) {
      return { success: false, message: 'Debes ordenar a todos los demás participantes sin dejar a ninguno fuera.' };
    }

    const currentVotes = match.rawVotes || {};
    const updatedVotes = {
      ...currentVotes,
      [voterPlayerId]: ranking
    };

    const { error } = await supabase
      .from('pachangas')
      .update({ raw_votes: updatedVotes })
      .eq('id', matchId);

    if (error) {
      console.error('Error saving raw votes:', error);
      return { success: false, message: error.message || 'Error al guardar ranking.' };
    }

    return { success: true, message: '¡Tu ranking de votos ha sido guardado exitosamente!' };
  },

  async getRankingVoteForUser(matchId: string, voterPlayerId: string): Promise<string[] | null> {
    const match = await this.getMatch(matchId);
    if (!match || !match.rawVotes) return null;
    return match.rawVotes[voterPlayerId] || null;
  },

  async submitCorrectionRequest(
    matchId: string,
    userId: string,
    playerId: string,
    description: string
  ): Promise<{ success: boolean; message: string }> {
    const match = await this.getMatch(matchId);
    if (!match) return { success: false, message: 'Partido no encontrado.' };

    const newRequest: CorrectionRequest = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `corr-${Date.now()}`,
      matchId,
      userId,
      playerId,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedCorrections = [...(match.corrections || []), newRequest];
    const { error } = await supabase
      .from('pachangas')
      .update({ corrections: updatedCorrections })
      .eq('id', matchId);

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Petición de corrección enviada al administrador.' };
  },

  async reviewCorrectionRequest(
    matchId: string,
    correctionId: string,
    newStatus: 'approved' | 'rejected'
  ): Promise<{ success: boolean; message: string }> {
    const match = await this.getMatch(matchId);
    if (!match) return { success: false, message: 'Partido no encontrado.' };

    const corrections = (match.corrections || []).map(c =>
      c.id === correctionId ? { ...c, status: newStatus } : c
    );

    const { error } = await supabase
      .from('pachangas')
      .update({ corrections })
      .eq('id', matchId);

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Petición marcada como ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}.` };
  },

  async addMatchEvent(
    matchId: string,
    eventData: Omit<MatchEvent, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message: string; match?: PachangaMatch }> {
    const match = await this.getMatch(matchId);
    if (!match) return { success: false, message: 'Partido no encontrado.' };

    const newEvent: MatchEvent = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}`,
      ...eventData,
      createdAt: new Date().toISOString()
    };

    const updatedEvents = [...(match.events || []), newEvent];
    const allConvocados = [...(match.teamA || []), ...(match.teamB || [])];
    const { scoreA, scoreB, stats } = computeStatsAndScoreFromEvents(updatedEvents, allConvocados);

    // Si el partido estaba en upcoming o created, al apuntar el primer evento pasa a 'live'
    const newStatus = (match.status === 'upcoming' || match.status === 'created') ? 'live' : match.status;

    let { data, error } = await supabase
      .from('pachangas')
      .update({
        events: updatedEvents,
        score_a: scoreA,
        score_b: scoreB,
        player_stats: stats,
        status: newStatus
      })
      .eq('id', matchId)
      .select()
      .maybeSingle();

    if (error && (error.code === '23514' || error.message?.includes('pachangas_status_check'))) {
      const fallbackStatus = newStatus === 'live' ? 'open' : newStatus;
      const retry = await supabase
        .from('pachangas')
        .update({
          events: updatedEvents,
          score_a: scoreA,
          score_b: scoreB,
          player_stats: stats,
          status: fallbackStatus
        })
        .eq('id', matchId)
        .select()
        .maybeSingle();
      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      console.error('Error adding match event:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Evento registrado con éxito.', match: data as any };
  },

  async undoLastMatchEvent(matchId: string): Promise<{ success: boolean; message: string; match?: PachangaMatch }> {
    const match = await this.getMatch(matchId);
    if (!match) return { success: false, message: 'Partido no encontrado.' };
    if (!match.events || match.events.length === 0) {
      return { success: false, message: 'No hay eventos para deshacer.' };
    }

    const updatedEvents = match.events.slice(0, -1);
    const allConvocados = [...(match.teamA || []), ...(match.teamB || [])];
    const { scoreA, scoreB, stats } = computeStatsAndScoreFromEvents(updatedEvents, allConvocados);

    const { data, error } = await supabase
      .from('pachangas')
      .update({
        events: updatedEvents,
        score_a: scoreA,
        score_b: scoreB,
        player_stats: stats
      })
      .eq('id', matchId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error undoing match event:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Último evento deshecho.', match: data as any };
  },

  async setMatchLive(matchId: string): Promise<{ success: boolean; message: string }> {
    return this.updateMatchStatus(matchId, 'live').then(m => ({ success: !!m, message: 'Partido en juego (Modo Directo activado).' }));
  },

  async publishFinalMatchResults(matchId: string): Promise<{ success: boolean; message: string }> {
    const match = await this.getMatch(matchId);
    if (!match) return { success: false, message: 'Partido no encontrado.' };

    try {
      const { data: currentPlayers } = await supabase.from('players').select('*');
      if (!currentPlayers) throw new Error('No se pudieron obtener los jugadores.');

      const teamA: string[] = match.teamA || [];
      const teamB: string[] = match.teamB || [];
      const stats: Record<string, any> = match.playerStats || {};
      const statsInput: Record<string, any> = {};
      const currentPrices: Record<string, number> = {};

      for (const [pId, stVal] of Object.entries(stats)) {
        const st = stVal as any;
        const p = currentPlayers.find((item: any) => item.id === pId);
        const rawPrice = Number(p?.current_price ?? 20000);
        const price = rawPrice <= 1000 ? rawPrice * 1000 : rawPrice;
        currentPrices[pId] = price;

        statsInput[pId] = {
          playerId: pId,
          team: teamA.includes(pId) ? 'A' : 'B',
          goals: st.goals || 0,
          assists: st.assists || 0,
          ownGoals: st.ownGoals || 0,
          saves: st.saves || 0,
        };
      }

      const playerScores = calculateMatchScores({
        scoreA: match.scoreA || 0,
        scoreB: match.scoreB || 0,
        stats: statsInput,
        votesByVoter: match.rawVotes || {},
        currentPrices,
      });

      // Actualizar jugadores
      for (const [pId, sc] of Object.entries(playerScores)) {
        const p = currentPlayers.find((item: any) => item.id === pId);
        if (!p) continue;

        const st = stats[pId] || { goals: 0, assists: 0, ownGoals: 0, saves: 0 };
        const currentStats = p.stats || { goals: 0, assists: 0, ownGoals: 0, saves: 0, matchesPlayed: 0 };
        const newStats = {
          ...currentStats,
          goals: (currentStats.goals || 0) + (st.goals || 0),
          assists: (currentStats.assists || 0) + (st.assists || 0),
          ownGoals: (currentStats.ownGoals || 0) + (st.ownGoals || 0),
          saves: (currentStats.saves || 0) + Math.min(3, st.saves || 0),
          matchesPlayed: (currentStats.matchesPlayed || 0) + 1
        };

        const rawCurrentPrice = Number(p.current_price ?? 20000);
        const currentPrice = rawCurrentPrice <= 1000 ? rawCurrentPrice * 1000 : rawCurrentPrice;

        await supabase
          .from('players')
          .update({
            stats: newStats,
            previous_price: currentPrice,
            current_price: sc.newPrice,
            price_change_pct: sc.priceChangePct,
            average_rating: Math.round(sc.votesPoints * 10) / 10
          })
          .eq('id', pId);
      }

      // Actualizar puntuaciones de mánagers con snapshots
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      if (allProfiles && allProfiles.length > 0) {
        for (const prof of allProfiles) {
          const snapshot = match.lineupSnapshots?.[prof.id];
          const starterIds: string[] = snapshot?.starters ?? (
            Array.isArray(prof.starter_player_ids)
              ? prof.starter_player_ids
              : (Array.isArray(prof.starterPlayerIds) ? prof.starterPlayerIds : [])
          );
          const captainId = snapshot?.captainId ?? (prof.captain_id ?? prof.captainId ?? null);

          const { totalPoints: matchPoints } = calculateManagerPoints(
            { starters: starterIds, captainId },
            playerScores
          );

          const currentTotal = Number(prof.total_points || 0);
          const newTotal = currentTotal + matchPoints;

          await supabase
            .from('profiles')
            .update({
              last_match_points: matchPoints,
              total_points: newTotal
            })
            .eq('id', prof.id);
        }
      }

      // Cerrar y publicar partido
      await supabase
        .from('pachangas')
        .update({
          status: 'scored'
        })
        .eq('id', matchId);

      await this.syncCurrentUser();
      return { success: true, message: '¡Resultados oficiales publicados con éxito!' };
    } catch (e: any) {
      console.error('Error publishing match results:', e);
      return { success: false, message: e.message || 'Error al publicar resultados.' };
    }
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
      console.error('Error fetching leaderboard from Supabase:', error);
      const cur = this.getCurrentUser();
      return cur ? [cur] : [];
    }

    const list = (data || []).map((p: any) => mapProfileToUser(p));

    // Si por cualquier motivo el usuario local no estuviera devuelto en la lista, añadirlo
    const cur = this.getCurrentUser();
    if (cur && !list.some(u => u.id === cur.id || u.username.toLowerCase() === cur.username.toLowerCase())) {
      list.push(cur);
    }

    return list.sort((a, b) => b.totalPoints - a.totalPoints);
  }
};
