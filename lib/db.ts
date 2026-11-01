import { supabase } from './supabase';

export const db = {
  async getMembers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }
    return data;
  },

  async getPachangas() {
    const { data, error } = await supabase.from('pachangas').select('*').order('date', { ascending: true });
    if (error) {
      console.error('Error fetching pachangas:', error);
      return [];
    }
    return data;
  },

  async createPachanga(payload: any) {
    const { data, error } = await supabase.from('pachangas').insert(payload).select().single();
    if (error) {
      console.error('Error creating pachanga:', error);
      throw error;
    }
    return data;
  },

  async updatePachangaStatus(id: string, status: string) {
    const { data, error } = await supabase.from('pachangas').update({ status }).eq('id', id).select().single();
    if (error) {
      console.error('Error updating status:', error);
      throw error;
    }
    return data;
  },

  async addAttendee(pachangaId: string, memberId: string | null, guestId: string | null, team: 'A' | 'B') {
    const { data, error } = await supabase.from('pachanga_attendees').insert({
      pachanga_id: pachangaId,
      member_id: memberId,
      guest_id: guestId,
      team: team
    }).select();
    if (error) {
      console.error('Error adding attendee:', error);
      throw error;
    }
    return data;
  },

  async getPachangaDetails(id: string) {
    const { data, error } = await supabase
      .from('pachangas')
      .select(`
        *,
        pachanga_attendees(*)
      `)
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching pachanga details:', error);
      throw error;
    }
    return data;
  }
};
