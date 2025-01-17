export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string | null;
          created_at: string | null;
          id: string;
          job_id: string | null;
          parsed_data: Json | null;
          resume_url: string;
          score: number | null;
          scoring_breakdown: Json | null;
          strengths: string[] | null;
          gaps: string[] | null;
          recommendation: string | null;
          status: Database['public']['Enums']['application_status'] | null;
          updated_at: string | null;
        };
        Insert: {
          applicant_id?: string | null;
          created_at?: string | null;
          id?: string;
          job_id?: string | null;
          parsed_data?: Json | null;
          resume_url: string;
          score?: number | null;
          scoring_breakdown?: Json | null;
          strengths?: string[] | null;
          gaps?: string[] | null;
          recommendation?: string | null;
          status?: Database['public']['Enums']['application_status'] | null;
          updated_at?: string | null;
        };
        Update: {
          applicant_id?: string | null;
          created_at?: string | null;
          id?: string;
          job_id?: string | null;
          parsed_data?: Json | null;
          resume_url?: string;
          score?: number | null;
          scoring_breakdown?: Json | null;
          strengths?: string[] | null;
          gaps?: string[] | null;
          recommendation?: string | null;
          status?: Database['public']['Enums']['application_status'] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'applications_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          }
        ];
      };
      jobs: {
        Row: {
          additional_info: string | null;
          ai_analysis: Json | null;
          application_deadline: string;
          company_name: string;
          created_at: string | null;
          description: string;
          education_requirements: string | null;
          employment_type: Database['public']['Enums']['employment_type'];
          experience_level: Database['public']['Enums']['experience_level'];
          id: string;
          is_active: boolean | null;
          location: string;
          recruiter_id: string | null;
          salary_max: number | null;
          salary_min: number | null;
          skills: string[];
          title: string;
          updated_at: string | null;
        };
        Insert: {
          additional_info?: string | null;
          ai_analysis?: Json | null;
          application_deadline: string;
          company_name: string;
          created_at?: string | null;
          description: string;
          education_requirements?: string | null;
          employment_type: Database['public']['Enums']['employment_type'];
          experience_level: Database['public']['Enums']['experience_level'];
          id?: string;
          is_active?: boolean | null;
          location: string;
          recruiter_id?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          skills?: string[];
          title: string;
          updated_at?: string | null;
        };
        Update: {
          additional_info?: string | null;
          ai_analysis?: Json | null;
          application_deadline?: string;
          company_name?: string;
          created_at?: string | null;
          description?: string;
          education_requirements?: string | null;
          employment_type?: Database['public']['Enums']['employment_type'];
          experience_level?: Database['public']['Enums']['experience_level'];
          id?: string;
          is_active?: boolean | null;
          location?: string;
          recruiter_id?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          skills?: string[];
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          company_name: string | null;
          company_website: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          company_name?: string | null;
          company_website?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          company_name?: string | null;
          company_website?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      application_status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
      employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
      experience_level: 'entry' | 'mid' | 'senior' | 'executive';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
  ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;
