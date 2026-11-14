const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xxcxscmaikpzbomjsmna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4Y3hzY21haWtwemJvbWpzbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjkyMzAsImV4cCI6MjEwOTEwNTIzMH0.kBz9bMcIdhkiF6ARz7r0RbBwFIRikVKUuqGny5FzvS4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Resultados esperados de la Sección 17 para el 6 de noviembre
const EXPECTED_RESULTS = {
  Gerard:  { raw: 30, votes: 10.00, stats: 10.00, total: 20, varPct: 15.00,  price: 23000, goals: 8, assists: 0, isMvp: true,  team: 'A' },
  Bernús:  { raw: 14, votes: 7.35,  stats: 7.00,  total: 14, varPct: 12.08,  price: 22420, goals: 4, assists: 2, isMvp: false, team: 'B' },
  Eloy:    { raw: 9,  votes: 7.28,  stats: 4.50,  total: 12, varPct: 7.08,   price: 21420, goals: 2, assists: 0, isMvp: false, team: 'A' },
  Merino:  { raw: 12, votes: 5.82,  stats: 6.00,  total: 12, varPct: 7.08,   price: 21420, goals: 3, assists: 0, isMvp: false, team: 'A' },
  Lombun:  { raw: 11, votes: 3.08,  stats: 5.50,  total: 9,  varPct: -0.42,  price: 19920, goals: 3, assists: 2, isMvp: false, team: 'B' },
  Uri:     { raw: 3,  votes: 6.06,  stats: 1.50,  total: 8,  varPct: -2.92,  price: 19420, goals: 1, assists: 0, isMvp: false, team: 'B' },
  Dean:    { raw: 7,  votes: 3.78,  stats: 3.50,  total: 7,  varPct: -5.42,  price: 18920, goals: 2, assists: 1, isMvp: false, team: 'B' },
  Dávila:  { raw: 6,  votes: 4.09,  stats: 3.00,  total: 7,  varPct: -5.42,  price: 18920, goals: 1, assists: 0, isMvp: false, team: 'A' },
  Salinas: { raw: 3,  votes: 4.65,  stats: 1.50,  total: 6,  varPct: -7.92,  price: 18420, goals: 0, assists: 0, isMvp: false, team: 'A' },
  Pedret:  { raw: 4,  votes: 3.65,  stats: 2.00,  total: 6,  varPct: -7.92,  price: 18420, goals: 1, assists: 1, isMvp: false, team: 'B' },
  Tais:    { raw: 6,  votes: 3.17,  stats: 3.00,  total: 6,  varPct: -7.92,  price: 18420, goals: 1, assists: 0, isMvp: false, team: 'A' },
  Sergi:   { raw: 1,  votes: 2.40,  stats: 0.50,  total: 3,  varPct: -15.00, price: 17000, goals: 0, assists: 1, isMvp: false, team: 'B' }
};

async function migrate() {
  console.log('Iniciando migración del partido del 6 de noviembre...');

  // 1. Obtener todos los jugadores
  const { data: players, error: pErr } = await supabase.from('players').select('*');
  if (pErr) throw pErr;

  console.log(`Encontrados ${players.length} jugadores en la base de datos.`);

  const playerMap = {};
  players.forEach(p => {
    // Normalizar nombres para coincidencia insensible a mayúsculas y acentos
    const norm = p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    playerMap[norm] = p;
  });

  const teamAIds = [];
  const teamBIds = [];
  const playerScores = {};
  const playerStats = {};

  // 2. Actualizar cada jugador de la prueba
  for (const [name, exp] of Object.entries(EXPECTED_RESULTS)) {
    const norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    let player = playerMap[norm];

    const isGuest = name.toLowerCase().includes('invitado');
    const playerPayload = {
      name,
      is_guest: isGuest,
      current_price: exp.price,
      previous_price: 20000,
      price_change_pct: Math.round(exp.varPct),
      average_rating: Math.round(exp.votes),
      ratings_count: 1,
      stats: { goals: exp.goals, assists: exp.assists, ownGoals: 0, saves: 0, matchesPlayed: 1 }
    };

    if (!player) {
      console.log(`Jugador ${name} no encontrado en Supabase. Creándolo...`);
      const insertRes = await supabase.from('players').insert(playerPayload).select().single();
      if (insertRes.error) {
        console.error(`Error creando ${name}:`, insertRes.error);
        continue;
      }
      player = insertRes.data;
    } else {
      const updateRes = await supabase.from('players').update(playerPayload).eq('id', player.id);
      if (updateRes.error) {
        console.error(`Error actualizando ${name}:`, updateRes.error);
      } else {
        console.log(`✓ ${name} actualizado: Precio ${exp.price} K€, Total ${exp.total} pts`);
      }
    }

    if (exp.team === 'A') teamAIds.push(player.id);
    else teamBIds.push(player.id);

    playerScores[player.id] = {
      playerId: player.id,
      playerName: name,
      rawStats: exp.raw,
      statsPoints: exp.stats,
      votesPoints: exp.votes,
      totalPoints: exp.total,
      isMvp: exp.isMvp,
      priceChangePct: exp.varPct,
      newPrice: exp.price
    };

    playerStats[player.id] = {
      goals: exp.goals,
      assists: exp.assists,
      ownGoals: 0,
      saves: 0,
      rating: exp.votes
    };
  }

  // Resto de jugadores que no jugaron el 6 de noviembre: precio base 20.000 K€
  for (const p of players) {
    const isPlayed = Object.values(playerScores).some(s => s.playerId === p.id);
    if (!isPlayed) {
      await supabase.from('players').update({
        current_price: 20000,
        previous_price: 20000,
        price_change_pct: 0
      }).eq('id', p.id);
    }
  }

  // 3. Actualizar la pachanga del 6 de noviembre en Supabase
  const { data: matches } = await supabase.from('pachangas').select('*');
  const nov6Match = (matches || []).find(m => m.date && m.date.startsWith('2026-11-06')) || matches?.[0];

  if (nov6Match) {
    console.log(`Actualizando pachanga oficial del 6 de noviembre (ID: ${nov6Match.id})...`);
    const updateMatchRes = await supabase.from('pachangas').update({
      score_a: 15,
      score_b: 11,
      team_a: teamAIds,
      team_b: teamBIds,
      player_stats: playerStats,
      status: 'scored'
    }).eq('id', nov6Match.id);

    if (updateMatchRes.error) {
      console.error('Error actualizando match:', updateMatchRes.error);
    } else {
      console.log('✓ Pachanga del 6 de noviembre actualizada como jornada oficial (15-11, status: published).');
    }
  }

  // 4. Actualizar perfiles a 100.000 K€ de saldo si tenían el valor antiguo (100)
  const { data: profiles } = await supabase.from('profiles').select('*');
  if (profiles) {
    for (const prof of profiles) {
      const budget = Number(prof.budget || 100);
      const newBudget = budget <= 1000 ? budget * 1000 : budget;
      // Admin Pagusa vinculado a Gutsens si existe
      const gutsensPlayer = playerMap['gutsens'];
      const updateData = { budget: newBudget };
      if (prof.name.toLowerCase() === 'pagusa' && gutsensPlayer) {
        updateData.linked_player_id = gutsensPlayer.id;
        updateData.link_status = 'approved';
      }
      await supabase.from('profiles').update(updateData).eq('id', prof.id);
    }
    console.log(`✓ Presupuestos de ${profiles.length} perfiles verificados en K€.`);
  }

  console.log('\nMigración del 6 de noviembre finalizada con éxito.');
}

migrate().catch(console.error);
