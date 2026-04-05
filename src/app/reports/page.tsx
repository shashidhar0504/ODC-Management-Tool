'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, subMonths, isAfter, startOfMonth } from 'date-fns';
import {
  BarChart3, Download, RefreshCw, Filter, Menu,
  ChevronDown, ChevronUp, IndianRupee, Users, FileText, TrendingUp,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getOdcRecords } from '@/lib/odc-service';
import type { OdcRecord, OdcStatus } from '@/lib/types';
import { format as dfFormat } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

type DateRange = 'all' | 'month' | '3months';

function filterByDate(records: OdcRecord[], range: DateRange): OdcRecord[] {
  if (range === 'all') return records;
  const cutoff = range === 'month'
    ? startOfMonth(new Date())
    : subMonths(new Date(), 3);
  return records.filter(r => isAfter(new Date(r.created_at), cutoff));
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(records: OdcRecord[]) {
  const header = ['#', 'Event Name', 'Company', 'Candidates', 'Students', 'Stipend (INR)', 'Total (INR)', 'Status', 'Created'];
  const rows = records.map((r, i) => [
    i + 1,
    `"${r.odc_name}"`,
    `"${r.company_name}"`,
    `"${(r.candidates ?? []).join('; ')}"`,
    r.candidate_count ?? r.candidates?.length ?? 0,
    r.stipend,
    r.total_amount,
    r.status,
    dfFormat(new Date(r.created_at), 'dd/MM/yyyy'),
  ]);
  const csv = [header, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `odc-report-${dfFormat(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OdcStatus }) {
  const map = {
    pending:  { cls: 'status-pending',  label: 'Pending'  },
    approved: { cls: 'status-approved', label: 'Approved' },
    rejected: { cls: 'status-rejected', label: 'Rejected' },
  };
  const { cls, label } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Company accordion ────────────────────────────────────────────────────────
function CompanyGroup({ company, records }: { company: string; records: OdcRecord[] }) {
  const [open, setOpen] = useState(false);
  const total = records.reduce((s, r) => s + r.total_amount, 0);
  const students = records.reduce((s, r) => s + (r.candidate_count ?? r.candidates?.length ?? 0), 0);

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(184,150,78,0.1)' }}>
            <BarChart3 size={15} style={{ color: 'var(--brand-brass)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>{company}</p>
            <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>
              {records.length} ODC{records.length !== 1 ? 's' : ''} · {students} students · {formatINR(total)}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={15} style={{ color: 'var(--brand-slate)' }} /> : <ChevronDown size={15} style={{ color: 'var(--brand-slate)' }} />}
      </button>

      {open && (
        <div className="border-t divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {records.map((r) => (
            <div key={r.id} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>
                  {r.odc_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>
                  {format(new Date(r.created_at), 'dd MMM yyyy')} · {r.candidate_count ?? r.candidates?.length ?? 0} students
                </p>
              </div>
              <StatusBadge status={r.status} />
              <span className="text-xs font-bold ml-auto" style={{ color: 'var(--brand-brass)' }}>
                {formatINR(r.total_amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [records, setRecords] = useState<OdcRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | OdcStatus>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortField, setSortField] = useState<'created_at' | 'total_amount' | 'candidate_count'>('created_at');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await getOdcRecords());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter + sort
  const filtered = useMemo(() => {
    let r = filterByDate(records, dateRange);
    if (statusFilter !== 'all') r = r.filter(x => x.status === statusFilter);
    return [...r].sort((a, b) => {
      const av = sortField === 'candidate_count'
        ? (a.candidate_count ?? a.candidates?.length ?? 0)
        : sortField === 'total_amount' ? a.total_amount
        : new Date(a.created_at).getTime();
      const bv = sortField === 'candidate_count'
        ? (b.candidate_count ?? b.candidates?.length ?? 0)
        : sortField === 'total_amount' ? b.total_amount
        : new Date(b.created_at).getTime();
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [records, statusFilter, dateRange, sortField, sortDir]);

  // Summary stats
  const summaryStats = useMemo(() => ({
    count: filtered.length,
    students: filtered.reduce((s, r) => s + (r.candidate_count ?? r.candidates?.length ?? 0), 0),
    total: filtered.reduce((s, r) => s + r.total_amount, 0),
    avg: filtered.length ? filtered.reduce((s, r) => s + r.total_amount, 0) / filtered.length : 0,
  }), [filtered]);

  // By company
  const byCompany = useMemo(() => {
    const map: Record<string, OdcRecord[]> = {};
    filtered.forEach(r => {
      (map[r.company_name] = map[r.company_name] ?? []).push(r);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
      : null;

  return (
    <AuthGuard>
    <div className="flex min-h-screen" style={{ background: 'var(--brand-sand)' }}>
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 min-w-0 md:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b"
          style={{ background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(8px)', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
            <Button variant="ghost" size="icon" className="md:hidden -ml-1"
              onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} style={{ color: 'var(--brand-navy)' }} />
            </Button>
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--brand-navy)' }}>Reports</h1>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--brand-slate)' }}>
                Filter, analyse and export ODC records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={load} disabled={loading} title="Refresh">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button
                onClick={() => exportCSV(filtered)}
                size="sm"
                className="gap-1.5 font-semibold text-white text-xs"
                style={{ background: 'var(--brand-brass)' }}
                disabled={!filtered.length}
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5">
          {/* Filter bar */}
          <div className="bg-white rounded-xl border p-3 sm:p-4 flex flex-wrap gap-3 items-center"
            style={{ borderColor: 'hsl(var(--border))' }}>
            <Filter size={15} style={{ color: 'var(--brand-brass)' }} />
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs" style={{ color: 'var(--brand-slate)' }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: 'Total ODCs', value: summaryStats.count.toString(), color: 'var(--brand-navy)' },
              { icon: Users,    label: 'Students',   value: summaryStats.students.toString(), color: 'var(--brand-brass)' },
              { icon: IndianRupee, label: 'Total Disbursed', value: formatINR(summaryStats.total), color: '#10B981' },
              { icon: TrendingUp,  label: 'Avg per ODC',    value: formatINR(summaryStats.avg),   color: '#8B5CF6' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card animate-fade-slide-up">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} style={{ color }} />
                  <span className="text-xs" style={{ color: 'var(--brand-slate)' }}>{label}</span>
                </div>
                <p className="text-lg font-bold truncate" style={{ color: 'var(--brand-navy)' }}>{value}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--brand-brass)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border flex flex-col items-center justify-center py-16"
              style={{ borderColor: 'hsl(var(--border))' }}>
              <BarChart3 size={32} style={{ color: 'rgba(107,122,141,0.4)' }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>No records match your filters</p>
              <p className="text-xs mt-1" style={{ color: 'var(--brand-slate)' }}>Try adjusting the status or date range</p>
            </div>
          ) : (
            <>
              {/* Detailed table */}
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-4 py-3 border-b flex items-center gap-2"
                  style={{ borderColor: 'hsl(var(--border))' }}>
                  <FileText size={14} style={{ color: 'var(--brand-brass)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>Detailed Records</span>
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="odc-table w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                        {[
                          { label: '#', field: null },
                          { label: 'Event Name', field: null },
                          { label: 'Company', field: null },
                          { label: 'Students', field: 'candidate_count' },
                          { label: 'Total Amount', field: 'total_amount' },
                          { label: 'Status', field: null },
                          { label: 'Date', field: 'created_at' },
                        ].map(({ label, field }) => (
                          <th
                            key={label}
                            className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${field ? 'cursor-pointer hover:text-[var(--brand-brass)] select-none' : ''}`}
                            style={{ color: 'var(--brand-slate)' }}
                            onClick={() => field && toggleSort(field as typeof sortField)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              {field && <SortIcon field={field as typeof sortField} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, idx) => (
                        <tr key={r.id} className="border-b animate-fade-slide-up transition-colors"
                          style={{ borderColor: 'hsl(var(--border))', animationDelay: `${idx * 0.03}s` }}>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--brand-slate)' }}>{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm" style={{ color: 'var(--brand-navy)' }}>{r.odc_name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--brand-slate)' }}>{r.company_name}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className="inline-flex px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(184,150,78,0.1)', color: 'var(--brand-navy)' }}>
                              {r.candidate_count ?? r.candidates?.length ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--brand-brass)' }}>
                            {formatINR(r.total_amount)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--brand-slate)' }}>
                            {format(new Date(r.created_at), 'dd MMM yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                  {filtered.map((r, idx) => (
                    <div key={r.id} className="px-4 py-3 animate-fade-slide-up"
                      style={{ animationDelay: `${idx * 0.03}s` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--brand-navy)' }}>{r.odc_name}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--brand-slate)' }}>{r.company_name}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(184,150,78,0.1)', color: 'var(--brand-navy)' }}>
                          {r.candidate_count ?? r.candidates?.length ?? 0} students
                        </span>
                        <span className="text-xs" style={{ color: 'var(--brand-slate)' }}>
                          {format(new Date(r.created_at), 'dd MMM yyyy')}
                        </span>
                        <span className="text-xs font-bold ml-auto" style={{ color: 'var(--brand-brass)' }}>
                          {formatINR(r.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-company breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={15} style={{ color: 'var(--brand-brass)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>
                    By Company
                  </h2>
                </div>
                <div className="space-y-2">
                  {byCompany.map(([company, recs]) => (
                    <CompanyGroup key={company} company={company} records={recs} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
