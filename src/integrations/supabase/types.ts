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
      orders: {
        Row: {
          admin_notes: string | null
          advance_paid: boolean
          city: string
          covers: number
          created_at: string
          deadline: string | null
          delivery_type: string
          estimated_total: number
          final_price: number | null
          id: string
          name: string
          notes: string | null
          order_code: string
          pages: number
          pdf_paths: string[]
          phone: string
          pin: string | null
          state: string
          status: Database["public"]["Enums"]["order_status"]
          tracking_info: string | null
          updated_at: string
          work_type: string
          writing_style: string
        }
        Insert: {
          admin_notes?: string | null
          advance_paid?: boolean
          city: string
          covers?: number
          created_at?: string
          deadline?: string | null
          delivery_type: string
          estimated_total?: number
          final_price?: number | null
          id?: string
          name: string
          notes?: string | null
          order_code: string
          pages?: number
          pdf_paths?: string[]
          phone: string
          pin?: string | null
          state: string
          status?: Database["public"]["Enums"]["order_status"]
          tracking_info?: string | null
          updated_at?: string
          work_type: string
          writing_style: string
        }
        Update: {
          admin_notes?: string | null
          advance_paid?: boolean
          city?: string
          covers?: number
          created_at?: string
          deadline?: string | null
          delivery_type?: string
          estimated_total?: number
          final_price?: number | null
          id?: string
          name?: string
          notes?: string | null
          order_code?: string
          pages?: number
          pdf_paths?: string[]
          phone?: string
          pin?: string | null
          state?: string
          status?: Database["public"]["Enums"]["order_status"]
          tracking_info?: string | null
          updated_at?: string
          work_type?: string
          writing_style?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          bulk_discount_percent: number
          bulk_discount_threshold: number
          id: number
          offer_active: boolean
          pdf_addon_per_page: number
          price_basic: number
          price_basic_offer: number
          price_cover: number
          price_cursive: number
          price_neat: number
          price_project_from: number
          shipping_max: number
          shipping_min: number
          updated_at: string
          upi_id: string
          whatsapp_number: string
        }
        Insert: {
          bulk_discount_percent?: number
          bulk_discount_threshold?: number
          id?: number
          offer_active?: boolean
          pdf_addon_per_page?: number
          price_basic?: number
          price_basic_offer?: number
          price_cover?: number
          price_cursive?: number
          price_neat?: number
          price_project_from?: number
          shipping_max?: number
          shipping_min?: number
          updated_at?: string
          upi_id?: string
          whatsapp_number?: string
        }
        Update: {
          bulk_discount_percent?: number
          bulk_discount_threshold?: number
          id?: number
          offer_active?: boolean
          pdf_addon_per_page?: number
          price_basic?: number
          price_basic_offer?: number
          price_cover?: number
          price_cursive?: number
          price_neat?: number
          price_project_from?: number
          shipping_max?: number
          shipping_min?: number
          updated_at?: string
          upi_id?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          _city: string
          _covers: number
          _deadline: string
          _delivery: string
          _name: string
          _notes: string
          _pages: number
          _phone: string
          _pin: string
          _state: string
          _style: string
          _work_type: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_order_pdfs: {
        Args: { _code: string; _phone: string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "new"
        | "confirmed"
        | "writing"
        | "ready"
        | "dispatched"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "user"],
      order_status: [
        "new",
        "confirmed",
        "writing",
        "ready",
        "dispatched",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
