export interface Player {
  id: string;
  game_id: string;
  email: string;
  nickname: string;
  device_fingerprint: string | null;
  created_at: string;
}

export type PlayerInsert = Pick<Player, 'game_id' | 'email' | 'nickname'> & {
  device_fingerprint?: string | null;
};
