export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  inkcre: {
    Tables: {
      block_embeddings: {
        Row: {
          embedding: string
          id: number
          updated_at: string | null
        }
        Insert: {
          embedding: string
          id: number
          updated_at?: string | null
        }
        Update: {
          embedding?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'block_embeddings_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'blocks'
            referencedColumns: ['id']
          },
        ]
      }
      blocks: {
        Row: {
          content: string
          created_at: string | null
          id: number
          resolver: string
          storage: number | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          resolver: string
          storage?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          resolver?: string
          storage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'blocks_storage_fkey'
            columns: ['storage']
            isOneToOne: false
            referencedRelation: 'storages'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          config: Json
          config_schema: Json
          created_at: string | null
          id: string
          labels: string[] | null
          name: string
          rest_api_url: string | null
        }
        Insert: {
          config?: Json
          config_schema: Json
          created_at?: string | null
          id: string
          labels?: string[] | null
          name: string
          rest_api_url?: string | null
        }
        Update: {
          config?: Json
          config_schema?: Json
          created_at?: string | null
          id?: string
          labels?: string[] | null
          name?: string
          rest_api_url?: string | null
        }
        Relationships: []
      }
      extensions: {
        Row: {
          config: Json | null
          config_schema: Json | null
          enabled: string[]
          id: string
          nickname: string | null
          version: string
        }
        Insert: {
          config?: Json | null
          config_schema?: Json | null
          enabled?: string[]
          id: string
          nickname?: string | null
          version: string
        }
        Update: {
          config?: Json | null
          config_schema?: Json | null
          enabled?: string[]
          id?: string
          nickname?: string | null
          version?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          attributes: Json
          body: string
          id: number
          severity_number: number
          severity_text: string
          span_id: string | null
          timestamp: string
          trace_id: string | null
        }
        Insert: {
          attributes?: Json
          body: string
          id?: number
          severity_number: number
          severity_text: string
          span_id?: string | null
          timestamp?: string
          trace_id?: string | null
        }
        Update: {
          attributes?: Json
          body?: string
          id?: number
          severity_number?: number
          severity_text?: string
          span_id?: string | null
          timestamp?: string
          trace_id?: string | null
        }
        Relationships: []
      }
      relation_embeddings: {
        Row: {
          embedding: string
          id: number
          updated_at: string | null
        }
        Insert: {
          embedding: string
          id: number
          updated_at?: string | null
        }
        Update: {
          embedding?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'relation_embeddings_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'relations'
            referencedColumns: ['id']
          },
        ]
      }
      relations: {
        Row: {
          content: string
          from_: number | null
          id: number
          to_: number | null
          updated_at: string | null
        }
        Insert: {
          content: string
          from_?: number | null
          id?: number
          to_?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          from_?: number | null
          id?: number
          to_?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'relations_from__fkey'
            columns: ['from_']
            isOneToOne: false
            referencedRelation: 'blocks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'relations_to__fkey'
            columns: ['to_']
            isOneToOne: false
            referencedRelation: 'blocks'
            referencedColumns: ['id']
          },
        ]
      }
      sources: {
        Row: {
          collect_at: Json | null
          config: Json
          id: number
          nickname: string | null
          state: Json
          type: string | null
        }
        Insert: {
          collect_at?: Json | null
          config?: Json
          id?: number
          nickname?: string | null
          state?: Json
          type?: string | null
        }
        Update: {
          collect_at?: Json | null
          config?: Json
          id?: number
          nickname?: string | null
          state?: Json
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sources_type_fkey'
            columns: ['type']
            isOneToOne: false
            referencedRelation: 'sources_types'
            referencedColumns: ['id']
          },
        ]
      }
      sources_collect_jobs: {
        Row: {
          closed_at: string | null
          config: Json | null
          created_at: string | null
          id: number
          source: number | null
          started_at: string | null
          state: Json | null
          status: Database['inkcre']['Enums']['sourcecollectjobstatus']
        }
        Insert: {
          closed_at?: string | null
          config?: Json | null
          created_at?: string | null
          id?: number
          source?: number | null
          started_at?: string | null
          state?: Json | null
          status?: Database['inkcre']['Enums']['sourcecollectjobstatus']
        }
        Update: {
          closed_at?: string | null
          config?: Json | null
          created_at?: string | null
          id?: number
          source?: number | null
          started_at?: string | null
          state?: Json | null
          status?: Database['inkcre']['Enums']['sourcecollectjobstatus']
        }
        Relationships: [
          {
            foreignKeyName: 'sources_collect_jobs_source_fkey'
            columns: ['source']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
      sources_types: {
        Row: {
          config_schema: Json
          description: string | null
          id: string
        }
        Insert: {
          config_schema?: Json
          description?: string | null
          id: string
        }
        Update: {
          config_schema?: Json
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      storage_types: {
        Row: {
          config_schema: Json
          description: string
          id: string
        }
        Insert: {
          config_schema?: Json
          description: string
          id: string
        }
        Update: {
          config_schema?: Json
          description?: string
          id?: string
        }
        Relationships: []
      }
      storages: {
        Row: {
          config: Json
          id: number
          nickname: string | null
          type: string
        }
        Insert: {
          config?: Json
          id?: number
          nickname?: string | null
          type: string
        }
        Update: {
          config?: Json
          id?: number
          nickname?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'storages_type_fkey'
            columns: ['type']
            isOneToOne: false
            referencedRelation: 'storage_types'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sourcecollectjobstatus: 'pending' | 'running' | 'finished' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  inkcre: {
    Enums: {
      sourcecollectjobstatus: ['pending', 'running', 'finished', 'failed'],
    },
  },
} as const
