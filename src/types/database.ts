export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface SurveyRow {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: string;
  options: Json | null;
  is_required: boolean;
  branching_logic: Json | null;
}

export interface ResponseRow {
  id: string;
  survey_id: string;
  submitted_at: string;
}

export interface AnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  text_value: string | null;
  score_performance: number | null;
  score_importance: number | null;
  reason: string | null;
}

export interface Database {
  public: {
    Tables: {
      surveys: {
        Row: SurveyRow;
        Insert: {
          id?: string;
          title: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: {
          id?: string;
          survey_id: string;
          question_text: string;
          question_type: string;
          options?: Json | null;
          is_required?: boolean;
          branching_logic?: Json | null;
        };
        Update: {
          survey_id?: string;
          question_text?: string;
          question_type?: string;
          options?: Json | null;
          is_required?: boolean;
          branching_logic?: Json | null;
        };
        Relationships: [];
      };
      responses: {
        Row: ResponseRow;
        Insert: {
          id?: string;
          survey_id: string;
          submitted_at?: string;
        };
        Update: {
          survey_id?: string;
          submitted_at?: string;
        };
        Relationships: [];
      };
      answers: {
        Row: AnswerRow;
        Insert: {
          id?: string;
          response_id: string;
          question_id: string;
          text_value?: string | null;
          score_performance?: number | null;
          score_importance?: number | null;
          reason?: string | null;
        };
        Update: {
          response_id?: string;
          question_id?: string;
          text_value?: string | null;
          score_performance?: number | null;
          score_importance?: number | null;
          reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
