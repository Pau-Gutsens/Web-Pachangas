import { Player } from '../types';

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-pagusa',
    name: 'Pagusa',
    isGuest: false,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    currentPrice: 20,
    previousPrice: 20,
    priceChangePct: 0,
    averageRating: 0,
    ratingsCount: 0,
    stats: { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 }
  },
  {
    id: 'p-carlos-invitado',
    name: 'Carlos',
    isGuest: true,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
    currentPrice: 20,
    previousPrice: 20,
    priceChangePct: 0,
    averageRating: 0,
    ratingsCount: 0,
    stats: { goals: 0, assists: 0, ownGoals: 0, saves: 0, goalsAgainst: 0, matchesPlayed: 0 }
  }
];
