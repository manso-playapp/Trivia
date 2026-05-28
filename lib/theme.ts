import { createClient } from '@supabase/supabase-js';

type Theme = { css_vars?: Record<string, string> | null; logo_url?: string | null; bg_url?: string | null };

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function getThemeForGame(tenantSlug: string, gameSlug: string): Promise<Theme> {
  const supabase = getPublicClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
  if (!tenant) return {};
  const { data: game } = await supabase
    .from('games')
    .select('id, theme_id')
    .eq('tenant_id', tenant.id)
    .eq('slug', gameSlug)
    .eq('status', 'published')
    .maybeSingle();
  if (!game) return {};
  if (!game.theme_id) return {};
  const { data: theme } = await supabase.from('themes').select('css_vars, logo_url, bg_url').eq('id', game.theme_id as any).maybeSingle();
  if (!theme) return {};
  return theme as Theme;
}

export function cssVarsToStyleTag(vars?: Record<string, string> | null): string {
  if (!vars) return '';
  const entries = Object.entries(vars);
  if (!entries.length) return '';
  const bodyVars = entries.map(([k, v]) => `${k}: ${v};`).join(' ');
  return `:root{ ${bodyVars} }`;
}

