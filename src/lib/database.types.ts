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
    }
  }
}