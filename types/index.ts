export type UserRole = 'admin' | 'user' | 'guest';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  isGuest?: boolean;
  budget: number; // In millions (defaults to 100M)
  ownedPlayerIds: string[]; // Max 6 players
  starterPlayerIds: string[]; // Exactly 5 starters when full
  totalPoints: number;
  lastMatchPoints?: number;
}

export interface PlayerStatsSummary {
  goals: number;
  assists: number;
  ownGoals: number;
  saves: number;
  goalsAgainst: number;
  matchesPlayed: number;
}

export interface Player {
  id: string;
  name: string;
  isGuest: boolean;
  avatarUrl?: string;
  currentPrice: number; // e.g. 20 (millones)
  previousPrice: number;
  priceChangePct: number; // e.g. +5.2 or -2.5%
  averageRating: number; // 1-10 average from community ratings
  ratingsCount: number;
  stats: PlayerStatsSummary;
}

export interface PachangaMatch {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "17:00"
  endTime: string; // e.g. "18:30"
  format: number; // e.g. 5
  status: 'upcoming' | 'live' | 'voting' | 'scored';
  teamA: string[]; // Player IDs
  teamB: string[]; // Player IDs
  scoreA?: number;
  scoreB?: number;
  playerStats?: Record<string, {
    goals: number;
    assists: number;
    ownGoals: number;
    saves: number;
    goalsAgainst: number;
  }>;
}

export interface PlayerRatingVote {
  id: string;
  pachangaId: string;
  voterUsername: string;
  targetPlayerId: string;
  rating: number; // 1 to 10
}

export type Member = Player;
