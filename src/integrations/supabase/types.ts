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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_experiments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          experiment_id: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
          variants: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          experiment_id: string
          id?: string
          is_active?: boolean
          name: string
          start_date?: string
          updated_at?: string
          variants?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          experiment_id?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      ab_test_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          experiment_id: string
          id: string
          page_path: string | null
          session_id: string | null
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          experiment_id: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          experiment_id?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      ab_user_assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          id: string
          user_id: string | null
          variant: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          id?: string
          user_id?: string | null
          variant: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          id?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_type: string
          amount: number | null
          created_at: string
          currency: string | null
          description: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          description: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          ip_address: unknown
          sensitive_data_accessed: Json | null
          target_admin_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_admin_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_admin_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notification_queue: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          notification_type: string
          processed: boolean | null
          processed_at: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          notification_type: string
          processed?: boolean | null
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          notification_type?: string
          processed?: boolean | null
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      admin_notification_templates: {
        Row: {
          content_template: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          title_template: string
          type_id: string
          updated_at: string
        }
        Insert: {
          content_template: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          title_template: string
          type_id: string
          updated_at?: string
        }
        Update: {
          content_template?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          title_template?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_templates_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "admin_notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notification_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          severity: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          requires_restart: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          requires_restart?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          requires_restart?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_subscription_earnings: {
        Row: {
          admin_commission_amount: number
          admin_commission_rate: number
          created_at: string | null
          driver_id: string
          id: string
          status: string
          subscription_amount: number
          subscription_id: string
          updated_at: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          admin_commission_amount: number
          admin_commission_rate?: number
          created_at?: string | null
          driver_id: string
          id?: string
          status?: string
          subscription_amount: number
          subscription_id: string
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          admin_commission_amount?: number
          admin_commission_rate?: number
          created_at?: string | null
          driver_id?: string
          id?: string
          status?: string
          subscription_amount?: number
          subscription_id?: string
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_subscription_earnings_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "driver_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_subscription_earnings_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          admin_level: string | null
          created_at: string | null
          department: string | null
          display_name: string
          email: string
          employee_id: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          permissions: string[] | null
          phone_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_level?: string | null
          created_at?: string | null
          department?: string | null
          display_name: string
          email: string
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          permissions?: string[] | null
          phone_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_level?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string
          email?: string
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          permissions?: string[] | null
          phone_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          ai_response: string
          context: string | null
          created_at: string | null
          error_message: string | null
          function_called: string | null
          function_result: Json | null
          id: string
          response_time_ms: number | null
          success: boolean | null
          user_id: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          context?: string | null
          created_at?: string | null
          error_message?: string | null
          function_called?: string | null
          function_result?: Json | null
          id?: string
          response_time_ms?: number | null
          success?: boolean | null
          user_id?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          context?: string | null
          created_at?: string | null
          error_message?: string | null
          function_called?: string | null
          function_result?: Json | null
          id?: string
          response_time_ms?: number | null
          success?: boolean | null
          user_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          reset_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          reset_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          reset_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_versions: {
        Row: {
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          platform: string
          release_notes: string | null
          store_url: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          platform: string
          release_notes?: string | null
          store_url?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          platform?: string
          release_notes?: string | null
          store_url?: string | null
          version?: string
        }
        Relationships: []
      }
      booking_beneficiaries: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          name: string
          phone: string
          relationship: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          phone: string
          relationship?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          phone?: string
          relationship?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      booking_reports: {
        Row: {
          admin_notes: string | null
          booking_id: string
          created_at: string | null
          driver_id: string | null
          id: string
          reason: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          reason: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          reason?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          billing_address: Json | null
          business_type: string | null
          company_name: string
          company_registration: string | null
          created_at: string
          currency: string
          employee_count: number | null
          id: string
          industry: string | null
          monthly_budget: number | null
          owner_id: string
          status: string
          subscription_plan: string | null
          tax_number: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          business_type?: string | null
          company_name: string
          company_registration?: string | null
          created_at?: string
          currency?: string
          employee_count?: number | null
          id?: string
          industry?: string | null
          monthly_budget?: number | null
          owner_id: string
          status?: string
          subscription_plan?: string | null
          tax_number?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          business_type?: string | null
          company_name?: string
          company_registration?: string | null
          created_at?: string
          currency?: string
          employee_count?: number | null
          id?: string
          industry?: string | null
          monthly_budget?: number | null
          owner_id?: string
          status?: string
          subscription_plan?: string | null
          tax_number?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      business_team_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_conversions: {
        Row: {
          campaign_id: string
          conversion_value: number | null
          created_at: string | null
          id: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          campaign_id: string
          conversion_value?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          campaign_id?: string
          conversion_value?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_conversions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_conversions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "campaign_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_events: {
        Row: {
          campaign_id: string
          created_at: string | null
          event_data: Json | null
          event_name: string
          id: string
          visitor_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          visitor_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "campaign_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_visitors: {
        Row: {
          campaign_id: string
          city: string | null
          converted: boolean | null
          converted_at: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          qr_channel: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign_id: string
          city?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          qr_channel?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign_id?: string
          city?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          qr_channel?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_visitors_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_history: {
        Row: {
          admin_notes: string | null
          admin_reviewed: boolean | null
          cancellation_type: string
          cancelled_by: string
          created_at: string | null
          financial_impact: Json | null
          id: string
          metadata: Json | null
          reason: string
          reference_id: string
          reference_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status_at_cancellation: string
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          cancellation_type: string
          cancelled_by: string
          created_at?: string | null
          financial_impact?: Json | null
          id?: string
          metadata?: Json | null
          reason: string
          reference_id: string
          reference_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status_at_cancellation: string
        }
        Update: {
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          cancellation_type?: string
          cancelled_by?: string
          created_at?: string | null
          financial_impact?: Json | null
          id?: string
          metadata?: Json | null
          reason?: string
          reference_id?: string
          reference_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status_at_cancellation?: string
        }
        Relationships: []
      }
      challenge_rewards: {
        Row: {
          challenge_id: string
          created_at: string
          driver_challenge_id: string
          driver_id: string
          id: string
          reward_currency: string | null
          reward_type: string
          reward_value: number
          wallet_transaction_id: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          driver_challenge_id: string
          driver_id: string
          id?: string
          reward_currency?: string | null
          reward_type: string
          reward_value: number
          wallet_transaction_id?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          driver_challenge_id?: string
          driver_id?: string
          id?: string
          reward_currency?: string | null
          reward_type?: string
          reward_value?: number
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_rewards_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_rewards_driver_challenge_id_fkey"
            columns: ["driver_challenge_id"]
            isOneToOne: false
            referencedRelation: "driver_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          end_date: string
          id: string
          is_active: boolean
          reward_currency: string | null
          reward_type: string
          reward_value: number
          start_date: string
          target_metric: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          end_date: string
          id?: string
          is_active?: boolean
          reward_currency?: string | null
          reward_type: string
          reward_value?: number
          start_date?: string
          target_metric: string
          target_value: number
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean
          reward_currency?: string | null
          reward_type?: string
          reward_value?: number
          start_date?: string
          target_metric?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chauffeurs: {
        Row: {
          bank_account_number: string | null
          city: string | null
          created_at: string | null
          delivery_capacity: string | null
          display_name: string | null
          documents: Json | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          has_own_vehicle: boolean | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_active: boolean | null
          license_expiry: string | null
          license_number: string | null
          migrated_at: string | null
          migrated_service_type: string | null
          migration_status: string | null
          phone_number: string | null
          profile_photo_url: string | null
          rating_average: number | null
          rating_count: number | null
          role: string | null
          service_areas: string[] | null
          service_specialization: string | null
          service_type: string | null
          total_rides: number | null
          updated_at: string | null
          user_id: string
          vehicle_class: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_photo_url: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_year: number | null
          verification_level: string | null
          verification_status: string | null
        }
        Insert: {
          bank_account_number?: string | null
          city?: string | null
          created_at?: string | null
          delivery_capacity?: string | null
          display_name?: string | null
          documents?: Json | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_own_vehicle?: boolean | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          migrated_at?: string | null
          migrated_service_type?: string | null
          migration_status?: string | null
          phone_number?: string | null
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          role?: string | null
          service_areas?: string[] | null
          service_specialization?: string | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_class?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          verification_level?: string | null
          verification_status?: string | null
        }
        Update: {
          bank_account_number?: string | null
          city?: string | null
          created_at?: string | null
          delivery_capacity?: string | null
          display_name?: string | null
          documents?: Json | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_own_vehicle?: boolean | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          migrated_at?: string | null
          migrated_service_type?: string | null
          migration_status?: string | null
          phone_number?: string | null
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          role?: string | null
          service_areas?: string[] | null
          service_specialization?: string | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_class?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          verification_level?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          phone_number: string
          preferred_language: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
          preferred_language?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
          preferred_language?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      code_generation_rate_limit: {
        Row: {
          code_type: string
          created_at: string
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          code_type: string
          created_at?: string
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code_type?: string
          created_at?: string
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      commission_configuration: {
        Row: {
          created_at: string
          created_by: string | null
          deprecated: boolean | null
          deprecated_at: string | null
          deprecation_reason: string | null
          driver_commission_rate: number
          id: string
          is_active: boolean
          partner_commission_rate: number
          platform_commission_rate: number
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deprecated?: boolean | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          driver_commission_rate?: number
          id?: string
          is_active?: boolean
          partner_commission_rate?: number
          platform_commission_rate?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deprecated?: boolean | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          driver_commission_rate?: number
          id?: string
          is_active?: boolean
          partner_commission_rate?: number
          platform_commission_rate?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_history_archive: {
        Row: {
          archived_at: string
          commission_amount: number | null
          commission_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          original_commission_id: string | null
          partner_id: string | null
        }
        Insert: {
          archived_at?: string
          commission_amount?: number | null
          commission_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          original_commission_id?: string | null
          partner_id?: string | null
        }
        Update: {
          archived_at?: string
          commission_amount?: number | null
          commission_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          original_commission_id?: string | null
          partner_id?: string | null
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          admin_rate: number
          created_at: string
          created_by: string | null
          deprecated: boolean | null
          deprecated_at: string | null
          deprecation_reason: string | null
          driver_rate: number
          id: string
          is_active: boolean
          platform_rate: number
          service_type: string
          updated_at: string
        }
        Insert: {
          admin_rate?: number
          created_at?: string
          created_by?: string | null
          deprecated?: boolean | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          driver_rate?: number
          id?: string
          is_active?: boolean
          platform_rate?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          admin_rate?: number
          created_at?: string
          created_by?: string | null
          deprecated?: boolean | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          driver_rate?: number
          id?: string
          is_active?: boolean
          platform_rate?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_to_subscription_log: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          migration_notes: string | null
          new_subscription_plan_id: string | null
          old_commission_rate: number | null
          status: string | null
          transition_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          migration_notes?: string | null
          new_subscription_plan_id?: string | null
          old_commission_rate?: number | null
          status?: string | null
          transition_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          migration_notes?: string | null
          new_subscription_plan_id?: string | null
          old_commission_rate?: number | null
          status?: string | null
          transition_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_to_subscription_log_new_subscription_plan_id_fkey"
            columns: ["new_subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string | null
          product_id: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      data_migration_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          migration_data: Json | null
          migration_type: string
          success: boolean | null
          target_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          migration_data?: Json | null
          migration_type: string
          success?: boolean | null
          target_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          migration_data?: Json | null
          migration_type?: string
          success?: boolean | null
          target_id?: string | null
        }
        Relationships: []
      }
      deferred_commissions: {
        Row: {
          booking_id: string
          commission_amount: number
          created_at: string
          deducted_at: string | null
          driver_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          commission_amount: number
          created_at?: string
          deducted_at?: string | null
          driver_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          commission_amount?: number
          created_at?: string
          deducted_at?: string | null
          driver_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          delivery_order_id: string
          id: string
          marketplace_order_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          delivery_order_id: string
          id?: string
          marketplace_order_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          delivery_order_id?: string
          id?: string
          marketplace_order_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_marketplace_order_id_fkey"
            columns: ["marketplace_order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_chat_messages: {
        Row: {
          delivery_order_id: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          sender_type: string
          sent_at: string
        }
        Insert: {
          delivery_order_id: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          sent_at?: string
        }
        Update: {
          delivery_order_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_chat_messages_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_driver_alerts: {
        Row: {
          alert_type: string
          created_at: string
          distance_km: number
          driver_id: string
          expires_at: string | null
          id: string
          order_details: Json | null
          order_id: string
          responded_at: string | null
          response_status: string
          seen_at: string | null
          sent_at: string
          updated_at: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          distance_km: number
          driver_id: string
          expires_at?: string | null
          id?: string
          order_details?: Json | null
          order_id: string
          responded_at?: string | null
          response_status?: string
          seen_at?: string | null
          sent_at?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          distance_km?: number
          driver_id?: string
          expires_at?: string | null
          id?: string
          order_details?: Json | null
          order_id?: string
          responded_at?: string | null
          response_status?: string
          seen_at?: string | null
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_driver_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_escrow_payments: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          driver_id: string | null
          id: string
          order_id: string
          payment_method: string
          released_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          order_id: string
          payment_method: string
          released_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          order_id?: string
          payment_method?: string
          released_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_escrow_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_fees: {
        Row: {
          base_fee: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          service_type: string
          updated_at: string
        }
        Insert: {
          base_fee?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Update: {
          base_fee?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_location_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          assignment_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          assignment_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          assignment_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      delivery_notifications: {
        Row: {
          created_at: string
          delivery_order_id: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          read: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_order_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string
          read?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_order_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          read?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notifications_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          actual_price: number | null
          assignment_version: number
          cancellation_reason: string | null
          cancellation_type: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          city: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_coordinates: Json | null
          delivery_google_address: string | null
          delivery_google_place_id: string | null
          delivery_google_place_name: string | null
          delivery_location: string
          delivery_photo_url: string | null
          delivery_proof: Json | null
          delivery_time: string | null
          delivery_type: string
          driver_assigned_at: string | null
          driver_id: string | null
          driver_notes: string | null
          estimated_price: number | null
          google_geocoded_at: string | null
          id: string
          in_transit_at: string | null
          loading_assistance: boolean | null
          order_time: string
          package_type: string | null
          package_weight: number | null
          picked_up_at: string | null
          pickup_coordinates: Json | null
          pickup_google_address: string | null
          pickup_google_place_id: string | null
          pickup_google_place_name: string | null
          pickup_location: string
          pickup_time: string | null
          recipient_name: string
          recipient_phone: string
          recipient_signature: string | null
          sender_name: string
          sender_phone: string
          status: string | null
          updated_at: string
          user_id: string
          vehicle_size: string | null
        }
        Insert: {
          actual_price?: number | null
          assignment_version?: number
          cancellation_reason?: string | null
          cancellation_type?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_coordinates?: Json | null
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          delivery_location: string
          delivery_photo_url?: string | null
          delivery_proof?: Json | null
          delivery_time?: string | null
          delivery_type: string
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          in_transit_at?: string | null
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          package_weight?: number | null
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location: string
          pickup_time?: string | null
          recipient_name: string
          recipient_phone: string
          recipient_signature?: string | null
          sender_name: string
          sender_phone: string
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_size?: string | null
        }
        Update: {
          actual_price?: number | null
          assignment_version?: number
          cancellation_reason?: string | null
          cancellation_type?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_coordinates?: Json | null
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          delivery_location?: string
          delivery_photo_url?: string | null
          delivery_proof?: Json | null
          delivery_time?: string | null
          delivery_type?: string
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          in_transit_at?: string | null
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          package_weight?: number | null
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location?: string
          pickup_time?: string | null
          recipient_name?: string
          recipient_phone?: string
          recipient_signature?: string | null
          sender_name?: string
          sender_phone?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_size?: string | null
        }
        Relationships: []
      }
      delivery_pricing_config: {
        Row: {
          base_price: number
          city: string
          created_at: string | null
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          service_type: string
          surge_multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          city?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type: string
          surge_multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          city?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type?: string
          surge_multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          delivery_order_id: string
          id: string
          location_coordinates: Json | null
          metadata: Json | null
          notes: string | null
          previous_status: string | null
          status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          delivery_order_id: string
          id?: string
          location_coordinates?: Json | null
          metadata?: Json | null
          notes?: string | null
          previous_status?: string | null
          status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          delivery_order_id?: string
          id?: string
          location_coordinates?: Json | null
          metadata?: Json | null
          notes?: string | null
          previous_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatcher_rejections: {
        Row: {
          booking_id: string | null
          booking_type: string | null
          created_at: string | null
          driver_id: string | null
          id: string
          rejection_reason: string
          rides_remaining: number | null
          subscription_status: string | null
        }
        Insert: {
          booking_id?: string | null
          booking_type?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          rejection_reason: string
          rides_remaining?: number | null
          subscription_status?: string | null
        }
        Update: {
          booking_id?: string | null
          booking_type?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          rejection_reason?: string
          rides_remaining?: number | null
          subscription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatcher_rejections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dispatcher_rejections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "dispatcher_rejections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_bonus_rides: {
        Row: {
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          rides_available: number
          total_earned: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          rides_available?: number
          total_earned?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          rides_available?: number
          total_earned?: number
          updated_at?: string
        }
        Relationships: []
      }
      driver_cash_collections: {
        Row: {
          amount: number
          collected_at: string | null
          collection_type: string
          created_at: string | null
          delivery_order_id: string
          driver_id: string
          id: string
          marketplace_order_id: string | null
          notes: string | null
          reconciled_at: string | null
          status: string
        }
        Insert: {
          amount: number
          collected_at?: string | null
          collection_type: string
          created_at?: string | null
          delivery_order_id: string
          driver_id: string
          id?: string
          marketplace_order_id?: string | null
          notes?: string | null
          reconciled_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          collected_at?: string | null
          collection_type?: string
          created_at?: string | null
          delivery_order_id?: string
          driver_id?: string
          id?: string
          marketplace_order_id?: string | null
          notes?: string | null
          reconciled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_cash_collections_marketplace_order_id_fkey"
            columns: ["marketplace_order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          driver_id: string
          id: string
          is_completed: boolean
          reward_claimed: boolean
          reward_claimed_at: string | null
          updated_at: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          driver_id: string
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          driver_id?: string
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_codes: {
        Row: {
          code: string
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          partner_id: string | null
          service_type: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          service_type?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          service_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "driver_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_codes_enhanced: {
        Row: {
          code: string
          code_type: string
          created_at: string
          created_by: string | null
          driver_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          partner_id: string | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          driver_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_codes_enhanced_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_codes_enhanced_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_codes_enhanced_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_codes_enhanced_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "driver_codes_enhanced_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_equipment_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_required: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_fraud_tracking: {
        Row: {
          created_at: string
          description: string | null
          driver_id: string
          fraud_type: string
          id: string
          is_suspended: boolean
          last_fraud_detected_at: string | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suspended_at: string | null
          suspended_until: string | null
          suspension_reason: string | null
          unpaid_commissions_count: number | null
          updated_at: string
          warning_level: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          driver_id: string
          fraud_type: string
          id?: string
          is_suspended?: boolean
          last_fraud_detected_at?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suspended_at?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          unpaid_commissions_count?: number | null
          updated_at?: string
          warning_level?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          driver_id?: string
          fraud_type?: string
          id?: string
          is_suspended?: boolean
          last_fraud_detected_at?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suspended_at?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          unpaid_commissions_count?: number | null
          updated_at?: string
          warning_level?: number | null
        }
        Relationships: []
      }
      driver_location_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          driver_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          driver_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          driver_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          geocode_source: string | null
          google_address: string | null
          google_geocoded_at: string | null
          google_place_id: string | null
          google_place_name: string | null
          heading: number | null
          id: string
          is_available: boolean
          is_online: boolean
          is_verified: boolean | null
          last_ping: string
          latitude: number
          longitude: number
          minimum_balance: number | null
          speed: number | null
          updated_at: string
          vehicle_class: string | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          geocode_source?: string | null
          google_address?: string | null
          google_geocoded_at?: string | null
          google_place_id?: string | null
          google_place_name?: string | null
          heading?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          is_verified?: boolean | null
          last_ping?: string
          latitude: number
          longitude: number
          minimum_balance?: number | null
          speed?: number | null
          updated_at?: string
          vehicle_class?: string | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          geocode_source?: string | null
          google_address?: string | null
          google_geocoded_at?: string | null
          google_place_id?: string | null
          google_place_name?: string | null
          heading?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          is_verified?: boolean | null
          last_ping?: string
          latitude?: number
          longitude?: number
          minimum_balance?: number | null
          speed?: number | null
          updated_at?: string
          vehicle_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_online_status_table: {
        Row: {
          last_updated: string | null
          online_drivers: number | null
          total_drivers: number | null
          vehicle_class: string | null
        }
        Insert: {
          last_updated?: string | null
          online_drivers?: number | null
          total_drivers?: number | null
          vehicle_class?: string | null
        }
        Update: {
          last_updated?: string | null
          online_drivers?: number | null
          total_drivers?: number | null
          vehicle_class?: string | null
        }
        Relationships: []
      }
      driver_profiles: {
        Row: {
          created_at: string
          delivery_capacity: string | null
          documents: Json | null
          id: string
          insurance_expiry: string
          insurance_number: string
          is_active: boolean
          license_expiry: string
          license_number: string
          profile_photo_url: string | null
          rating_average: number | null
          rating_count: number | null
          service_type: string | null
          total_rides: number | null
          updated_at: string
          user_id: string
          vehicle_class: string
          vehicle_color: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_photo_url: string | null
          vehicle_plate: string
          vehicle_year: number
          verification_level: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          delivery_capacity?: string | null
          documents?: Json | null
          id?: string
          insurance_expiry: string
          insurance_number: string
          is_active?: boolean
          license_expiry: string
          license_number: string
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
          vehicle_class?: string
          vehicle_color?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_photo_url?: string | null
          vehicle_plate: string
          vehicle_year: number
          verification_level?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          delivery_capacity?: string | null
          documents?: Json | null
          id?: string
          insurance_expiry?: string
          insurance_number?: string
          is_active?: boolean
          license_expiry?: string
          license_number?: string
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
          vehicle_class?: string
          vehicle_color?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_photo_url?: string | null
          vehicle_plate?: string
          vehicle_year?: number
          verification_level?: string
          verification_status?: string
        }
        Relationships: []
      }
      driver_queue: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          last_activity: string
          position_in_queue: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          last_activity?: string
          position_in_queue?: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          position_in_queue?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_queue_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_ratings: {
        Row: {
          booking_id: string
          created_at: string | null
          driver_id: string
          feedback: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          driver_id: string
          feedback?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          driver_id?: string
          feedback?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      driver_requests: {
        Row: {
          approved_at: string | null
          created_at: string
          documents: Json | null
          has_own_vehicle: boolean | null
          id: string
          insurance_number: string | null
          license_expiry: string | null
          license_number: string
          partner_id: string | null
          rejected_reason: string | null
          service_type: string | null
          status: string
          updated_at: string
          user_id: string
          validated_by: string | null
          validation_comments: string | null
          validation_date: string | null
          validation_level: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          documents?: Json | null
          has_own_vehicle?: boolean | null
          id?: string
          insurance_number?: string | null
          license_expiry?: string | null
          license_number: string
          partner_id?: string | null
          rejected_reason?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
          validated_by?: string | null
          validation_comments?: string | null
          validation_date?: string | null
          validation_level?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          documents?: Json | null
          has_own_vehicle?: boolean | null
          id?: string
          insurance_number?: string | null
          license_expiry?: string | null
          license_number?: string
          partner_id?: string | null
          rejected_reason?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          validated_by?: string | null
          validation_comments?: string | null
          validation_date?: string | null
          validation_level?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
      driver_service_associations: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          migration_source: string | null
          notes: string | null
          service_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          migration_source?: string | null
          notes?: string | null
          service_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          migration_source?: string | null
          notes?: string | null
          service_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_service_associations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_service_preferences: {
        Row: {
          created_at: string
          deprecated: boolean | null
          deprecated_at: string | null
          deprecation_reason: string | null
          driver_id: string
          id: string
          is_active: boolean
          languages: string[] | null
          max_distance_km: number | null
          minimum_fare: number | null
          preferred_zones: string[] | null
          service_types: string[]
          special_services: string[] | null
          updated_at: string
          vehicle_classes: string[] | null
          work_schedule: Json | null
        }
        Insert: {
          created_at?: string
          deprecated?: boolean | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          driver_id: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          max_distance_km?: number | null
          minimum_fare?: number | null
          preferred_zones?: string[] | null
          service_types?: string[]
          special_services?: string[] | null
          updated_at?: string
          vehicle_classes?: string[] | null
          work_schedule?: Json | null
        }
        Update: {
          created_at?: string
          deprecated?: boolean | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          max_distance_km?: number | null
          minimum_fare?: number | null
          preferred_zones?: string[] | null
          service_types?: string[]
          special_services?: string[] | null
          updated_at?: string
          vehicle_classes?: string[] | null
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_service_preferences_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_service_preferences_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_service_preferences_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          driver_id: string
          end_date: string
          grace_period_end: string | null
          id: string
          is_trial: boolean | null
          last_payment_date: string | null
          next_payment_date: string | null
          payment_method: string
          plan_id: string
          rides_remaining: number | null
          rides_used: number | null
          service_type: string | null
          start_date: string
          status: string
          trial_granted_at: string | null
          trial_granted_by: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          driver_id: string
          end_date: string
          grace_period_end?: string | null
          id?: string
          is_trial?: boolean | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method: string
          plan_id: string
          rides_remaining?: number | null
          rides_used?: number | null
          service_type?: string | null
          start_date?: string
          status?: string
          trial_granted_at?: string | null
          trial_granted_by?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          driver_id?: string
          end_date?: string
          grace_period_end?: string | null
          id?: string
          is_trial?: boolean | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method?: string
          plan_id?: string
          rides_remaining?: number | null
          rides_used?: number | null
          service_type?: string | null
          start_date?: string
          status?: string
          trial_granted_at?: string | null
          trial_granted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_vehicle_associations: {
        Row: {
          approval_status: string
          approved_by: string | null
          association_type: string
          created_at: string
          created_by: string | null
          driver_id: string
          end_date: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          notes: string | null
          partner_id: string | null
          start_date: string
          updated_at: string
          vehicle_details: Json | null
          vehicle_id: string | null
        }
        Insert: {
          approval_status?: string
          approved_by?: string | null
          association_type: string
          created_at?: string
          created_by?: string | null
          driver_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          partner_id?: string | null
          start_date?: string
          updated_at?: string
          vehicle_details?: Json | null
          vehicle_id?: string | null
        }
        Update: {
          approval_status?: string
          approved_by?: string | null
          association_type?: string
          created_at?: string
          created_by?: string | null
          driver_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          partner_id?: string | null
          start_date?: string
          updated_at?: string
          vehicle_details?: Json | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicle_associations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_vehicle_associations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_vehicle_associations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_vehicle_associations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_vehicle_associations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_vehicle_associations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_zone_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_type: string
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_concurrent_requests: number | null
          metadata: Json | null
          priority_level: number | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_concurrent_requests?: number | null
          metadata?: Json | null
          priority_level?: number | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_concurrent_requests?: number | null
          metadata?: Json | null
          priority_level?: number | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_zone_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_pricing: {
        Row: {
          available_drivers: number
          calculated_at: string
          demand_level: string
          id: string
          pending_requests: number
          surge_multiplier: number
          valid_until: string
          vehicle_class: string
          zone_id: string
        }
        Insert: {
          available_drivers?: number
          calculated_at?: string
          demand_level?: string
          id?: string
          pending_requests?: number
          surge_multiplier?: number
          valid_until?: string
          vehicle_class?: string
          zone_id: string
        }
        Update: {
          available_drivers?: number
          calculated_at?: string
          demand_level?: string
          id?: string
          pending_requests?: number
          surge_multiplier?: number
          valid_until?: string
          vehicle_class?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_pricing_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_function_performance: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number
          function_name: string
          id: string
          request_id: string | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms: number
          function_name: string
          id?: string
          request_id?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          request_id?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          auto_notifications_sent: Json | null
          created_at: string
          emergency_contacts: Json | null
          id: string
          location: Json
          priority_level: number
          resolution_notes: string | null
          resolved_at: string | null
          responder_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type?: string
          auto_notifications_sent?: Json | null
          created_at?: string
          emergency_contacts?: Json | null
          id?: string
          location: Json
          priority_level?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          responder_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          auto_notifications_sent?: Json | null
          created_at?: string
          emergency_contacts?: Json | null
          id?: string
          location?: Json
          priority_level?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          responder_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          algorithm: string
          created_at: string
          created_by: string | null
          encrypted_key: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_identifier: string
          key_type: string
        }
        Insert: {
          algorithm?: string
          created_at?: string
          created_by?: string | null
          encrypted_key: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_identifier: string
          key_type: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          created_by?: string | null
          encrypted_key?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_identifier?: string
          key_type?: string
        }
        Relationships: []
      }
      enhanced_support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      escrow_notifications: {
        Row: {
          created_at: string
          escrow_transaction_id: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          escrow_transaction_id: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          escrow_transaction_id?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_notifications_escrow_transaction_id_fkey"
            columns: ["escrow_transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          currency: string
          held_at: string
          id: string
          order_id: string
          payment_method: string
          refunded_at: string | null
          released_at: string | null
          seller_id: string
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          currency?: string
          held_at?: string
          id?: string
          order_id: string
          payment_method: string
          refunded_at?: string | null
          released_at?: string | null
          seller_id: string
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          currency?: string
          held_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          refunded_at?: string | null
          released_at?: string | null
          seller_id?: string
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          admin_notes: string | null
          auto_release_at: string | null
          buyer_id: string
          completed_at: string | null
          created_at: string
          currency: string
          dispute_opened_at: string | null
          dispute_reason: string | null
          driver_amount: number | null
          driver_id: string | null
          held_at: string
          id: string
          order_id: string
          platform_fee: number
          refunded_at: string | null
          released_at: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_amount: number
          seller_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          auto_release_at?: string | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          driver_amount?: number | null
          driver_id?: string | null
          held_at?: string
          id?: string
          order_id: string
          platform_fee: number
          refunded_at?: string | null
          released_at?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_amount: number
          seller_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          auto_release_at?: string | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          driver_amount?: number | null
          driver_id?: string | null
          held_at?: string
          id?: string
          order_id?: string
          platform_fee?: number
          refunded_at?: string | null
          released_at?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_amount?: number
          seller_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      food_delivery_assignments: {
        Row: {
          assignment_status: string | null
          created_at: string
          delivery_coordinates: Json | null
          delivery_fee: number | null
          delivery_location: string | null
          driver_earnings: number | null
          driver_id: string
          estimated_delivery_time: string | null
          estimated_pickup_time: string | null
          food_order_id: string
          id: string
          pickup_coordinates: Json | null
          pickup_location: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          assignment_status?: string | null
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_location?: string | null
          driver_earnings?: number | null
          driver_id: string
          estimated_delivery_time?: string | null
          estimated_pickup_time?: string | null
          food_order_id: string
          id?: string
          pickup_coordinates?: Json | null
          pickup_location?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          assignment_status?: string | null
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_location?: string | null
          driver_earnings?: number | null
          driver_id?: string
          estimated_delivery_time?: string | null
          estimated_pickup_time?: string | null
          food_order_id?: string
          id?: string
          pickup_coordinates?: Json | null
          pickup_location?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          notification_type: string
          order_id: string | null
          priority: string | null
          read_at: string | null
          restaurant_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          order_id?: string | null
          priority?: string | null
          read_at?: string | null
          restaurant_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          order_id?: string | null
          priority?: string | null
          read_at?: string | null
          restaurant_id?: string
          title?: string
        }
        Relationships: []
      }
      food_order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          delivery_rating: number | null
          food_rating: number
          id: string
          order_id: string
          overall_rating: number
          restaurant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          delivery_rating?: number | null
          food_rating: number
          id?: string
          order_id: string
          overall_rating: number
          restaurant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          delivery_rating?: number | null
          food_rating?: number
          id?: string
          order_id?: string
          overall_rating?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_order_ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_order_ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_order_ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      food_orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          customer_id: string
          delivered_at: string | null
          delivery_address: string
          delivery_coordinates: Json
          delivery_fee: number
          delivery_instructions: string | null
          delivery_paid_at: string | null
          delivery_payment_method: string | null
          delivery_payment_status: string | null
          delivery_phone: string
          driver_id: string | null
          estimated_delivery_time: number | null
          estimated_preparation_time: number | null
          id: string
          items: Json
          order_number: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          picked_up_at: string | null
          preparing_at: string | null
          ready_at: string | null
          restaurant_id: string
          service_fee: number | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          delivered_at?: string | null
          delivery_address: string
          delivery_coordinates: Json
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_paid_at?: string | null
          delivery_payment_method?: string | null
          delivery_payment_status?: string | null
          delivery_phone: string
          driver_id?: string | null
          estimated_delivery_time?: number | null
          estimated_preparation_time?: number | null
          id?: string
          items: Json
          order_number: string
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          picked_up_at?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          restaurant_id: string
          service_fee?: number | null
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_coordinates?: Json
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_paid_at?: string | null
          delivery_payment_method?: string | null
          delivery_payment_status?: string | null
          delivery_phone?: string
          driver_id?: string | null
          estimated_delivery_time?: number | null
          estimated_preparation_time?: number | null
          id?: string
          items?: Json
          order_number?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          picked_up_at?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          restaurant_id?: string
          service_fee?: number | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "food_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      food_products: {
        Row: {
          allergens: string[] | null
          category: string
          created_at: string
          currency: string
          description: string | null
          discount_percentage: number | null
          featured_until: string | null
          id: string
          images: string[] | null
          ingredients: string[] | null
          is_available: boolean | null
          is_featured: boolean | null
          is_spicy: boolean | null
          main_image_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string
          name: string
          original_price: number | null
          preparation_time: number | null
          price: number
          rating_average: number | null
          rating_count: number | null
          rejection_reason: string | null
          restaurant_id: string
          spicy_level: number | null
          stock_quantity: number | null
          subcategory: string | null
          tags: string[] | null
          total_orders: number | null
          updated_at: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          allergens?: string[] | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_percentage?: number | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_spicy?: boolean | null
          main_image_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          name: string
          original_price?: number | null
          preparation_time?: number | null
          price: number
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          restaurant_id: string
          spicy_level?: number | null
          stock_quantity?: number | null
          subcategory?: string | null
          tags?: string[] | null
          total_orders?: number | null
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          allergens?: string[] | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_percentage?: number | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_spicy?: boolean | null
          main_image_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          name?: string
          original_price?: number | null
          preparation_time?: number | null
          price?: number
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          restaurant_id?: string
          spicy_level?: number | null
          stock_quantity?: number | null
          subcategory?: string | null
          tags?: string[] | null
          total_orders?: number | null
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_products_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      function_monitoring_logs: {
        Row: {
          created_at: string
          error_count: number | null
          function_name: string
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
          success_rate: number | null
        }
        Insert: {
          created_at?: string
          error_count?: number | null
          function_name: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status: string
          success_rate?: number | null
        }
        Update: {
          created_at?: string
          error_count?: number | null
          function_name?: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          success_rate?: number | null
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          address: string
          cache_key: string
          cached_at: string
          city: string | null
          country_code: string | null
          created_at: string
          formatted_address: string
          id: string
          latitude: number
          longitude: number
          place_id: string | null
        }
        Insert: {
          address: string
          cache_key: string
          cached_at?: string
          city?: string | null
          country_code?: string | null
          created_at?: string
          formatted_address: string
          id?: string
          latitude: number
          longitude: number
          place_id?: string | null
        }
        Update: {
          address?: string
          cache_key?: string
          cached_at?: string
          city?: string | null
          country_code?: string | null
          created_at?: string
          formatted_address?: string
          id?: string
          latitude?: number
          longitude?: number
          place_id?: string | null
        }
        Relationships: []
      }
      geolocation_audit_trail: {
        Row: {
          action_type: string
          created_at: string
          encrypted_payload: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          location_data: Json | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          risk_score: number | null
          session_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          encrypted_payload?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          risk_score?: number | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          encrypted_payload?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          risk_score?: number | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      heatmap_clicks: {
        Row: {
          created_at: string
          device_type: string
          element_class: string | null
          element_id: string | null
          element_text: string | null
          element_type: string | null
          id: string
          page: string
          relative_x: number
          relative_y: number
          session_id: string
          user_id: string | null
          viewport_height: number
          viewport_width: number
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          device_type: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          element_type?: string | null
          id?: string
          page: string
          relative_x: number
          relative_y: number
          session_id: string
          user_id?: string | null
          viewport_height: number
          viewport_width: number
          x: number
          y: number
        }
        Update: {
          created_at?: string
          device_type?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          element_type?: string | null
          id?: string
          page?: string
          relative_x?: number
          relative_y?: number
          session_id?: string
          user_id?: string | null
          viewport_height?: number
          viewport_width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      intelligent_places: {
        Row: {
          avenue: string | null
          category: string
          city: string
          commune: string | null
          country_code: string | null
          created_at: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string
          name_alternatives: string[] | null
          numero: string | null
          popularity_score: number | null
          quartier: string | null
          search_vector: unknown
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          avenue?: string | null
          category?: string
          city?: string
          commune?: string | null
          country_code?: string | null
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          name_alternatives?: string[] | null
          numero?: string | null
          popularity_score?: number | null
          quartier?: string | null
          search_vector?: unknown
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          avenue?: string | null
          category?: string
          city?: string
          commune?: string | null
          country_code?: string | null
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          name_alternatives?: string[] | null
          numero?: string | null
          popularity_score?: number | null
          quartier?: string | null
          search_vector?: unknown
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ip_geolocation_cache: {
        Row: {
          accuracy: number | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          latitude: number | null
          longitude: number | null
          provider: string | null
        }
        Insert: {
          accuracy?: number | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address: unknown
          latitude?: number | null
          longitude?: number | null
          provider?: string | null
        }
        Update: {
          accuracy?: number | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          provider?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          id: string
          job_id: string
          resume_url: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      job_companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          owner_user_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_messages: {
        Row: {
          application_id: string
          created_at: string | null
          from_user_id: string
          id: string
          is_read: boolean | null
          message: string
          to_user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          from_user_id: string
          id?: string
          is_read?: boolean | null
          message: string
          to_user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_saved: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_saved_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          currency: string | null
          description: string
          employment_type: string
          end_date: string | null
          id: string
          is_featured: boolean | null
          is_remote: boolean | null
          location_city: string
          moderation_status: string | null
          posted_by_user_id: string
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          employment_type: string
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          is_remote?: boolean | null
          location_city: string
          moderation_status?: string | null
          posted_by_user_id: string
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employment_type?: string
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          is_remote?: boolean | null
          location_city?: string
          moderation_status?: string | null
          posted_by_user_id?: string
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "job_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      location_access_audit: {
        Row: {
          access_type: string
          accessed_by: string | null
          created_at: string | null
          drivers_found: number | null
          id: string
          ip_address: unknown
          search_coordinates: Json | null
          search_radius_km: number | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by?: string | null
          created_at?: string | null
          drivers_found?: number | null
          id?: string
          ip_address?: unknown
          search_coordinates?: Json | null
          search_radius_km?: number | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string | null
          created_at?: string | null
          drivers_found?: number | null
          id?: string
          ip_address?: unknown
          search_coordinates?: Json | null
          search_radius_km?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      location_search_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string | null
          query: string
          region: string | null
          result_count: number | null
          results: Json
          search_key: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string | null
          query: string
          region?: string | null
          result_count?: number | null
          results?: Json
          search_key: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string | null
          query?: string
          region?: string | null
          result_count?: number | null
          results?: Json
          search_key?: string
        }
        Relationships: []
      }
      lottery_admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          notes: string | null
          previous_data: Json | null
          reason: string | null
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      lottery_config: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_draws: {
        Row: {
          created_at: string
          draw_algorithm: string
          draw_type: string
          drawn_at: string | null
          id: string
          max_winners: number
          min_tickets_required: number
          name: string
          prize_pool: Json | null
          scheduled_date: string
          status: string
          total_participants: number | null
          total_tickets_used: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          draw_algorithm?: string
          draw_type: string
          drawn_at?: string | null
          id?: string
          max_winners?: number
          min_tickets_required?: number
          name: string
          prize_pool?: Json | null
          scheduled_date: string
          status?: string
          total_participants?: number | null
          total_tickets_used?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          draw_algorithm?: string
          draw_type?: string
          drawn_at?: string | null
          id?: string
          max_winners?: number
          min_tickets_required?: number
          name?: string
          prize_pool?: Json | null
          scheduled_date?: string
          status?: string
          total_participants?: number | null
          total_tickets_used?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      lottery_entries: {
        Row: {
          claimed_at: string | null
          created_at: string
          draw_id: string
          entry_time: string
          id: string
          is_winner: boolean | null
          prize_won: Json | null
          ticket_ids: Json
          tickets_used: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          draw_id: string
          entry_time?: string
          id?: string
          is_winner?: boolean | null
          prize_won?: Json | null
          ticket_ids?: Json
          tickets_used?: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          draw_id?: string
          entry_time?: string
          id?: string
          is_winner?: boolean | null
          prize_won?: Json | null
          ticket_ids?: Json
          tickets_used?: number
          user_id?: string
        }
        Relationships: []
      }
      lottery_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          notification_type: string
          priority: string | null
          read: boolean | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          notification_type: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      lottery_prize_deliveries: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_method: string
          delivery_notes: string | null
          delivery_person_id: string | null
          delivery_person_name: string | null
          delivery_photo_urls: string[] | null
          delivery_status: string
          id: string
          recipient_signature: string | null
          scheduled_date: string | null
          updated_at: string | null
          updated_by: string | null
          win_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_method: string
          delivery_notes?: string | null
          delivery_person_id?: string | null
          delivery_person_name?: string | null
          delivery_photo_urls?: string[] | null
          delivery_status?: string
          id?: string
          recipient_signature?: string | null
          scheduled_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          win_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_method?: string
          delivery_notes?: string | null
          delivery_person_id?: string | null
          delivery_person_name?: string | null
          delivery_photo_urls?: string[] | null
          delivery_status?: string
          id?: string
          recipient_signature?: string | null
          scheduled_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          win_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_prize_deliveries_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lottery_prize_deliveries_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "lottery_prize_deliveries_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lottery_prize_deliveries_win_id_fkey"
            columns: ["win_id"]
            isOneToOne: false
            referencedRelation: "lottery_wins"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_prize_types: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          partner_id: string | null
          physical_delivery_required: boolean | null
          probability: number | null
          rarity: string | null
          updated_at: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          partner_id?: string | null
          physical_delivery_required?: boolean | null
          probability?: number | null
          rarity?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          partner_id?: string | null
          physical_delivery_required?: boolean | null
          probability?: number | null
          rarity?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "lottery_prize_types_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_prize_types_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_prize_types_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_prize_types_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "lottery_prize_types_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_special_events: {
        Row: {
          card_design_url: string | null
          created_at: string | null
          end_date: string
          event_name: string
          event_type: string
          id: string
          is_active: boolean | null
          multiplier: number | null
          special_prizes: Json | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          card_design_url?: string | null
          created_at?: string | null
          end_date: string
          event_name: string
          event_type: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          special_prizes?: Json | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          card_design_url?: string | null
          created_at?: string | null
          end_date?: string
          event_name?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          special_prizes?: Json | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lottery_tickets: {
        Row: {
          created_at: string
          earned_date: string
          expires_at: string | null
          id: string
          multiplier: number | null
          source_id: string | null
          source_type: string
          status: string
          ticket_number: string
          used_at: string | null
          used_in_draw_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_date?: string
          expires_at?: string | null
          id?: string
          multiplier?: number | null
          source_id?: string | null
          source_type: string
          status?: string
          ticket_number: string
          used_at?: string | null
          used_in_draw_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          earned_date?: string
          expires_at?: string | null
          id?: string
          multiplier?: number | null
          source_id?: string | null
          source_type?: string
          status?: string
          ticket_number?: string
          used_at?: string | null
          used_in_draw_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lottery_user_limits: {
        Row: {
          cards_earned_today: number | null
          created_at: string | null
          daily_limit: number | null
          id: string
          last_reset_date: string | null
          unlimited_until: string | null
          updated_at: string | null
          user_id: string
          vip_bonus: number | null
        }
        Insert: {
          cards_earned_today?: number | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          last_reset_date?: string | null
          unlimited_until?: string | null
          updated_at?: string | null
          user_id: string
          vip_bonus?: number | null
        }
        Update: {
          cards_earned_today?: number | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          last_reset_date?: string | null
          unlimited_until?: string | null
          updated_at?: string | null
          user_id?: string
          vip_bonus?: number | null
        }
        Relationships: []
      }
      lottery_wins: {
        Row: {
          admin_notes: string | null
          boost_details: Json | null
          card_type: string | null
          claim_status: string | null
          claimed_at: string | null
          created_at: string
          currency: string
          daily_card: boolean | null
          delivery_address: string | null
          delivery_method: string | null
          delivery_status: string | null
          draw_id: string | null
          entry_id: string | null
          expires_at: string | null
          expires_in_hours: number | null
          id: string
          is_partner_prize: boolean | null
          partner_prize_id: string | null
          physical_delivery_info: Json | null
          points_awarded: number | null
          prize_details: Json
          prize_type_id: string | null
          prize_value: number
          proof_of_delivery: Json | null
          rarity: string | null
          recipient_signature: string | null
          reward_type: string | null
          scratch_percentage: number | null
          scratch_revealed_at: string | null
          status: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          boost_details?: Json | null
          card_type?: string | null
          claim_status?: string | null
          claimed_at?: string | null
          created_at?: string
          currency?: string
          daily_card?: boolean | null
          delivery_address?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          draw_id?: string | null
          entry_id?: string | null
          expires_at?: string | null
          expires_in_hours?: number | null
          id?: string
          is_partner_prize?: boolean | null
          partner_prize_id?: string | null
          physical_delivery_info?: Json | null
          points_awarded?: number | null
          prize_details: Json
          prize_type_id?: string | null
          prize_value: number
          proof_of_delivery?: Json | null
          rarity?: string | null
          recipient_signature?: string | null
          reward_type?: string | null
          scratch_percentage?: number | null
          scratch_revealed_at?: string | null
          status?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          boost_details?: Json | null
          card_type?: string | null
          claim_status?: string | null
          claimed_at?: string | null
          created_at?: string
          currency?: string
          daily_card?: boolean | null
          delivery_address?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          draw_id?: string | null
          entry_id?: string | null
          expires_at?: string | null
          expires_in_hours?: number | null
          id?: string
          is_partner_prize?: boolean | null
          partner_prize_id?: string | null
          physical_delivery_info?: Json | null
          points_awarded?: number | null
          prize_details?: Json
          prize_type_id?: string | null
          prize_value?: number
          proof_of_delivery?: Json | null
          rarity?: string | null
          recipient_signature?: string | null
          reward_type?: string | null
          scratch_percentage?: number | null
          scratch_revealed_at?: string | null
          status?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_wins_partner_prize_id_fkey"
            columns: ["partner_prize_id"]
            isOneToOne: false
            referencedRelation: "partner_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          city: string
          colors: Json
          countdown: boolean | null
          created_at: string | null
          cta_primary: string
          cta_secondary: string | null
          headline: string
          hero_image: string | null
          hero_video: string | null
          id: string
          is_active: boolean | null
          name: string
          offer: Json
          scarcity: Json | null
          share_buttons: Json | null
          subheadline: string
          target: string
          testimonials: string | null
          updated_at: string | null
        }
        Insert: {
          city: string
          colors?: Json
          countdown?: boolean | null
          created_at?: string | null
          cta_primary: string
          cta_secondary?: string | null
          headline: string
          hero_image?: string | null
          hero_video?: string | null
          id: string
          is_active?: boolean | null
          name: string
          offer?: Json
          scarcity?: Json | null
          share_buttons?: Json | null
          subheadline: string
          target: string
          testimonials?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string
          colors?: Json
          countdown?: boolean | null
          created_at?: string | null
          cta_primary?: string
          cta_secondary?: string | null
          headline?: string
          hero_image?: string | null
          hero_video?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          offer?: Json
          scarcity?: Json | null
          share_buttons?: Json | null
          subheadline?: string
          target?: string
          testimonials?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_fr: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_fr: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_fr?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_chats: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          product_id: string
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          product_id: string
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          product_id?: string
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_chats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_commission_config: {
        Row: {
          commission_rate: number
          created_at: string
          created_by: string | null
          currency: string
          fixed_fee: number | null
          id: string
          is_active: boolean
          service_type: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          fixed_fee?: number | null
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          fixed_fee?: number | null
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_delivery_assignments: {
        Row: {
          actual_delivery_time: string | null
          actual_pickup_time: string | null
          assigned_by_vendor: boolean | null
          assignment_status: string
          created_at: string
          delivery_coordinates: Json | null
          delivery_fee: number | null
          delivery_location: string
          driver_id: string | null
          driver_notes: string | null
          estimated_delivery_time: string | null
          id: string
          order_id: string
          pickup_coordinates: Json | null
          pickup_location: string
          updated_at: string
          vendor_delivery_notes: string | null
        }
        Insert: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          assigned_by_vendor?: boolean | null
          assignment_status?: string
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_location: string
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id: string
          pickup_coordinates?: Json | null
          pickup_location: string
          updated_at?: string
          vendor_delivery_notes?: string | null
        }
        Update: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          assigned_by_vendor?: boolean | null
          assignment_status?: string
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_location?: string
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string
          pickup_coordinates?: Json | null
          pickup_location?: string
          updated_at?: string
          vendor_delivery_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_digital_downloads: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          download_count: number | null
          download_token: string
          expires_at: string
          id: string
          last_downloaded_at: string | null
          max_downloads: number | null
          order_id: string | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          download_count?: number | null
          download_token: string
          expires_at?: string
          id?: string
          last_downloaded_at?: string | null
          max_downloads?: number | null
          order_id?: string | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          download_count?: number | null
          download_token?: string
          expires_at?: string
          id?: string
          last_downloaded_at?: string | null
          max_downloads?: number | null
          order_id?: string | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_digital_downloads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_digital_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_messages: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "marketplace_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          assigned_to_driver_at: string | null
          auto_completed: boolean | null
          buyer_id: string
          buyer_phone: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_feedback: string | null
          customer_rating: number | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_attempted_at: string | null
          delivery_coordinates: Json | null
          delivery_fee: number | null
          delivery_fee_approved_by_buyer: boolean | null
          delivery_fee_payment_method: string | null
          delivery_method: string
          delivery_paid_at: string | null
          delivery_payment_status: string | null
          driver_notes: string | null
          estimated_delivery_time: string | null
          id: string
          in_transit_at: string | null
          notes: string | null
          payment_status: string
          picked_up_by_driver_at: string | null
          pickup_coordinates: Json | null
          preparing_at: string | null
          product_id: string
          quantity: number
          ready_for_pickup_at: string | null
          revenue_status: string | null
          seller_id: string
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
          vendor_approved_at: string | null
          vendor_confirmation_status: string | null
          vendor_confirmed_at: string | null
          vendor_delivery_method: string | null
          vendor_rejection_reason: string | null
        }
        Insert: {
          assigned_to_driver_at?: string | null
          auto_completed?: boolean | null
          buyer_id: string
          buyer_phone?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_attempted_at?: string | null
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_fee_approved_by_buyer?: boolean | null
          delivery_fee_payment_method?: string | null
          delivery_method?: string
          delivery_paid_at?: string | null
          delivery_payment_status?: string | null
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          in_transit_at?: string | null
          notes?: string | null
          payment_status?: string
          picked_up_by_driver_at?: string | null
          pickup_coordinates?: Json | null
          preparing_at?: string | null
          product_id: string
          quantity?: number
          ready_for_pickup_at?: string | null
          revenue_status?: string | null
          seller_id: string
          status?: string
          total_amount: number
          unit_price: number
          updated_at?: string
          vendor_approved_at?: string | null
          vendor_confirmation_status?: string | null
          vendor_confirmed_at?: string | null
          vendor_delivery_method?: string | null
          vendor_rejection_reason?: string | null
        }
        Update: {
          assigned_to_driver_at?: string | null
          auto_completed?: boolean | null
          buyer_id?: string
          buyer_phone?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_attempted_at?: string | null
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_fee_approved_by_buyer?: boolean | null
          delivery_fee_payment_method?: string | null
          delivery_method?: string
          delivery_paid_at?: string | null
          delivery_payment_status?: string | null
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          in_transit_at?: string | null
          notes?: string | null
          payment_status?: string
          picked_up_by_driver_at?: string | null
          pickup_coordinates?: Json | null
          preparing_at?: string | null
          product_id?: string
          quantity?: number
          ready_for_pickup_at?: string | null
          revenue_status?: string | null
          seller_id?: string
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
          vendor_approved_at?: string | null
          vendor_confirmation_status?: string | null
          vendor_confirmed_at?: string | null
          vendor_delivery_method?: string | null
          vendor_rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_orders_buyer"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_marketplace_orders_seller"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketplace_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          brand: string | null
          category: string
          category_id: string | null
          condition: string | null
          coordinates: Json | null
          created_at: string
          description: string | null
          digital_download_limit: number | null
          digital_file_name: string | null
          digital_file_size: number | null
          digital_file_type: string | null
          digital_file_url: string | null
          featured: boolean | null
          id: string
          images: Json | null
          is_digital: boolean | null
          location: string | null
          moderated_at: string | null
          moderation_notified_at: string | null
          moderation_status: string | null
          moderator_id: string | null
          popularity_score: number | null
          price: number
          rating_average: number | null
          rating_count: number | null
          rejection_reason: string | null
          sales_count: number | null
          seller_id: string
          specifications: Json | null
          status: string | null
          stock_count: number | null
          subcategory: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          category_id?: string | null
          condition?: string | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          digital_download_limit?: number | null
          digital_file_name?: string | null
          digital_file_size?: number | null
          digital_file_type?: string | null
          digital_file_url?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          is_digital?: boolean | null
          location?: string | null
          moderated_at?: string | null
          moderation_notified_at?: string | null
          moderation_status?: string | null
          moderator_id?: string | null
          popularity_score?: number | null
          price: number
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          sales_count?: number | null
          seller_id: string
          specifications?: Json | null
          status?: string | null
          stock_count?: number | null
          subcategory?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          category_id?: string | null
          condition?: string | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          digital_download_limit?: number | null
          digital_file_name?: string | null
          digital_file_size?: number | null
          digital_file_type?: string | null
          digital_file_url?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          is_digital?: boolean | null
          location?: string | null
          moderated_at?: string | null
          moderation_notified_at?: string | null
          moderation_status?: string | null
          moderator_id?: string | null
          popularity_score?: number | null
          price?: number
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          sales_count?: number | null
          seller_id?: string
          specifications?: Json | null
          status?: string | null
          stock_count?: number | null
          subcategory?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_products_seller"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketplace_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotions: {
        Row: {
          created_at: string | null
          discount_percentage: number
          discounted_price: number
          end_date: string
          id: string
          is_active: boolean | null
          max_quantity: number | null
          original_price: number
          product_id: string | null
          promotion_type: string | null
          remaining_quantity: number | null
          seller_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage: number
          discounted_price: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          original_price: number
          product_id?: string | null
          promotion_type?: string | null
          remaining_quantity?: number | null
          seller_id: string
          start_date?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number
          discounted_price?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          original_price?: number
          product_id?: string | null
          promotion_type?: string | null
          remaining_quantity?: number | null
          seller_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_ratings: {
        Row: {
          buyer_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          rating: number | null
          seller_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          rating?: number | null
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          rating?: number | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_share_analytics: {
        Row: {
          clicks: number | null
          conversions: number | null
          id: string
          product_id: string | null
          share_type: string
          shared_at: string | null
          vendor_id: string
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          id?: string
          product_id?: string | null
          share_type: string
          shared_at?: string | null
          vendor_id: string
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          id?: string
          product_id?: string | null
          share_type?: string
          shared_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_share_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          pending_withdrawals: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          pending_withdrawals?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          pending_withdrawals?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      merchant_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency: string
          description: string
          id: string
          merchant_account_id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          vendor_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          merchant_account_id: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          vendor_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          merchant_account_id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          vendor_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_status: string | null
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_status?: string | null
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_status?: string | null
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          location_coords: Json | null
          session_id: string
          timestamp: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          location_coords?: Json | null
          session_id: string
          timestamp?: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          location_coords?: Json | null
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "navigation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_sessions: {
        Row: {
          actual_duration_minutes: number | null
          battery_level: number | null
          completion_status: string | null
          created_at: string
          destination_coords: Json
          device_info: Json | null
          distance_km: number | null
          driver_id: string
          duration_seconds: number | null
          ended_at: string | null
          estimated_duration_minutes: number | null
          geocoding_errors: Json | null
          id: string
          navigation_errors: Json | null
          network_type: string | null
          off_route_count: number | null
          order_id: string
          order_type: string
          pickup_coords: Json
          recalculations_count: number | null
          started_at: string
          status: string
          updated_at: string
          voice_instructions_count: number | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          battery_level?: number | null
          completion_status?: string | null
          created_at?: string
          destination_coords: Json
          device_info?: Json | null
          distance_km?: number | null
          driver_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          estimated_duration_minutes?: number | null
          geocoding_errors?: Json | null
          id?: string
          navigation_errors?: Json | null
          network_type?: string | null
          off_route_count?: number | null
          order_id: string
          order_type: string
          pickup_coords: Json
          recalculations_count?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          voice_instructions_count?: number | null
        }
        Update: {
          actual_duration_minutes?: number | null
          battery_level?: number | null
          completion_status?: string | null
          created_at?: string
          destination_coords?: Json
          device_info?: Json | null
          distance_km?: number | null
          driver_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          estimated_duration_minutes?: number | null
          geocoding_errors?: Json | null
          id?: string
          navigation_errors?: Json | null
          network_type?: string | null
          off_route_count?: number | null
          order_id?: string
          order_type?: string
          pickup_coords?: Json
          recalculations_count?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          voice_instructions_count?: number | null
        }
        Relationships: []
      }
      navigation_stats_daily: {
        Row: {
          avg_distance_km: number | null
          avg_duration_minutes: number | null
          avg_off_route_count: number | null
          avg_recalculations: number | null
          cancelled_sessions: number | null
          completed_sessions: number | null
          completion_rate: number | null
          created_at: string
          elevenlabs_calls: number | null
          error_sessions: number | null
          geocoding_success_rate: number | null
          google_geocoding_calls: number | null
          id: string
          stats_date: string
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          avg_distance_km?: number | null
          avg_duration_minutes?: number | null
          avg_off_route_count?: number | null
          avg_recalculations?: number | null
          cancelled_sessions?: number | null
          completed_sessions?: number | null
          completion_rate?: number | null
          created_at?: string
          elevenlabs_calls?: number | null
          error_sessions?: number | null
          geocoding_success_rate?: number | null
          google_geocoding_calls?: number | null
          id?: string
          stats_date: string
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          avg_distance_km?: number | null
          avg_duration_minutes?: number | null
          avg_off_route_count?: number | null
          avg_recalculations?: number | null
          cancelled_sessions?: number | null
          completed_sessions?: number | null
          completion_rate?: number | null
          created_at?: string
          elevenlabs_calls?: number | null
          error_sessions?: number | null
          geocoding_success_rate?: number | null
          google_geocoding_calls?: number | null
          id?: string
          stats_date?: string
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_campaign_history: {
        Row: {
          campaign_title: string
          clicked_count: number
          created_at: string
          delivered_count: number
          id: string
          message_content: string
          opened_count: number
          priority: string
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string
          sent_count: number
          status: string
          target_criteria: Json | null
          target_type: string
          updated_at: string
        }
        Insert: {
          campaign_title: string
          clicked_count?: number
          created_at?: string
          delivered_count?: number
          id?: string
          message_content: string
          opened_count?: number
          priority?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by: string
          sent_count?: number
          status?: string
          target_criteria?: Json | null
          target_type: string
          updated_at?: string
        }
        Update: {
          campaign_title?: string
          clicked_count?: number
          created_at?: string
          delivered_count?: number
          id?: string
          message_content?: string
          opened_count?: number
          priority?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string
          sent_count?: number
          status?: string
          target_criteria?: Json | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          chat_notifications: boolean | null
          created_at: string
          id: string
          marketing_emails: boolean | null
          order_updates: boolean | null
          product_updates: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_notifications?: boolean | null
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          order_updates?: boolean | null
          product_updates?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_notifications?: boolean | null
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          order_updates?: boolean | null
          product_updates?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          order_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          order_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          order_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      partenaires: {
        Row: {
          address: string
          admin_comments: string | null
          bank_account_number: string | null
          banner_image: string | null
          business_type: string
          city: string | null
          commission_rate: number | null
          company_address: string | null
          company_name: string
          company_phone: string | null
          company_registration_number: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          country: string | null
          created_at: string | null
          display_name: string
          email: string
          featured_until: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          license_number: string | null
          logo_url: string | null
          loyalty_points: number
          loyalty_tier: string
          opening_hours: Json | null
          partner_type: string | null
          phone: string | null
          phone_number: string
          primary_vehicle_category: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          service_areas: string[] | null
          shop_description: string | null
          slogan: string | null
          tax_number: string | null
          updated_at: string | null
          user_id: string
          verification_level: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address: string
          admin_comments?: string | null
          bank_account_number?: string | null
          banner_image?: string | null
          business_type: string
          city?: string | null
          commission_rate?: number | null
          company_address?: string | null
          company_name: string
          company_phone?: string | null
          company_registration_number?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          country?: string | null
          created_at?: string | null
          display_name: string
          email: string
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          opening_hours?: Json | null
          partner_type?: string | null
          phone?: string | null
          phone_number: string
          primary_vehicle_category?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          service_areas?: string[] | null
          shop_description?: string | null
          slogan?: string | null
          tax_number?: string | null
          updated_at?: string | null
          user_id: string
          verification_level?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          admin_comments?: string | null
          bank_account_number?: string | null
          banner_image?: string | null
          business_type?: string
          city?: string | null
          commission_rate?: number | null
          company_address?: string | null
          company_name?: string
          company_phone?: string | null
          company_registration_number?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          opening_hours?: Json | null
          partner_type?: string | null
          phone?: string | null
          phone_number?: string
          primary_vehicle_category?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          service_areas?: string[] | null
          shop_description?: string | null
          slogan?: string | null
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string
          verification_level?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_audit_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          partner_id: string
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          partner_id: string
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          partner_id?: string
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commission_tracking: {
        Row: {
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string | null
          currency: string
          driver_id: string
          id: string
          partner_id: string
          service_type: string
          updated_at: string | null
        }
        Insert: {
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          currency?: string
          driver_id: string
          id?: string
          partner_id: string
          service_type: string
          updated_at?: string | null
        }
        Update: {
          booking_amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          currency?: string
          driver_id?: string
          id?: string
          partner_id?: string
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_driver_requests: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string
          partner_id: string | null
          request_message: string | null
          responded_at: string | null
          response_message: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          partner_id?: string | null
          request_message?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          partner_id?: string | null
          request_message?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_driver_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_driver_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_service_preferences_legacy"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "partner_driver_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_status_unified"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_driver_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_driver_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_driver_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partner_drivers: {
        Row: {
          added_at: string
          commission_rate: number
          created_at: string
          driver_code: string
          driver_id: string
          id: string
          partner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          added_at?: string
          commission_rate?: number
          created_at?: string
          driver_code: string
          driver_id: string
          id?: string
          partner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          added_at?: string
          commission_rate?: number
          created_at?: string
          driver_code?: string
          driver_id?: string
          id?: string
          partner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_prize_claims: {
        Row: {
          admin_notes: string | null
          claimed_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_notes: string | null
          delivery_phone: string | null
          id: string
          lottery_win_id: string
          partner_prize_id: string
          processed_at: string | null
          processed_by: string | null
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          claimed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          delivery_phone?: string | null
          id?: string
          lottery_win_id: string
          partner_prize_id: string
          processed_at?: string | null
          processed_by?: string | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          claimed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          delivery_phone?: string | null
          id?: string
          lottery_win_id?: string
          partner_prize_id?: string
          processed_at?: string | null
          processed_by?: string | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_prize_claims_lottery_win_id_fkey"
            columns: ["lottery_win_id"]
            isOneToOne: false
            referencedRelation: "lottery_wins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_prize_claims_partner_prize_id_fkey"
            columns: ["partner_prize_id"]
            isOneToOne: false
            referencedRelation: "partner_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_prizes: {
        Row: {
          claim_instructions: string | null
          created_at: string | null
          currency: string | null
          delivery_instructions: string | null
          description: string | null
          distribution_probability: number | null
          estimated_value: number | null
          gallery_urls: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          partner_logo_url: string | null
          partner_name: string
          prize_type: string
          rarity_tier: string | null
          requires_delivery: boolean | null
          stock_quantity: number | null
          stock_unlimited: boolean | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          claim_instructions?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_instructions?: string | null
          description?: string | null
          distribution_probability?: number | null
          estimated_value?: number | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          partner_logo_url?: string | null
          partner_name: string
          prize_type?: string
          rarity_tier?: string | null
          requires_delivery?: boolean | null
          stock_quantity?: number | null
          stock_unlimited?: boolean | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          claim_instructions?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_instructions?: string | null
          description?: string | null
          distribution_probability?: number | null
          estimated_value?: number | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          partner_logo_url?: string | null
          partner_name?: string
          prize_type?: string
          rarity_tier?: string | null
          requires_delivery?: boolean | null
          stock_quantity?: number | null
          stock_unlimited?: boolean | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      partner_promotions: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          expires_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          partner_id: string
          plan_key: string
          promotion_type: string
          starts_at: string
          target_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          partner_id: string
          plan_key: string
          promotion_type: string
          starts_at?: string
          target_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          partner_id?: string
          plan_key?: string
          promotion_type?: string
          starts_at?: string
          target_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_promotions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_promotions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_promotions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_promotions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_promotions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_ratings: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          partner_id: string
          rating: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          partner_id: string
          rating: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          partner_id?: string
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_ratings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_ratings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_ratings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_ratings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_ratings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rental_bookings: {
        Row: {
          created_at: string
          end_date: string
          id: string
          partner_id: string
          start_date: string
          status: string
          total_price: number
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          partner_id: string
          start_date: string
          status?: string
          total_price?: number
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          partner_id?: string
          start_date?: string
          status?: string
          total_price?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rental_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_rental_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rental_followers: {
        Row: {
          created_at: string | null
          follower_id: string
          id: string
          partner_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          id?: string
          partner_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          id?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rental_followers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_followers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_followers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_followers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_rental_followers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rental_subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          partner_id: string
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          plan_id: string | null
          subscription_id: string | null
          transaction_reference: string | null
          updated_at: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          partner_id: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          plan_id?: string | null
          subscription_id?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          partner_id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          plan_id?: string | null
          subscription_id?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_rental_subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "rental_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rental_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          grace_period_end: string | null
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          partner_id: string
          payment_method: string | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          partner_id: string
          payment_method?: string | null
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          partner_id?: string
          payment_method?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rental_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "rental_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_subscriptions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_review_stats"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "partner_rental_subscriptions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rental_vehicles: {
        Row: {
          category_id: string | null
          created_at: string
          daily_rate: number
          id: string
          is_active: boolean
          license_plate: string | null
          location: string | null
          moderated_at: string | null
          moderation_status: string
          moderator_id: string | null
          partner_id: string
          rejection_reason: string | null
          updated_at: string
          vehicle_name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          daily_rate?: number
          id?: string
          is_active?: boolean
          license_plate?: string | null
          location?: string | null
          moderated_at?: string | null
          moderation_status?: string
          moderator_id?: string | null
          partner_id: string
          rejection_reason?: string | null
          updated_at?: string
          vehicle_name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          daily_rate?: number
          id?: string
          is_active?: boolean
          license_plate?: string | null
          location?: string | null
          moderated_at?: string | null
          moderation_status?: string
          moderator_id?: string | null
          partner_id?: string
          rejection_reason?: string | null
          updated_at?: string
          vehicle_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_security_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      partner_subscription_earnings: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          partner_commission_amount: number
          partner_commission_rate: number
          partner_id: string
          payment_date: string
          status: string
          subscription_amount: number
          subscription_id: string
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          partner_commission_amount: number
          partner_commission_rate?: number
          partner_id: string
          payment_date?: string
          status?: string
          subscription_amount: number
          subscription_id: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          partner_commission_amount?: number
          partner_commission_rate?: number
          partner_id?: string
          payment_date?: string
          status?: string
          subscription_amount?: number
          subscription_id?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscription_earnings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_earnings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_earnings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_earnings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_subscription_earnings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_earnings_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "driver_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_earnings_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_taxi_vehicles: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_driver_id: string | null
          brand: string
          chassis_number: string | null
          color: string | null
          created_at: string
          document_urls: Json | null
          id: string
          images: Json | null
          inspection_expiry: string | null
          insurance_expiry: string | null
          is_active: boolean
          is_available: boolean
          license_plate: string
          model: string
          moderation_status: string
          name: string
          owner_name: string | null
          owner_phone: string | null
          ownership_type: string
          partner_id: string
          rejection_reason: string | null
          seats: number
          updated_at: string
          vehicle_class: string
          year: number
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_driver_id?: string | null
          brand: string
          chassis_number?: string | null
          color?: string | null
          created_at?: string
          document_urls?: Json | null
          id?: string
          images?: Json | null
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          is_active?: boolean
          is_available?: boolean
          license_plate: string
          model: string
          moderation_status?: string
          name: string
          owner_name?: string | null
          owner_phone?: string | null
          ownership_type?: string
          partner_id: string
          rejection_reason?: string | null
          seats?: number
          updated_at?: string
          vehicle_class?: string
          year: number
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_driver_id?: string | null
          brand?: string
          chassis_number?: string | null
          color?: string | null
          created_at?: string
          document_urls?: Json | null
          id?: string
          images?: Json | null
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          is_active?: boolean
          is_available?: boolean
          license_plate?: string
          model?: string
          moderation_status?: string
          name?: string
          owner_name?: string | null
          owner_phone?: string | null
          ownership_type?: string
          partner_id?: string
          rejection_reason?: string | null
          seats?: number
          updated_at?: string
          vehicle_class?: string
          year?: number
        }
        Relationships: []
      }
      partner_withdrawals: {
        Row: {
          account_details: Json
          amount: number
          created_at: string | null
          currency: string
          id: string
          notes: string | null
          partner_id: string
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_details?: Json
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          partner_id: string
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_details?: Json
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          partner_id?: string
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          ip_address: unknown
          sensitive_data_accessed: Json | null
          target_payment_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_payment_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_payment_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string
          created_at: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          method_type: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          method_type: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          method_type?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          commission_rate: number
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          is_test_mode: boolean
          maximum_amount: number | null
          minimum_amount: number
          provider_config: Json
          provider_name: string
          supported_currencies: string[]
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          is_test_mode?: boolean
          maximum_amount?: number | null
          minimum_amount?: number
          provider_config?: Json
          provider_name: string
          supported_currencies?: string[]
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          is_test_mode?: boolean
          maximum_amount?: number | null
          minimum_amount?: number
          provider_config?: Json
          provider_name?: string
          supported_currencies?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string | null
          delivery_id: string | null
          id: string
          metadata: Json | null
          payment_method: string
          payment_provider: string | null
          product_id: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          delivery_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method: string
          payment_provider?: string | null
          product_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          delivery_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string
          payment_provider?: string | null
          product_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "transport_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      places_database: {
        Row: {
          accuracy: number | null
          address_components: Json | null
          aliases: string[] | null
          category: string
          city: string
          commune: string | null
          country_code: string
          created_at: string
          district: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean
          is_popular: boolean
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          name_fr: string
          name_local: string | null
          opening_hours: Json | null
          parent_id: string | null
          phone_number: string | null
          place_type: string
          popularity_score: number | null
          search_keywords: string[] | null
          search_vector: unknown
          services: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accuracy?: number | null
          address_components?: Json | null
          aliases?: string[] | null
          category?: string
          city?: string
          commune?: string | null
          country_code?: string
          created_at?: string
          district?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          name_fr: string
          name_local?: string | null
          opening_hours?: Json | null
          parent_id?: string | null
          phone_number?: string | null
          place_type?: string
          popularity_score?: number | null
          search_keywords?: string[] | null
          search_vector?: unknown
          services?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accuracy?: number | null
          address_components?: Json | null
          aliases?: string[] | null
          category?: string
          city?: string
          commune?: string | null
          country_code?: string
          created_at?: string
          district?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          name_fr?: string
          name_local?: string | null
          opening_hours?: Json | null
          parent_id?: string | null
          phone_number?: string | null
          place_type?: string
          popularity_score?: number | null
          search_keywords?: string[] | null
          search_vector?: unknown
          services?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_database_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "places_database"
            referencedColumns: ["id"]
          },
        ]
      }
      points_conversion_history: {
        Row: {
          bonus_percentage: number | null
          conversion_rate: number
          created_at: string | null
          credits_received: number
          id: string
          points_converted: number
          user_id: string
        }
        Insert: {
          bonus_percentage?: number | null
          conversion_rate?: number
          created_at?: string | null
          credits_received: number
          id?: string
          points_converted: number
          user_id: string
        }
        Update: {
          bonus_percentage?: number | null
          conversion_rate?: number
          created_at?: string | null
          credits_received?: number
          id?: string
          points_converted?: number
          user_id?: string
        }
        Relationships: []
      }
      pricing_configs: {
        Row: {
          active: boolean
          base_price: number
          city: string
          created_at: string
          currency: string
          id: string
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          service_type: string
          surge_multiplier: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          id?: string
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type: string
          surge_multiplier?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          id?: string
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_price: number
          city: string
          created_at: string
          currency: string
          free_waiting_time_minutes: number | null
          id: string
          is_active: boolean
          max_waiting_time_minutes: number | null
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          service_type: string
          surge_multiplier: number
          updated_at: string
          vehicle_class: string
          waiting_fee_per_minute: number | null
        }
        Insert: {
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          free_waiting_time_minutes?: number | null
          id?: string
          is_active?: boolean
          max_waiting_time_minutes?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
          vehicle_class?: string
          waiting_fee_per_minute?: number | null
        }
        Update: {
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          free_waiting_time_minutes?: number | null
          id?: string
          is_active?: boolean
          max_waiting_time_minutes?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
          vehicle_class?: string
          waiting_fee_per_minute?: number | null
        }
        Relationships: []
      }
      product_moderation_logs: {
        Row: {
          action: string
          admin_notes: string | null
          changes_made: Json | null
          created_at: string
          id: string
          moderator_id: string
          new_status: string
          previous_status: string | null
          product_id: string
        }
        Insert: {
          action: string
          admin_notes?: string | null
          changes_made?: Json | null
          created_at?: string
          id?: string
          moderator_id: string
          new_status: string
          previous_status?: string | null
          product_id: string
        }
        Update: {
          action?: string
          admin_notes?: string | null
          changes_made?: Json | null
          created_at?: string
          id?: string
          moderator_id?: string
          new_status?: string
          previous_status?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_moderation_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_qa: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string
          id: string
          product_id: string
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          id?: string
          product_id: string
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          id?: string
          product_id?: string
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_qa_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string | null
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reactions: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_type: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_type: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_type?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      product_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          product_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          product_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views_log: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          id: string
          ip_address: unknown
          sensitive_data_accessed: Json | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean | null
          is_verified_seller: boolean | null
          last_seen: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean | null
          is_verified_seller?: boolean | null
          last_seen?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean | null
          is_verified_seller?: boolean | null
          last_seen?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          currency: string
          discount_amount: number
          id: string
          order_id: string | null
          order_type: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          discount_amount: number
          id?: string
          order_id?: string | null
          order_type: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          currency?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          order_type?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_services: string[] | null
          code: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_published: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          scheduled_publish_at: string | null
          title: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
          user_limit: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_services?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          is_published?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          scheduled_publish_at?: string | null
          title: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_limit?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          applicable_services?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_published?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          scheduled_publish_at?: string | null
          title?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_limit?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      promo_compensation_config: {
        Row: {
          created_at: string
          discount_type: string
          id: string
          is_active: boolean
          max_rides_per_promo: number | null
          min_discount_threshold: number
          rides_per_amount: number
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean
          max_rides_per_promo?: number | null
          min_discount_threshold?: number
          rides_per_amount?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean
          max_rides_per_promo?: number | null
          min_discount_threshold?: number
          rides_per_amount?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_driver_compensations: {
        Row: {
          compensation_type: string
          created_at: string
          credited_at: string | null
          driver_id: string
          id: string
          metadata: Json | null
          order_id: string
          order_type: string
          promo_discount_amount: number
          promo_usage_id: string | null
          rides_credited: number
          status: string
          subscription_days_added: number | null
        }
        Insert: {
          compensation_type?: string
          created_at?: string
          credited_at?: string | null
          driver_id: string
          id?: string
          metadata?: Json | null
          order_id: string
          order_type: string
          promo_discount_amount: number
          promo_usage_id?: string | null
          rides_credited?: number
          status?: string
          subscription_days_added?: number | null
        }
        Update: {
          compensation_type?: string
          created_at?: string
          credited_at?: string | null
          driver_id?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          order_type?: string
          promo_discount_amount?: number
          promo_usage_id?: string | null
          rides_credited?: number
          status?: string
          subscription_days_added?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_driver_compensations_promo_usage_id_fkey"
            columns: ["promo_usage_id"]
            isOneToOne: false
            referencedRelation: "promo_code_usage"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_ads: {
        Row: {
          click_count: number | null
          created_at: string
          created_by: string | null
          cta_action: string
          cta_target: string | null
          cta_text: string
          description: string
          display_priority: number | null
          end_date: string | null
          id: string
          image_url: string | null
          impression_count: number | null
          is_active: boolean
          placement: string
          start_date: string
          target_user_types: string[] | null
          target_zones: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          cta_action: string
          cta_target?: string | null
          cta_text?: string
          description: string
          display_priority?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number | null
          is_active?: boolean
          placement?: string
          start_date?: string
          target_user_types?: string[] | null
          target_zones?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          cta_action?: string
          cta_target?: string | null
          cta_text?: string
          description?: string
          display_priority?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number | null
          is_active?: boolean
          placement?: string
          start_date?: string
          target_user_types?: string[] | null
          target_zones?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_messages: {
        Row: {
          audience_role: string | null
          audience_type: string
          body: string
          created_at: string
          data: Json | null
          error: string | null
          failure_count: number
          id: string
          sent_at: string | null
          sent_by: string
          status: string
          success_count: number
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          audience_role?: string | null
          audience_type: string
          body: string
          created_at?: string
          data?: Json | null
          error?: string | null
          failure_count?: number
          id?: string
          sent_at?: string | null
          sent_by: string
          status?: string
          success_count?: number
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          audience_role?: string | null
          audience_type?: string
          body?: string
          created_at?: string
          data?: Json | null
          error?: string | null
          failure_count?: number
          id?: string
          sent_at?: string | null
          sent_by?: string
          status?: string
          success_count?: number
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_notification_analytics: {
        Row: {
          created_at: string
          device_info: Json | null
          event_type: string
          id: string
          notification_data: Json | null
          notification_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_type: string
          id?: string
          notification_data?: Json | null
          notification_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_type?: string
          id?: string
          notification_data?: Json | null
          notification_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_notification_queue: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          error_message: string | null
          id: string
          max_retries: number
          metadata: Json | null
          priority: string
          processed_at: string | null
          recipients: string[]
          retry_count: number
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number
          metadata?: Json | null
          priority?: string
          processed_at?: string | null
          recipients: string[]
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number
          metadata?: Json | null
          priority?: string
          processed_at?: string | null
          recipients?: string[]
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          created_at: string
          device_id: string | null
          device_name: string | null
          id: string
          is_active: boolean
          last_used: string | null
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used?: string | null
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used?: string | null
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_sent: boolean
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          reference_id: string | null
          sent_at: string | null
          title: string
          transport_booking_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_sent?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          reference_id?: string | null
          sent_at?: string | null
          title: string
          transport_booking_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_sent?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          reference_id?: string | null
          sent_at?: string | null
          title?: string
          transport_booking_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notifications_transport_booking_id_fkey"
            columns: ["transport_booking_id"]
            isOneToOne: false
            referencedRelation: "transport_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          app_type: string
          created_at: string
          device_id: string | null
          device_model: string | null
          id: string
          language: string | null
          last_seen_at: string | null
          notifications_enabled: boolean
          os_version: string | null
          platform: string
          timezone: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_type: string
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          notifications_enabled?: boolean
          os_version?: string | null
          platform: string
          timezone?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_type?: string
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          notifications_enabled?: boolean
          os_version?: string | null
          platform?: string
          timezone?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      qr_code_scans: {
        Row: {
          channel_id: string
          city: string | null
          converted: boolean | null
          converted_at: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          referrer: string | null
          scanned_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          channel_id: string
          city?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          referrer?: string | null
          scanned_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          channel_id?: string
          city?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          referrer?: string | null
          scanned_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          ambassador_name: string | null
          ambassador_note: string | null
          bonus_per_referral: number | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_ambassador: boolean | null
          max_referrals: number | null
          referred_bonus: number | null
          service_type: string
          successful_referrals: number | null
          total_earnings: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          ambassador_name?: string | null
          ambassador_note?: string | null
          bonus_per_referral?: number | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_ambassador?: boolean | null
          max_referrals?: number | null
          referred_bonus?: number | null
          service_type: string
          successful_referrals?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          ambassador_name?: string | null
          ambassador_note?: string | null
          bonus_per_referral?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_ambassador?: boolean | null
          max_referrals?: number | null
          referred_bonus?: number | null
          service_type?: string
          successful_referrals?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string
          id: string
          referral_id: string
          referrer_id: string
          reward_amount: number
          reward_currency: string | null
          tier_level: string
          wallet_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referral_id: string
          referrer_id: string
          reward_amount: number
          reward_currency?: string | null
          tier_level: string
          wallet_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referral_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_currency?: string | null
          tier_level?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_system: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          referee_id: string
          referee_reward_amount: number | null
          referral_code: string
          referrer_id: string
          referrer_reward_amount: number | null
          rewarded_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          referee_id: string
          referee_reward_amount?: number | null
          referral_code: string
          referrer_id: string
          referrer_reward_amount?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          referee_id?: string
          referee_reward_amount?: number | null
          referral_code?: string
          referrer_id?: string
          referrer_reward_amount?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      referral_tracking: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          referral_code_id: string
          referred_bonus_amount: number | null
          referred_bonus_paid: boolean | null
          referred_completed_rides: number | null
          referred_id: string
          referrer_bonus_amount: number | null
          referrer_bonus_paid: boolean | null
          referrer_id: string
          status: string
          validation_threshold: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referral_code_id: string
          referred_bonus_amount?: number | null
          referred_bonus_paid?: boolean | null
          referred_completed_rides?: number | null
          referred_id: string
          referrer_bonus_amount?: number | null
          referrer_bonus_paid?: boolean | null
          referrer_id: string
          status?: string
          validation_threshold?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referral_code_id?: string
          referred_bonus_amount?: number | null
          referred_bonus_paid?: boolean | null
          referred_completed_rides?: number | null
          referred_id?: string
          referrer_bonus_amount?: number | null
          referrer_bonus_paid?: boolean | null
          referrer_id?: string
          status?: string
          validation_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completion_date: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referred_user_type: string | null
          referrer_id: string
          reward_given_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referred_user_type?: string | null
          referrer_id: string
          reward_given_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referred_user_type?: string | null
          referrer_id?: string
          reward_given_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_bookings: {
        Row: {
          additional_services: Json | null
          confirmed_at: string | null
          contract_signed: boolean
          created_at: string
          currency: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          deposit_percentage: number | null
          driver_choice: string | null
          driver_email: string | null
          driver_license: string | null
          driver_license_verified: boolean
          driver_name: string | null
          driver_phone: string | null
          end_date: string
          equipment_ids: string[] | null
          equipment_total: number | null
          id: string
          insurance_type: string | null
          payment_status: string
          picked_up_at: string | null
          pickup_coordinates: Json | null
          pickup_location: string
          remaining_amount: number | null
          rental_duration_type: string
          return_coordinates: Json | null
          return_location: string | null
          returned_at: string | null
          security_deposit: number
          special_requests: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          additional_services?: Json | null
          confirmed_at?: string | null
          contract_signed?: boolean
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          deposit_percentage?: number | null
          driver_choice?: string | null
          driver_email?: string | null
          driver_license?: string | null
          driver_license_verified?: boolean
          driver_name?: string | null
          driver_phone?: string | null
          end_date: string
          equipment_ids?: string[] | null
          equipment_total?: number | null
          id?: string
          insurance_type?: string | null
          payment_status?: string
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location: string
          remaining_amount?: number | null
          rental_duration_type: string
          return_coordinates?: Json | null
          return_location?: string | null
          returned_at?: string | null
          security_deposit?: number
          special_requests?: string | null
          start_date: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          additional_services?: Json | null
          confirmed_at?: string | null
          contract_signed?: boolean
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          deposit_percentage?: number | null
          driver_choice?: string | null
          driver_email?: string | null
          driver_license?: string | null
          driver_license_verified?: boolean
          driver_name?: string | null
          driver_phone?: string | null
          end_date?: string
          equipment_ids?: string[] | null
          equipment_total?: number | null
          id?: string
          insurance_type?: string | null
          payment_status?: string
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location?: string
          remaining_amount?: number | null
          rental_duration_type?: string
          return_coordinates?: Json | null
          return_location?: string | null
          returned_at?: string | null
          security_deposit?: number
          special_requests?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_review_stats"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_city_pricing: {
        Row: {
          base_delivery_fee: number | null
          category_id: string | null
          city: string
          created_at: string | null
          id: string
          multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          base_delivery_fee?: number | null
          category_id?: string | null
          city: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          base_delivery_fee?: number | null
          category_id?: string | null
          city?: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_city_pricing_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_equipment_pricing: {
        Row: {
          city: string
          created_at: string | null
          currency: string | null
          daily_rate: number | null
          equipment_type_id: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          weekly_rate: number | null
        }
        Insert: {
          city: string
          created_at?: string | null
          currency?: string | null
          daily_rate?: number | null
          equipment_type_id?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          weekly_rate?: number | null
        }
        Update: {
          city?: string
          created_at?: string | null
          currency?: string | null
          daily_rate?: number | null
          equipment_type_id?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          weekly_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_equipment_pricing_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_moderation_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          moderated_at: string
          moderator_id: string | null
          new_status: string
          previous_status: string | null
          rejection_reason: string | null
          vehicle_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderated_at?: string
          moderator_id?: string | null
          new_status: string
          previous_status?: string | null
          rejection_reason?: string | null
          vehicle_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderated_at?: string
          moderator_id?: string | null
          new_status?: string
          previous_status?: string | null
          rejection_reason?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_moderation_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_review_stats"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_moderation_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_partner_share_analytics: {
        Row: {
          created_at: string | null
          id: string
          partner_id: string
          share_type: string
          shared_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id: string
          share_type: string
          shared_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string
          share_type?: string
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_partner_share_analytics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_partner_share_analytics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_partner_share_analytics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_partner_share_analytics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "rental_partner_share_analytics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_payment_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          sensitive_data_accessed: Json | null
          target_payment_id: string
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          sensitive_data_accessed?: Json | null
          target_payment_id: string
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          sensitive_data_accessed?: Json | null
          target_payment_id?: string
        }
        Relationships: []
      }
      rental_reviews: {
        Row: {
          booking_id: string
          cleanliness_rating: number
          comment: string | null
          created_at: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string | null
          overall_rating: number | null
          photos: string[] | null
          reviewer_id: string
          reviewer_type: string
          service_rating: number
          updated_at: string | null
          vehicle_id: string
          vehicle_rating: number
        }
        Insert: {
          booking_id: string
          cleanliness_rating: number
          comment?: string | null
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          overall_rating?: number | null
          photos?: string[] | null
          reviewer_id: string
          reviewer_type: string
          service_rating: number
          updated_at?: string | null
          vehicle_id: string
          vehicle_rating: number
        }
        Update: {
          booking_id?: string
          cleanliness_rating?: number
          comment?: string | null
          created_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          overall_rating?: number | null
          photos?: string[] | null
          reviewer_id?: string
          reviewer_type?: string
          service_rating?: number
          updated_at?: string | null
          vehicle_id?: string
          vehicle_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_reviews_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_review_stats"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_reviews_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          partner_id: string
          payment_date: string | null
          payment_method: string
          phone_number: string | null
          provider: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          partner_id: string
          payment_date?: string | null
          payment_method?: string
          phone_number?: string | null
          provider?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          partner_id?: string
          payment_date?: string | null
          payment_method?: string
          phone_number?: string | null
          provider?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_subscription_plans: {
        Row: {
          analytics_access: boolean | null
          analytics_level: string | null
          api_access: boolean | null
          badge_type: string | null
          category_id: string | null
          created_at: string
          currency: string
          custom_banner: boolean | null
          custom_branding: boolean | null
          description: string | null
          featured_in_homepage: boolean | null
          featured_listing: boolean | null
          features: Json | null
          id: string
          is_active: boolean
          max_photos: number | null
          max_vehicles: number | null
          monthly_price: number
          name: string
          priority_level: number | null
          priority_support: boolean | null
          support_level: string | null
          support_response_time: string | null
          tier: string | null
          tier_name: string | null
          updated_at: string
          vehicle_category: string | null
          video_allowed: boolean | null
          visibility_boost: number | null
        }
        Insert: {
          analytics_access?: boolean | null
          analytics_level?: string | null
          api_access?: boolean | null
          badge_type?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          custom_banner?: boolean | null
          custom_branding?: boolean | null
          description?: string | null
          featured_in_homepage?: boolean | null
          featured_listing?: boolean | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_photos?: number | null
          max_vehicles?: number | null
          monthly_price?: number
          name: string
          priority_level?: number | null
          priority_support?: boolean | null
          support_level?: string | null
          support_response_time?: string | null
          tier?: string | null
          tier_name?: string | null
          updated_at?: string
          vehicle_category?: string | null
          video_allowed?: boolean | null
          visibility_boost?: number | null
        }
        Update: {
          analytics_access?: boolean | null
          analytics_level?: string | null
          api_access?: boolean | null
          badge_type?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          custom_banner?: boolean | null
          custom_branding?: boolean | null
          description?: string | null
          featured_in_homepage?: boolean | null
          featured_listing?: boolean | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_photos?: number | null
          max_vehicles?: number | null
          monthly_price?: number
          name?: string
          priority_level?: number | null
          priority_support?: boolean | null
          support_level?: string | null
          support_response_time?: string | null
          tier?: string | null
          tier_name?: string | null
          updated_at?: string
          vehicle_category?: string | null
          video_allowed?: boolean | null
          visibility_boost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_subscription_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_vehicle_categories: {
        Row: {
          base_price: number | null
          city: string | null
          color_class: string | null
          created_at: string
          description: string | null
          icon: string
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          priority: number | null
          recommended_price_range: Json | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          city?: string | null
          color_class?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          recommended_price_range?: Json | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          city?: string | null
          color_class?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          recommended_price_range?: Json | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rental_vehicles: {
        Row: {
          available_cities: string[] | null
          brand: string
          category_id: string
          city: string | null
          comfort_level: string | null
          created_at: string
          currency: string
          daily_rate: number
          driver_available: boolean | null
          driver_equipment: Json | null
          driver_required: boolean | null
          equipment: Json | null
          featured_until: string | null
          features: Json | null
          fuel_type: string
          has_hydraulic_lift: boolean | null
          has_refrigeration: boolean | null
          hourly_rate: number
          id: string
          images: Json | null
          is_active: boolean
          is_available: boolean
          is_featured: boolean | null
          license_plate: string
          loading_capacity_m3: number | null
          location_address: string | null
          location_coordinates: Json | null
          model: string
          moderated_at: string | null
          moderation_status: string | null
          moderator_id: string | null
          name: string
          partner_id: string | null
          partner_user_id: string | null
          rejection_reason: string | null
          seats: number
          security_deposit: number
          self_drive_allowed: boolean | null
          tonnage_max: number | null
          tonnage_min: number | null
          transmission: string
          truck_type: string | null
          updated_at: string
          vehicle_equipment: Json | null
          vehicle_type: string
          weekly_rate: number
          with_driver_daily_rate: number | null
          with_driver_hourly_rate: number | null
          with_driver_weekly_rate: number | null
          without_driver_daily_rate: number | null
          without_driver_hourly_rate: number | null
          without_driver_weekly_rate: number | null
          year: number
        }
        Insert: {
          available_cities?: string[] | null
          brand: string
          category_id: string
          city?: string | null
          comfort_level?: string | null
          created_at?: string
          currency?: string
          daily_rate?: number
          driver_available?: boolean | null
          driver_equipment?: Json | null
          driver_required?: boolean | null
          equipment?: Json | null
          featured_until?: string | null
          features?: Json | null
          fuel_type?: string
          has_hydraulic_lift?: boolean | null
          has_refrigeration?: boolean | null
          hourly_rate?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          is_featured?: boolean | null
          license_plate: string
          loading_capacity_m3?: number | null
          location_address?: string | null
          location_coordinates?: Json | null
          model: string
          moderated_at?: string | null
          moderation_status?: string | null
          moderator_id?: string | null
          name: string
          partner_id?: string | null
          partner_user_id?: string | null
          rejection_reason?: string | null
          seats?: number
          security_deposit?: number
          self_drive_allowed?: boolean | null
          tonnage_max?: number | null
          tonnage_min?: number | null
          transmission?: string
          truck_type?: string | null
          updated_at?: string
          vehicle_equipment?: Json | null
          vehicle_type: string
          weekly_rate?: number
          with_driver_daily_rate?: number | null
          with_driver_hourly_rate?: number | null
          with_driver_weekly_rate?: number | null
          without_driver_daily_rate?: number | null
          without_driver_hourly_rate?: number | null
          without_driver_weekly_rate?: number | null
          year: number
        }
        Update: {
          available_cities?: string[] | null
          brand?: string
          category_id?: string
          city?: string | null
          comfort_level?: string | null
          created_at?: string
          currency?: string
          daily_rate?: number
          driver_available?: boolean | null
          driver_equipment?: Json | null
          driver_required?: boolean | null
          equipment?: Json | null
          featured_until?: string | null
          features?: Json | null
          fuel_type?: string
          has_hydraulic_lift?: boolean | null
          has_refrigeration?: boolean | null
          hourly_rate?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          is_featured?: boolean | null
          license_plate?: string
          loading_capacity_m3?: number | null
          location_address?: string | null
          location_coordinates?: Json | null
          model?: string
          moderated_at?: string | null
          moderation_status?: string | null
          moderator_id?: string | null
          name?: string
          partner_id?: string | null
          partner_user_id?: string | null
          rejection_reason?: string | null
          seats?: number
          security_deposit?: number
          self_drive_allowed?: boolean | null
          tonnage_max?: number | null
          tonnage_min?: number | null
          transmission?: string
          truck_type?: string | null
          updated_at?: string
          vehicle_equipment?: Json | null
          vehicle_type?: string
          weekly_rate?: number
          with_driver_daily_rate?: number | null
          with_driver_hourly_rate?: number | null
          with_driver_weekly_rate?: number | null
          without_driver_daily_rate?: number | null
          without_driver_hourly_rate?: number | null
          without_driver_weekly_rate?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_vehicles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires_public_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "rental_vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_public_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          performed_by: string | null
          restaurant_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          restaurant_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_commission_config: {
        Row: {
          created_at: string | null
          default_commission_rate: number
          id: string
          max_commission_rate: number
          min_commission_rate: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          default_commission_rate?: number
          id?: string
          max_commission_rate?: number
          min_commission_rate?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          default_commission_rate?: number
          id?: string
          max_commission_rate?: number
          min_commission_rate?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      restaurant_custom_commission_rates: {
        Row: {
          created_at: string | null
          custom_commission_rate: number
          id: string
          reason: string | null
          restaurant_id: string
          set_by: string | null
        }
        Insert: {
          created_at?: string | null
          custom_commission_rate: number
          id?: string
          reason?: string | null
          restaurant_id: string
          set_by?: string | null
        }
        Update: {
          created_at?: string | null
          custom_commission_rate?: number
          id?: string
          reason?: string | null
          restaurant_id?: string
          set_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_custom_commission_rates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_custom_commission_rates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_daily_reports: {
        Row: {
          card_revenue: number | null
          cash_revenue: number | null
          created_at: string
          discounts_amount: number | null
          generated_at: string
          generated_by: string | null
          id: string
          mobile_money_revenue: number | null
          refunds_amount: number | null
          report_date: string
          restaurant_id: string
          top_selling_products: Json | null
          total_revenue: number | null
          total_transactions: number | null
          wallet_revenue: number | null
        }
        Insert: {
          card_revenue?: number | null
          cash_revenue?: number | null
          created_at?: string
          discounts_amount?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          mobile_money_revenue?: number | null
          refunds_amount?: number | null
          report_date: string
          restaurant_id: string
          top_selling_products?: Json | null
          total_revenue?: number | null
          total_transactions?: number | null
          wallet_revenue?: number | null
        }
        Update: {
          card_revenue?: number | null
          cash_revenue?: number | null
          created_at?: string
          discounts_amount?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          mobile_money_revenue?: number | null
          refunds_amount?: number | null
          report_date?: string
          restaurant_id?: string
          top_selling_products?: Json | null
          total_revenue?: number | null
          total_transactions?: number | null
          wallet_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_daily_reports_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_daily_reports_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_followers: {
        Row: {
          created_at: string | null
          follower_id: string
          id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          id?: string
          restaurant_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_followers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_followers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_inventory: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          last_restocked_at: string | null
          last_restocked_by: string | null
          low_stock_alert: boolean | null
          minimum_stock: number | null
          product_id: string
          restaurant_id: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          last_restocked_at?: string | null
          last_restocked_by?: string | null
          low_stock_alert?: boolean | null
          minimum_stock?: number | null
          product_id: string
          restaurant_id: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          last_restocked_at?: string | null
          last_restocked_by?: string | null
          low_stock_alert?: boolean | null
          minimum_stock?: number | null
          product_id?: string
          restaurant_id?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "food_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_inventory_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_inventory_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_pos_sessions: {
        Row: {
          cash_difference: number | null
          closed_at: string | null
          closed_by: string | null
          closing_cash: number | null
          created_at: string
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_cash: number
          restaurant_id: string
          status: string | null
          total_sales: number | null
          total_transactions: number | null
          updated_at: string
        }
        Insert: {
          cash_difference?: number | null
          closed_at?: string | null
          closed_by?: string | null
          closing_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_cash?: number
          restaurant_id: string
          status?: string | null
          total_sales?: number | null
          total_transactions?: number | null
          updated_at?: string
        }
        Update: {
          cash_difference?: number | null
          closed_at?: string | null
          closed_by?: string | null
          closing_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_cash?: number
          restaurant_id?: string
          status?: string | null
          total_sales?: number | null
          total_transactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_pos_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_pos_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_pos_transactions: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          discount_reason: string | null
          id: string
          items: Json
          notes: string | null
          payment_method: string
          payment_reference: string | null
          restaurant_id: string
          served_by: string
          session_id: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          transaction_number: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          restaurant_id: string
          served_by: string
          session_id: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_number: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          restaurant_id?: string
          served_by?: string
          session_id?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_pos_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_pos_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_pos_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "restaurant_pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_profiles: {
        Row: {
          address: string
          average_preparation_time: number | null
          banner_url: string | null
          business_name: string | null
          business_registration: string | null
          city: string
          commune: string | null
          coordinates: Json | null
          created_at: string
          cuisine_types: string[] | null
          delivery_zones: string[] | null
          description: string | null
          email: string
          health_certificate: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          minimum_order_amount: number | null
          opening_hours: Json | null
          payment_model: string
          phone_number: string
          quartier: string | null
          rating_average: number | null
          rating_count: number | null
          rejection_reason: string | null
          restaurant_name: string
          subscription_id: string | null
          subscription_status: string | null
          tax_number: string | null
          total_orders: number | null
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address: string
          average_preparation_time?: number | null
          banner_url?: string | null
          business_name?: string | null
          business_registration?: string | null
          city?: string
          commune?: string | null
          coordinates?: Json | null
          created_at?: string
          cuisine_types?: string[] | null
          delivery_zones?: string[] | null
          description?: string | null
          email: string
          health_certificate?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          minimum_order_amount?: number | null
          opening_hours?: Json | null
          payment_model?: string
          phone_number: string
          quartier?: string | null
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          restaurant_name: string
          subscription_id?: string | null
          subscription_status?: string | null
          tax_number?: string | null
          total_orders?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string
          average_preparation_time?: number | null
          banner_url?: string | null
          business_name?: string | null
          business_registration?: string | null
          city?: string
          commune?: string | null
          coordinates?: Json | null
          created_at?: string
          cuisine_types?: string[] | null
          delivery_zones?: string[] | null
          description?: string | null
          email?: string
          health_certificate?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          minimum_order_amount?: number | null
          opening_hours?: Json | null
          payment_model?: string
          phone_number?: string
          quartier?: string | null
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          restaurant_name?: string
          subscription_id?: string | null
          subscription_status?: string | null
          tax_number?: string | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["user_id"]
          },
        ]
      }
      restaurant_stock_movements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          inventory_id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          restaurant_id: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          inventory_id: string
          movement_type: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          restaurant_id: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          inventory_id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          restaurant_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "restaurant_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "food_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_stock_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_stock_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_subscription_plans: {
        Row: {
          can_feature_products: boolean | null
          can_run_promotions: boolean | null
          commission_rate: number | null
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          max_photos_per_product: number | null
          max_products: number | null
          monthly_price: number
          name: string
          priority_level: number | null
          updated_at: string
        }
        Insert: {
          can_feature_products?: boolean | null
          can_run_promotions?: boolean | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_photos_per_product?: number | null
          max_products?: number | null
          monthly_price: number
          name: string
          priority_level?: number | null
          updated_at?: string
        }
        Update: {
          can_feature_products?: boolean | null
          can_run_promotions?: boolean | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_photos_per_product?: number | null
          max_products?: number | null
          monthly_price?: number
          name?: string
          priority_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          end_date: string
          grace_period_end: string | null
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          payment_method: string
          plan_id: string
          restaurant_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          end_date: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method: string
          plan_id: string
          restaurant_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method?: string
          plan_id?: string
          restaurant_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "restaurant_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "v_public_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_commissions: {
        Row: {
          created_at: string | null
          driver_id: string
          driver_net_amount: number
          id: string
          kwenda_commission: number
          kwenda_rate: number
          paid_at: string | null
          partner_commission: number | null
          partner_id: string | null
          partner_rate: number | null
          payment_status: string | null
          ride_amount: number
          ride_id: string
          ride_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          driver_net_amount?: number
          id?: string
          kwenda_commission?: number
          kwenda_rate?: number
          paid_at?: string | null
          partner_commission?: number | null
          partner_id?: string | null
          partner_rate?: number | null
          payment_status?: string | null
          ride_amount?: number
          ride_id: string
          ride_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          driver_net_amount?: number
          id?: string
          kwenda_commission?: number
          kwenda_rate?: number
          paid_at?: string | null
          partner_commission?: number | null
          partner_id?: string | null
          partner_rate?: number | null
          payment_status?: string | null
          ride_amount?: number
          ride_id?: string
          ride_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ride_offers: {
        Row: {
          accepted_at: string | null
          booking_id: string | null
          client_proposal_price: number | null
          created_at: string
          distance_to_pickup: number | null
          driver_current_location: Json | null
          driver_id: string
          estimated_arrival_time: number | null
          expires_at: string | null
          id: string
          is_counter_offer: boolean | null
          message: string | null
          offered_price: number | null
          original_estimated_price: number | null
          ride_request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          booking_id?: string | null
          client_proposal_price?: number | null
          created_at?: string
          distance_to_pickup?: number | null
          driver_current_location?: Json | null
          driver_id: string
          estimated_arrival_time?: number | null
          expires_at?: string | null
          id?: string
          is_counter_offer?: boolean | null
          message?: string | null
          offered_price?: number | null
          original_estimated_price?: number | null
          ride_request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          booking_id?: string | null
          client_proposal_price?: number | null
          created_at?: string
          distance_to_pickup?: number | null
          driver_current_location?: Json | null
          driver_id?: string
          estimated_arrival_time?: number | null
          expires_at?: string | null
          id?: string
          is_counter_offer?: boolean | null
          message?: string | null
          offered_price?: number | null
          original_estimated_price?: number | null
          ride_request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "transport_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          acceptance_time: string | null
          assigned_driver_id: string | null
          cancellation_reason: string | null
          cancellation_time: string | null
          completion_time: string | null
          created_at: string
          customer_boarded_at: string | null
          destination: string
          destination_coordinates: Json
          destination_zone_id: string | null
          dispatch_time: string | null
          driver_arrived_at: string | null
          estimated_price: number | null
          final_price: number | null
          id: string
          pickup_coordinates: Json
          pickup_location: string
          pickup_time: string | null
          pickup_zone_id: string | null
          request_time: string
          status: string
          surge_price: number | null
          updated_at: string
          user_id: string
          vehicle_class: string
          waiting_fee_amount: number | null
          waiting_time_minutes: number | null
        }
        Insert: {
          acceptance_time?: string | null
          assigned_driver_id?: string | null
          cancellation_reason?: string | null
          cancellation_time?: string | null
          completion_time?: string | null
          created_at?: string
          customer_boarded_at?: string | null
          destination: string
          destination_coordinates: Json
          destination_zone_id?: string | null
          dispatch_time?: string | null
          driver_arrived_at?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          pickup_coordinates: Json
          pickup_location: string
          pickup_time?: string | null
          pickup_zone_id?: string | null
          request_time?: string
          status?: string
          surge_price?: number | null
          updated_at?: string
          user_id: string
          vehicle_class?: string
          waiting_fee_amount?: number | null
          waiting_time_minutes?: number | null
        }
        Update: {
          acceptance_time?: string | null
          assigned_driver_id?: string | null
          cancellation_reason?: string | null
          cancellation_time?: string | null
          completion_time?: string | null
          created_at?: string
          customer_boarded_at?: string | null
          destination?: string
          destination_coordinates?: Json
          destination_zone_id?: string | null
          dispatch_time?: string | null
          driver_arrived_at?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          pickup_coordinates?: Json
          pickup_location?: string
          pickup_time?: string | null
          pickup_zone_id?: string | null
          request_time?: string
          status?: string
          surge_price?: number | null
          updated_at?: string
          user_id?: string
          vehicle_class?: string
          waiting_fee_amount?: number | null
          waiting_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_destination_zone_id_fkey"
            columns: ["destination_zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_pickup_zone_id_fkey"
            columns: ["pickup_zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          created_at: string
          id: string
          is_active: boolean
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          created_at?: string
          id?: string
          is_active?: boolean
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          created_at?: string
          id?: string
          is_active?: boolean
          permission?: Database["public"]["Enums"]["permission"]
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address_line: string
          address_type: string | null
          city: string
          commune: string | null
          coordinates: Json | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          last_used_at: string | null
          quartier: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          address_line: string
          address_type?: string | null
          city?: string
          commune?: string | null
          coordinates?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          last_used_at?: string | null
          quartier?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          address_line?: string
          address_type?: string | null
          city?: string
          commune?: string | null
          coordinates?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          last_used_at?: string | null
          quartier?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      scratch_card_pity_tracker: {
        Row: {
          active_multiplier: number | null
          commons_streak: number | null
          created_at: string | null
          guaranteed_epic_at: number | null
          guaranteed_legendary_at: number | null
          guaranteed_rare_at: number | null
          id: string
          last_epic_at: string | null
          last_legendary_at: string | null
          last_rare_at: string | null
          multiplier_expires_at: string | null
          total_scratched: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_multiplier?: number | null
          commons_streak?: number | null
          created_at?: string | null
          guaranteed_epic_at?: number | null
          guaranteed_legendary_at?: number | null
          guaranteed_rare_at?: number | null
          id?: string
          last_epic_at?: string | null
          last_legendary_at?: string | null
          last_rare_at?: string | null
          multiplier_expires_at?: string | null
          total_scratched?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_multiplier?: number | null
          commons_streak?: number | null
          created_at?: string | null
          guaranteed_epic_at?: number | null
          guaranteed_legendary_at?: number | null
          guaranteed_rare_at?: number | null
          id?: string
          last_epic_at?: string | null
          last_legendary_at?: string | null
          last_rare_at?: string | null
          multiplier_expires_at?: string | null
          total_scratched?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          risk_level: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          risk_level?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          risk_level?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_definer_views_audit: {
        Row: {
          detected_at: string | null
          id: string
          remediated: boolean | null
          remediation_notes: string | null
          view_definition: string | null
          view_name: string
        }
        Insert: {
          detected_at?: string | null
          id?: string
          remediated?: boolean | null
          remediation_notes?: string | null
          view_definition?: string | null
          view_name: string
        }
        Update: {
          detected_at?: string | null
          id?: string
          remediated?: boolean | null
          remediation_notes?: string | null
          view_definition?: string | null
          view_name?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string
          id: string
          profile_image_url: string | null
          rating_average: number | null
          rating_count: number | null
          seller_badge_level: string | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
          verified_seller: boolean | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          profile_image_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_badge_level?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
          verified_seller?: boolean | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          profile_image_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_badge_level?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
          verified_seller?: boolean | null
        }
        Relationships: []
      }
      seller_verification_requests: {
        Row: {
          business_documents: Json | null
          business_name: string | null
          business_type: string | null
          created_at: string | null
          id: string
          id_document_url: string | null
          proof_of_address_url: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          updated_at: string | null
          user_id: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          business_documents?: Json | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          id?: string
          id_document_url?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          business_documents?: Json | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          id?: string
          id_document_url?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      sensitive_access_audit: {
        Row: {
          access_reason: string | null
          accessed_by: string
          created_at: string | null
          data_accessed: Json | null
          error_message: string | null
          id: string
          ip_address: unknown
          operation: string
          success: boolean | null
          table_name: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          accessed_by: string
          created_at?: string | null
          data_accessed?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          operation: string
          success?: boolean | null
          table_name: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          accessed_by?: string
          created_at?: string | null
          data_accessed?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          operation?: string
          success?: boolean | null
          table_name?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      sensitive_data_access_audit: {
        Row: {
          accessed_user_data: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_user_data?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_user_data?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensitive_data_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          accessed_columns: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          target_record_id: string | null
          target_table: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          accessed_columns?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          target_record_id?: string | null
          target_table: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          accessed_columns?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          target_record_id?: string | null
          target_table?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      service_change_requests: {
        Row: {
          created_at: string
          current_service_type: string
          driver_id: string
          id: string
          justification_documents: Json | null
          reason: string | null
          requested_at: string
          requested_service_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_comments: string | null
          service_category: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_service_type: string
          driver_id: string
          id?: string
          justification_documents?: Json | null
          reason?: string | null
          requested_at?: string
          requested_service_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comments?: string | null
          service_category: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_service_type?: string
          driver_id?: string
          id?: string
          justification_documents?: Json | null
          reason?: string | null
          requested_at?: string
          requested_service_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comments?: string | null
          service_category?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_configurations: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean
          requirements: Json | null
          service_category: string
          service_status: string
          service_type: string
          sort_order: number | null
          updated_at: string
          vehicle_requirements: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          service_category: string
          service_status?: string
          service_type: string
          sort_order?: number | null
          updated_at?: string
          vehicle_requirements?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          service_category?: string
          service_status?: string
          service_type?: string
          sort_order?: number | null
          updated_at?: string
          vehicle_requirements?: Json | null
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          base_price: number
          city: string
          commission_rate: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          price_per_minute: number | null
          service_category: string
          service_type: string
          surge_multiplier: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          base_price?: number
          city?: string
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number | null
          service_category: string
          service_type: string
          surge_multiplier?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          base_price?: number
          city?: string
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number | null
          service_category?: string
          service_type?: string
          surge_multiplier?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      service_zones: {
        Row: {
          base_price_multiplier: number
          city: string
          coordinates: Json
          country_code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          maintenance_end: string | null
          maintenance_start: string | null
          metadata: Json | null
          name: string
          status: string | null
          surge_multiplier: number
          updated_at: string
          updated_by: string | null
          zone_type: string
        }
        Insert: {
          base_price_multiplier?: number
          city?: string
          coordinates: Json
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          maintenance_end?: string | null
          maintenance_start?: string | null
          metadata?: Json | null
          name: string
          status?: string | null
          surge_multiplier?: number
          updated_at?: string
          updated_by?: string | null
          zone_type?: string
        }
        Update: {
          base_price_multiplier?: number
          city?: string
          coordinates?: Json
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          maintenance_end?: string | null
          maintenance_start?: string | null
          metadata?: Json | null
          name?: string
          status?: string | null
          surge_multiplier?: number
          updated_at?: string
          updated_by?: string | null
          zone_type?: string
        }
        Relationships: []
      }
      subscription_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string | null
          id: string
          is_acknowledged: boolean | null
          is_sent: boolean | null
          message: string
          metadata: Json | null
          sent_at: string | null
          severity: string
          subscription_id: string
          subscription_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_sent?: boolean | null
          message: string
          metadata?: Json | null
          sent_at?: string | null
          severity?: string
          subscription_id: string
          subscription_type: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_sent?: boolean | null
          message?: string
          metadata?: Json | null
          sent_at?: string | null
          severity?: string
          subscription_id?: string
          subscription_type?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          commission_rate: number | null
          created_at: string
          currency: string
          description: string | null
          duration_type: string
          features: Json
          id: string
          is_active: boolean
          is_trial: boolean | null
          max_rides_per_day: number | null
          name: string
          price: number
          price_per_extra_ride: number | null
          priority_level: number
          rides_included: number
          service_type: string | null
          trial_duration_days: number | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_type: string
          features?: Json
          id?: string
          is_active?: boolean
          is_trial?: boolean | null
          max_rides_per_day?: number | null
          name: string
          price: number
          price_per_extra_ride?: number | null
          priority_level?: number
          rides_included?: number
          service_type?: string | null
          trial_duration_days?: number | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_type?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_trial?: boolean | null
          max_rides_per_day?: number | null
          name?: string
          price?: number
          price_per_extra_ride?: number | null
          priority_level?: number
          rides_included?: number
          service_type?: string | null
          trial_duration_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_renewal_history: {
        Row: {
          amount_charged: number | null
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          new_end_date: string
          next_retry_at: string | null
          old_end_date: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          renewal_date: string | null
          retry_count: number | null
          subscription_id: string
          subscription_type: string
          updated_at: string | null
        }
        Insert: {
          amount_charged?: number | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          new_end_date: string
          next_retry_at?: string | null
          old_end_date: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          renewal_date?: string | null
          retry_count?: number | null
          subscription_id: string
          subscription_type: string
          updated_at?: string | null
        }
        Update: {
          amount_charged?: number | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          new_end_date?: string
          next_retry_at?: string | null
          old_end_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          renewal_date?: string | null
          retry_count?: number | null
          subscription_id?: string
          subscription_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_ride_logs: {
        Row: {
          booking_id: string | null
          booking_type: string | null
          created_at: string | null
          driver_id: string
          extra_charge: number | null
          id: string
          rides_after: number
          rides_before: number
          subscription_id: string
        }
        Insert: {
          booking_id?: string | null
          booking_type?: string | null
          created_at?: string | null
          driver_id: string
          extra_charge?: number | null
          id?: string
          rides_after: number
          rides_before: number
          subscription_id: string
        }
        Update: {
          booking_id?: string | null
          booking_type?: string | null
          created_at?: string | null
          driver_id?: string
          extra_charge?: number | null
          id?: string
          rides_after?: number
          rides_before?: number
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_ride_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "driver_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      super_lottery_draws: {
        Row: {
          created_at: string | null
          description: string | null
          draw_date: string
          entry_cost_points: number | null
          id: string
          max_entries: number | null
          name: string
          prize_pool: Json | null
          status: string | null
          updated_at: string | null
          winner_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          draw_date: string
          entry_cost_points?: number | null
          id?: string
          max_entries?: number | null
          name: string
          prize_pool?: Json | null
          status?: string | null
          updated_at?: string | null
          winner_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          draw_date?: string
          entry_cost_points?: number | null
          id?: string
          max_entries?: number | null
          name?: string
          prize_pool?: Json | null
          status?: string | null
          updated_at?: string | null
          winner_ids?: string[] | null
        }
        Relationships: []
      }
      super_lottery_entries: {
        Row: {
          created_at: string | null
          draw_id: string
          entry_number: string
          id: string
          points_spent: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          draw_id: string
          entry_number: string
          id?: string
          points_spent: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          draw_id?: string
          entry_number?: string
          id?: string
          points_spent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_lottery_entries_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "super_lottery_draws"
            referencedColumns: ["id"]
          },
        ]
      }
      support_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "enhanced_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          is_system_wide: boolean
          message: string
          notification_type: string
          priority: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_system_wide?: boolean
          message: string
          notification_type: string
          priority?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_system_wide?: boolean
          message?: string
          notification_type?: string
          priority?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
          unit: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
          unit?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      team_accounts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          invited_at: string
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_requests: {
        Row: {
          company_name: string
          contact_email: string
          created_at: string
          id: string
          industry: string | null
          metadata: Json | null
          phone: string | null
          rejection_reason: string | null
          request_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          contact_email: string
          created_at?: string
          id?: string
          industry?: string | null
          metadata?: Json | null
          phone?: string | null
          rejection_reason?: string | null
          request_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          created_at?: string
          id?: string
          industry?: string | null
          metadata?: Json | null
          phone?: string | null
          rejection_reason?: string | null
          request_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transport_bookings: {
        Row: {
          actual_price: number | null
          assigned_driver_id: string | null
          assignment_version: number
          beneficiary_id: string | null
          beneficiary_instructions: string | null
          beneficiary_name: string | null
          beneficiary_phone: string | null
          bidding_closes_at: string | null
          bidding_mode: boolean | null
          booked_for_other: boolean | null
          booking_time: string
          cancellation_reason: string | null
          cancellation_type: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          city: string | null
          client_proposed_price: number | null
          completed_at: string | null
          completion_time: string | null
          created_at: string
          delivery_google_address: string | null
          delivery_google_place_id: string | null
          delivery_google_place_name: string | null
          destination: string
          destination_coordinates: Json | null
          destination_google_address: string | null
          destination_google_place_id: string | null
          destination_google_place_name: string | null
          driver_arrived_at: string | null
          driver_assigned_at: string | null
          driver_id: string | null
          estimated_price: number | null
          google_geocoded_at: string | null
          id: string
          intermediate_stops: Json | null
          notes: string | null
          offer_count: number | null
          pickup_coordinates: Json | null
          pickup_google_address: string | null
          pickup_google_place_id: string | null
          pickup_google_place_name: string | null
          pickup_location: string
          pickup_time: string | null
          rated: boolean | null
          status: string | null
          surge_multiplier: number | null
          total_distance: number | null
          total_duration: number | null
          trip_started_at: string | null
          updated_at: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          actual_price?: number | null
          assigned_driver_id?: string | null
          assignment_version?: number
          beneficiary_id?: string | null
          beneficiary_instructions?: string | null
          beneficiary_name?: string | null
          beneficiary_phone?: string | null
          bidding_closes_at?: string | null
          bidding_mode?: boolean | null
          booked_for_other?: boolean | null
          booking_time?: string
          cancellation_reason?: string | null
          cancellation_type?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string | null
          client_proposed_price?: number | null
          completed_at?: string | null
          completion_time?: string | null
          created_at?: string
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          destination: string
          destination_coordinates?: Json | null
          destination_google_address?: string | null
          destination_google_place_id?: string | null
          destination_google_place_name?: string | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          intermediate_stops?: Json | null
          notes?: string | null
          offer_count?: number | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location: string
          pickup_time?: string | null
          rated?: boolean | null
          status?: string | null
          surge_multiplier?: number | null
          total_distance?: number | null
          total_duration?: number | null
          trip_started_at?: string | null
          updated_at?: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          actual_price?: number | null
          assigned_driver_id?: string | null
          assignment_version?: number
          beneficiary_id?: string | null
          beneficiary_instructions?: string | null
          beneficiary_name?: string | null
          beneficiary_phone?: string | null
          bidding_closes_at?: string | null
          bidding_mode?: boolean | null
          booked_for_other?: boolean | null
          booking_time?: string
          cancellation_reason?: string | null
          cancellation_type?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string | null
          client_proposed_price?: number | null
          completed_at?: string | null
          completion_time?: string | null
          created_at?: string
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          destination?: string
          destination_coordinates?: Json | null
          destination_google_address?: string | null
          destination_google_place_id?: string | null
          destination_google_place_name?: string | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          intermediate_stops?: Json | null
          notes?: string | null
          offer_count?: number | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location?: string
          pickup_time?: string | null
          rated?: boolean | null
          status?: string | null
          surge_multiplier?: number | null
          total_distance?: number | null
          total_duration?: number | null
          trip_started_at?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_bookings_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "booking_beneficiaries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_chat_messages: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          message: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          sender_type: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          sent_at?: string | null
        }
        Relationships: []
      }
      trip_messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      trip_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          encrypted_data: string
          expires_at: string
          id: string
          is_active: boolean
          share_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          encrypted_data: string
          expires_at: string
          id?: string
          is_active?: boolean
          share_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          encrypted_data?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          share_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      unified_conversations: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string
          deleted_by_participant_1: boolean | null
          deleted_by_participant_2: boolean | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          participant_1: string
          participant_2: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          context_id?: string | null
          context_type: string
          created_at?: string
          deleted_by_participant_1?: boolean | null
          deleted_by_participant_2?: boolean | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          participant_1: string
          participant_2: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          deleted_by_participant_1?: boolean | null
          deleted_by_participant_2?: boolean | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          participant_1?: string
          participant_2?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unified_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unified_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "unified_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_notifications: {
        Row: {
          category: string
          channels: string[]
          correlation_id: string | null
          created_at: string
          data: Json | null
          delivered_at: string | null
          delivery_status: Json
          expires_at: string | null
          id: string
          is_read: boolean
          max_retries: number
          message: string
          next_retry_at: string | null
          notification_type: string
          priority: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          sent_at: string | null
          source_event: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          channels?: string[]
          correlation_id?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          delivery_status?: Json
          expires_at?: string | null
          id?: string
          is_read?: boolean
          max_retries?: number
          message: string
          next_retry_at?: string | null
          notification_type: string
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          sent_at?: string | null
          source_event?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          channels?: string[]
          correlation_id?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          delivery_status?: Json
          expires_at?: string | null
          id?: string
          is_read?: boolean
          max_retries?: number
          message?: string
          next_retry_at?: string | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          sent_at?: string | null
          source_event?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          linked_email: string
          primary_user_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          linked_email: string
          primary_user_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          linked_email?: string
          primary_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          metadata: Json | null
          source: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_engagement: {
        Row: {
          app_opens: number | null
          created_at: string | null
          has_rated: boolean | null
          id: string
          last_review_request: string | null
          never_ask_again: boolean | null
          total_orders: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_opens?: number | null
          created_at?: string | null
          has_rated?: boolean | null
          id?: string
          last_review_request?: string | null
          never_ask_again?: boolean | null
          total_orders?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_opens?: number | null
          created_at?: string | null
          has_rated?: boolean | null
          id?: string
          last_review_request?: string | null
          never_ask_again?: boolean | null
          total_orders?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_gratta_stats: {
        Row: {
          active_cards: number | null
          cards_scratched: number | null
          consecutive_days: number | null
          created_at: string | null
          last_scratch_date: string | null
          longest_streak: number | null
          mega_cards: number | null
          rare_cards: number | null
          standard_cards: number | null
          total_xp_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_cards?: number | null
          cards_scratched?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          last_scratch_date?: string | null
          longest_streak?: number | null
          mega_cards?: number | null
          rare_cards?: number | null
          standard_cards?: number | null
          total_xp_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_cards?: number | null
          cards_scratched?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          last_scratch_date?: string | null
          longest_streak?: number | null
          mega_cards?: number | null
          rare_cards?: number | null
          standard_cards?: number | null
          total_xp_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_location_preferences: {
        Row: {
          auto_save_favorites: boolean | null
          created_at: string | null
          id: string
          location_sharing: boolean | null
          preferred_city: string | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_save_favorites?: boolean | null
          created_at?: string | null
          id?: string
          location_sharing?: boolean | null
          preferred_city?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_save_favorites?: boolean | null
          created_at?: string | null
          id?: string
          location_sharing?: boolean | null
          preferred_city?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_lottery_badges: {
        Row: {
          badge_description: string | null
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_loyalty_points: {
        Row: {
          created_at: string
          current_points: number
          id: string
          loyalty_level: string
          total_earned_points: number
          total_spent_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_points?: number
          id?: string
          loyalty_level?: string
          total_earned_points?: number
          total_spent_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_points?: number
          id?: string
          loyalty_level?: string
          total_earned_points?: number
          total_spent_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_logs: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          priority: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          chat_messages: boolean
          created_at: string
          delivery_updates: boolean
          digest_frequency: string
          driver_updates: boolean
          id: string
          marketplace_updates: boolean
          payment_alerts: boolean
          priority_only: boolean
          promotions: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          ride_updates: boolean
          sound_enabled: boolean
          system_alerts: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
        }
        Insert: {
          chat_messages?: boolean
          created_at?: string
          delivery_updates?: boolean
          digest_frequency?: string
          driver_updates?: boolean
          id?: string
          marketplace_updates?: boolean
          payment_alerts?: boolean
          priority_only?: boolean
          promotions?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          ride_updates?: boolean
          sound_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
        }
        Update: {
          chat_messages?: boolean
          created_at?: string
          delivery_updates?: boolean
          digest_frequency?: string
          driver_updates?: boolean
          id?: string
          marketplace_updates?: boolean
          payment_alerts?: boolean
          priority_only?: boolean
          promotions?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          ride_updates?: boolean
          sound_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          admin_notification_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          priority: string
          read_at: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          admin_notification_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          admin_notification_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_places: {
        Row: {
          address: string
          coordinates: Json | null
          created_at: string
          id: string
          last_used: string
          name: string
          place_type: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          address: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          last_used?: string
          name: string
          place_type?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          address?: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          last_used?: string
          name?: string
          place_type?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          app_theme: string
          auto_save_addresses: boolean
          created_at: string
          currency: string
          default_payment_method: string | null
          id: string
          language: string
          notification_dnd_end_time: string | null
          notification_dnd_start_time: string | null
          notification_do_not_disturb: boolean | null
          notification_duration: number | null
          notification_position: string | null
          notification_preferences: Json
          notification_sound_enabled: boolean | null
          notification_sound_volume: number | null
          notification_toast_enabled: boolean | null
          notification_types_enabled: Json | null
          share_location: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_theme?: string
          auto_save_addresses?: boolean
          created_at?: string
          currency?: string
          default_payment_method?: string | null
          id?: string
          language?: string
          notification_dnd_end_time?: string | null
          notification_dnd_start_time?: string | null
          notification_do_not_disturb?: boolean | null
          notification_duration?: number | null
          notification_position?: string | null
          notification_preferences?: Json
          notification_sound_enabled?: boolean | null
          notification_sound_volume?: number | null
          notification_toast_enabled?: boolean | null
          notification_types_enabled?: Json | null
          share_location?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_theme?: string
          auto_save_addresses?: boolean
          created_at?: string
          currency?: string
          default_payment_method?: string | null
          id?: string
          language?: string
          notification_dnd_end_time?: string | null
          notification_dnd_start_time?: string | null
          notification_do_not_disturb?: boolean | null
          notification_duration?: number | null
          notification_position?: string | null
          notification_preferences?: Json
          notification_sound_enabled?: boolean | null
          notification_sound_volume?: number | null
          notification_toast_enabled?: boolean | null
          notification_types_enabled?: Json | null
          share_location?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          delivery_id: string | null
          id: string
          marketplace_order_id: string | null
          rated_user_id: string
          rater_user_id: string
          rating: number
          rating_context: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          marketplace_order_id?: string | null
          rated_user_id: string
          rater_user_id: string
          rating: number
          rating_context?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          marketplace_order_id?: string | null
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          rating_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_marketplace_order_id_fkey"
            columns: ["marketplace_order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recent_searches: {
        Row: {
          created_at: string | null
          id: string
          last_searched_at: string | null
          result_address: string | null
          result_latitude: number | null
          result_longitude: number | null
          search_count: number | null
          search_query: string
          selected: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_searched_at?: string | null
          result_address?: string | null
          result_latitude?: number | null
          result_longitude?: number | null
          search_count?: number | null
          search_query: string
          selected?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_searched_at?: string | null
          result_address?: string | null
          result_latitude?: number | null
          result_longitude?: number | null
          search_count?: number | null
          search_query?: string
          selected?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_referral_codes: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_claimed: boolean
          points_required: number | null
          promo_code_id: string | null
          reward_type: string
          reward_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean
          points_required?: number | null
          promo_code_id?: string | null
          reward_type: string
          reward_value?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean
          points_required?: number | null
          promo_code_id?: string | null
          reward_type?: string
          reward_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          assigned_at: string
          assigned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_saved_places: {
        Row: {
          address: string
          created_at: string | null
          id: string
          last_used_at: string | null
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          place_type: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          place_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          place_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          created_at: string
          data_sharing_consent: boolean
          id: string
          location_tracking: boolean
          login_notifications: boolean
          marketing_consent: boolean
          privacy_mode: boolean
          transaction_notifications: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_sharing_consent?: boolean
          id?: string
          location_tracking?: boolean
          login_notifications?: boolean
          marketing_consent?: boolean
          privacy_mode?: boolean
          transaction_notifications?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_sharing_consent?: boolean
          id?: string
          location_tracking?: boolean
          login_notifications?: boolean
          marketing_consent?: boolean
          privacy_mode?: boolean
          transaction_notifications?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          currency: string
          dark_mode: boolean
          email_notifications: boolean
          id: string
          language: string
          location_sharing: boolean
          notifications_enabled: boolean
          push_notifications: boolean
          sms_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          id?: string
          language?: string
          location_sharing?: boolean
          notifications_enabled?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          id?: string
          language?: string
          location_sharing?: boolean
          notifications_enabled?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_suggestions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          message: string
          user_id: string
          user_type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          message: string
          user_id: string
          user_type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      user_verification: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          identity_document_url: string | null
          identity_verified: boolean | null
          phone_verified: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_level: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          identity_document_url?: string | null
          identity_verified?: boolean | null
          phone_verified?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verification_level?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          identity_document_url?: string | null
          identity_verified?: boolean | null
          phone_verified?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verification_level?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_verification_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number
          bonus_balance: number | null
          created_at: string
          currency: string
          ecosystem_credits: number
          id: string
          is_active: boolean
          kwenda_points: number | null
          scratch_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bonus_balance?: number | null
          created_at?: string
          currency?: string
          ecosystem_credits?: number
          id?: string
          is_active?: boolean
          kwenda_points?: number | null
          scratch_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bonus_balance?: number | null
          created_at?: string
          currency?: string
          ecosystem_credits?: number
          id?: string
          is_active?: boolean
          kwenda_points?: number | null
          scratch_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      validation_history: {
        Row: {
          action: string
          comments: string | null
          created_at: string
          id: string
          request_id: string
          validation_type: string
          validator_id: string
        }
        Insert: {
          action: string
          comments?: string | null
          created_at?: string
          id?: string
          request_id: string
          validation_type: string
          validator_id: string
        }
        Update: {
          action?: string
          comments?: string | null
          created_at?: string
          id?: string
          request_id?: string
          validation_type?: string
          validator_id?: string
        }
        Relationships: []
      }
      vehicle_equipment_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_premium: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
        }
        Relationships: []
      }
      vendor_active_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string | null
          id: string
          payment_method: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          payment_method?: string
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          payment_method?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_active_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "vendor_subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_business_info: {
        Row: {
          additional_documents: Json | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          business_address: string | null
          business_city: string | null
          business_country: string | null
          company_registration_number: string | null
          created_at: string | null
          id: string
          mobile_money_number: string | null
          mobile_money_provider: string | null
          tax_identification_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_documents?: Json | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_city?: string | null
          business_country?: string | null
          company_registration_number?: string | null
          created_at?: string | null
          id?: string
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          tax_identification_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_documents?: Json | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_city?: string | null
          business_country?: string | null
          company_registration_number?: string | null
          created_at?: string | null
          id?: string
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          tax_identification_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_earnings: {
        Row: {
          amount: number
          commission_deducted: number | null
          commission_rate: number | null
          confirmed_at: string | null
          created_at: string
          currency: string
          earnings_type: string
          gross_amount: number | null
          id: string
          net_amount: number | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          platform_fees: number | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          commission_deducted?: number | null
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          earnings_type?: string
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          platform_fees?: number | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          commission_deducted?: number | null
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          earnings_type?: string
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          platform_fees?: number | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_financial_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          id: string
          ip_address: unknown
          sensitive_data_accessed: Json | null
          target_vendor_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_vendor_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          sensitive_data_accessed?: Json | null
          target_vendor_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      vendor_followers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_followers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_followers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_stats"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_notifications: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_acknowledged: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          order_id: string | null
          read_at: string | null
          sound_played: boolean
          title: string
          vendor_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_acknowledged?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          order_id?: string | null
          read_at?: string | null
          sound_played?: boolean
          title: string
          vendor_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_acknowledged?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          order_id?: string | null
          read_at?: string | null
          sound_played?: boolean
          title?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_product_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_product_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_product_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          product_id: string
          read_at: string | null
          title: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          product_id: string
          read_at?: string | null
          title: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          product_id?: string
          read_at?: string | null
          title?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_product_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          average_rating: number | null
          city: string | null
          created_at: string | null
          follower_count: number | null
          id: string
          shop_banner_url: string | null
          shop_description: string | null
          shop_logo_url: string | null
          shop_name: string
          shop_type: string | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          city?: string | null
          created_at?: string | null
          follower_count?: number | null
          id?: string
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_logo_url?: string | null
          shop_name: string
          shop_type?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_rating?: number | null
          city?: string | null
          created_at?: string | null
          follower_count?: number | null
          id?: string
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_logo_url?: string | null
          shop_name?: string
          shop_type?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_stats_cache: {
        Row: {
          avg_rating: number
          follower_count: number
          last_product_date: string | null
          last_sale_date: string | null
          last_updated: string
          total_products: number
          total_reviews: number
          total_sales: number
          vendor_id: string
        }
        Insert: {
          avg_rating?: number
          follower_count?: number
          last_product_date?: string | null
          last_sale_date?: string | null
          last_updated?: string
          total_products?: number
          total_reviews?: number
          total_sales?: number
          vendor_id: string
        }
        Update: {
          avg_rating?: number
          follower_count?: number
          last_product_date?: string | null
          last_sale_date?: string | null
          last_updated?: string
          total_products?: number
          total_reviews?: number
          total_sales?: number
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_subscription_plans: {
        Row: {
          analytics_enabled: boolean | null
          commission_rate: number | null
          created_at: string
          currency: string
          description: string | null
          display_order: number | null
          duration_days: number
          duration_type: string
          features: Json | null
          id: string
          is_active: boolean
          is_popular: boolean | null
          max_photos_per_product: number | null
          max_products: number
          name: string
          name_en: string | null
          price: number
          priority_support: boolean | null
          updated_at: string
          verified_badge: boolean | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number
          duration_type?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          max_photos_per_product?: number | null
          max_products?: number
          name: string
          name_en?: string | null
          price: number
          priority_support?: boolean | null
          updated_at?: string
          verified_badge?: boolean | null
        }
        Update: {
          analytics_enabled?: boolean | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number
          duration_type?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          max_photos_per_product?: number | null
          max_products?: number
          name?: string
          name_en?: string | null
          price?: number
          priority_support?: boolean | null
          updated_at?: string
          verified_badge?: boolean | null
        }
        Relationships: []
      }
      vendor_subscriptions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_active: boolean
          notification_preferences: Json | null
          subscribed_at: string
          subscriber_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_active?: boolean
          notification_preferences?: Json | null
          subscribed_at?: string
          subscriber_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_active?: boolean
          notification_preferences?: Json | null
          subscribed_at?: string
          subscriber_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          vendor_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          vendor_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          vendor_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      vendor_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          last_withdrawal_date: string | null
          total_earned: number
          total_withdrawn: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          last_withdrawal_date?: string | null
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          last_withdrawal_date?: string | null
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_withdrawals: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fees_amount: number
          id: string
          net_amount: number
          phone_number: string
          processed_at: string | null
          provider_reference: string | null
          status: string
          updated_at: string
          vendor_id: string
          wallet_id: string
          withdrawal_method: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fees_amount?: number
          id?: string
          net_amount: number
          phone_number: string
          processed_at?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          wallet_id: string
          withdrawal_method: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fees_amount?: number
          id?: string
          net_amount?: number
          phone_number?: string
          processed_at?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          wallet_id?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency: string
          description: string
          id: string
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string
          description: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          recipient_balance_after: number | null
          recipient_balance_before: number | null
          recipient_id: string
          sender_balance_after: number
          sender_balance_before: number
          sender_id: string
          status: string
          user_agent: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          recipient_balance_after?: number | null
          recipient_balance_before?: number | null
          recipient_id: string
          sender_balance_after: number
          sender_balance_before: number
          sender_id: string
          status?: string
          user_agent?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          recipient_balance_after?: number | null
          recipient_balance_before?: number | null
          recipient_id?: string
          sender_balance_after?: number
          sender_balance_before?: number
          sender_id?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      webhook_audit_logs: {
        Row: {
          correlation_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          execution_time_ms: number | null
          id: string
          ip_address: unknown
          payload: Json
          response_data: Json | null
          response_status: number | null
          retry_count: number
          success: boolean
          user_agent: string | null
          user_id: string | null
          webhook_type: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown
          payload?: Json
          response_data?: Json | null
          response_status?: number | null
          retry_count?: number
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          webhook_type: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown
          payload?: Json
          response_data?: Json | null
          response_status?: number | null
          retry_count?: number
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          webhook_type?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          admin_reference: string | null
          amount: number
          auto_approved: boolean | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          kwenda_pay_phone: string | null
          mobile_money_phone: string | null
          mobile_money_provider: string | null
          paid_at: string | null
          processed_at: string | null
          status: string
          transaction_reference: string | null
          updated_at: string
          user_id: string
          user_type: string
          withdrawal_method: string
        }
        Insert: {
          admin_notes?: string | null
          admin_reference?: string | null
          amount: number
          auto_approved?: boolean | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          kwenda_pay_phone?: string | null
          mobile_money_phone?: string | null
          mobile_money_provider?: string | null
          paid_at?: string | null
          processed_at?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id: string
          user_type: string
          withdrawal_method?: string
        }
        Update: {
          admin_notes?: string | null
          admin_reference?: string | null
          amount?: number
          auto_approved?: boolean | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          kwenda_pay_phone?: string | null
          mobile_money_phone?: string | null
          mobile_money_provider?: string | null
          paid_at?: string | null
          processed_at?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
      zone_analytics: {
        Row: {
          active_drivers: number
          average_wait_time: number
          city: string
          country_code: string
          created_at: string
          customer_satisfaction: number
          date: string
          id: string
          peak_hours: Json | null
          total_revenue: number
          total_rides: number
          zone_name: string
        }
        Insert: {
          active_drivers?: number
          average_wait_time?: number
          city: string
          country_code: string
          created_at?: string
          customer_satisfaction?: number
          date: string
          id?: string
          peak_hours?: Json | null
          total_revenue?: number
          total_rides?: number
          zone_name: string
        }
        Update: {
          active_drivers?: number
          average_wait_time?: number
          city?: string
          country_code?: string
          created_at?: string
          customer_satisfaction?: number
          date?: string
          id?: string
          peak_hours?: Json | null
          total_revenue?: number
          total_rides?: number
          zone_name?: string
        }
        Relationships: []
      }
      zone_demand_cache: {
        Row: {
          available_drivers: number
          avg_price: number | null
          calculated_at: string
          city: string
          created_at: string
          demand_ratio: number
          id: string
          peak_hours: Json | null
          pending_requests: number
          zone_id: string
        }
        Insert: {
          available_drivers?: number
          avg_price?: number | null
          calculated_at?: string
          city: string
          created_at?: string
          demand_ratio?: number
          id?: string
          peak_hours?: Json | null
          pending_requests?: number
          zone_id: string
        }
        Update: {
          available_drivers?: number
          avg_price?: number | null
          calculated_at?: string
          city?: string
          created_at?: string
          demand_ratio?: number
          id?: string
          peak_hours?: Json | null
          pending_requests?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_demand_cache_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_pricing_rules: {
        Row: {
          base_price: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          special_pricing: Json | null
          surge_multiplier: number
          time_based_pricing: Json | null
          updated_at: string
          updated_by: string | null
          valid_from: string
          valid_until: string | null
          vehicle_class: string
          zone_id: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          special_pricing?: Json | null
          surge_multiplier?: number
          time_based_pricing?: Json | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string
          valid_until?: string | null
          vehicle_class?: string
          zone_id: string
        }
        Update: {
          base_price?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          special_pricing?: Json | null
          surge_multiplier?: number
          time_based_pricing?: Json | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string
          valid_until?: string | null
          vehicle_class?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_pricing_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_statistics: {
        Row: {
          active_drivers: number | null
          available_drivers: number | null
          average_trip_duration: number | null
          average_wait_time: number | null
          calculated_at: string
          cancellation_rate: number | null
          completion_rate: number | null
          customer_satisfaction_avg: number | null
          customer_satisfaction_count: number | null
          date: string
          hour_of_day: number | null
          id: string
          metadata: Json | null
          peak_demand_multiplier: number | null
          total_deliveries: number | null
          total_revenue: number | null
          total_rides: number | null
          zone_id: string
        }
        Insert: {
          active_drivers?: number | null
          available_drivers?: number | null
          average_trip_duration?: number | null
          average_wait_time?: number | null
          calculated_at?: string
          cancellation_rate?: number | null
          completion_rate?: number | null
          customer_satisfaction_avg?: number | null
          customer_satisfaction_count?: number | null
          date?: string
          hour_of_day?: number | null
          id?: string
          metadata?: Json | null
          peak_demand_multiplier?: number | null
          total_deliveries?: number | null
          total_revenue?: number | null
          total_rides?: number | null
          zone_id: string
        }
        Update: {
          active_drivers?: number | null
          available_drivers?: number | null
          average_trip_duration?: number | null
          average_wait_time?: number | null
          calculated_at?: string
          cancellation_rate?: number | null
          completion_rate?: number | null
          customer_satisfaction_avg?: number | null
          customer_satisfaction_count?: number | null
          date?: string
          hour_of_day?: number | null
          id?: string
          metadata?: Json | null
          peak_demand_multiplier?: number | null
          total_deliveries?: number | null
          total_revenue?: number | null
          total_rides?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_statistics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ab_experiment_metrics: {
        Row: {
          clicks: number | null
          conversion_rate: number | null
          conversions: number | null
          ctr: number | null
          experiment_id: string | null
          unique_users: number | null
          variant: string | null
          views: number | null
        }
        Relationships: []
      }
      active_driver_orders: {
        Row: {
          city: string | null
          created_at: string | null
          delivery_coordinates: Json | null
          delivery_location: string | null
          delivery_type: string | null
          driver_id: string | null
          estimated_price: number | null
          order_id: string | null
          order_type: string | null
          package_type: string | null
          pickup_coordinates: Json | null
          pickup_location: string | null
          pickup_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_subscription_revenue_stats: {
        Row: {
          avg_commission_rate: number | null
          month: string | null
          subscription_count: number | null
          total_admin_commission: number | null
          total_subscription_revenue: number | null
        }
        Relationships: []
      }
      ai_performance_stats_secure: {
        Row: {
          avg_response_time_ms: number | null
          context: string | null
          day: string | null
          failed_calls: number | null
          function_called: string | null
          successful_calls: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      assignment_conflicts_view: {
        Row: {
          created_at: string | null
          current_driver_id: string | null
          current_status: string | null
          description: string | null
          driver_id: string | null
          order_id: string | null
          order_type: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          current_driver_id?: never
          current_status?: never
          description?: string | null
          driver_id?: never
          order_id?: string | null
          order_type?: string | null
          reason?: never
        }
        Update: {
          created_at?: string | null
          current_driver_id?: never
          current_status?: never
          description?: string | null
          driver_id?: never
          order_id?: string | null
          order_type?: string | null
          reason?: never
        }
        Relationships: []
      }
      driver_service_preferences_legacy: {
        Row: {
          delivery_capacity: string | null
          driver_id: string | null
          service_areas: string[] | null
          service_specialization: string | null
          service_type: string | null
          vehicle_class: string | null
          vehicle_type: string | null
        }
        Insert: {
          delivery_capacity?: string | null
          driver_id?: string | null
          service_areas?: string[] | null
          service_specialization?: string | null
          service_type?: string | null
          vehicle_class?: string | null
          vehicle_type?: string | null
        }
        Update: {
          delivery_capacity?: string | null
          driver_id?: string | null
          service_areas?: string[] | null
          service_specialization?: string | null
          service_type?: string | null
          vehicle_class?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      driver_status_unified: {
        Row: {
          chauffeur_id: string | null
          heading: number | null
          is_active: boolean | null
          is_available: boolean | null
          is_online: boolean | null
          last_ping: string | null
          latitude: number | null
          longitude: number | null
          speed: number | null
          truly_online: boolean | null
          user_id: string | null
          verification_status: string | null
        }
        Relationships: []
      }
      heatmap_grid_density: {
        Row: {
          density: number | null
          device_type: string | null
          grid_x: number | null
          grid_y: number | null
          page: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      heatmap_top_elements: {
        Row: {
          avg_x: number | null
          avg_y: number | null
          click_count: number | null
          device_type: string | null
          element_class: string | null
          element_id: string | null
          element_text: string | null
          element_type: string | null
          page: string | null
          unique_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      partenaires_public_listing: {
        Row: {
          banner_image: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          shop_description: string | null
        }
        Insert: {
          banner_image?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          shop_description?: string | null
        }
        Update: {
          banner_image?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          shop_description?: string | null
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          address: string | null
          bank_account_number: string | null
          city: string | null
          commission_rate: number | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          loyalty_points: number | null
          loyalty_tier: string | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          city?: string | null
          commission_rate?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          city?: string | null
          commission_rate?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      partner_registration_monitoring: {
        Row: {
          activity_type: string | null
          company_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          error_code: string | null
          error_message: string | null
          user_id: string | null
        }
        Relationships: []
      }
      partner_rental_stats: {
        Row: {
          available_vehicles: number | null
          completed_bookings: number | null
          followers_count: number | null
          last_updated: string | null
          partner_id: string | null
          rating_average: number | null
          rating_count: number | null
          total_bookings: number | null
          total_revenue: number | null
          total_vehicles: number | null
          user_id: string | null
        }
        Relationships: []
      }
      rental_booking_stats_secure: {
        Row: {
          completed_bookings: number | null
          last_updated: string | null
          pending_bookings: number | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      rental_subscription_stats_secure: {
        Row: {
          active_subscriptions: number | null
          last_updated: string | null
        }
        Relationships: []
      }
      rental_vehicle_review_stats: {
        Row: {
          avg_rating: number | null
          five_stars: number | null
          four_stars: number | null
          last_review_at: string | null
          one_star: number | null
          three_stars: number | null
          total_reviews: number | null
          two_stars: number | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      rental_vehicle_stats_secure: {
        Row: {
          active_vehicles: number | null
          approved_vehicles: number | null
          last_updated: string | null
          pending_moderation: number | null
          total_vehicles: number | null
        }
        Relationships: []
      }
      subscription_stats_by_service: {
        Row: {
          active_subscriptions: number | null
          avg_price: number | null
          expired_subscriptions: number | null
          plan_name: string | null
          service_type: string | null
          total_revenue: number | null
          total_subscriptions: number | null
        }
        Relationships: []
      }
      user_profiles_safe: {
        Row: {
          email: string | null
          is_active: boolean | null
          name: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_profiles_view: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          is_active: boolean | null
          phone_number: string | null
          user_id: string | null
          user_type: string | null
        }
        Relationships: []
      }
      v_public_drivers: {
        Row: {
          city: string | null
          display_name: string | null
          id: string | null
          is_active: boolean | null
          profile_photo_url: string | null
          rating_average: number | null
          rating_count: number | null
          service_type: string | null
          total_rides: number | null
          vehicle_class: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_photo_url: string | null
          vehicle_type: string | null
          verification_status: string | null
        }
        Insert: {
          city?: string | null
          display_name?: string | null
          id?: string | null
          is_active?: boolean | null
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          service_type?: string | null
          total_rides?: number | null
          vehicle_class?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_type?: string | null
          verification_status?: string | null
        }
        Update: {
          city?: string | null
          display_name?: string | null
          id?: string | null
          is_active?: boolean | null
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          service_type?: string | null
          total_rides?: number | null
          vehicle_class?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_type?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      v_public_partenaires: {
        Row: {
          banner_image: string | null
          city: string | null
          company_name: string | null
          id: string | null
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          opening_hours: Json | null
          partner_type: string | null
          shop_description: string | null
          slogan: string | null
        }
        Insert: {
          banner_image?: string | null
          city?: string | null
          company_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          partner_type?: string | null
          shop_description?: string | null
          slogan?: string | null
        }
        Update: {
          banner_image?: string | null
          city?: string | null
          company_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          partner_type?: string | null
          shop_description?: string | null
          slogan?: string | null
        }
        Relationships: []
      }
      v_public_restaurants: {
        Row: {
          address: string | null
          average_preparation_time: number | null
          banner_url: string | null
          city: string | null
          commune: string | null
          coordinates: Json | null
          cuisine_types: string[] | null
          delivery_zones: string[] | null
          description: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          minimum_order_amount: number | null
          opening_hours: Json | null
          quartier: string | null
          rating_average: number | null
          rating_count: number | null
          restaurant_name: string | null
          total_orders: number | null
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          average_preparation_time?: number | null
          banner_url?: string | null
          city?: string | null
          commune?: string | null
          coordinates?: Json | null
          cuisine_types?: string[] | null
          delivery_zones?: string[] | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          minimum_order_amount?: number | null
          opening_hours?: Json | null
          quartier?: string | null
          rating_average?: number | null
          rating_count?: number | null
          restaurant_name?: string | null
          total_orders?: number | null
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          average_preparation_time?: number | null
          banner_url?: string | null
          city?: string | null
          commune?: string | null
          coordinates?: Json | null
          cuisine_types?: string[] | null
          delivery_zones?: string[] | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          minimum_order_amount?: number | null
          opening_hours?: Json | null
          quartier?: string | null
          rating_average?: number | null
          rating_count?: number | null
          restaurant_name?: string | null
          total_orders?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      v_user_rating_stats: {
        Row: {
          avg_rating: number | null
          negative_ratings: number | null
          positive_ratings: number | null
          total_ratings: number | null
          user_id: string | null
        }
        Relationships: []
      }
      vendor_stats: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          cover_url: string | null
          display_name: string | null
          followers_count: number | null
          is_verified_seller: boolean | null
          products_count: number | null
          sales_count: number | null
          vendor_id: string | null
        }
        Relationships: []
      }
      vendor_stats_mv: {
        Row: {
          active_products: number | null
          escrow_balance: number | null
          last_updated: string | null
          pending_escrow: number | null
          pending_orders: number | null
          pending_products: number | null
          seller_id: string | null
          total_orders: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_products_seller"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      activate_transport_services_all_cities: {
        Args: never
        Returns: {
          city: string
          services_activated: number
        }[]
      }
      add_partner_role_to_existing_user: {
        Args: {
          p_business_type: string
          p_company_name: string
          p_phone_number: string
          p_service_areas: string[]
          p_user_id: string
        }
        Returns: Json
      }
      admin_approve_verification_manual: {
        Args: { p_admin_notes?: string; p_user_id: string }
        Returns: Json
      }
      admin_cancel_subscription: {
        Args: {
          p_reason?: string
          p_subscription_id: string
          p_subscription_type: string
        }
        Returns: Json
      }
      admin_extend_subscription: {
        Args: {
          p_days: number
          p_subscription_id: string
          p_subscription_type: string
        }
        Returns: Json
      }
      admin_repair_orphan_driver: { Args: { p_user_id: string }; Returns: Json }
      anonymize_old_location_data: {
        Args: { days_old?: number }
        Returns: number
      }
      apply_driver_referral_code: {
        Args: { p_code: string; p_referred_id: string }
        Returns: Json
      }
      apply_referral_code: {
        Args: { p_referee_id: string; p_referral_code: string }
        Returns: Json
      }
      approve_client_for_selling: {
        Args: { p_admin_notes?: string; p_user_id: string }
        Returns: Json
      }
      audit_functions_without_search_path: {
        Args: never
        Returns: {
          arguments: string
          fix_command: string
          function_name: string
          owner: string
          priority: string
          schema_name: string
        }[]
      }
      audit_security_definer_functions: {
        Args: never
        Returns: {
          function_name: string
          risk_level: string
          security_justification: string
        }[]
      }
      audit_security_definer_views: {
        Args: never
        Returns: {
          definition_preview: string
          fix_recommendation: string
          owner: string
          schema_name: string
          view_name: string
        }[]
      }
      auto_complete_old_delivered_orders: { Args: never; Returns: undefined }
      auto_fix_function_search_paths: {
        Args: never
        Returns: {
          function_fixed: string
          status: string
        }[]
      }
      auto_monitor_edge_functions: { Args: never; Returns: undefined }
      auto_release_escrow_after_48h: { Args: never; Returns: undefined }
      automated_security_maintenance: { Args: never; Returns: string }
      calculate_ab_significance: {
        Args: { experiment_id_param: string }
        Returns: {
          confidence_level: number
          conversion_rate: number
          conversions: number
          variant: string
          views: number
        }[]
      }
      calculate_delivery_estimate: {
        Args: { order_id_param: string }
        Returns: string
      }
      calculate_delivery_price: {
        Args: {
          city_param?: string
          delivery_type_param: string
          distance_km_param: number
        }
        Returns: Json
      }
      calculate_demand_heatmap: {
        Args: { city_param?: string; time_range_minutes?: number }
        Returns: {
          available_drivers: number
          avg_price: number
          demand_ratio: number
          peak_hours: Json
          pending_requests: number
          zone_id: string
          zone_name: string
        }[]
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_distance_meters: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_marketplace_commission: {
        Args: { p_gross_amount: number; p_service_type?: string }
        Returns: Json
      }
      calculate_promo_driver_compensation: {
        Args: {
          p_discount_type: string
          p_promo_discount_amount: number
          p_service_type: string
        }
        Returns: Json
      }
      calculate_rental_price: {
        Args: {
          base_price: number
          category_id_param?: string
          city_name: string
        }
        Returns: number
      }
      calculate_risk_score: {
        Args: {
          p_action_type: string
          p_time_window_hours?: number
          p_user_id: string
        }
        Returns: number
      }
      calculate_service_price: {
        Args: {
          p_city?: string
          p_distance_km: number
          p_duration_minutes?: number
          p_service_category: string
          p_service_type: string
        }
        Returns: Json
      }
      calculate_surge_pricing: {
        Args: { vehicle_class_param: string; zone_id_param: string }
        Returns: number
      }
      calculate_user_loyalty_points: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_zone_statistics: {
        Args: {
          date_param?: string
          hour_param?: number
          zone_id_param: string
        }
        Returns: undefined
      }
      can_post_jobs: { Args: { _user_id: string }; Returns: boolean }
      can_rate_order: {
        Args: { p_order_id: string; p_order_type: string; p_user_id: string }
        Returns: boolean
      }
      check_admin_status_for_rls: { Args: never; Returns: boolean }
      check_code_generation_rate_limit: {
        Args: { p_code_type: string; p_max_per_day?: number; p_user_id: string }
        Returns: boolean
      }
      check_driver_location_access: {
        Args: { target_driver_id: string }
        Returns: boolean
      }
      check_location_search_rate_limit: { Args: never; Returns: boolean }
      check_security_configuration: {
        Args: never
        Returns: {
          action_required: string
          security_item: string
          status: string
        }[]
      }
      check_security_status: {
        Args: never
        Returns: {
          action_required: string
          check_name: string
          details: string
          status: string
        }[]
      }
      check_super_admin_status: { Args: never; Returns: boolean }
      check_test_account_exists: { Args: { p_email: string }; Returns: boolean }
      check_user_admin_role_secure: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      check_user_exists_by_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_user_role_secure: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      check_vehicle_availability: {
        Args: {
          p_end_date: string
          p_exclude_booking_id?: string
          p_start_date: string
          p_vehicle_id: string
        }
        Returns: boolean
      }
      check_vehicle_has_active_subscription: {
        Args: { p_vehicle_id: string }
        Returns: boolean
      }
      cleanup_expired_location_cache: { Args: never; Returns: number }
      cleanup_expired_trip_links: { Args: never; Returns: number }
      cleanup_ip_geolocation_cache: { Args: never; Returns: number }
      cleanup_monitoring_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_audit_logs:
        | { Args: never; Returns: number }
        | { Args: { retention_days?: number }; Returns: number }
      cleanup_old_geocode_data: { Args: { days_old?: number }; Returns: number }
      cleanup_old_heatmap_data: { Args: never; Returns: number }
      cleanup_old_notifications: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      cleanup_old_security_logs: {
        Args: { days_retention?: number }
        Returns: number
      }
      cleanup_security_definer_views: { Args: never; Returns: string }
      cleanup_security_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      cleanup_security_vulnerabilities: { Args: never; Returns: string }
      cleanup_sensitive_data_automated: { Args: never; Returns: number }
      complete_driver_registration_after_email: {
        Args: { p_registration_data: Json; p_user_id: string }
        Returns: Json
      }
      complete_partner_registration_after_email: {
        Args: { p_registration_data: Json; p_user_id: string }
        Returns: Json
      }
      convert_kwenda_points_to_ecosystem: {
        Args: {
          p_bonus_rate?: number
          p_credits: number
          p_points: number
          p_user_id: string
        }
        Returns: Json
      }
      convert_points_to_credits: {
        Args: { p_credits: number; p_points: number; p_user_id: string }
        Returns: undefined
      }
      create_client_profile_secure: {
        Args: {
          p_address?: string
          p_city?: string
          p_date_of_birth?: string
          p_display_name: string
          p_email: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_gender?: string
          p_phone_number: string
          p_user_id: string
        }
        Returns: Json
      }
      create_driver_profile_secure: {
        Args: {
          p_delivery_capacity?: string
          p_display_name: string
          p_email: string
          p_has_own_vehicle?: boolean
          p_license_number?: string
          p_phone_number: string
          p_service_type?: string
          p_user_id: string
          p_vehicle_class?: string
          p_vehicle_plate?: string
        }
        Returns: Json
      }
      create_partner_profile_secure: {
        Args: {
          p_address?: string
          p_business_type: string
          p_company_name: string
          p_display_name: string
          p_email: string
          p_phone_number: string
          p_service_areas: string[]
          p_user_id: string
        }
        Returns: Json
      }
      create_restaurant_profile_manual: {
        Args: {
          p_city: string
          p_email: string
          p_phone: string
          p_restaurant_name: string
          p_user_id: string
        }
        Returns: Json
      }
      create_subscription_alert: {
        Args: {
          p_alert_type: string
          p_message: string
          p_metadata?: Json
          p_severity?: string
          p_subscription_id: string
          p_subscription_type: string
        }
        Returns: string
      }
      create_support_ticket: {
        Args: {
          p_category: string
          p_description: string
          p_metadata?: Json
          p_priority?: string
          p_subject: string
          p_user_id: string
        }
        Returns: {
          category: string
          created_at: string
          description: string
          id: string
          metadata: Json
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }[]
      }
      create_test_driver_profile: {
        Args: {
          p_display_name: string
          p_email: string
          p_phone: string
          p_user_id: string
        }
        Returns: string
      }
      create_test_partner_profile: {
        Args: {
          p_company_name: string
          p_email: string
          p_phone: string
          p_user_id: string
        }
        Returns: string
      }
      create_trip_share_link: {
        Args: {
          p_encrypted_data: string
          p_expires_at: string
          p_share_id: string
          p_trip_id: string
        }
        Returns: string
      }
      create_user_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_notification_type: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      credit_driver_bonus_rides: {
        Args: { p_driver_id: string; p_rides_amount: number }
        Returns: Json
      }
      deactivate_old_tokens: {
        Args: { p_platform: string; p_user_id: string }
        Returns: undefined
      }
      deactivate_trip_share_link: {
        Args: { p_share_id: string }
        Returns: boolean
      }
      debug_driver_availability: {
        Args: { p_lat?: number; p_lng?: number; p_service_type?: string }
        Returns: {
          count: number
          details: Json
          metric: string
        }[]
      }
      debug_user_verification: { Args: { p_user_id: string }; Returns: Json }
      decrement_driver_rides: {
        Args: { p_driver_id: string }
        Returns: boolean
      }
      decrement_subscription_rides: {
        Args: {
          p_booking_id: string
          p_booking_type: string
          p_driver_id: string
        }
        Returns: Json
      }
      deduct_kwenda_points: {
        Args: { p_points: number; p_user_id: string }
        Returns: undefined
      }
      delivery_status_manager: {
        Args: {
          additional_data?: Json
          driver_id_param?: string
          location_coords?: Json
          new_status: string
          order_id: string
        }
        Returns: Json
      }
      diagnose_seller_status: { Args: { p_user_id: string }; Returns: Json }
      disable_user_notifications: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      ensure_seller_profile: { Args: { p_user_id: string }; Returns: string }
      ensure_user_profile: { Args: { p_user_id: string }; Returns: string }
      execute_wallet_transfer: {
        Args: {
          p_amount: number
          p_description?: string
          p_recipient_id: string
          p_sender_id: string
        }
        Returns: Json
      }
      expire_partner_promotions: { Args: never; Returns: undefined }
      find_nearby_delivery_drivers: {
        Args: {
          p_delivery_type?: string
          p_lat: number
          p_lng: number
          p_max_distance_km?: number
        }
        Returns: {
          delivery_capacity: string
          distance_km: number
          driver_id: string
          estimated_arrival_minutes: number
          is_available: boolean
          rating_average: number
          service_type: string
          vehicle_class: string
        }[]
      }
      find_nearby_drivers: {
        Args: {
          p_city?: string
          p_lat: number
          p_lng: number
          p_max_distance_km?: number
          p_service_type?: string
          p_vehicle_class?: string
        }
        Returns: {
          display_name: string
          distance_km: number
          driver_id: string
          is_available: boolean
          is_verified: boolean
          latitude: number
          longitude: number
          rating_average: number
          rides_remaining: number
          total_rides: number
          vehicle_class: string
          vehicle_make: string
          vehicle_model: string
          vehicle_plate: string
          wallet_balance: number
        }[]
      }
      find_nearby_drivers_secure: {
        Args: {
          max_distance_km?: number
          service_type_filter?: string
          user_lat: number
          user_lng: number
          vehicle_class_filter?: string
        }
        Returns: {
          current_lat: number
          current_lng: number
          display_name: string
          distance_km: number
          driver_id: string
          is_available: boolean
          is_online: boolean
          last_ping: string
          phone_number: string
          rating_average: number
          rides_remaining: number
          service_type: string
          user_id: string
          vehicle_class: string
        }[]
      }
      fix_invalid_coordinates: { Args: never; Returns: number }
      force_activate_seller: {
        Args: { p_admin_notes?: string; p_user_id: string }
        Returns: Json
      }
      generate_driver_code: { Args: never; Returns: string }
      generate_driver_code_secure: { Args: never; Returns: string }
      generate_driver_referral_code: {
        Args: { p_service_type: string; p_user_id: string }
        Returns: string
      }
      generate_food_order_number: { Args: never; Returns: string }
      generate_lottery_ticket_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_security_report: {
        Args: never
        Returns: {
          category: string
          details: string
          last_check: string
          recommendations: string
          status: string
        }[]
      }
      generate_ticket_number: { Args: never; Returns: string }
      generate_unique_referral_code: { Args: never; Returns: string }
      geocode_location: { Args: { query_text: string }; Returns: Json }
      get_admin_registration_debug_logs: {
        Args: { limit_count?: number }
        Returns: {
          activity_type: string
          attempted_user_id: string
          auth_uid_at_time: string
          created_at: string
          description: string
          driver_profile_exists: boolean
          driver_role_exists: boolean
          error_message: string
          failed_step: string
          id: string
          metadata: Json
          user_exists_in_auth: boolean
          user_id: string
          validation_errors: string
        }[]
      }
      get_admin_subscriptions_unified: { Args: never; Returns: Json }
      get_admin_users_cache: {
        Args: never
        Returns: {
          admin_level: string
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          department: string
          display_name: string
          email: string
          is_active: boolean
          last_login: string
          permissions: string[]
          phone_number: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }[]
      }
      get_admin_users_safe: {
        Args: never
        Returns: {
          admin_level: string
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          department: string
          display_name: string
          email: string
          is_active: boolean
          last_login: string
          permissions: string[]
          phone_number: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }[]
      }
      get_admins_with_permissions: {
        Args: { permission_names: string[] }
        Returns: string[]
      }
      get_ai_performance_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_response_time_ms: number
          context: string
          day: string
          failed_calls: number
          function_called: string
          successful_calls: number
          total_calls: number
        }[]
      }
      get_anonymized_vendor_performance: {
        Args: never
        Returns: {
          avg_monthly_earnings: number
          avg_orders_per_month: number
          performance_tier: string
          vendor_count: number
        }[]
      }
      get_available_drivers_summary: {
        Args: never
        Returns: {
          avg_rating: number
          city: string
          total_available_drivers: number
          vehicle_class: string
        }[]
      }
      get_cancellation_stats: {
        Args: { days_back?: number }
        Returns: {
          cancellation_date: string
          reference_type: string
          total_cancellations: number
          unique_users: number
        }[]
      }
      get_city_price_multiplier: {
        Args: { city_name: string }
        Returns: number
      }
      get_clients_admin_safe: {
        Args: never
        Returns: {
          city: string
          country: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          phone_number: string
          role: string
          user_id: string
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_delivery_zone_info: {
        Args: { assignment_id_param: string }
        Returns: {
          assignment_id: string
          delivery_zone: string
          estimated_distance_km: number
          estimated_duration_minutes: number
          order_id: string
          pickup_zone: string
          special_requirements: string
          status: string
        }[]
      }
      get_driver_current_service: {
        Args: { p_driver_id: string }
        Returns: Json
      }
      get_driver_delivery_coordinates: {
        Args: { assignment_id_param: string }
        Returns: {
          delivery_address: string
          delivery_contact: string
          delivery_lat: number
          delivery_lng: number
          pickup_address: string
          pickup_contact: string
          pickup_lat: number
          pickup_lng: number
        }[]
      }
      get_driver_exact_location_admin: {
        Args: { p_driver_id: string }
        Returns: {
          is_available: boolean
          is_online: boolean
          last_ping: string
          latitude: number
          longitude: number
        }[]
      }
      get_driver_location_for_order: {
        Args: { p_order_id: string }
        Returns: {
          heading: number
          latitude: number
          longitude: number
          updated_at: string
        }[]
      }
      get_driver_location_with_audit: {
        Args: { target_driver_id: string }
        Returns: {
          driver_id: string
          is_available: boolean
          is_online: boolean
          last_ping: string
          latitude: number
          longitude: number
          vehicle_class: string
        }[]
      }
      get_driver_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_driver_service_info: {
        Args: { driver_user_id: string }
        Returns: {
          service_specialization: string
          service_type: string
        }[]
      }
      get_driver_service_type: {
        Args: { driver_user_id: string }
        Returns: string
      }
      get_driver_zones: {
        Args: { zone_radius_km?: number }
        Returns: {
          average_wait_time_minutes: number
          driver_count: number
          zone_center_lat: number
          zone_center_lng: number
        }[]
      }
      get_edge_function_performance_stats: {
        Args: { p_function_name?: string; p_hours_back?: number }
        Returns: {
          avg_execution_time_ms: number
          error_rate: number
          function_name: string
          p95_execution_time_ms: number
          success_rate: number
          total_calls: number
        }[]
      }
      get_email_by_phone: { Args: { p_phone: string }; Returns: string }
      get_identity_document_url: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_lottery_admin_stats: { Args: never; Returns: Json }
      get_manual_security_tasks: {
        Args: never
        Returns: {
          action: string
          location: string
          task: string
        }[]
      }
      get_market_benchmark_stats: {
        Args: { category_filter?: string }
        Returns: {
          avg_earnings_per_vendor: number
          median_order_value: number
          top_25_percent_threshold: number
          total_active_vendors: number
        }[]
      }
      get_migration_status: { Args: never; Returns: Json }
      get_monitoring_stats: {
        Args: never
        Returns: {
          description: string
          stat_name: string
          stat_value: string
        }[]
      }
      get_nearby_active_drivers_enhanced: {
        Args: {
          max_results?: number
          radius_km?: number
          search_lat: number
          search_lng: number
          vehicle_class_filter?: string
        }
        Returns: {
          distance_km: number
          driver_id: string
          is_verified: boolean
          last_ping: string
          vehicle_class: string
        }[]
      }
      get_notification_stats: { Args: { admin_id?: string }; Returns: Json }
      get_or_create_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_partner_by_code: {
        Args: { driver_code: string }
        Returns: {
          commission_rate: number
          is_active: boolean
          partner_id: string
          partner_name: string
        }[]
      }
      get_partner_earnings_secure: {
        Args: { date_range?: string; partner_user_id: string }
        Returns: {
          driver_count: number
          total_bookings: number
          total_commission: number
          total_revenue: number
        }[]
      }
      get_partner_stats_optimized: {
        Args: { partner_user_id: string }
        Returns: {
          active_drivers: number
          monthly_commissions: number
          partner_id: string
          subscribed_drivers: number
          total_commissions: number
        }[]
      }
      get_partner_subscription_balance: {
        Args: { p_partner_id: string }
        Returns: number
      }
      get_performance_trends: {
        Args: { p_hours_back?: number; p_metric_type?: string }
        Returns: {
          avg_value: number
          data_points: number
          max_value: number
          metric_name: string
          metric_type: string
          min_value: number
          trend_direction: string
        }[]
      }
      get_protected_admin_info: {
        Args: { admin_id_param: string }
        Returns: {
          admin_level: string
          created_at: string
          department: string
          display_name: string
          is_active: boolean
          user_id: string
        }[]
      }
      get_protected_user_info: {
        Args: { user_id_param: string }
        Returns: {
          avatar_url: string
          display_name: string
          member_since: string
          user_id: string
          user_type: string
        }[]
      }
      get_public_chauffeur_info: {
        Args: { chauffeur_id: string }
        Returns: {
          display_name: string
          id: string
          is_active: boolean
          rating_average: number
          total_rides: number
          vehicle_color: string
          vehicle_model: string
          vehicle_type: string
          verification_status: string
        }[]
      }
      get_referral_reward_amount: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_rental_booking_stats: {
        Args: never
        Returns: {
          active_bookings: number
          cancelled_bookings: number
          completed_bookings: number
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_rental_subscription_stats: {
        Args: never
        Returns: {
          active_subscriptions: number
          expired_subscriptions: number
          total_subscription_revenue: number
          total_subscriptions: number
        }[]
      }
      get_rental_vehicle_stats: {
        Args: never
        Returns: {
          active_vehicles: number
          approved_vehicles: number
          pending_moderation: number
          rejected_vehicles: number
          total_vehicles: number
        }[]
      }
      get_restaurant_commission_rate: {
        Args: { p_restaurant_id: string }
        Returns: number
      }
      get_safe_user_info: {
        Args: { user_id_param: string }
        Returns: {
          avatar_url: string
          display_name: string
          member_since: string
          user_id: string
          user_type: string
        }[]
      }
      get_secure_financial_summary: {
        Args: { user_id_param: string }
        Returns: {
          available_balance: number
          last_transaction_date: string
          pending_amount: number
          total_earnings: number
        }[]
      }
      get_secure_vendor_earnings:
        | {
            Args: {
              limit_records?: number
              offset_records?: number
              vendor_filter?: string
            }
            Returns: {
              amount: number
              confirmed_at: string
              created_at: string
              currency: string
              earnings_type: string
              id: string
              order_id: string
              paid_at: string
              status: string
              vendor_id: string
            }[]
          }
        | {
            Args: { vendor_id_param?: string }
            Returns: {
              amount: number
              created_at: string
              currency: string
              earnings_type: string
              id: string
              paid_at: string
              status: string
              vendor_id: string
            }[]
          }
      get_secure_vendor_earnings_summary: {
        Args: { period_days?: number }
        Returns: {
          average_order_value: number
          last_payment_date: string
          pending_amount: number
          total_earnings: number
          total_orders: number
        }[]
      }
      get_security_alerts_current: {
        Args: never
        Returns: {
          alert_type: string
          created_at: string
          message: string
          severity: string
          user_id: string
        }[]
      }
      get_security_compliance_report: {
        Args: never
        Returns: {
          category: string
          compliance_level: string
          details: string
          status: string
        }[]
      }
      get_security_dashboard_metrics: {
        Args: never
        Returns: {
          alert_level: string
          description: string
          metric_name: string
          metric_value: string
        }[]
      }
      get_security_metrics: {
        Args: never
        Returns: {
          admin_access_count: number
          failed_login_attempts: number
          financial_access_count: number
          last_24h_violations: number
          suspicious_activities: number
        }[]
      }
      get_security_status: {
        Args: never
        Returns: {
          check_type: string
          details: string
          status: string
        }[]
      }
      get_service_price: {
        Args: {
          p_base_distance?: number
          p_city?: string
          p_service_type: string
        }
        Returns: Json
      }
      get_top_food_products: {
        Args: { date_end: string; date_start: string; limit_count?: number }
        Returns: {
          id: string
          image_url: string
          name: string
          restaurant_name: string
          total_orders: number
          total_revenue: number
        }[]
      }
      get_top_restaurants: {
        Args: { date_end: string; date_start: string; limit_count?: number }
        Returns: {
          city: string
          id: string
          name: string
          orders_count: number
          rating: number
          total_revenue: number
        }[]
      }
      get_transport_chat_messages: {
        Args: { p_booking_id: string }
        Returns: {
          booking_id: string
          id: string
          message: string
          message_type: string
          metadata: Json
          read_at: string
          sender_id: string
          sender_type: string
          sent_at: string
        }[]
      }
      get_trip_share_data: {
        Args: { p_share_id: string }
        Returns: {
          created_at: string
          encrypted_data: string
          expires_at: string
          id: string
          is_active: boolean
          share_id: string
          trip_id: string
        }[]
      }
      get_user_by_email: {
        Args: { p_email: string }
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      get_user_by_email_from_id: {
        Args: { p_user_id: string }
        Returns: {
          email: string
        }[]
      }
      get_user_display_name: { Args: { p_user_id: string }; Returns: string }
      get_user_role: { Args: { user_id_param: string }; Returns: string }
      get_user_role_secure:
        | { Args: never; Returns: string }
        | { Args: { p_user_id: string }; Returns: string }
      get_user_roles: {
        Args: { p_user_id: string }
        Returns: {
          admin_role: string
          permissions: string[]
          role: string
        }[]
      }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      get_user_type: { Args: { p_user_id: string }; Returns: string }
      get_vehicle_types_with_pricing: {
        Args: { p_city: string; p_distance?: number }
        Returns: {
          base_price: number
          calculated_price: number
          display_name: string
          features: Json
          is_active: boolean
          price_per_km: number
          service_type: string
        }[]
      }
      get_vendor_average_rating: {
        Args: { vendor_id: string }
        Returns: number
      }
      get_vendor_dashboard_data: {
        Args: never
        Returns: {
          average_order_value: number
          current_month_earnings: number
          last_month_earnings: number
          pending_payments: number
          top_selling_category: string
          total_orders_this_month: number
        }[]
      }
      get_vendor_earnings_stats: {
        Args: { p_vendor_id: string }
        Returns: Json
      }
      get_vendor_earnings_summary: {
        Args: { period_days?: number; vendor_id_param?: string }
        Returns: {
          average_order_value: number
          last_payment_date: string
          pending_amount: number
          total_earnings: number
          total_orders: number
        }[]
      }
      get_vendor_escrow_stats: {
        Args: { vendor_uuid: string }
        Returns: {
          auto_release_soon_count: number
          pending_orders_count: number
          total_held: number
          total_released: number
        }[]
      }
      get_vendor_follower_count: {
        Args: { vendor_user_id: string }
        Returns: number
      }
      get_vendor_stats_optimized: {
        Args: { vendor_user_id: string }
        Returns: {
          active_products: number
          escrow_balance: number
          pending_escrow: number
          pending_orders: number
          pending_products: number
          total_orders: number
        }[]
      }
      get_vendor_total_reviews: {
        Args: { vendor_user_id: string }
        Returns: number
      }
      get_vendor_total_sales: {
        Args: { vendor_user_id: string }
        Returns: number
      }
      get_zone_for_coordinates: {
        Args: { lat: number; lng: number }
        Returns: string
      }
      get_zone_pricing: {
        Args: {
          datetime_param?: string
          vehicle_class_param?: string
          zone_id_param: string
        }
        Returns: {
          base_price: number
          maximum_fare: number
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          surge_multiplier: number
        }[]
      }
      handle_new_client_user_direct: {
        Args: { auth_user: unknown }
        Returns: undefined
      }
      handle_new_driver_user_direct: {
        Args: { auth_user: unknown }
        Returns: undefined
      }
      handle_new_restaurant_user_direct: {
        Args: { auth_user: unknown }
        Returns: undefined
      }
      has_active_subscription: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      has_admin_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      has_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      has_user_role: { Args: { check_role: string }; Returns: boolean }
      increment_address_usage: {
        Args: { address_id: string }
        Returns: undefined
      }
      increment_beneficiary_usage: {
        Args: { beneficiary_id: string }
        Returns: undefined
      }
      increment_job_views: { Args: { job_id: string }; Returns: undefined }
      increment_offer_count:
        | {
            Args: { amount_to_add: number; driver_id_param: string }
            Returns: undefined
          }
        | { Args: { p_booking_id: string }; Returns: undefined }
      insert_booking_report: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      insert_driver_rating: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_feedback?: string
          p_rating: number
          p_user_id: string
        }
        Returns: string
      }
      intelligent_places_search:
        | {
            Args: {
              include_nearby?: boolean
              max_results?: number
              search_city?: string
              search_query?: string
              user_latitude?: number
              user_longitude?: number
            }
            Returns: {
              avenue: string
              badge: string
              category: string
              city: string
              commune: string
              distance_meters: number
              formatted_address: string
              hierarchy_level: number
              id: string
              latitude: number
              longitude: number
              name: string
              popularity_score: number
              quartier: string
              relevance_score: number
              subcategory: string
              subtitle: string
            }[]
          }
        | {
            Args: {
              max_results?: number
              min_hierarchy_level?: number
              search_query: string
              user_city?: string
              user_country_code?: string
              user_lat?: number
              user_lng?: number
            }
            Returns: {
              aliases: string[]
              category: string
              city: string
              commune: string
              country_code: string
              distance_km: number
              hierarchy_level: number
              id: string
              is_popular: boolean
              latitude: number
              longitude: number
              name: string
              name_fr: string
              name_local: string
              place_type: string
              popularity_score: number
              relevance_score: number
              search_keywords: string[]
            }[]
          }
      intelligent_places_search_enhanced: {
        Args: {
          include_nearby?: boolean
          max_results?: number
          search_city?: string
          search_query?: string
          user_latitude?: number
          user_longitude?: number
        }
        Returns: {
          avenue: string
          badge: string
          category: string
          city: string
          commune: string
          distance_meters: number
          formatted_address: string
          hierarchy_level: number
          id: string
          latitude: number
          longitude: number
          name: string
          popularity_score: number
          quartier: string
          relevance_score: number
          subcategory: string
          subtitle: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_fast: { Args: never; Returns: boolean }
      is_admin_food: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      is_driver_truly_online: { Args: { p_user_id: string }; Returns: boolean }
      is_restaurant_owner: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_admin_secure: { Args: never; Returns: boolean }
      is_user_super_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_vehicle_subscription_active: {
        Args: { vehicle_id_param: string }
        Returns: boolean
      }
      link_payment_to_subscription: {
        Args: { payment_id: string; subscription_id: string }
        Returns: boolean
      }
      log_admin_access: {
        Args: {
          p_access_reason?: string
          p_access_type: string
          p_target_admin_id: string
        }
        Returns: undefined
      }
      log_assignment_conflict: {
        Args: {
          p_conflict_reason: string
          p_driver_id: string
          p_order_id: string
          p_order_type: string
        }
        Returns: undefined
      }
      log_cancellation: {
        Args: {
          p_cancellation_type: string
          p_cancelled_by: string
          p_financial_impact?: Json
          p_metadata?: Json
          p_reason: string
          p_reference_id: string
          p_reference_type: string
          p_status_at_cancellation: string
        }
        Returns: string
      }
      log_driver_location_access: {
        Args: {
          p_access_reason?: string
          p_access_type: string
          p_driver_id: string
        }
        Returns: undefined
      }
      log_driver_registration_attempt: {
        Args: {
          p_email: string
          p_error_message?: string
          p_license_number: string
          p_phone_number: string
          p_success: boolean
        }
        Returns: undefined
      }
      log_edge_function_performance: {
        Args: {
          p_error_message?: string
          p_execution_time_ms: number
          p_function_name: string
          p_request_id?: string
          p_status_code?: number
          p_user_id?: string
        }
        Returns: string
      }
      log_geolocation_access: {
        Args: {
          p_action_type: string
          p_encrypted_payload?: string
          p_location_data?: Json
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      log_location_access: {
        Args: {
          access_type_param: string
          drivers_found_count?: number
          search_lat?: number
          search_lng?: number
          search_radius?: number
        }
        Returns: undefined
      }
      log_notification_event: {
        Args: {
          p_event_type: string
          p_notification_data: Json
          p_user_id: string
        }
        Returns: undefined
      }
      log_partner_audit_event: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_new_status?: string
          p_old_status?: string
          p_partner_id: string
          p_reason?: string
        }
        Returns: string
      }
      log_security_audit: {
        Args: { action_type: string; table_accessed: string; user_data?: Json }
        Returns: undefined
      }
      log_security_event:
        | {
            Args: {
              p_action_type: string
              p_error_message?: string
              p_metadata?: Json
              p_resource_id?: string
              p_resource_type: string
              p_success?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_event_type: string
              p_severity?: string
            }
            Returns: undefined
          }
      log_sensitive_access: {
        Args: {
          access_type: string
          accessed_user_id?: string
          table_name: string
        }
        Returns: string
      }
      log_sensitive_access_enhanced: {
        Args: {
          p_operation: string
          p_table_name: string
          p_target_user_id?: string
        }
        Returns: boolean
      }
      log_sensitive_access_secure: {
        Args: {
          p_accessed_user_data?: string
          p_metadata?: Json
          p_operation: string
          p_table_name: string
        }
        Returns: string
      }
      log_sensitive_data_access:
        | {
            Args: {
              p_accessed_user_id?: string
              p_metadata?: Json
              p_operation: string
              p_table_name: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_access_reason?: string
              p_access_type?: string
              p_accessed_columns?: string[]
              p_target_record_id?: string
              p_target_table: string
            }
            Returns: undefined
          }
      log_subscription_access: {
        Args: {
          p_operation: string
          p_subscription_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_system_activity: {
        Args: {
          p_activity_type: string
          p_description: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_wallet_error: {
        Args: {
          p_error_message: string
          p_error_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      maintain_security_compliance: {
        Args: never
        Returns: {
          check_name: string
          recommendation: string
          status: string
        }[]
      }
      map_legacy_data_to_service: {
        Args: { p_delivery_capacity?: string; p_vehicle_type?: string }
        Returns: string
      }
      mark_expired_delivery_alerts: { Args: never; Returns: number }
      mark_message_as_read: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      mark_prize_delivered: {
        Args: {
          p_delivery_notes?: string
          p_delivery_photo_urls?: string[]
          p_recipient_signature?: string
          p_win_id: string
        }
        Returns: Json
      }
      mask_sensitive_data: {
        Args: {
          data_owner_id: string
          data_type: string
          original_value: string
          requester_id: string
        }
        Returns: string
      }
      migrate_coordinates_to_google_addresses: {
        Args: never
        Returns: {
          processed_bookings: number
          processed_deliveries: number
          processed_drivers: number
        }[]
      }
      monitor_security_events: { Args: never; Returns: undefined }
      process_escrow_release: { Args: { escrow_id: string }; Returns: boolean }
      process_marketplace_payment: {
        Args: {
          p_cart_items: Json
          p_delivery_address: string
          p_delivery_fee?: number
          p_delivery_zone?: string
          p_phone_number?: string
          p_total_price: number
          p_user_id: string
        }
        Returns: Json
      }
      process_orange_money_payment: {
        Args: {
          p_amount: number
          p_currency: string
          p_transaction_ref: string
          p_user_id: string
        }
        Returns: string
      }
      record_performance_metric: {
        Args: {
          p_metadata?: Json
          p_metric_name: string
          p_metric_type: string
          p_metric_value: number
          p_unit?: string
        }
        Returns: string
      }
      refresh_active_driver_orders: { Args: never; Returns: undefined }
      refresh_admin_cache: { Args: never; Returns: undefined }
      refresh_ai_stats: { Args: never; Returns: undefined }
      refresh_driver_status: { Args: never; Returns: undefined }
      refresh_driver_status_unified: { Args: never; Returns: undefined }
      refresh_security_stats: { Args: never; Returns: undefined }
      refresh_vendor_stats_cache: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      reject_client_verification: {
        Args: { p_rejection_reason: string; p_user_id: string }
        Returns: Json
      }
      request_vendor_withdrawal: {
        Args: {
          p_amount: number
          p_payment_details?: Json
          p_payment_method: string
        }
        Returns: Json
      }
      reset_daily_lottery_limits: { Args: never; Returns: undefined }
      run_security_maintenance: { Args: never; Returns: string }
      safe_auth_uid: { Args: never; Returns: string }
      search_places: {
        Args: {
          max_results?: number
          search_query: string
          user_city?: string
          user_country_code?: string
        }
        Returns: {
          category: string
          city: string
          commune: string
          country_code: string
          id: string
          is_popular: boolean
          latitude: number
          longitude: number
          name: string
          name_fr: string
          name_local: string
          place_type: string
          relevance_score: number
          search_keywords: string[]
        }[]
      }
      search_transfer_recipient: {
        Args: { search_phone: string }
        Returns: {
          display_name: string
          id: string
          phone_number: string
        }[]
      }
      search_users_protected: {
        Args: { limit_results?: number; search_term: string }
        Returns: {
          masked_name: string
          user_id: string
          user_type: string
        }[]
      }
      security_audit_report: {
        Args: never
        Returns: {
          action_required: string
          category: string
          details: string
          status: string
        }[]
      }
      security_check_search_path: {
        Args: never
        Returns: {
          function_name: string
          has_search_path: boolean
          recommendation: string
        }[]
      }
      security_definer_check: {
        Args: never
        Returns: {
          check_name: string
          recommendation: string
          status: string
          view_count: number
        }[]
      }
      security_diagnostic: {
        Args: never
        Returns: {
          check_name: string
          recommendation: string
          result: string
        }[]
      }
      security_diagnostic_report: {
        Args: never
        Returns: {
          action_required: string
          check_category: string
          details: string
          status: string
        }[]
      }
      security_health_check: {
        Args: never
        Returns: {
          action_required: string
          check_type: string
          details: string
          status: string
        }[]
      }
      security_monitor_access: {
        Args: never
        Returns: {
          failed_auth_attempts: number
          recent_admin_access: number
          sensitive_data_access: number
          suspicious_patterns: number
        }[]
      }
      send_notification_to_vendor_subscribers: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_notification_type: string
          p_title: string
          p_vendor_id: string
        }
        Returns: undefined
      }
      send_transport_chat_message: {
        Args: {
          p_booking_id: string
          p_message: string
          p_message_type?: string
          p_sender_id: string
        }
        Returns: string
      }
      sync_missing_user_roles: {
        Args: never
        Returns: {
          action_type: string
          affected_user_id: string
          assigned_role: string
          source_table: string
        }[]
      }
      system_health_check: { Args: never; Returns: Json }
      update_trip_share_location: {
        Args: { p_encrypted_data: string; p_share_id: string }
        Returns: boolean
      }
      update_user_average_rating: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      update_vehicle_pricing: {
        Args: {
          p_base_price: number
          p_minimum_fare: number
          p_price_per_km: number
          p_pricing_id: string
        }
        Returns: undefined
      }
      update_vehicle_type_config: {
        Args: {
          p_description: string
          p_display_name: string
          p_is_active: boolean
          p_service_type: string
        }
        Returns: undefined
      }
      update_verification_level: {
        Args: { p_admin_notes?: string; p_new_level: string; p_user_id: string }
        Returns: Json
      }
      upsert_push_token: {
        Args: { p_platform: string; p_token: string; p_user_id: string }
        Returns: undefined
      }
      use_referral_code: {
        Args: { p_code: string; p_referred_id: string }
        Returns: Json
      }
      user_exists: { Args: { user_id_param: string }; Returns: boolean }
      validate_and_fix_delivery_coordinates: { Args: never; Returns: number }
      validate_booking_coordinates: {
        Args: { delivery_coords: Json; pickup_coords: Json }
        Returns: Json
      }
      validate_driver_registration_data: {
        Args: {
          p_email: string
          p_license_number: string
          p_phone_number: string
          p_vehicle_plate?: string
        }
        Returns: Json
      }
      validate_google_address: {
        Args: { address_text: string }
        Returns: boolean
      }
      validate_gps_coordinates: { Args: { coords: Json }; Returns: boolean }
      validate_lottery_win: {
        Args: {
          p_admin_notes?: string
          p_delivery_method: string
          p_win_id: string
        }
        Returns: Json
      }
      validate_partner_registration_secure: {
        Args: {
          p_commission_rate?: number
          p_company_name: string
          p_email: string
          p_phone_number: string
        }
        Returns: Json
      }
      validate_referral_code: {
        Args: { p_referral_code: string }
        Returns: Json
      }
      validate_service_requirements: {
        Args: { p_requirements: Json; p_service_type: string }
        Returns: Json
      }
      verify_admin_fast: { Args: { p_user_id: string }; Returns: Json }
      verify_security_configuration: {
        Args: never
        Returns: {
          check_name: string
          recommendation: string
          severity: string
          status: string
        }[]
      }
      verify_seller: {
        Args: { p_user_id: string; p_verified: boolean }
        Returns: Json
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "admin_financier"
        | "admin_transport"
        | "admin_marketplace"
        | "admin_support"
        | "moderator"
        | "admin_food"
      delivery_service_type: "flash" | "flex" | "maxicharge"
      lottery_win_status:
        | "pending"
        | "claimed"
        | "credited"
        | "expired"
        | "validated"
        | "in_delivery"
        | "delivered"
        | "cancelled"
        | "disputed"
      permission:
        | "users_read"
        | "users_write"
        | "users_delete"
        | "drivers_read"
        | "drivers_write"
        | "drivers_validate"
        | "partners_read"
        | "partners_write"
        | "partners_validate"
        | "finance_read"
        | "finance_write"
        | "finance_admin"
        | "transport_read"
        | "transport_write"
        | "transport_admin"
        | "marketplace_read"
        | "marketplace_write"
        | "marketplace_moderate"
        | "support_read"
        | "support_write"
        | "support_admin"
        | "analytics_read"
        | "analytics_admin"
        | "system_admin"
        | "notifications_read"
        | "notifications_write"
        | "notifications_admin"
        | "zones_read"
        | "zones_write"
        | "zones_admin"
        | "drivers_admin"
        | "food_read"
        | "food_write"
        | "food_moderate"
        | "food_admin"
        | "vehicle_settings_manage"
      taxi_service_type: "moto" | "eco" | "confort" | "premium"
      user_role:
        | "client"
        | "driver"
        | "partner"
        | "admin"
        | "restaurant"
        | "vendor"
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
      admin_role: [
        "super_admin",
        "admin_financier",
        "admin_transport",
        "admin_marketplace",
        "admin_support",
        "moderator",
        "admin_food",
      ],
      delivery_service_type: ["flash", "flex", "maxicharge"],
      lottery_win_status: [
        "pending",
        "claimed",
        "credited",
        "expired",
        "validated",
        "in_delivery",
        "delivered",
        "cancelled",
        "disputed",
      ],
      permission: [
        "users_read",
        "users_write",
        "users_delete",
        "drivers_read",
        "drivers_write",
        "drivers_validate",
        "partners_read",
        "partners_write",
        "partners_validate",
        "finance_read",
        "finance_write",
        "finance_admin",
        "transport_read",
        "transport_write",
        "transport_admin",
        "marketplace_read",
        "marketplace_write",
        "marketplace_moderate",
        "support_read",
        "support_write",
        "support_admin",
        "analytics_read",
        "analytics_admin",
        "system_admin",
        "notifications_read",
        "notifications_write",
        "notifications_admin",
        "zones_read",
        "zones_write",
        "zones_admin",
        "drivers_admin",
        "food_read",
        "food_write",
        "food_moderate",
        "food_admin",
        "vehicle_settings_manage",
      ],
      taxi_service_type: ["moto", "eco", "confort", "premium"],
      user_role: [
        "client",
        "driver",
        "partner",
        "admin",
        "restaurant",
        "vendor",
      ],
    },
  },
} as const
