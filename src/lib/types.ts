export type OdcStatus = 'pending' | 'approved' | 'rejected';
export type OdcPaymentStatus = 'pending' | 'received_from_company' | 'received_from_event_head';

export interface OdcCandidate {
  name: string;
  shift_status: 'pending' | 'completed';
  payment_status: 'unpaid' | 'paid';
}

export interface OdcRecord {
  id: string;
  company_name: string;
  odc_name: string;
  candidates: OdcCandidate[];
  candidate_count: number;
  stipend: number;
  total_amount: number;
  remarks?: string;
  document_urls: string[];
  guider_signature?: string;
  manager_signature?: string;
  status: OdcStatus;
  payment_status: OdcPaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface OdcFormData {
  company_name: string;
  odc_name: string;
  candidates: string[];
  stipend: number;
  total_amount: number;
  remarks?: string;
}
