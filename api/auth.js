const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    // 1. LOG IN
    if (action === 'login') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Correu i contrasenya requerits' });
      }

      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authErr) {
        let userMessage = 'El correu o la contrasenya són incorrectes';
        if (authErr.message.includes('Invalid login credentials')) {
          userMessage = 'El correu no està registrat o la contrasenya és incorrecta';
        }
        return res.status(401).json({ error: userMessage });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null
      });
    }

    // 2. SIGN UP (Registre net de l'usuari)
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

      // Crea el perfil de l'usuari
      const { data: profile, error: profileErr } = await supabase.from('profiles').insert({
        id: authData.user.id,
        display_name: displayName,
        role: 'member',
        elo: 1400,
        emoji: '⚽'
      }).select().single();

      if (profileErr) console.warn('Error al crear perfil:', profileErr);

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null
      });
    }

    return res.status(400).json({ error: 'Acció no vàlida' });
  } catch (err) {
    console.error('[API Auth Error]:', err);
    return res.status(500).json({ error: err.message || 'Error del servidor' });
  }
};
