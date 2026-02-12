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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_overrides: {
        Row: {
          created_at: string
          date: string
          id: string
          is_suspended: boolean
          pickup_end: string | null
          pickup_start: string | null
          quantity: number | null
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_suspended?: boolean
          pickup_end?: string | null
          pickup_start?: string | null
          quantity?: number | null
          restaurant_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_suspended?: boolean
          pickup_end?: string | null
          pickup_start?: string | null
          quantity?: number | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_overrides_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_overrides_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          category: string | null
          created_at: string
          date: string | null
          description: string | null
          discounted_price: number
          id: string
          image_url: string | null
          is_active: boolean | null
          items_left: number
          original_price: number
          pickup_end: string
          pickup_start: string
          quantity: number
          restaurant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          discounted_price: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          items_left?: number
          original_price: number
          pickup_end: string
          pickup_start: string
          quantity?: number
          restaurant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          discounted_price?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          items_left?: number
          original_price?: number
          pickup_end?: string
          pickup_start?: string
          quantity?: number
          restaurant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          commission_rate: number
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commission_rate?: number
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commission_rate?: number
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          image_url: string | null
          message: string
          reservation_id: string
          restaurant_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message: string
          reservation_id: string
          restaurant_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          reservation_id?: string
          restaurant_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          config_id: string | null
          created_at: string
          id: string
          offer_id: string | null
          payment_intent_id: string | null
          pickup_code: string
          pickup_date: string | null
          restaurant_id: string
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config_id?: string | null
          created_at?: string
          id?: string
          offer_id?: string | null
          payment_intent_id?: string | null
          pickup_code?: string
          pickup_date?: string | null
          restaurant_id: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config_id?: string | null
          created_at?: string
          id?: string
          offer_id?: string | null
          payment_intent_id?: string | null
          pickup_code?: string
          pickup_date?: string | null
          restaurant_id?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "surprise_bag_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_payouts: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          platform_amount: number
          reservation_id: string | null
          restaurant_amount: number
          restaurant_id: string
          status: string
          stripe_transfer_id: string | null
          total_amount: number
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          platform_amount: number
          reservation_id?: string | null
          restaurant_amount: number
          restaurant_id: string
          status?: string
          stripe_transfer_id?: string | null
          total_amount: number
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          platform_amount?: number
          reservation_id?: string | null
          restaurant_amount?: number
          restaurant_id?: string
          status?: string
          stripe_transfer_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_payouts_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          business_id: string | null
          category: string
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          postal_code: string | null
          status: string
          stripe_account_id: string | null
          subscription_plan: string | null
          subscription_start: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address: string
          business_id?: string | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          status?: string
          stripe_account_id?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          business_id?: string | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          status?: string
          stripe_account_id?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          rating: number
          rating_presentation: number | null
          rating_quality: number | null
          rating_quantity: number | null
          reservation_id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          rating_presentation?: number | null
          rating_quality?: number | null
          rating_quantity?: number | null
          reservation_id: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          rating_presentation?: number | null
          rating_quality?: number | null
          rating_quantity?: number | null
          reservation_id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          restaurant_id: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          restaurant_id: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          restaurant_id?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      support_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      surprise_bag_config: {
        Row: {
          base_price: number
          created_at: string
          daily_quantity: number
          id: string
          image_url: string | null
          is_active: boolean
          pickup_end: string
          pickup_start: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          base_price: number
          created_at?: string
          daily_quantity?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          pickup_end?: string
          pickup_start?: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          daily_quantity?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          pickup_end?: string
          pickup_start?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surprise_bag_config_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surprise_bag_config_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      restaurants_public: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          description: string | null
          id: string | null
          image_url: string | null
          name: string | null
          opening_hours: Json | null
          phone: string | null
          postal_code: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      expire_unconfirmed_reservations: { Args: never; Returns: undefined }
      generate_daily_offers: { Args: never; Returns: undefined }
      get_all_restaurant_ratings: {
        Args: never
        Returns: {
          avg_presentation: number
          avg_quality: number
          avg_quantity: number
          avg_rating: number
          restaurant_name: string
          review_count: number
        }[]
      }
      get_restaurant_rating: {
        Args: { p_restaurant_id: string }
        Returns: {
          avg_presentation: number
          avg_quality: number
          avg_quantity: number
          avg_rating: number
          review_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
