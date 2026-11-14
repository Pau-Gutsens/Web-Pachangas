const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://xxcxscmaikpzbomjsmna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4Y3hzY21haWtwemJvbWpzbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjkyMzAsImV4cCI6MjEwOTEwNTIzMH0.kBz9bMcIdhkiF6ARz7r0RbBwFIRikVKUuqGny5FzvS4';

const supabase = createClient(supabaseUrl, supabaseKey);

const backupDir = path.join(__dirname, '..', 'backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const tables = [
  'profiles',
  'players',
  'pachangas',
  'pachanga_attendees',
  'fantasy_picks',
  'match_stats',
  'pachanga_results',
  'rating_votes'
];

async function runBackup() {
  console.log('Iniciando backup completo de Supabase...');
  const manifest = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`Aviso al exportar tabla ${table}:`, error.message);
        manifest.tables[table] = { status: 'error', message: error.message };
      } else {
        const filePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data || [], null, 2), 'utf-8');
        console.log(`✓ Tabla ${table}: ${(data || []).length} filas guardadas en ${filePath}`);
        manifest.tables[table] = { status: 'ok', count: (data || []).length, file: `${table}.json` };
      }
    } catch (e) {
      console.error(`Error inesperado en ${table}:`, e);
      manifest.tables[table] = { status: 'error', error: String(e) };
    }
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nBackup finalizado con éxito en: ${backupDir}`);
}

runBackup();

