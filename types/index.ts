export type PachangaStatus = 'draft' | 'open' | 'closed' | 'scored' | 'cancelled';

export interface Member {
  id: string;
  name: string;
  role: 'member' | 'admin';
  avatar_url?: string;
  alias?: string;
}

export interface Guest {
  id: string;
  name: string;
}

export interface Pachanga {
  id: string;
  date: Date;
  status: PachangaStatus;
  format: number; // Players per team
  attendees: {
    memberId: string | null;
    guestId: string | null;
    team: 'A' | 'B';
  }[];
}

export interface PlayerStat {
  id: string;
  pachangaId: string;
  playerId: string; // MemberId or GuestId
  type: 'goal' | 'assist' | 'own_goal' | 'save' | 'goal_against' | 'mvp' | 'win';
  value: number;
}

export interface ManagerPick {
  id: string;
  pachangaId: string;
  managerId: string;
  selectedPlayerIds: string[];
  captainId: string;
}

export interface Ranking {
  managerId: string;
  totalPoints: number;
  matchPoints: number;
  matchesPlayed: number;
  wins: number;
  lastMatchPoints: number;
}
