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
      clients: {
        Row: {
          id: string
          ruc: string
          business_name: string
          commercial_name: string
          address: string
          district: string
          province: string
          salesperson_id: string | null
          transport: string | null
          transport_address: string | null
          transport_district: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ruc: string
          business_name: string
          commercial_name: string
          address: string
          district: string
          province: string
          salesperson_id?: string | null
          transport?: string | null
          transport_address?: string | null
          transport_district?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ruc?: string
          business_name?: string
          commercial_name?: string
          address?: string
          district?: string
          province?: string
          salesperson_id?: string | null
          transport?: string | null
          transport_address?: string | null
          transport_district?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string
          birthday: string | null
          cargo: string
          role: 'ADMINISTRADOR' | 'LOGISTICA' | 'ASESOR_VENTAS'
          must_change_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone: string
          birthday?: string | null
          cargo: string
          role: 'ADMINISTRADOR' | 'LOGISTICA' | 'ASESOR_VENTAS'
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          birthday?: string | null
          cargo?: string
          role?: 'ADMINISTRADOR' | 'LOGISTICA' | 'ASESOR_VENTAS'
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          ruc: string
          business_name: string
          commercial_name: string
          address: string
          district: string
          province: string
          salesperson_id: string | null
          transport: string | null
          transport_address: string | null
          transport_district: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ruc: string
          business_name: string
          commercial_name: string
          address: string
          district: string
          province: string
          salesperson_id?: string | null
          transport?: string | null
          transport_address?: string | null
          transport_district?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ruc?: string
          business_name?: string
          commercial_name?: string
          address?: string
          district?: string
          province?: string
          salesperson_id?: string | null
          transport?: string | null
          transport_address?: string | null
          transport_district?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}