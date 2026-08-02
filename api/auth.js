const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ID fix del grup principal
const MAIN_GROUP_NAME = 'FC😎';

async function getOrCreateMainGroup() {
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (group) return group;

  const { data: newGroup, error } = await supabase
    .from('groups')
    .insert({ name: MAIN_GROUP_NAME, invite_code: 'COLLA' })
    .select()
    .single();

  if (error) throw new Error('Error al crear el grup principal: ' + error.message);
  return newGroup;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    const mainGroup = await getOrCreateMainGroup();

    // 1. LOG IN
    if (action === 'login') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Correu i contrasenya requerits' });
      }

      // Intentar login
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authErr) {
        // Comprovar si el correu existeix a la llista d'usuaris/perfils per especificar quin camp falla
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .limit(100);

        // Si tenim usuaris, podem fer una comprovació aproximada
        let userMessage = 'La contrasenya és incorrecta';
        if (authErr.message.includes('Invalid login credentials')) {
          userMessage = 'El correu no està registrat o la contrasenya és incorrecta';
        }

        return res.status(401).json({ error: userMessage });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, groups(*)')
        .eq('id', authData.user.id)
        .maybeSingle();

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null,
        group: mainGroup
      });
    }

    // 2. SIGN UP (Registre)
    if (action === 'signup') {
      const { displayName, email, password } = req.body || {};
      if (!displayName || !email || !password) {
        return res.status(400).json({ error: 'Tots els camps són obligatoris' });
      }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password
      });

      if (authErr) {
        let userMessage = authErr.message;
        if (authErr.message.includes('User already registered') || authErr.message.includes('already exists')) {
          userMessage = 'Aquest correu electrònic ja està registrat. Utilitza la pestanya Iniciar Sessió.';
        } else if (authErr.message.includes('Password should be at least')) {
          userMessage = 'La contrasenya ha de tenir com a mínim 6 caràcters';
        }
        return res.status(400).json({ error: userMessage });
      }

      // Crea el perfil vinculat al grup principal
      const { data: profile, error: profileErr } = await supabase.from('profiles').insert({
        id: authData.user.id,
        group_id: mainGroup.id,
        display_name: displayName,
        role: 'member',
        elo: 1400,
        emoji: '⚽'
      }).select().single();

      if (profileErr) console.warn('Error al crear perfil:', profileErr);

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null,
        group: mainGroup
      });
    }

    return res.status(400).json({ error: 'Acció no vàlida' });
  } catch (err) {
    console.error('[API Auth Error]:', err);
    return res.status(500).json({ error: err.message || 'Error del servidor' });
  }
};
