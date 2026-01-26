export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academies: {
        Row: {
          created_at: string
          id: string
          legal_name: string | null
          logo_url: string | null
          settings: Json | null
          tax_id: string | null
          trade_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          settings?: Json | null
          tax_id?: string | null
          trade_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          settings?: Json | null
          tax_id?: string | null
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_memberships: {
        Row: {
          academy_id: string
          id: string
          is_primary: boolean
          joined_at: string
          profile_id: string
          unit_id: string | null
        }
        Insert: {
          academy_id: string
          id?: string
          is_primary?: boolean
          joined_at?: string
          profile_id: string
          unit_id?: string | null
        }
        Update: {
          academy_id?: string
          id?: string
          is_primary?: boolean
          joined_at?: string
          profile_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          academy_id: string
          created_at: string
          created_by: string | null
          discount: Json | null
          expires_at: string
          id: string
          invite_type: Database["public"]["Enums"]["user_type"]
          max_uses: number
          staff_role: Database["public"]["Enums"]["role_id"] | null
          status: Database["public"]["Enums"]["invite_status"]
          token: string
          unit_id: string | null
          used_count: number
        }
        Insert: {
          academy_id: string
          created_at?: string
          created_by?: string | null
          discount?: Json | null
          expires_at?: string
          id?: string
          invite_type: Database["public"]["Enums"]["user_type"]
          max_uses?: number
          staff_role?: Database["public"]["Enums"]["role_id"] | null
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          unit_id?: string | null
          used_count?: number
        }
        Update: {
          academy_id?: string
          created_at?: string
          created_by?: string | null
          discount?: Json | null
          expires_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["user_type"]
          max_uses?: number
          staff_role?: Database["public"]["Enums"]["role_id"] | null
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          unit_id?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: Database["public"]["Enums"]["role_id"]
          is_system: boolean
          name: string
          permissions: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: Database["public"]["Enums"]["role_id"]
          is_system?: boolean
          name: string
          permissions?: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: Database["public"]["Enums"]["role_id"]
          is_system?: boolean
          name?: string
          permissions?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string | null
          custom_permissions: string[] | null
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["role_id"]
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_permissions?: string[] | null
          id: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["role_id"]
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_permissions?: string[] | null
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["role_id"]
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_unit_assignments: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean
          staff_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean
          staff_id: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean
          staff_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_unit_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_unit_assignments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          address: Json | null
          created_at: string | null
          emergency_contact: Json | null
          id: string
          plan_expires_at: string | null
          plan_id: string | null
          plan_name: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          registration_id: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          emergency_contact?: Json | null
          id: string
          plan_expires_at?: string | null
          plan_id?: string | null
          plan_name?: string | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          plan_expires_at?: string | null
          plan_id?: string | null
          plan_name?: string | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          academy_id: string
          access_config: Json | null
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          qr_token: string
          status: Database["public"]["Enums"]["unit_status"]
          updated_at: string
        }
        Insert: {
          academy_id: string
          access_config?: Json | null
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          qr_token?: string
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Update: {
          academy_id?: string
          access_config?: Json | null
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          qr_token?: string
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_profile: {
        Row: {
          academies: Json | null
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          custom_permissions: string[] | null
          email: string | null
          id: string | null
          last_login_at: string | null
          name: string | null
          phone: string | null
          plan_expires_at: string | null
          plan_name: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          registration_id: string | null
          role: Database["public"]["Enums"]["role_id"] | null
          staff_status: Database["public"]["Enums"]["staff_status"] | null
          student_status: Database["public"]["Enums"]["student_status"] | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      staff_with_role: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          custom_permissions: string[] | null
          effective_permissions: string[] | null
          email: string | null
          id: string | null
          last_login_at: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role_id"] | null
          role_name: string | null
          status: Database["public"]["Enums"]["staff_status"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students_with_status: {
        Row: {
          access_status: string | null
          address: Json | null
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          emergency_contact: Json | null
          id: string | null
          name: string | null
          phone: string | null
          plan_expires_at: string | null
          plan_id: string | null
          plan_name: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          registration_id: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      complete_user_setup: {
        Args: {
          p_user_id: string
          p_user_type: Database["public"]["Enums"]["user_type"]
          p_academy_id: string
          p_unit_id?: string | null
          p_staff_role?: Database["public"]["Enums"]["role_id"] | null
          p_cpf?: string | null
        }
        Returns: Json
      }
      gen_invite_token: { Args: Record<string, never>; Returns: string }
      gen_registration_id: { Args: Record<string, never>; Returns: string }
      get_user_academies: { Args: { p_user_id: string }; Returns: string[] }
      has_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      is_member_of_academy: {
        Args: { p_academy_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_invite: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      plan_status: "active" | "expired" | "pending" | "suspended" | "cancelled"
      role_id: "admin" | "manager" | "receptionist" | "financial" | "readonly"
      staff_status: "active" | "inactive" | "pending"
      student_status: "active" | "inactive" | "pending" | "suspended" | "blocked"
      unit_status: "active" | "inactive" | "maintenance"
      user_type: "staff" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"]
