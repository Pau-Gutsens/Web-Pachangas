import { Pachanga, Member } from '../types';
import { INITIAL_MEMBERS } from './seed';

// In-memory "database" for development
let pachangas: Pachanga[] = [];
let members: Member[] = [...INITIAL_MEMBERS];

export const db = {
  getMembers: () => members,

  getPachangas: () => pachangas,

  createPachanga: (data: Omit<Pachanga, 'id'>) => {
    const newPachanga = {
      id: Math.random().toString(36).substring(2, 15),
      ...data,
      attendees: [],
    } as Pachanga;
    pachangas.push(newPachanga);
    return newPachanga;
  },

  updatePachangaStatus: (id: string, status: Pachanga['status']) => {
    const p = pachangas.find(p => p.id === id);
    if (p) p.status = status;
    return p;
  },

  addAttendee: (pachangaId: string, memberId: string | null, guestId: string | null, team: 'A' | 'B') => {
    const p = pachangas.find(p => p.id === pachangaId);
    if (p) {
      p.attendees.push({ memberId, guestId, team });
    }
    return p;
  },

  // Helper to remove an attendee (useful if admin makes a mistake)
  removeAttendee: (pachangaId: string, memberId: string | null, guestId: string | null) => {
    const p = pachangas.find(p => p.id === pachangaId);
    if (p) {
      p.attendees = p.attendees.filter(a => !(a.memberId === memberId && a.guestId === guestId));
    }
    return p;
  }
};
