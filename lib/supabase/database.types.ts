export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cancellation_requests: {
        Row: {
          created_at: string
          email: string
          executed_at: string | null
          id: string
          name: string
          receipt_sent_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["cancellation_status"]
          token_expires_at: string | null
          token_hash: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          executed_at?: string | null
          id?: string
          name: string
          receipt_sent_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["cancellation_status"]
          token_expires_at?: string | null
          token_hash?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          executed_at?: string | null
          id?: string
          name?: string
          receipt_sent_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["cancellation_status"]
          token_expires_at?: string | null
          token_hash?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          announced_at: string | null
          created_at: string
          id: string
          intro_md: string | null
          month: string
          published_at: string | null
          theme: string | null
          title: string
        }
        Insert: {
          announced_at?: string | null
          created_at?: string
          id?: string
          intro_md?: string | null
          month: string
          published_at?: string | null
          theme?: string | null
          title: string
        }
        Update: {
          announced_at?: string | null
          created_at?: string
          id?: string
          intro_md?: string | null
          month?: string
          published_at?: string | null
          theme?: string | null
          title?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          id: number
          kind: Database["public"]["Enums"]["email_kind"]
          ref_id: string
          resend_id: string | null
          sent_at: string
          user_id: string | null
        }
        Insert: {
          id?: never
          kind: Database["public"]["Enums"]["email_kind"]
          ref_id: string
          resend_id?: string | null
          sent_at?: string
          user_id?: string | null
        }
        Update: {
          id?: never
          kind?: Database["public"]["Enums"]["email_kind"]
          ref_id?: string
          resend_id?: string | null
          sent_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_codes: {
        Row: {
          code: string
          created_at: string
          external_id: string | null
          id: string
          kind: Database["public"]["Enums"]["code_kind"]
          percent: number
          revoked_at: string | null
          status: Database["public"]["Enums"]["code_status"]
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          external_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["code_kind"]
          percent: number
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["code_status"]
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          external_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["code_kind"]
          percent?: number
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["code_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_snapshots: {
        Row: {
          active_members: number
          created_at: string
          day: string
          mrr_cents: number
        }
        Insert: {
          active_members: number
          created_at?: string
          day: string
          mrr_cents: number
        }
        Update: {
          active_members?: number
          created_at?: string
          day?: string
          mrr_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          drop_emails: boolean
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string
          drop_emails?: boolean
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          drop_emails?: boolean
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          body_md: string | null
          category: Database["public"]["Enums"]["resource_category"]
          content: Json | null
          cover_path: string | null
          created_at: string
          draft_content: Json | null
          draft_updated_at: string | null
          drop_id: string | null
          drop_position: number | null
          file_path: string | null
          id: string
          item_count: number | null
          list_kind: Database["public"]["Enums"]["list_kind"] | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["resource_status"]
          summary: string
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
          word_count: number | null
        }
        Insert: {
          body_md?: string | null
          category: Database["public"]["Enums"]["resource_category"]
          content?: Json | null
          cover_path?: string | null
          created_at?: string
          draft_content?: Json | null
          draft_updated_at?: string | null
          drop_id?: string | null
          drop_position?: number | null
          file_path?: string | null
          id?: string
          item_count?: number | null
          list_kind?: Database["public"]["Enums"]["list_kind"] | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary?: string
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          body_md?: string | null
          category?: Database["public"]["Enums"]["resource_category"]
          content?: Json | null
          cover_path?: string | null
          created_at?: string
          draft_content?: Json | null
          draft_updated_at?: string | null
          drop_id?: string | null
          drop_position?: number | null
          file_path?: string | null
          id?: string
          item_count?: number | null
          list_kind?: Database["public"]["Enums"]["list_kind"] | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary?: string
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_submissions: {
        Row: {
          admin_note: string | null
          consent_at: string
          created_at: string
          description: string
          featured_post_url: string | null
          id: string
          instagram_handle: string | null
          media_paths: string[]
          month: string
          status: Database["public"]["Enums"]["spotlight_status"]
          title: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          admin_note?: string | null
          consent_at: string
          created_at?: string
          description: string
          featured_post_url?: string | null
          id?: string
          instagram_handle?: string | null
          media_paths?: string[]
          month: string
          status?: Database["public"]["Enums"]["spotlight_status"]
          title: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          admin_note?: string | null
          consent_at?: string
          created_at?: string
          description?: string
          featured_post_url?: string | null
          id?: string
          instagram_handle?: string | null
          media_paths?: string[]
          month?: string
          status?: Database["public"]["Enums"]["spotlight_status"]
          title?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          ended_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at: string
          current_period_end?: string | null
          ended_at?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          ended_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error: string | null
          event_type: string
          id: number
          payload: Json
          processed_at: string | null
          received_at: string
          stripe_event_id: string
        }
        Insert: {
          error?: string | null
          event_type: string
          id?: never
          payload: Json
          processed_at?: string | null
          received_at?: string
          stripe_event_id: string
        }
        Update: {
          error?: string | null
          event_type?: string
          id?: never
          payload?: Json
          processed_at?: string | null
          received_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_teaser_items: {
        Row: {
          item: Json | null
          list_kind: Database["public"]["Enums"]["list_kind"] | null
          position: number | null
          resource_slug: string | null
          section_title: string | null
        }
        Relationships: []
      }
      public_teaser_resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"] | null
          cover_path: string | null
          item_count: number | null
          list_kind: Database["public"]["Enums"]["list_kind"] | null
          slug: string | null
          summary: string | null
          title: string | null
          type: Database["public"]["Enums"]["resource_type"] | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["resource_category"] | null
          cover_path?: string | null
          item_count?: never
          list_kind?: Database["public"]["Enums"]["list_kind"] | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["resource_type"] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"] | null
          cover_path?: string | null
          item_count?: never
          list_kind?: Database["public"]["Enums"]["list_kind"] | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["resource_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean }
      is_plus: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      cancellation_status: "received" | "verified" | "executed" | "no_match"
      code_kind: "merch" | "promotion"
      code_status: "active" | "pending_sync" | "revoked"
      email_kind:
        | "welcome"
        | "cancellation_confirmed"
        | "cancellation_receipt"
        | "cancellation_verify"
        | "drop_announcement"
        | "spotlight_featured"
      list_kind: "tools" | "assets" | "creators" | "prompts"
      resource_category: "gamedev" | "3d" | "business" | "ai"
      resource_status: "draft" | "published"
      resource_type: "list" | "ebook" | "guide"
      spotlight_status: "submitted" | "shortlisted" | "featured" | "declined"
      subscription_plan: "founding_monthly" | "founding_annual"
      subscription_status:
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "unpaid"
        | "canceled"
        | "paused"
      user_role: "member" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cancellation_status: ["received", "verified", "executed", "no_match"],
      code_kind: ["merch", "promotion"],
      code_status: ["active", "pending_sync", "revoked"],
      email_kind: [
        "welcome",
        "cancellation_confirmed",
        "cancellation_receipt",
        "cancellation_verify",
        "drop_announcement",
        "spotlight_featured",
      ],
      list_kind: ["tools", "assets", "creators", "prompts"],
      resource_category: ["gamedev", "3d", "business", "ai"],
      resource_status: ["draft", "published"],
      resource_type: ["list", "ebook", "guide"],
      spotlight_status: ["submitted", "shortlisted", "featured", "declined"],
      subscription_plan: ["founding_monthly", "founding_annual"],
      subscription_status: [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "unpaid",
        "canceled",
        "paused",
      ],
      user_role: ["member", "admin"],
    },
  },
} as const
