-- ========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA WEB-PACHANGAS
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ========================================================

-- 1. Tabla de perfiles / miembros (15 miembros del grupo)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  alias TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de pachangas
CREATE TABLE IF NOT EXISTS pachangas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  format INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de asistentes a pachanga (miembros e invitados)
CREATE TABLE IF NOT EXISTS pachanga_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL REFERENCES pachangas(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_id UUID,
  guest_name TEXT,
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de elecciones de Fantasy por manager
CREATE TABLE IF NOT EXISTS fantasy_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL REFERENCES pachangas(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  captain_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pachanga_id, manager_id)
);

-- 5. Tabla de estadísticas de partido
CREATE TABLE IF NOT EXISTS match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pachanga_id UUID NOT NULL REFERENCES pachangas(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  player_name TEXT,
  type TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de resultados y puntuaciones finales calculadas
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
-- Permitir acceso libre para que la aplicación funcione al 100%
-- ========================================================
ALTER TABLE pachangas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pachanga_attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_picks DISABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE pachanga_results DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- INSERCIÓN DE LOS 15 MIEMBROS INICIALES
-- (Solo se insertan si la tabla está vacía)
-- ========================================================
INSERT INTO profiles (id, name, role, alias)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Pau', 'admin', 'Pau'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Jugador 2', 'member', 'J2'),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'Jugador 3', 'member', 'J3'),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'Jugador 4', 'member', 'J4'),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'Jugador 5', 'member', 'J5'),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'Jugador 6', 'member', 'J6'),
  ('a0000000-0000-0000-0000-000000000007'::uuid, 'Jugador 7', 'member', 'J7'),
  ('a0000000-0000-0000-0000-000000000008'::uuid, 'Jugador 8', 'member', 'J8'),
  ('a0000000-0000-0000-0000-000000000009'::uuid, 'Jugador 9', 'member', 'J9'),
  ('a0000000-0000-0000-0000-00000000010'::uuid, 'Jugador 10', 'member', 'J10'),
  ('a0000000-0000-0000-0000-00000000011'::uuid, 'Jugador 11', 'member', 'J11'),
  ('a0000000-0000-0000-0000-00000000012'::uuid, 'Jugador 12', 'member', 'J12'),
  ('a0000000-0000-0000-0000-00000000013'::uuid, 'Jugador 13', 'member', 'J13'),
  ('a0000000-0000-0000-0000-00000000014'::uuid, 'Jugador 14', 'member', 'J14'),
  ('a0000000-0000-0000-0000-00000000015'::uuid, 'Jugador 15', 'member', 'J15')
) AS v(id, name, role, alias)
WHERE NOT EXISTS (SELECT 1 FROM profiles);
