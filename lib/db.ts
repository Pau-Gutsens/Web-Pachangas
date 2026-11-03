import { supabase } from './supabase';
import { Member, Pachanga } from '../types';
import { INITIAL_MEMBERS } from './seed';
import { calculatePachangaScores, calculatePlayerPoints } from './scoring';

// Helper for safe UUID generation in browser and node
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Local Storage helpers for fallback and offline persistence
const LOCAL_STORAGE_PREFIX = 'pachangas_cache_';

function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export const db = {
  /**
   * Obtiene la lista de miembros del grupo.
   * Si en Supabase está vacía o falla, usa INITIAL_MEMBERS.
   */
  async getMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error || !data || data.length === 0) {
        const local = getLocal<Member[]>('members', INITIAL_MEMBERS);
        return local.length > 0 ? local : INITIAL_MEMBERS;
      }
      setLocal('members', data);
      return data;
    } catch (e) {
      console.warn('Fallback getting members:', e);
      return getLocal<Member[]>('members', INITIAL_MEMBERS);
    }
  },

  /**
   * Inicializa los 15 miembros iniciales en Supabase.
   */
  async seedInitialMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase.from('profiles').upsert(INITIAL_MEMBERS).select();
      if (error) {
        console.warn('Error seeding to supabase, saving locally:', error);
        setLocal('members', INITIAL_MEMBERS);
        return INITIAL_MEMBERS;
      }
      setLocal('members', data || INITIAL_MEMBERS);
      return data || INITIAL_MEMBERS;
    } catch (e) {
      console.warn('Error seeding members:', e);
      setLocal('members', INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
  },

  /**
   * Crea un nuevo miembro / jugador en la base de datos.
   */
  async createMember(name: string, role: 'member' | 'admin' = 'member', alias?: string): Promise<Member> {
    const newMember: Member = {
      id: generateUUID(),
      name: name.trim(),
      role,
      alias: alias?.trim() || name.trim()
    };

    try {
      const { data, error } = await supabase.from('profiles').insert(newMember).select().single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Error creating member on supabase:', e);
    }

    // Fallback local
    const members = await this.getMembers();
    const updated = [...members, newMember];
    setLocal('members', updated);
    return newMember;
  },

  /**
   * Obtiene todas las pachangas ordenadas por fecha.
   */
  async getPachangas(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pachangas')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('Error fetching pachangas from Supabase:', error);
        return getLocal<any[]>('pachangas', []);
      }
      setLocal('pachangas', data || []);
      return data || [];
    } catch (e) {
      console.warn('Fallback getting pachangas:', e);
      return getLocal<any[]>('pachangas', []);
    }
  },

  /**
   * Crea una nueva pachanga.
   */
  async createPachanga(payload: { date: Date | string; format: number; status?: string }): Promise<any> {
    const cleanPayload = {
      date: new Date(payload.date).toISOString(),
      format: Number(payload.format) || 5,
      status: payload.status || 'draft'
    };

    try {
      const { data, error } = await supabase.from('pachangas').insert(cleanPayload).select().single();
      if (error) throw error;
      return data;
    } catch (e: any) {
      console.error('Error creating pachanga on Supabase:', e);
      // Fallback local
      const id = generateUUID();
      const localPachanga = { id, ...cleanPayload, created_at: new Date().toISOString() };
      const current = getLocal<any[]>('pachangas', []);
      setLocal('pachangas', [localPachanga, ...current]);
      return localPachanga;
    }
  },

  /**
   * Actualiza el estado de una pachanga (draft, open, closed, scored, cancelled).
   */
  async updatePachangaStatus(id: string, status: string): Promise<any> {
    try {
      const { data, error } = await supabase.from('pachangas').update({ status }).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase status update error:', e);
    }

    const current = getLocal<any[]>('pachangas', []);
    const updated = current.map(p => p.id === id ? { ...p, status } : p);
    setLocal('pachangas', updated);
    return updated.find(p => p.id === id);
  },

  /**
   * Obtiene detalles completos de una pachanga (asistentes, picks y resultados).
   */
  async getPachangaDetails(id: string): Promise<any> {
    let pachanga: any = null;
    let attendees: any[] = [];
    let picks: any[] = [];
    let result: any = null;

    try {
      const { data: pData } = await supabase.from('pachangas').select('*').eq('id', id).single();
      pachanga = pData;

      const { data: aData } = await supabase.from('pachanga_attendees').select('*').eq('pachanga_id', id);
      if (aData) attendees = aData;

      const { data: picksData } = await supabase.from('fantasy_picks').select('*').eq('pachanga_id', id);
      if (picksData) picks = picksData;

      const { data: resData } = await supabase.from('pachanga_results').select('*').eq('pachanga_id', id).single();
      if (resData) result = resData;
    } catch (e) {
      console.warn('Error fetching details from Supabase:', e);
    }

    // Merge con datos locales si faltan
    if (!pachanga) {
      const allPachangas = getLocal<any[]>('pachangas', []);
      pachanga = allPachangas.find(p => p.id === id) || { id, date: new Date().toISOString(), status: 'draft', format: 5 };
    }

    const localAttendees = getLocal<any[]>(`attendees_${id}`, []);
    if (attendees.length === 0 && localAttendees.length > 0) {
      attendees = localAttendees;
    }

    const localPicks = getLocal<any[]>(`picks_${id}`, []);
    if (picks.length === 0 && localPicks.length > 0) {
      picks = localPicks;
    }

    const localResult = getLocal<any>(`result_${id}`, null);
    if (!result && localResult) {
      result = localResult;
    }

    return {
      ...pachanga,
      pachanga_attendees: attendees,
      fantasy_picks: picks,
      pachanga_results: result
    };
  },

  /**
   * Añade un asistente (miembro o invitado) a la pachanga y equipo especificado.
   * Garantiza que guestId sea un UUID válido.
   */
  async addAttendee(
    pachangaId: string,
    memberId: string | null,
    guestId: string | null,
    team: 'A' | 'B',
    guestName?: string
  ): Promise<any> {
    const validGuestId = guestId ? (guestId.includes('-') ? guestId : generateUUID()) : null;

    // Payload para Supabase
    const payload: any = {
      pachanga_id: pachangaId,
      member_id: memberId || null,
      guest_id: validGuestId,
      team
    };

    if (guestName) {
      payload.guest_name = guestName.trim();
    }

    try {
      // Intenta insertar con guest_name
      const { data, error } = await supabase.from('pachanga_attendees').insert(payload).select().single();
      if (!error && data) {
        return data;
      }

      // Si falla porque la columna guest_name no existe en Supabase, reintentar sin ella
      if (error && error.message?.includes('guest_name')) {
        delete payload.guest_name;
        const retry = await supabase.from('pachanga_attendees').insert(payload).select().single();
        if (!retry.error && retry.data) {
          // Guardar el nombre del invitado localmente para mapearlo
          if (validGuestId && guestName) {
            setLocal(`guest_name_${validGuestId}`, guestName);
          }
          return retry.data;
        }
      }
      throw error;
    } catch (e: any) {
      console.warn('Supabase attendee insert error, saving locally:', e);
      // Fallback local
      const attendee = {
        id: generateUUID(),
        pachanga_id: pachangaId,
        member_id: memberId,
        guest_id: validGuestId,
        guest_name: guestName,
        team
      };
      const current = getLocal<any[]>(`attendees_${pachangaId}`, []);
      const updated = [...current, attendee];
      setLocal(`attendees_${pachangaId}`, updated);
      if (validGuestId && guestName) {
        setLocal(`guest_name_${validGuestId}`, guestName);
      }
      return attendee;
    }
  },

  /**
   * Elimina un asistente de una pachanga.
   */
  async removeAttendee(attendeeId: string, pachangaId: string): Promise<boolean> {
    try {
      await supabase.from('pachanga_attendees').delete().eq('id', attendeeId);
    } catch (e) {
      console.warn('Supabase removeAttendee error:', e);
    }

    const current = getLocal<any[]>(`attendees_${pachangaId}`, []);
    const updated = current.filter(a => a.id !== attendeeId);
    setLocal(`attendees_${pachangaId}`, updated);
    return true;
  },

  /**
   * Cambia el equipo de un asistente (Equipo A <-> Equipo B).
   */
  async updateAttendeeTeam(attendeeId: string, pachangaId: string, newTeam: 'A' | 'B'): Promise<boolean> {
    try {
      await supabase.from('pachanga_attendees').update({ team: newTeam }).eq('id', attendeeId);
    } catch (e) {
      console.warn('Supabase updateAttendeeTeam error:', e);
    }

    const current = getLocal<any[]>(`attendees_${pachangaId}`, []);
    const updated = current.map(a => a.id === attendeeId ? { ...a, team: newTeam } : a);
    setLocal(`attendees_${pachangaId}`, updated);
    return true;
  },

  /**
   * Guarda o actualiza la elección Fantasy de un manager para una pachanga.
   */
  async saveFantasyPick(
    pachangaId: string,
    managerId: string,
    selectedPlayerIds: string[],
    captainId: string
  ): Promise<any> {
    const pickData = {
      pachanga_id: pachangaId,
      manager_id: managerId,
      selected_player_ids: selectedPlayerIds,
      captain_id: captainId,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('fantasy_picks')
        .upsert(pickData, { onConflict: 'pachanga_id,manager_id' })
        .select()
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase saveFantasyPick error:', e);
    }

    // Fallback local
    const current = getLocal<any[]>(`picks_${pachangaId}`, []);
    const filtered = current.filter(p => p.manager_id !== managerId);
    const updated = [...filtered, { id: generateUUID(), ...pickData }];
    setLocal(`picks_${pachangaId}`, updated);
    return pickData;
  },

  /**
   * Guarda las estadísticas del partido, calcula los puntos de jugadores y managers,
   * y cambia el estado de la pachanga a 'scored'.
   */
  async scorePachanga(
    pachangaId: string,
    matchResult: { scoreA: number; scoreB: number; winner: 'A' | 'B' | 'draw' },
    playerStats: { playerId: string; type: any; value: number; isGoalkeeper?: boolean }[]
  ): Promise<any> {
    const details = await this.getPachangaDetails(pachangaId);
    const attendees = details.pachanga_attendees || [];
    const picks = details.fantasy_picks || [];

    // 1. Calcular puntos base por jugador
    const playerPointsMap: Record<string, number> = {};

    attendees.forEach((a: any) => {
      const id = a.member_id || a.guest_id;
      if (id) playerPointsMap[id] = 0;
    });

    playerStats.forEach(stat => {
      const pts = calculatePlayerPoints(
        { type: stat.type, value: stat.value },
        Boolean(stat.isGoalkeeper)
      );
      playerPointsMap[stat.playerId] = (playerPointsMap[stat.playerId] || 0) + pts;
    });

    // 2. Sumar punto por victoria al equipo ganador
    if (matchResult.winner === 'A' || matchResult.winner === 'B') {
      attendees.forEach((a: any) => {
        if (a.team === matchResult.winner) {
          const id = a.member_id || a.guest_id;
          if (id) {
            playerPointsMap[id] = (playerPointsMap[id] || 0) + 1;
          }
        }
      });
    }

    // 3. Calcular puntos por manager según sus picks y capitán x2
    const managerPointsMap: Record<string, number> = {};

    picks.forEach((pick: any) => {
      let total = 0;
      const selectedIds = Array.isArray(pick.selected_player_ids)
        ? pick.selected_player_ids
        : [];

      selectedIds.forEach((pId: string) => {
        const pts = playerPointsMap[pId] || 0;
        if (pId === pick.captain_id) {
          total += pts * 2;
        } else {
          total += pts;
        }
      });
      managerPointsMap[pick.manager_id] = total;
    });

    // 4. Guardar resultados
    const resultsPayload = {
      pachanga_id: pachangaId,
      score_team_a: matchResult.scoreA,
      score_team_b: matchResult.scoreB,
      winner_team: matchResult.winner,
      player_points: playerPointsMap,
      manager_points: managerPointsMap,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('pachanga_results').upsert(resultsPayload, { onConflict: 'pachanga_id' });
      await supabase.from('pachangas').update({ status: 'scored' }).eq('id', pachangaId);
    } catch (e) {
      console.warn('Supabase scorePachanga error:', e);
    }

    setLocal(`result_${pachangaId}`, resultsPayload);
    await this.updatePachangaStatus(pachangaId, 'scored');

    return resultsPayload;
  },

  /**
   * Calcula la clasificación general histórica acumulando todas las pachangas puntuadas.
   */
  async getRankings(): Promise<any[]> {
    const pachangas = await this.getPachangas();
    const members = await this.getMembers();
    const scoredPachangas = pachangas.filter(p => p.status === 'scored');

    const leaderboard: Record<string, {
      managerId: string;
      name: string;
      totalPoints: number;
      lastMatchPoints: number;
      matchesPlayed: number;
      wins: number;
    }> = {};

    // Inicializar cada miembro en el leaderboard
    members.forEach(m => {
      leaderboard[m.id] = {
        managerId: m.id,
        name: m.name,
        totalPoints: 0,
        lastMatchPoints: 0,
        matchesPlayed: 0,
        wins: 0
      };
    });

    for (let i = 0; i < scoredPachangas.length; i++) {
      const p = scoredPachangas[i];
      const details = await this.getPachangaDetails(p.id);
      const res = details.pachanga_results;
      if (res && res.manager_points) {
        let maxPoints = -999;
        let matchWinnerManagerId: string | null = null;

        Object.entries(res.manager_points).forEach(([mId, pts]: [string, any]) => {
          if (!leaderboard[mId]) {
            const memberObj = members.find(m => m.id === mId);
            leaderboard[mId] = {
              managerId: mId,
              name: memberObj?.name || `Manager ${mId.substring(0, 4)}`,
              totalPoints: 0,
              lastMatchPoints: 0,
              matchesPlayed: 0,
              wins: 0
            };
          }
          const numericPts = Number(pts) || 0;
          leaderboard[mId].totalPoints += numericPts;
          leaderboard[mId].matchesPlayed += 1;

          // Si es la pachanga más reciente
          if (i === 0) {
            leaderboard[mId].lastMatchPoints = numericPts;
          }

          if (numericPts > maxPoints) {
            maxPoints = numericPts;
            matchWinnerManagerId = mId;
          }
        });

        if (matchWinnerManagerId && leaderboard[matchWinnerManagerId]) {
          leaderboard[matchWinnerManagerId].wins += 1;
        }
      }
    }

    return Object.values(leaderboard).sort((a, b) => b.totalPoints - a.totalPoints);
  }
};
