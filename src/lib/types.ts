export type OdcStatus = 'pending' | 'approved' | 'rejected';

export interface OdcRecord {
  id: string;
  company_name: string;
  odc_name: string;
  candidates: string[];
  candidate_count: number;
  stipend: number;
  total_amount: number;
  remarks?: string;
  document_urls: string[];
  guider_signature?: string;
  manager_signature?: string;
  status: OdcStatus;
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
  document_urls: string[];
  guider_signature?: string;
  manager_signature?: string;
}
