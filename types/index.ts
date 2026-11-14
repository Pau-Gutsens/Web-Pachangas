export type UserRole = 'admin' | 'user' | 'member' | 'guest';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  isGuest?: boolean;
  budget: number; // En K€ (100.000 K€ = 100 M€)
  ownedPlayerIds: string[]; // Máximo 6 jugadores (5 titulares + 1 reserva)
  starterPlayerIds: string[]; // 5 titulares
  captainId?: string | null; // Uno de los 5 titulares, puntúa × 2
  reservePlayerId?: string | null; // El sexto jugador (en banquillo)
  linkedPlayerId?: string | null; // Vínculo con jugador real de las pachangas
  linkStatus?: 'approved' | 'pending' | 'none'; // Aprobación del admin
  totalPoints: number;
  lastMatchPoints: number;
  seasonPoints?: Record<number, number>; // Puntos acumulados por año/temporada
}

export interface PlayerStatsSummary {
  goals: number;
  assists: number;
  ownGoals: number;
  saves: number; // Salvadas (máximo 3 por partido)
  matchesPlayed: number;
}

export interface Player {
  id: string;
  name: string;
  isGuest: boolean;
  avatarUrl?: string;
  currentPrice: number; // En K€ (ej. 20.000 = 20 M€)
  previousPrice: number; // En K€
  priceChangePct: number; // Ej. +12.08 % (sin redondear a entero)
  averageRating: number; // Nota media del cromo (Bayesiana)
  ratingsCount: number; // Pachangas con nota
  stats: PlayerStatsSummary;
}

export type MatchEventType = 'goal' | 'own_goal' | 'save';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  team: 'A' | 'B';
  playerId: string;
  assistantId?: string; // Opcional, para goles
  createdAt: string;
}

export interface CorrectionRequest {
  id: string;
  matchId: string;
  userId: string;
  playerId: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface LineupSnapshot {
  starters: string[]; // 5 titulares
  captainId?: string | null;
  reserveId?: string | null;
}

export interface VoteRanking {
  id?: string;
  matchId: string;
  voterUsername: string;
  voterPlayerId: string;
  orderedPlayerIds: string[]; // Ranking completo de todos los demás participantes (del 1 al último)
  submittedAt?: string;
}

export type MatchStatus = 'created' | 'locked' | 'live' | 'voting' | 'published' | 'upcoming' | 'scored' | 'cancelled';

export interface PlayerMatchScore {
  playerId: string;
  rawStats: number; // Puntos brutos (0-20 o más)
  statsPoints: number; // Estadísticas en escala 0-10 (sin redondear)
  votesPoints: number; // Votos en escala 0-10 (sin redondear)
  totalPoints: number; // Total entero (el .5 sube)
  isMvp: boolean;
  priceChangePct: number; // Variación %
  newPrice: number; // Nuevo precio en K€
}

export interface ManagerMatchScore {
  managerId: string;
  username: string;
  totalPoints: number;
  playerBreakdown: Record<string, number>; // playerId -> puntos aportados (capitán × 2)
}

export interface PachangaMatch {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "17:00"
  endTime: string; // "18:30"
  format?: number;
  status: MatchStatus;
  isOfficial?: boolean; // El del 6 de noviembre es oficial (true); otros de prueba false
  teamA: string[]; // Player IDs convocados
  teamB: string[]; // Player IDs convocados
  scoreA?: number;
  scoreB?: number;
  events?: MatchEvent[]; // Secuencia de eventos del modo directo
  corrections?: CorrectionRequest[];
  lineupSnapshots?: Record<string, LineupSnapshot>; // managerId -> foto al bloquear
  rawVotes?: Record<string, string[]>; // voterPlayerId -> ranking de playerIds
  playerScores?: Record<string, PlayerMatchScore>;
  managerScores?: Record<string, ManagerMatchScore>;
  playerStats?: Record<string, {
    goals: number;
    assists: number;
    ownGoals: number;
    saves?: number;
    rating?: number;
  }>;
  votingOpenedAt?: string | null;
  correctionsOpenedAt?: string | null;
}

export type Member = Player;
