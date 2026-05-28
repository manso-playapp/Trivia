export type QuestionOption = string;

export interface Question {
  id: string;
  game_id: string;
  idx: number;
  text: string;
  options: QuestionOption[];
  correct_index: number;
  time_limit_sec: number;
  points_base: number;
  points_time_factor: number;
  created_at: string;
}

export type PublicQuestion = Omit<Question, 'correct_index' | 'points_base' | 'points_time_factor' | 'created_at'>;
