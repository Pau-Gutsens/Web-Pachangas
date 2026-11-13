-- ========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA WEB-PACHANGAS
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ========================================================

-- 1. Tabla de perfiles / managers (usuarios registrados de la app)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  alias TEXT,
  avatar_url TEXT,
  budget NUMERIC DEFAULT 100,
  owned_player_ids JSONB DEFAULT '[]'::jsonb,
  starter_player_ids JSONB DEFAULT '[]'::jsonb,
  total_points INTEGER DEFAULT 0,
  last_match_points INTEGER DEFAULT 0,
  compras_iniciales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla profiles ya existía previamente, asegurar que tenga todas las columnas necesarias:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owned_player_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS starter_player_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_match_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compras_iniciales INTEGER DEFAULT 0;

-- 2. Tabla de pachangas
CREATE TABLE IF NOT EXISTS pachangas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  start_time TEXT DEFAULT '17:00',
  end_time TEXT DEFAULT '18:30',
  status TEXT NOT NULL DEFAULT 'upcoming',
  format INTEGER NOT NULL DEFAULT 5,
  team_a JSONB DEFAULT '[]'::jsonb,
  team_b JSONB DEFAULT '[]'::jsonb,
  score_a INTEGER,
  score_b INTEGER,
  player_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de jugadores fantasy (futbolistas gestionados por el admin)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  current_price NUMERIC DEFAULT 20,
  previous_price NUMERIC DEFAULT 20,
  price_change_pct NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"goals":0,"assists":0,"ownGoals":0,"saves":0,"goalsAgainst":0,"matchesPlayed":0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de asistentes a pachanga (miembros e invitados)
CREATE TABLE IF NOT EXISTS pachanga_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL REFERENCES pachangas(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_id UUID,
  guest_name TEXT,
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de elecciones de Fantasy por manager
CREATE TABLE IF NOT EXISTS fantasy_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL REFERENCES pachangas(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  captain_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pachanga_id, manager_id)
);

-- 6. Tabla de estadísticas de partido
CREATE TABLE IF NOT EXISTS match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL REFERENCES pachangas(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  player_name TEXT,
  type TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla de resultados y puntuaciones finales calculadas
CREATE TABLE IF NOT EXISTS pachanga_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL UNIQUE REFERENCES pachangas(id) ON DELETE CASCADE,
  score_team_a INTEGER DEFAULT 0,
  score_team_b INTEGER DEFAULT 0,
  winner_team TEXT DEFAULT 'draw', -- 'A', 'B', o 'draw'
  player_points JSONB DEFAULT '{}'::jsonb,
  manager_points JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- PERMISOS Y SEGURIDAD (RLS)
-- ========================================================
ALTER TABLE pachangas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pachanga_attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_picks DISABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE pachanga_results DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- INSERCIÓN DEL ADMINISTRADOR
-- (Solo se inserta Pagusa como admin inicial si la tabla está vacía)
-- ========================================================
INSERT INTO profiles (id, name, role, alias)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Pagusa', 'admin', 'Pagusa')
) AS v(id, name, role, alias)
WHERE NOT EXISTS (SELECT 1 FROM profiles);
