import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PaymentDocument, PaymentDocumentStatus } from '../lib/types';

type PaymentStats = {
  totalPending: number;
  totalOverdue: number;
  totalPartiallyPaid: number;
  totalPaid: number;
  countPending: number;
  countOverdue: number;
  countPartiallyPaid: number;
  countPaid: number;
};

type PaymentStore = {
  paymentDocuments: PaymentDocument[];
  stats: PaymentStats | null;
  isLoading: boolean;
  error: string | null;

  getPaymentDocuments: (filters?: {
    clientId?: string;
    status?: PaymentDocumentStatus;
    dueDateFrom?: string;
    dueDateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    salespersonId?: string;
  }) => Promise<void>;

  updatePaymentStatus: (
    installmentId: string,
    paidAmount: number,
    paymentDate: string,
    notes?: string
  ) => Promise<void>;

  getPaymentStats: () => Promise<void>;

  updateOverdueDocuments: () => Promise<void>;
};

const mapInstallmentRow = (row: any): PaymentDocument => ({
  id: row.id,
  orderId: row.order_id,
  installmentNumber: row.installment_number,
  amount: parseFloat(row.amount),
  dueDate: row.due_date,
  daysDue: row.days_due,
  status: row.status as PaymentDocumentStatus,
  paidAmount: parseFloat(row.paid_amount || 0),
  paymentDate: row.payment_date,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  order: row.orders ? {
    id: row.orders.id,
    clientId: row.orders.client_id,
    salespersonId: row.orders.salesperson_id,
    status: row.orders.status,
    subtotal: parseFloat(row.orders.subtotal),
    igv: parseFloat(row.orders.igv),
    total: parseFloat(row.orders.total),
    observations: row.orders.observations,
    paymentType: row.orders.payment_type,
    creditType: row.orders.credit_type,
    installments: row.orders.installments,
    createdBy: row.orders.created_by,
    createdAt: row.orders.created_at,
    updatedAt: row.orders.updated_at,
    items: [],
  } : undefined,
  client: row.orders?.clients ? {
    id: row.orders.clients.id,
    ruc: row.orders.clients.ruc,
    businessName: row.orders.clients.business_name,
    commercialName: row.orders.clients.commercial_name,
    contactName: row.orders.clients.contact_name,
    contactPhone: row.orders.clients.contact_phone,
    contactName2: row.orders.clients.contact_name_2,
    contactPhone2: row.orders.clients.contact_phone_2,
    address: row.orders.clients.address,
    district: row.orders.clients.district,
    province: row.orders.clients.province,
    reference: row.orders.clients.reference,
    salespersonId: row.orders.clients.salesperson_id,
    transport: row.orders.clients.transport,
    transportAddress: row.orders.clients.transport_address,
    transportDistrict: row.orders.clients.transport_district,
    createdAt: row.orders.clients.created_at,
    updatedAt: row.orders.clients.updated_at,
  } : undefined,
  salesperson: row.orders?.salesperson_profile ? {
    id: row.orders.salesperson_profile.id,
    fullName: row.orders.salesperson_profile.full_name,
    email: row.orders.salesperson_profile.email,
    phone: row.orders.salesperson_profile.phone,
    birthday: row.orders.salesperson_profile.birthday,
    cargo: row.orders.salesperson_profile.cargo,
    role: row.orders.salesperson_profile.role,
    avatar: row.orders.salesperson_profile.avatar,
  } : undefined,
});

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  paymentDocuments: [],
  stats: null,
  isLoading: false,
  error: null,

  getPaymentDocuments: async (filters) => {
    set({ isLoading: true, error: null });

    try {
      await get().updateOverdueDocuments();

      let query = supabase
        .from('order_installments')
        .select(`
          *,
          orders (
            *,
            clients (*),
            salesperson_profile:profiles!orders_salesperson_id_fkey (*)
          )
        `)
        .order('due_date', { ascending: true });

      if (filters?.clientId) {
        query = query.eq('orders.client_id', filters.clientId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }

      if (filters?.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      if (filters?.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }

      if (filters?.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }

      if (filters?.salespersonId) {
        query = query.eq('orders.salesperson_id', filters.salespersonId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedDocuments = (data || []).map(mapInstallmentRow);

      set({
        paymentDocuments: mappedDocuments,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading payment documents:', error);
      set({
        error: error instanceof Error ? error.message : 'Error al cargar documentos de pago',
        isLoading: false
      });
    }
  },

  updatePaymentStatus: async (installmentId, paidAmount, paymentDate, notes) => {
    set({ isLoading: true, error: null });

    try {
      const installment = get().paymentDocuments.find(d => d.id === installmentId);
      if (!installment) {
        throw new Error('Documento no encontrado');
      }

      const totalPaid = paidAmount;
      let newStatus: PaymentDocumentStatus;

      if (totalPaid >= installment.amount) {
        newStatus = PaymentDocumentStatus.PAGADA;
      } else if (totalPaid > 0) {
        newStatus = PaymentDocumentStatus.PAGADA_PARCIAL;
      } else {
        const today = new Date();
        const dueDate = new Date(installment.dueDate);
        newStatus = dueDate < today ? PaymentDocumentStatus.VENCIDA : PaymentDocumentStatus.PENDIENTE;
      }

      const { error } = await supabase
        .from('order_installments')
        .update({
          paid_amount: paidAmount,
          payment_date: paymentDate,
          status: newStatus,
          notes: notes || null,
        })
        .eq('id', installmentId);

      if (error) throw error;

      await get().getPaymentDocuments();
      await get().getPaymentStats();

      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating payment status:', error);
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar estado de pago',
        isLoading: false
      });
      throw error;
    }
  },

  getPaymentStats: async () => {
    try {
      const { data, error } = await supabase
        .from('order_installments')
        .select('status, amount, paid_amount');

      if (error) throw error;

      const stats: PaymentStats = {
        totalPending: 0,
        totalOverdue: 0,
        totalPartiallyPaid: 0,
        totalPaid: 0,
        countPending: 0,
        countOverdue: 0,
        countPartiallyPaid: 0,
        countPaid: 0,
      };

      (data || []).forEach((doc) => {
        const amount = parseFloat(doc.amount);
        const paidAmount = parseFloat(doc.paid_amount || 0);
        const remaining = amount - paidAmount;

        switch (doc.status) {
          case PaymentDocumentStatus.PENDIENTE:
            stats.totalPending += remaining;
            stats.countPending++;
            break;
          case PaymentDocumentStatus.VENCIDA:
            stats.totalOverdue += remaining;
            stats.countOverdue++;
            break;
          case PaymentDocumentStatus.PAGADA_PARCIAL:
            stats.totalPartiallyPaid += remaining;
            stats.countPartiallyPaid++;
            break;
          case PaymentDocumentStatus.PAGADA:
            stats.totalPaid += amount;
            stats.countPaid++;
            break;
        }
      });

      set({ stats });
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  },

  updateOverdueDocuments: async () => {
    try {
      await supabase.rpc('update_installment_status');
    } catch (error) {
      console.error('Error updating overdue documents:', error);
    }
  },
}));
