export interface Database {
  public: {
    Tables: {
      game_rooms: {
        Row: {
          id: string
          game_type: string
          players: string[]
          max_players: number
          status: 'waiting' | 'playing' | 'finished'
          created_by: string
          created_at: string
          game_state: any
        }
        Insert: {
          id: string
          game_type: string
          players?: string[]
          max_players?: number
          status?: 'waiting' | 'playing' | 'finished'
          created_by: string
          created_at?: string
          game_state?: any
        }
        Update: {
          id?: string
          game_type?: string
          players?: string[]
          max_players?: number
          status?: 'waiting' | 'playing' | 'finished'
          created_by?: string
          created_at?: string
          game_state?: any
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          game_id: string
          score: number
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          score: number
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          score?: number
          metadata?: any
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          total_xp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          avatar_url?: string | null
          total_xp?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          total_xp?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      array_append: {
        Args: {
          arr: string
          elem: string
        }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}