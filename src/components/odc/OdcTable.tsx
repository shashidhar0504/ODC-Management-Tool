'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { OdcRecord, OdcStatus } from '@/lib/types';
import { deleteOdcRecord, updateOdcStatus } from '@/lib/odc-service';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OdcStatus }) {
  const map = {
    pending:  { icon: Clock,       cls: 'status-pending',  label: 'Pending'  },
    approved: { icon: CheckCircle, cls: 'status-approved', label: 'Approved' },
    rejected: { icon: XCircle,     cls: 'status-rejected', label: 'Rejected' },
  };
  const { icon: Icon, cls, label } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

// ─── View modal ───────────────────────────────────────────────────────────────
function OdcViewModal({
  record,
  onClose,
  onStatusChange,
}: {
  record: OdcRecord;
  onClose: () => void;
  onStatusChange: (id: string, status: OdcStatus) => void;
}) {
  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  return (
    <DialogContent
      className="w-full max-w-full sm:max-w-2xl max-h-[90dvh] overflow-y-auto rounded-none sm:rounded-xl"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <DialogHeader>
        <DialogTitle style={{ color: 'var(--brand-navy)' }}>{record.odc_name}</DialogTitle>
        <DialogDescription style={{ color: 'var(--brand-slate)' }}>
          {record.company_name} · Created {format(new Date(record.created_at), 'dd MMM yyyy, h:mm a')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        {/* Status row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-slate)' }}>Status:</span>
          <StatusBadge status={record.status} />
          <Select
            defaultValue={record.status}
            onValueChange={(v) => onStatusChange(record.id, v as OdcStatus)}
          >
            <SelectTrigger className="h-7 w-32 text-xs ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <hr style={{ borderColor: 'hsl(var(--border))' }} />

        {/* Financials */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Students', value: record.candidate_count?.toString() ?? '0' },
            { label: 'Stipend',  value: formatINR(record.stipend) },
            { label: 'Total',    value: formatINR(record.total_amount) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-md p-2 sm:p-3 text-center" style={{ background: 'rgba(184,150,78,0.07)', border: '1px solid rgba(184,150,78,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>{label}</p>
              <p className="text-xs sm:text-sm font-bold mt-0.5 break-all" style={{ color: 'var(--brand-navy)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Candidates */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--brand-slate)' }}>Candidates</p>
          <div className="flex flex-wrap gap-2">
            {record.candidates.map((c, i) => (
              <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(184,150,78,0.12)', color: 'var(--brand-navy)', border: '1px solid rgba(184,150,78,0.3)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Remarks */}
        {record.remarks && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--brand-slate)' }}>Remarks</p>
            <p className="text-sm rounded-md p-2.5" style={{ background: '#f9f9f9', color: 'var(--brand-navy)' }}>{record.remarks}</p>
          </div>
        )}

        {/* Documents */}
        {record.document_urls?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--brand-slate)' }}>Documents</p>
            <div className="space-y-1.5">
              {record.document_urls.map((url, i) => (
                url.startsWith('http') ? (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs underline block" style={{ color: 'var(--brand-brass)' }}>
                    Document {i + 1}
                  </a>
                ) : (
                  <span key={i} className="text-xs" style={{ color: 'var(--brand-slate)' }}>
                    Document {i + 1} (embedded)
                  </span>
                )
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        {(record.guider_signature || record.manager_signature) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Guider Signature',  src: record.guider_signature },
              { label: 'Manager Signature', src: record.manager_signature },
            ].map(({ label, src }) =>
              src ? (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--brand-slate)' }}>{label}</p>
                  <img src={src} alt={label} className="rounded-md border w-full" style={{ maxHeight: 100, objectFit: 'contain', background: '#fafafa' }} />
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({
  record,
  idx,
  onView,
  onDelete,
}: {
  record: OdcRecord;
  idx: number;
  onView: () => void;
  onDelete: () => void;
}) {
  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="border-b px-4 py-3 animate-fade-slide-up"
      style={{ borderColor: 'hsl(var(--border))', animationDelay: `${idx * 0.04}s` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--brand-navy)' }}>
            {record.odc_name}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--brand-slate)' }}>
            {record.company_name}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onView} title="View">
            <Eye size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7 hover:text-red-500 hover:bg-red-50" onClick={onDelete} title="Delete">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <StatusBadge status={record.status} />
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(184,150,78,0.1)', color: 'var(--brand-navy)' }}>
          {record.candidate_count ?? record.candidates?.length ?? 0} students
        </span>
        <span className="text-xs font-bold ml-auto" style={{ color: 'var(--brand-brass)' }}>
          {formatINR(record.total_amount)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────
interface OdcTableProps {
  records: OdcRecord[];
  onRefresh: () => void;
}

export default function OdcTable({ records, onRefresh }: OdcTableProps) {
  const [viewRecord, setViewRecord] = useState<OdcRecord | null>(null);

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const handleDelete = async (record: OdcRecord) => {
    if (!confirm(`Delete "${record.odc_name}"? This cannot be undone.`)) return;
    try {
      await deleteOdcRecord(record.id);
      toast.success('Record deleted');
      onRefresh();
    } catch (e: unknown) {
      toast.error('Delete failed', { description: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  const handleStatusChange = async (id: string, status: OdcStatus) => {
    try {
      await updateOdcStatus(id, status);
      toast.success(`Status updated to ${status}`);
      onRefresh();
    } catch {
      toast.error('Update failed');
    }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(184,150,78,0.08)' }}>
          <MoreHorizontal size={24} style={{ color: 'var(--brand-brass)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>No ODC records yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--brand-slate)' }}>Click &quot;+ New ODC&quot; to create the first record</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile view (card list, < lg) ── */}
      <div className="lg:hidden divide-y-0">
        {records.map((r, idx) => (
          <MobileCard
            key={r.id}
            record={r}
            idx={idx}
            onView={() => setViewRecord(r)}
            onDelete={() => handleDelete(r)}
          />
        ))}
      </div>

      {/* ── Desktop table (lg+) ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="odc-table w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
              {['#', 'Event Name', 'Company', 'Candidates', 'Stipend', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: 'var(--brand-slate)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr
                key={r.id}
                className="border-b transition-colors duration-100 animate-fade-slide-up"
                style={{ borderColor: 'hsl(var(--border))', animationDelay: `${idx * 0.04}s` }}
              >
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--brand-slate)' }}>{idx + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold" style={{ color: 'var(--brand-navy)' }}>{r.odc_name}</p>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--brand-slate)' }}>{r.company_name}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(184,150,78,0.10)', color: 'var(--brand-navy)' }}
                  >
                    {r.candidate_count ?? r.candidates?.length ?? 0} students
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--brand-navy)' }}>
                  {formatINR(r.stipend)}
                </td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--brand-brass)' }}>
                  {formatINR(r.total_amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--brand-slate)' }}>
                  {format(new Date(r.created_at), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setViewRecord(r)} title="View details">
                      <Eye size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(r)} title="Delete record">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── View modal ── */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        {viewRecord && (
          <OdcViewModal
            record={viewRecord}
            onClose={() => setViewRecord(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </Dialog>
    </>
  );
}
