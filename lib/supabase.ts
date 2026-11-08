import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types for clarity
export type Member = {
  id: string;
  name: string;
  role: 'member' | 'admin';
  avatar_url?: string;
  alias?: string;
};

export type Pachanga = {
  id: string;
  date: Date;
  status: 'draft' | 'open' | 'closed' | 'scored' | 'cancelled';
  format: number;
};
