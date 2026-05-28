import { createClient } from '@supabase/supabase-js';

// Crea cliente solo si hay env válidas, sino lanza error descriptivo en tiempo de ejecución
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase no configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

// Placeholder de tipos: luego generaremos con supabase gen types
type Database = any;
