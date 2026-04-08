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
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          line_id: string;
          region: string;
          instagram_handle: string;
          instagram_url: string | null;
          threads_url: string | null;
          facebook_url: string | null;
          youtube_url: string | null;
          dcard_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          line_id: string;
          region: string;
          instagram_handle: string;
          instagram_url?: string | null;
          threads_url?: string | null;
          facebook_url?: string | null;
          youtube_url?: string | null;
          dcard_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          line_id?: string;
          region?: string;
          instagram_handle?: string;
          instagram_url?: string | null;
          threads_url?: string | null;
          facebook_url?: string | null;
          youtube_url?: string | null;
          dcard_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          category: string;
          region: string;
          thumbnail_url: string | null;
          recruitment_count: number;
          bonus_application_count: number;
          application_deadline: string;
          experience_date: string;
          review_deadline: string;
          status: "draft" | "active" | "closed";
          title_ko: string;
          brand_name_ko: string;
          summary_ko: string;
          description_ko: string;
          benefits_ko: string;
          requirements_ko: string;
          precautions_ko: string | null;
          title_zh_tw: string | null;
          brand_name_zh_tw: string | null;
          summary_zh_tw: string | null;
          description_zh_tw: string | null;
          benefits_zh_tw: string | null;
          requirements_zh_tw: string | null;
          precautions_zh_tw: string | null;
          map_url: string | null;
          platforms: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          region: string;
          thumbnail_url?: string | null;
          recruitment_count?: number;
          bonus_application_count?: number;
          application_deadline: string;
          experience_date: string;
          review_deadline: string;
          status?: "draft" | "active" | "closed";
          title_ko: string;
          brand_name_ko: string;
          summary_ko: string;
          description_ko: string;
          benefits_ko: string;
          requirements_ko: string;
          precautions_ko?: string | null;
          title_zh_tw?: string | null;
          brand_name_zh_tw?: string | null;
          summary_zh_tw?: string | null;
          description_zh_tw?: string | null;
          benefits_zh_tw?: string | null;
          requirements_zh_tw?: string | null;
          precautions_zh_tw?: string | null;
          map_url?: string | null;
          platforms?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          region?: string;
          thumbnail_url?: string | null;
          recruitment_count?: number;
          bonus_application_count?: number;
          application_deadline?: string;
          experience_date?: string;
          review_deadline?: string;
          status?: "draft" | "active" | "closed";
          title_ko?: string;
          brand_name_ko?: string;
          summary_ko?: string;
          description_ko?: string;
          benefits_ko?: string;
          requirements_ko?: string;
          precautions_ko?: string | null;
          title_zh_tw?: string | null;
          brand_name_zh_tw?: string | null;
          summary_zh_tw?: string | null;
          description_zh_tw?: string | null;
          benefits_zh_tw?: string | null;
          requirements_zh_tw?: string | null;
          precautions_zh_tw?: string | null;
          map_url?: string | null;
          platforms?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string;
          message: string | null;
          applied_instagram_url: string;
          applied_threads_url: string | null;
          applied_facebook_url: string | null;
          applied_youtube_url: string | null;
          applied_dcard_url: string | null;
          status: "pending" | "approved" | "rejected";
          admin_note: string | null;
          applied_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id: string;
          message?: string | null;
          applied_instagram_url: string;
          applied_threads_url?: string | null;
          applied_facebook_url?: string | null;
          applied_youtube_url?: string | null;
          applied_dcard_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_note?: string | null;
          applied_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string;
          message?: string | null;
          applied_instagram_url?: string;
          applied_threads_url?: string | null;
          applied_facebook_url?: string | null;
          applied_youtube_url?: string | null;
          applied_dcard_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_note?: string | null;
          applied_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          application_id: string;
          review_url: string;
          content: string | null;
          image_urls: string[] | null;
          visited_at: string | null;
          submitted_at: string;
          status: "pending" | "submitted" | "approved";
        };
        Insert: {
          id?: string;
          application_id: string;
          review_url: string;
          content?: string | null;
          image_urls?: string[] | null;
          visited_at?: string | null;
          submitted_at?: string;
          status?: "pending" | "submitted" | "approved";
        };
        Update: {
          id?: string;
          application_id?: string;
          review_url?: string;
          content?: string | null;
          image_urls?: string[] | null;
          visited_at?: string | null;
          submitted_at?: string;
          status?: "pending" | "submitted" | "approved";
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "user" | "admin";
      campaign_status: "draft" | "active" | "closed";
      application_status: "pending" | "approved" | "rejected";
      review_status: "pending" | "submitted" | "approved";
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Profile = Tables<"profiles">;
export type Campaign = Tables<"campaigns">;
export type Application = Tables<"applications">;
export type Review = Tables<"reviews">;

export type Category = {
  id: string;
  name_ko: string;
  name_zh: string;
  icon: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};
