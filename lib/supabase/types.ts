export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: string | null
          play_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          category?: string | null
          play_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          category?: string | null
          play_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          created_at: string
          game_id: string
          player_id: string | null
          guest_session_id: string | null
          player_name: string
          score: number
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          game_id: string
          player_id?: string | null
          guest_session_id?: string | null
          player_name: string
          score: number
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          game_id?: string
          player_id?: string | null
          guest_session_id?: string | null
          player_name?: string
          score?: number
          metadata?: Json | null
        }
      }
      leaderboards: {
        Row: {
          id: string
          game_id: string
          period: 'all_time' | 'monthly' | 'weekly' | 'daily'
          player_id: string | null
          guest_session_id: string | null
          player_name: string
          score: number
          rank: number
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          period: 'all_time' | 'monthly' | 'weekly' | 'daily'
          player_id?: string | null
          guest_session_id?: string | null
          player_name: string
          score: number
          rank?: number
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          period?: 'all_time' | 'monthly' | 'weekly' | 'daily'
          player_id?: string | null
          guest_session_id?: string | null
          player_name?: string
          score?: number
          rank?: number
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          avatar_url: string | null
          total_games_played: number
          achievements: Json | null
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          avatar_url?: string | null
          total_games_played?: number
          achievements?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          avatar_url?: string | null
          total_games_played?: number
          achievements?: Json | null
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          criteria: Json
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          criteria: Json
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          criteria?: Json
          icon?: string | null
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}