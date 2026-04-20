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
      access_logs: {
        Row: {
          academy_id: string
          access_event: string | null
          denial_reason: string | null
          id: string
          method: string
          notes: string | null
          occurred_at: string
          operator_id: string | null
          presence_after: boolean | null
          raw_payload: Json | null
          status: string
          unit_id: string
          user_document: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          academy_id: string
          access_event?: string | null
          denial_reason?: string | null
          id?: string
          method: string
          notes?: string | null
          occurred_at?: string
          operator_id?: string | null
          presence_after?: boolean | null
          raw_payload?: Json | null
          status: string
          unit_id: string
          user_document?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          academy_id?: string
          access_event?: string | null
          denial_reason?: string | null
          id?: string
          method?: string
          notes?: string | null
          occurred_at?: string
          operator_id?: string | null
          presence_after?: boolean | null
          raw_payload?: Json | null
          status?: string
          unit_id?: string
          user_document?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      asaas_accounts: {
        Row: {
          academy_id: string
          account_name: string
          api_key_reference: string | null
          asaas_account_id: string | null
          created_at: string
          environment: string
          external_reference: string | null
          id: string
          status: string
          unit_id: string | null
          updated_at: string
          wallet_id: string | null
        }
        Insert: {
          academy_id: string
          account_name?: string
          api_key_reference?: string | null
          asaas_account_id?: string | null
          created_at?: string
          environment: string
          external_reference?: string | null
          id?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
          wallet_id?: string | null
        }
        Update: {
          academy_id?: string
          account_name?: string
          api_key_reference?: string | null
          asaas_account_id?: string | null
          created_at?: string
          environment?: string
          external_reference?: string | null
          id?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_accounts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_accounts_unit_fkey"
            columns: ["academy_id", "unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["academy_id", "id"]
          },
        ]
      }
      asaas_charges: {
        Row: {
          academy_id: string
          asaas_account_id: string
          asaas_customer_id: string
          asaas_payment_id: string
          asaas_status: string
          asaas_subscription_id: string | null
          bank_slip_url: string | null
          billing_type: string
          created_at: string
          due_date: string
          environment: string
          external_reference: string | null
          id: string
          invoice_url: string | null
          net_value: number | null
          payment_date: string | null
          payment_id: string
          synced_at: string
          updated_at: string
          value: number
        }
        Insert: {
          academy_id: string
          asaas_account_id: string
          asaas_customer_id: string
          asaas_payment_id: string
          asaas_status: string
          asaas_subscription_id?: string | null
          bank_slip_url?: string | null
          billing_type: string
          created_at?: string
          due_date: string
          environment: string
          external_reference?: string | null
          id?: string
          invoice_url?: string | null
          net_value?: number | null
          payment_date?: string | null
          payment_id: string
          synced_at?: string
          updated_at?: string
          value: number
        }
        Update: {
          academy_id?: string
          asaas_account_id?: string
          asaas_customer_id?: string
          asaas_payment_id?: string
          asaas_status?: string
          asaas_subscription_id?: string | null
          bank_slip_url?: string | null
          billing_type?: string
          created_at?: string
          due_date?: string
          environment?: string
          external_reference?: string | null
          id?: string
          invoice_url?: string | null
          net_value?: number | null
          payment_date?: string | null
          payment_id?: string
          synced_at?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_charges_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_charges_asaas_account_id_fkey"
            columns: ["asaas_account_id"]
            isOneToOne: false
            referencedRelation: "asaas_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_charges_asaas_customer_id_fkey"
            columns: ["asaas_customer_id"]
            isOneToOne: false
            referencedRelation: "asaas_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_charges_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "financial_charges_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_charges_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_customers: {
        Row: {
          academy_id: string
          asaas_account_id: string
          asaas_customer_id: string
          created_at: string
          environment: string
          external_reference: string | null
          id: string
          status: string
          student_id: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          asaas_account_id: string
          asaas_customer_id: string
          created_at?: string
          environment: string
          external_reference?: string | null
          id?: string
          status?: string
          student_id: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          asaas_account_id?: string
          asaas_customer_id?: string
          created_at?: string
          environment?: string
          external_reference?: string | null
          id?: string
          status?: string
          student_id?: string
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_customers_asaas_account_id_fkey"
            columns: ["asaas_account_id"]
            isOneToOne: false
            referencedRelation: "asaas_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_customers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_subscriptions: {
        Row: {
          academy_id: string
          asaas_account_id: string
          asaas_customer_id: string
          asaas_status: string
          asaas_subscription_id: string
          billing_type: string
          created_at: string
          cycle: string
          description: string
          end_date: string | null
          environment: string
          external_reference: string
          id: string
          max_payments: number | null
          next_due_date: string | null
          subscription_id: string
          synced_at: string
          updated_at: string
          value: number
        }
        Insert: {
          academy_id: string
          asaas_account_id: string
          asaas_customer_id: string
          asaas_status?: string
          asaas_subscription_id: string
          billing_type: string
          created_at?: string
          cycle: string
          description?: string
          end_date?: string | null
          environment: string
          external_reference?: string
          id?: string
          max_payments?: number | null
          next_due_date?: string | null
          subscription_id: string
          synced_at?: string
          updated_at?: string
          value: number
        }
        Update: {
          academy_id?: string
          asaas_account_id?: string
          asaas_customer_id?: string
          asaas_status?: string
          asaas_subscription_id?: string
          billing_type?: string
          created_at?: string
          cycle?: string
          description?: string
          end_date?: string | null
          environment?: string
          external_reference?: string
          id?: string
          max_payments?: number | null
          next_due_date?: string | null
          subscription_id?: string
          synced_at?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_subscriptions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_subscriptions_asaas_account_id_fkey"
            columns: ["asaas_account_id"]
            isOneToOne: false
            referencedRelation: "asaas_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_subscriptions_asaas_customer_id_fkey"
            columns: ["asaas_customer_id"]
            isOneToOne: false
            referencedRelation: "asaas_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhook_events: {
        Row: {
          asaas_account_id: string | null
          asaas_payment_id: string | null
          created_at: string
          environment: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          received_at: string
          updated_at: string
        }
        Insert: {
          asaas_account_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          environment: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          updated_at?: string
        }
        Update: {
          asaas_account_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          environment?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_webhook_events_asaas_account_id_fkey"
            columns: ["asaas_account_id"]
            isOneToOne: false
            referencedRelation: "asaas_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_acceptances: {
        Row: {
          academy_id: string
          accepted_at: string
          context: Json
          created_at: string
          id: string
          ip_address: string | null
          student_id: string
          subscription_id: string | null
          terms_version: string
          user_agent: string | null
        }
        Insert: {
          academy_id: string
          accepted_at?: string
          context?: Json
          created_at?: string
          id?: string
          ip_address?: string | null
          student_id: string
          subscription_id?: string | null
          terms_version?: string
          user_agent?: string | null
        }
        Update: {
          academy_id?: string
          accepted_at?: string
          context?: Json
          created_at?: string
          id?: string
          ip_address?: string | null
          student_id?: string
          subscription_id?: string | null
          terms_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_acceptances_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptances_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_links: {
        Row: {
          academy_id: string
          claimed_at: string | null
          claimed_by_user_id: string | null
          claimed_email: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          draft_id: string | null
          expected_email: string | null
          expires_at: string
          id: string
          recipient_name: string | null
          recipient_phone: string | null
          status: string
          token: string
          unit_id: string | null
          updated_at: string
          used_at: string | null
        }
        Insert: {
          academy_id: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          claimed_email?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          draft_id?: string | null
          expected_email?: string | null
          expires_at?: string
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string
          token?: string
          unit_id?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          academy_id?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          claimed_email?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          draft_id?: string | null
          expected_email?: string | null
          expires_at?: string
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string
          token?: string
          unit_id?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_links_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "staff_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "staff_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "student_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "students_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "student_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "student_drafts_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_unit_id_fkey"
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
      payments: {
        Row: {
          academy_id: string
          amount: number
          created_at: string
          currency: string
          due_date: string
          id: string
          method: string
          paid_at: string | null
          reference: string | null
          status: string
          student_id: string
          subscription_id: string
        }
        Insert: {
          academy_id: string
          amount: number
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          student_id: string
          subscription_id: string
        }
        Update: {
          academy_id?: string
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          student_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_access_rules: {
        Row: {
          academy_id: string
          allowed_end_time: string | null
          allowed_start_time: string | null
          allowed_units: string[] | null
          allowed_weekdays: number[] | null
          created_at: string
          id: string
          plan_id: string
        }
        Insert: {
          academy_id: string
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          allowed_units?: string[] | null
          allowed_weekdays?: number[] | null
          created_at?: string
          id?: string
          plan_id: string
        }
        Update: {
          academy_id?: string
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          allowed_units?: string[] | null
          allowed_weekdays?: number[] | null
          created_at?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_access_rules_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_access_rules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          academy_id: string
          access_rules: Json | null
          billing_cycle: string
          created_at: string
          description: string
          id: string
          name: string
          price: number
          status: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          access_rules?: Json | null
          billing_cycle?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          price?: number
          status?: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          access_rules?: Json | null
          billing_cycle?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
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
      qr_used_nonces: {
        Row: {
          nonce: string
          student_id: string
          used_at: string
        }
        Insert: {
          nonce: string
          student_id: string
          used_at?: string
        }
        Update: {
          nonce?: string
          student_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_used_nonces_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          origin: string
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
          origin?: string
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
          origin?: string
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
      subscriptions: {
        Row: {
          academy_id: string
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string
          plan_id: string
          price: number
          started_at: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string
          plan_id: string
          price: number
          started_at?: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string
          plan_id?: string
          price?: number
          started_at?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
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
      financial_charges_view: {
        Row: {
          academy_id: string | null
          amount: number | null
          asaas_billing_type: string | null
          asaas_charge_id: string | null
          asaas_net_value: number | null
          asaas_payment_id: string | null
          asaas_status: string | null
          asaas_subscription_id: string | null
          asaas_synced_at: string | null
          bank_slip_url: string | null
          charge_origin: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          invoice_url: string | null
          is_asaas_managed: boolean | null
          is_recurring: boolean | null
          method: string | null
          paid_at: string | null
          plan_id: string | null
          plan_name: string | null
          reference: string | null
          status: string | null
          student_document: string | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          student_registration_id: string | null
          student_status: Database["public"]["Enums"]["student_status"] | null
          subscription_expires_at: string | null
          subscription_id: string | null
          subscription_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_links_list: {
        Row: {
          academy_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          draft_id: string | null
          expected_email: string | null
          expires_at: string | null
          id: string | null
          is_valid: boolean | null
          status: string | null
          time_remaining: string | null
          token: string | null
          unit_id: string | null
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          academy_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          draft_id?: string | null
          expected_email?: string | null
          expires_at?: string | null
          id?: string | null
          is_valid?: never
          status?: string | null
          time_remaining?: never
          token?: string | null
          unit_id?: string | null
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          academy_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          draft_id?: string | null
          expected_email?: string | null
          expires_at?: string | null
          id?: string | null
          is_valid?: never
          status?: string | null
          time_remaining?: never
          token?: string | null
          unit_id?: string | null
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_links_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "student_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "student_drafts_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_links_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
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
      student_delinquency_view: {
        Row: {
          academy_id: string | null
          days_delinquent: number | null
          oldest_overdue_date: string | null
          overdue_count: number | null
          overdue_total: number | null
          student_id: string | null
          student_name: string | null
          student_registration_id: string | null
          student_status: Database["public"]["Enums"]["student_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          origin: string | null
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
      _activate_student_subscription: {
        Args: {
          p_academy_id: string
          p_contract_accepted?: boolean
          p_payment_method?: string
          p_plan_id: string
          p_student_id: string
        }
        Returns: Json
      }
      claim_invite_signup: {
        Args: {
          p_email: string
          p_full_name: string
          p_password?: string
          p_phone?: string
          p_token: string
        }
        Returns: Json
      }
      complete_my_invite_signup: { Args: { p_token: string }; Returns: Json }
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
      create_invite_link: {
        Args: {
          p_academy_id: string
          p_description?: string
          p_expected_email?: string
          p_expires_in_days?: number
          p_unit_id?: string
        }
        Returns: {
          academy_id: string
          created_at: string
          created_by: string
          description: string
          expected_email: string
          expires_at: string
          id: string
          status: string
          token: string
          unit_id: string
        }[]
      }
      create_team_staff: {
        Args: {
          p_email: string
          p_name: string
          p_password: string
          p_phone?: string
          p_role?: Database["public"]["Enums"]["role_id"]
          p_unit_ids?: string[]
        }
        Returns: Json
      }
      finalize_student_draft: { Args: { p_draft_id: string }; Returns: Json }
      from_base64url: { Args: { data: string }; Returns: string }
      get_home_overview: { Args: never; Returns: Json }
      get_invite_signup_context: { Args: { p_token: string }; Returns: Json }
      get_my_invite_signup_session: {
        Args: { p_token?: string }
        Returns: Json
      }
      get_public_plans_catalog: {
        Args: { p_academy_id: string }
        Returns: Json
      }
      get_student_delinquency: {
        Args: {
          p_academy_id: string
          p_grace_days?: number
          p_student_id: string
        }
        Returns: {
          days_delinquent: number
          is_delinquent: boolean
          oldest_overdue_date: string
          overdue_count: number
          overdue_total: number
        }[]
      }
      get_team_staff_list: {
        Args: never
        Returns: {
          academy_id: string
          academy_name: string
          avatar_url: string
          cpf: string
          created_at: string
          custom_permissions: string[]
          email: string
          id: string
          last_login_at: string
          last_login_ip: string
          name: string
          phone: string
          role_id: Database["public"]["Enums"]["role_id"]
          status: Database["public"]["Enums"]["staff_status"]
          unit_ids: string[]
          updated_at: string
        }[]
      }
      get_user_academy_ids: { Args: never; Returns: string[] }
      get_user_primary_academy_id: { Args: never; Returns: string }
      has_permission: {
        Args: { required_permission: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      issue_student_qr_token: { Args: never; Returns: string }
      mask_email_hint: { Args: { p_email: string }; Returns: string }
      process_checkin:
        | {
            Args: {
              p_flow?: string
              p_method: string
              p_notes?: string
              p_unit_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_method: string
              p_notes?: string
              p_unit_id: string
              p_user_id: string
            }
            Returns: Json
          }
      process_checkin_by_identifier:
        | {
            Args: {
              p_flow?: string
              p_identifier: string
              p_method: string
              p_notes?: string
              p_unit_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_identifier: string
              p_method: string
              p_notes?: string
              p_unit_id: string
            }
            Returns: Json
          }
      save_my_invite_signup_progress: {
        Args: {
          p_collected_data: Json
          p_completed_at?: string
          p_current_step: string
          p_status: string
          p_token: string
        }
        Returns: Json
      }
      sync_student_current_plan_from_subscriptions: {
        Args: { target_student_id: string }
        Returns: undefined
      }
      to_base64url: { Args: { data: string }; Returns: string }
      update_team_staff: {
        Args: {
          p_phone?: string
          p_role?: Database["public"]["Enums"]["role_id"]
          p_staff_id: string
          p_status?: Database["public"]["Enums"]["staff_status"]
          p_unit_ids?: string[]
        }
        Returns: Json
      }
      use_invite_token: {
        Args: { p_email?: string; p_token: string }
        Returns: {
          draft_id: string
          error_code: string
          is_new_draft: boolean
          success: boolean
        }[]
      }
      validate_invite_token: {
        Args: { p_token: string }
        Returns: {
          academy_id: string
          draft_id: string
          error_code: string
          expected_email: string
          invite_id: string
          is_valid: boolean
          unit_id: string
        }[]
      }
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
