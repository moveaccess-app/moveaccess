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
      academies: {
        Row: {
          address: Json | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          phone: string | null
          preferences: Json | null
          status: Database["public"]["Enums"]["academy_status"] | null
          trade_name: string
          updated_at: string | null
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: Json | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["academy_status"] | null
          trade_name: string
          updated_at?: string | null
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: Json | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["academy_status"] | null
          trade_name?: string
          updated_at?: string | null
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_memberships: {
        Row: {
          academy_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          profile_id: string
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          profile_id: string
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          profile_id?: string
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
            referencedRelation: "my_profile"
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
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          academy_id: string
          accepted_at: string | null
          created_at: string | null
          created_by: string | null
          created_profile_id: string | null
          discount: Json | null
          expires_at: string
          id: string
          invite_type: Database["public"]["Enums"]["user_type"]
          opened_at: string | null
          staff_role: Database["public"]["Enums"]["role_id"] | null
          status: Database["public"]["Enums"]["invite_status"] | null
          token: string
          unit_id: string | null
        }
        Insert: {
          academy_id: string
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          created_profile_id?: string | null
          discount?: Json | null
          expires_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["user_type"]
          opened_at?: string | null
          staff_role?: Database["public"]["Enums"]["role_id"] | null
          status?: Database["public"]["Enums"]["invite_status"] | null
          token?: string
          unit_id?: string | null
        }
        Update: {
          academy_id?: string
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          created_profile_id?: string | null
          discount?: Json | null
          expires_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["user_type"]
          opened_at?: string | null
          staff_role?: Database["public"]["Enums"]["role_id"] | null
          status?: Database["public"]["Enums"]["invite_status"] | null
          token?: string
          unit_id?: string | null
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
            referencedRelation: "my_profile"
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
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_profile_id_fkey"
            columns: ["created_profile_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
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
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: Database["public"]["Enums"]["role_id"]
          is_system: boolean | null
          name: string
          permissions: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: Database["public"]["Enums"]["role_id"]
          is_system?: boolean | null
          name: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: Database["public"]["Enums"]["role_id"]
          is_system?: boolean | null
          name?: string
          permissions?: string[] | null
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
          last_login_ip: string | null
          role: Database["public"]["Enums"]["role_id"]
          status: Database["public"]["Enums"]["staff_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_permissions?: string[] | null
          id: string
          last_login_at?: string | null
          last_login_ip?: string | null
          role?: Database["public"]["Enums"]["role_id"]
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_permissions?: string[] | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          role?: Database["public"]["Enums"]["role_id"]
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_unit_assignments: {
        Row: {
          created_at: string | null
          id: string
          staff_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          staff_id: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
      student_drafts: {
        Row: {
          academy_id: string
          collected_data: Json
          completed_at: string | null
          created_at: string
          created_by: string
          current_step: string
          id: string
          published_at: string | null
          published_user_id: string | null
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          academy_id: string
          collected_data?: Json
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_step?: string
          id?: string
          published_at?: string | null
          published_user_id?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          academy_id?: string
          collected_data?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_step?: string
          id?: string
          published_at?: string | null
          published_user_id?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_drafts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_unit_id_fkey"
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
          birth_date: string | null
          created_at: string | null
          emergency_contact: Json | null
          id: string
          plan_expires_at: string | null
          plan_name: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          registration_id: string | null
          registration_origin: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          status_reason: string | null
          status_since: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id: string
          plan_expires_at?: string | null
          plan_name?: string | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          registration_id?: string | null
          registration_origin?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          status_reason?: string | null
          status_since?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          plan_expires_at?: string | null
          plan_name?: string | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          registration_id?: string | null
          registration_origin?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          status_reason?: string | null
          status_since?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unit_assignments: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          student_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          student_id: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          student_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unit_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unit_assignments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          academy_id: string
          access_config: Json | null
          address: Json | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          operating_hours: Json | null
          phone: string | null
          qr_token: string | null
          status: Database["public"]["Enums"]["unit_status"] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          academy_id: string
          access_config?: Json | null
          address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          operating_hours?: Json | null
          phone?: string | null
          qr_token?: string | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          academy_id?: string
          access_config?: Json | null
          address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          qr_token?: string | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_profile: {
        Row: {
          academies: Json | null
          academy_ids: string[] | null
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
      staff_list_view: {
        Row: {
          academy_id: string | null
          academy_name: string | null
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          custom_permissions: string[] | null
          email: string | null
          id: string | null
          last_login_at: string | null
          last_login_ip: string | null
          name: string | null
          phone: string | null
          role_id: Database["public"]["Enums"]["role_id"] | null
          status: Database["public"]["Enums"]["staff_status"] | null
          unit_ids: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_with_role: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string | null
          last_login_at: string | null
          name: string | null
          permissions: string[] | null
          phone: string | null
          role: Database["public"]["Enums"]["role_id"] | null
          role_name: string | null
          status: Database["public"]["Enums"]["staff_status"] | null
          unit_ids: string[] | null
        }
        Relationships: []
      }
      student_drafts_list: {
        Row: {
          academy_id: string | null
          completed_at: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          current_step: string | null
          id: string | null
          plan_name: string | null
          plan_value: number | null
          published_at: string | null
          published_user_id: string | null
          status: string | null
          steps_completed: number | null
          student_email: string | null
          student_name: string | null
          student_phone: string | null
          unit_id: string | null
          unit_name: string | null
          updated_at: string | null
          user_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_drafts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_published_user_id_fkey"
            columns: ["published_user_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drafts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      student_list_view: {
        Row: {
          academy_id: string | null
          academy_name: string | null
          address: Json | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          document: string | null
          email: string | null
          emergency_contact: Json | null
          full_name: string | null
          id: string | null
          phone: string | null
          plan_expires_at: string | null
          plan_name: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          registration_id: string | null
          registration_origin: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          status_reason: string | null
          status_since: string | null
          unit_id: string | null
          unit_name: string | null
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
            foreignKeyName: "student_unit_assignments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      students_with_status: {
        Row: {
          access_allowed: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          plan_expires_at: string | null
          plan_name: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          registration_id: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          status_reason: string | null
          units: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      complete_user_setup: {
        Args: {
          p_academy_id: string
          p_cpf?: string
          p_staff_role?: Database["public"]["Enums"]["role_id"]
          p_unit_id?: string
          p_user_id: string
          p_user_type: Database["public"]["Enums"]["user_type"]
        }
        Returns: Json
      }
      get_user_academy_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      get_user_primary_academy_id: { Args: Record<PropertyKey, never>; Returns: string }
      has_permission: {
        Args: { required_permission: string }
        Returns: boolean
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_invite_valid: { Args: { invite_token: string }; Returns: boolean }
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      academy_status: "active" | "inactive" | "suspended"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      plan_status: "active" | "expired" | "pending" | "suspended" | "cancelled"
      role_id: "admin" | "manager" | "receptionist" | "financial" | "readonly"
      staff_status: "active" | "inactive" | "pending"
      student_status:
        | "active"
        | "inactive"
        | "pending"
        | "suspended"
        | "blocked"
      unit_status: "active" | "inactive" | "maintenance"
      user_type: "staff" | "student"
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
      academy_status: ["active", "inactive", "suspended"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      plan_status: ["active", "expired", "pending", "suspended", "cancelled"],
      role_id: ["admin", "manager", "receptionist", "financial", "readonly"],
      staff_status: ["active", "inactive", "pending"],
      student_status: ["active", "inactive", "pending", "suspended", "blocked"],
      unit_status: ["active", "inactive", "maintenance"],
      user_type: ["staff", "student"],
    },
  },
} as const
