export interface Submission {
  id: string;
  player_id: string;
  question_id: string;
  selected_index: number;
  submitted_at: string;
  is_correct: boolean | null;
  score_awarded: number | null;
}

export type SubmissionInsert = Pick<
  Submission,
  'player_id' | 'question_id' | 'selected_index' | 'is_correct' | 'score_awarded'
>;
