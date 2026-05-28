export type GameStatus = 'draft' | 'published' | 'archived';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  active: boolean;
  created_at: string;
}

export interface Game {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  status: GameStatus;
  config: Record<string, unknown>;
  current_question_idx: number | null;
  question_ends_at: string | null;
  theme_id: string | null;
  created_at: string;
}
