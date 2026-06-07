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

/** Digunakan bersama view `survey_with_question_count` */
export interface SurveyWithCount extends SurveyRow {
  question_count: number;
}

export interface SectionRow {
  id: string;
  survey_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  survey_id: string;
  /** Referensi ke section. Null untuk pertanyaan lama yang belum dimigrasikan. */
  section_id: string | null;
  question_text: string;
  question_type: string;
  options: Json | null;
  is_required: boolean;
  branching_logic: Json | null;
  /** Urutan tampil dalam section. 0-indexed. */
  order_index: number;
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

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  nik: string | null;
  date_of_birth: string | null;
  province: string | null;
  university: string | null;
  role: 'admin' | 'awardee';
  updated_at: string;
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
      sections: {
        Row: SectionRow;
        Insert: {
          id?: string;
          survey_id: string;
          title: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          survey_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
        };
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: {
          id?: string;
          survey_id: string;
          section_id?: string | null;
          question_text: string;
          question_type: string;
          options?: Json | null;
          is_required?: boolean;
          branching_logic?: Json | null;
          order_index?: number;
        };
        Update: {
          survey_id?: string;
          section_id?: string | null;
          question_text?: string;
          question_type?: string;
          options?: Json | null;
          is_required?: boolean;
          branching_logic?: Json | null;
          order_index?: number;
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
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          nik?: string | null;
          date_of_birth?: string | null;
          province?: string | null;
          university?: string | null;
          role?: 'admin' | 'awardee';
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          nik?: string | null;
          date_of_birth?: string | null;
          province?: string | null;
          university?: string | null;
          role?: 'admin' | 'awardee';
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      list_profiles_for_admin: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: 'admin' | 'awardee';
          updated_at: string;
        }[];
      };
      set_user_role: {
        Args: {
          target_user_id: string;
          next_role: 'admin' | 'awardee';
        };
        Returns: boolean;
      };
      set_survey_status: {
        Args: {
          survey_id: string;
          next_status: boolean;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
