/**
 * Database Types for Supabase
 * This file will be auto-generated from your Supabase schema
 * For now, we use a minimal type definition
 */

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
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [_: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [_: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [_: string]: string
    }
  }
}

/**
 * To generate exact types from your Supabase schema, run:
 * npx supabase gen types typescript --project-id auakxtwvqqefysprkczv > backend/types/database.types.ts
 * 
 * Or use the Supabase CLI:
 * supabase gen types typescript --linked > backend/types/database.types.ts
 */
