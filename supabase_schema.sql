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
  budget NUMERIC DEFAULT 100000, -- en K€ (100 M€)
  owned_player_ids JSONB DEFAULT '[]'::jsonb,
  starter_player_ids JSONB DEFAULT '[]'::jsonb,
  captain_id UUID,
  linked_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  link_status TEXT DEFAULT 'none',
  total_points INTEGER DEFAULT 0,
  last_match_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla profiles ya existía previamente, asegurar que tenga todas las columnas necesarias:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 100000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owned_player_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS starter_player_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS captain_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linked_player_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_match_points INTEGER DEFAULT 0;

-- Asegurar que el id se genere automáticamente y no dependa de auth.users:
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Permitir eliminar perfiles de managers sin bloqueos de clave foránea:
ALTER TABLE pachanga_attendees DROP CONSTRAINT IF EXISTS pachanga_attendees_member_id_fkey;
ALTER TABLE pachanga_attendees ADD CONSTRAINT pachanga_attendees_member_id_fkey FOREIGN KEY (member_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE fantasy_picks DROP CONSTRAINT IF EXISTS fantasy_picks_manager_id_fkey;
ALTER TABLE fantasy_picks ADD CONSTRAINT fantasy_picks_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Conceder permisos completos a usuarios anónimos y autenticados:
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

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

-- Si la tabla pachangas ya existía con restricciones anteriores, asegurar columnas y actualizar estados permitidos:
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS start_time TEXT DEFAULT '17:00';
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS end_time TEXT DEFAULT '18:30';
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'upcoming';
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS format INTEGER NOT NULL DEFAULT 5;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS team_a JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS team_b JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS score_a INTEGER;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS score_b INTEGER;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS player_stats JSONB DEFAULT '{}'::jsonb;

ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS lineup_snapshots JSONB DEFAULT '{}'::jsonb;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS corrections JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS raw_votes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE pachangas ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT TRUE;

-- Actualizar restricción de estados para admitir todos los estados:
ALTER TABLE pachangas DROP CONSTRAINT IF EXISTS pachangas_status_check;
ALTER TABLE pachangas ADD CONSTRAINT pachangas_status_check 
  CHECK (status IN ('created', 'locked', 'live', 'voting', 'published', 'upcoming', 'scored', 'draft', 'open', 'closed', 'cancelled'));

-- 3. Tabla de jugadores fantasy (futbolistas gestionados por el admin)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  current_price NUMERIC DEFAULT 20000, -- en K€ (20 M€)
  previous_price NUMERIC DEFAULT 20000,
  price_change_pct NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"goals":0,"assists":0,"ownGoals":0,"saves":0,"matchesPlayed":0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar tipos numéricos para precios en K€ y decimales en valoraciones:
ALTER TABLE players ALTER COLUMN average_rating TYPE NUMERIC USING average_rating::numeric;
ALTER TABLE players ALTER COLUMN price_change_pct TYPE NUMERIC USING price_change_pct::numeric;
ALTER TABLE players ALTER COLUMN current_price TYPE NUMERIC USING current_price::numeric;
ALTER TABLE players ALTER COLUMN previous_price TYPE NUMERIC USING previous_price::numeric;

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

-- 8. Tabla de auditoría y transacciones de presupuesto
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  type TEXT NOT NULL, -- 'buy', 'sell', 'adjustment', 'bonus', etc.
  description TEXT NOT NULL,
  player_name TEXT,
  amount NUMERIC NOT NULL,
  previous_budget NUMERIC NOT NULL,
  new_budget NUMERIC NOT NULL,
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
ALTER TABLE budget_transactions DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- INSERCIÓN Y VINCULACIÓN DEL ADMINISTRADOR (PAGUSA ↔ GUTSENS)
-- ========================================================
INSERT INTO profiles (id, name, role, alias)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Pagusa', 'admin', 'Pagusa')
) AS v(id, name, role, alias)
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE LOWER(name) = 'pagusa');

-- Vincular Pagusa a Gutsens automáticamente:
UPDATE profiles 
SET linked_player_id = (SELECT id FROM players WHERE LOWER(name) = 'gutsens' LIMIT 1),
    link_status = 'approved'
WHERE LOWER(name) = 'pagusa';
