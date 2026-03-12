// Define GenericSchema locally to avoid dependency on internal type
type GenericSchema = {
  Tables: Record<string, any>;
  Views: Record<string, any>;
  Functions: Record<string, any>;
  Enums: Record<string, any>;
  CompositeTypes: Record<string, any>;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicSchema = GenericSchema & {
  Tables: {
    price_history: {
      Row: {
        created_at: string;
        id: number;
        ore_price_usd: string;
        timestamp: string;
        weth_price_usd: string;
      };
      Insert: {
        created_at?: string;
        id?: number;
        ore_price_usd: string;
        timestamp: string;
        weth_price_usd: string;
      };
      Update: {
        created_at?: string;
        id?: number;
        ore_price_usd?: string;
        timestamp?: string;
        weth_price_usd?: string;
      };
      Relationships: [];
    };
    protocol_stats: {
      Row: {
        created_at: string;
        id: number;
        protocol_stats: Json;
        timestamp: string;
        updated_at: string;
      };
      Insert: {
        created_at?: string;
        id?: number;
        protocol_stats?: Json;
        timestamp: string;
        updated_at?: string;
      };
      Update: {
        created_at?: string;
        id?: number;
        protocol_stats?: Json;
        timestamp?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    rounds: {
      Row: {
        round_id: number;
        block_number: number | null;
        winner_take_all: boolean;
        winner_address: string | null;
        winners: number;
        deployed: number;
        vaulted: number;
        winnings: number;
        motherlode_hit: boolean;
        motherlode_value: number | null;
        motherlode_running: number;
        end_timestamp: string;
        created_at: string;
      };
      Insert: {
        round_id: number;
        block_number?: number | null;
        winner_take_all: boolean;
        winner_address?: string | null;
        winners: number;
        deployed: number;
        vaulted: number;
        winnings: number;
        motherlode_hit: boolean;
        motherlode_value?: number | null;
        motherlode_running: number;
        end_timestamp: string;
        created_at?: string;
      };
      Update: {
        round_id?: number;
        block_number?: number | null;
        winner_take_all?: boolean;
        winner_address?: string | null;
        winners?: number;
        deployed?: number;
        vaulted?: number;
        winnings?: number;
        motherlode_hit?: boolean;
        motherlode_value?: number | null;
        motherlode_running?: number;
        end_timestamp?: string;
        created_at?: string;
      };
      Relationships: [];
    };
    sync_metadata: {
      Row: {
        created_at: string;
        id: string;
        last_round_number: number | null;
        last_synced_at: string;
        next_cursor: string | null;
        updated_at: string;
      };
      Insert: {
        created_at?: string;
        id: string;
        last_round_number?: number | null;
        last_synced_at: string;
        next_cursor?: string | null;
        updated_at?: string;
      };
      Update: {
        created_at?: string;
        id?: string;
        last_round_number?: number | null;
        last_synced_at?: string;
        next_cursor?: string | null;
        updated_at?: string;
      };
      Relationships: [];
    };
  };
  Views: {
    latest_stats: {
      Row: {
        current_round: Json | null;
        motherlode_ore: string | null;
        ore_price_usd: string | null;
        weth_price_usd: string | null;
      };
      Relationships: [];
    };
  };
  Functions: Record<never, never>;
  Enums: Record<never, never>;
  CompositeTypes: Record<never, never>;
};

export type Database = {
  public: PublicSchema;
};

type PublicTables = Database['public']['Tables'];
type PublicViews = Database['public']['Views'];

export type TableName = keyof PublicTables;
export type ViewName = keyof PublicViews;

export type Tables<TName extends TableName> = PublicTables[TName]['Row'];
export type TablesInsert<TName extends TableName> = PublicTables[TName]['Insert'];
export type TablesUpdate<TName extends TableName> = PublicTables[TName]['Update'];
export type Views<TName extends ViewName> = PublicViews[TName]['Row'];
