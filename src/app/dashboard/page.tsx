'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  TrendingUp, Users, Clock, CalendarCheck, ArrowRight, Plus,
  CheckCircle, XCircle, Building2, RefreshCw, Activity,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import OdcFormDialog from '@/components/odc/OdcFormDialog';
import { getOdcRecords, getOdcStats } from '@/lib/odc-service';
import type { OdcRecord } from '@/lib/types';
import { Menu } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── Monthly bar chart (pure CSS) ────────────────────────────────────────────
function MonthlyChart({ records }: { records: OdcRecord[] }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const count = records.filter(r =>
      isWithinInterval(new Date(r.created_at), { start, end })
    ).length;
    return { label: format(d, 'MMM'), count };
  });

  const max = Math.max(...months.map(m => m.count), 1);

  return (
    <div className="flex items-end gap-2 h-28">
      {months.map(({ label, count }) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: 'var(--brand-navy)' }}>
            {count > 0 ? count : ''}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{
              height: `${Math.max((count / max) * 80, count > 0 ? 8 : 4)}px`,
              background: count > 0
                ? 'linear-gradient(to top, var(--brand-brass), var(--brand-brass-light))'
                : 'rgba(107,122,141,0.15)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--brand-slate)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Status donut ─────────────────────────────────────────────────────────────
function StatusBreakdown({ records }: { records: OdcRecord[] }) {
  const total = records.length || 1;
  const approved = records.filter(r => r.status === 'approved').length;
  const pending  = records.filter(r => r.status === 'pending').length;
  const rejected = records.filter(r => r.status === 'rejected').length;

  const items = [
    { label: 'Approved', count: approved, color: '#10B981', bg: '#D1FAE5' },
    { label: 'Pending',  count: pending,  color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Rejected', count: rejected, color: '#EF4444', bg: '#FEE2E2' },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ label, count, color, bg }) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--brand-slate)' }}>{label}</span>
            <span className="font-bold" style={{ color: 'var(--brand-navy)' }}>
              {count} <span style={{ color: 'var(--brand-slate)', fontWeight: 400 }}>
                ({Math.round((count / total) * 100)}%)
              </span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: bg }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(count / total) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Top companies ────────────────────────────────────────────────────────────
function TopCompanies({ records }: { records: OdcRecord[] }) {
  const map: Record<string, { count: number; total: number }> = {};
  records.forEach(r => {
    if (!map[r.company_name]) map[r.company_name] = { count: 0, total: 0 };
    map[r.company_name].count++;
    map[r.company_name].total += r.total_amount;
  });

  const sorted = Object.entries(map)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  if (!sorted.length) return (
    <p className="text-xs text-center py-4" style={{ color: 'var(--brand-slate)' }}>No data yet</p>
  );

  return (
    <div className="space-y-2">
      {sorted.map(([name, { count, total }], i) => (
        <div key={name} className="flex items-center gap-3">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(184,150,78,0.12)', color: 'var(--brand-brass)' }}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>{name}</p>
            <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>{count} ODC{count !== 1 ? 's' : ''}</p>
          </div>
          <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--brand-brass)' }}>
            {formatINR(total)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Recent activity ──────────────────────────────────────────────────────────
function RecentActivity({ records }: { records: OdcRecord[] }) {
  const recent = [...records]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const statusIcon: Record<string, React.ElementType> = {
    approved: CheckCircle,
    rejected: XCircle,
    pending: Clock,
  };
  const statusColor: Record<string, string> = {
    approved: '#10B981',
    rejected: '#EF4444',
    pending: '#F59E0B',
  };

  if (!recent.length) return (
    <p className="text-xs text-center py-4" style={{ color: 'var(--brand-slate)' }}>No activity yet</p>
  );

  return (
    <div className="space-y-3">
      {recent.map((r) => {
        const Icon = statusIcon[r.status] ?? Clock;
        const color = statusColor[r.status] ?? '#F59E0B';
        return (
          <div key={r.id} className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${color}15` }}
            >
              <Icon size={13} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--brand-navy)' }}>
                {r.odc_name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--brand-slate)' }}>
                {r.company_name} · {r.candidate_count ?? r.candidates?.length ?? 0} students
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs font-bold" style={{ color: 'var(--brand-brass)' }}>
                {formatINR(r.total_amount)}
              </p>
              <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>
                {format(new Date(r.created_at), 'dd MMM')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function BigStatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="stat-card animate-fade-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#D1FAE5', color: '#065F46' }}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--brand-navy)' }}>{value}</p>
      <p className="text-sm font-medium mt-1" style={{ color: 'var(--brand-navy)' }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--brand-slate)' }}>{sub}</p>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, action }: {
  title: string; icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: 'var(--brand-brass)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>{title}</span>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [records, setRecords] = useState<OdcRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, totalStudents: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, st] = await Promise.all([getOdcRecords(), getOdcStats()]);
      setRecords(recs);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalDisbursed = records.reduce((s, r) => s + (r.total_amount ?? 0), 0);

  return (
    <AuthGuard>
    <div className="flex min-h-screen" style={{ background: 'var(--brand-sand)' }}>
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 min-w-0 md:ml-60">
        {/* Header */}
        <header
          className="sticky top-0 z-20 border-b"
          style={{ background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(8px)', borderColor: 'hsl(var(--border))' }}
        >
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
            <Button variant="ghost" size="icon" className="md:hidden -ml-1"
              onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} style={{ color: 'var(--brand-navy)' }} />
            </Button>
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--brand-navy)' }}>Dashboard</h1>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--brand-slate)' }}>
                Overview of all ODC activity and key metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={load} disabled={loading} title="Refresh">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-1.5 font-semibold text-white text-xs sm:text-sm"
                style={{ background: 'var(--brand-brass)' }}
              >
                <Plus size={15} />
                <span className="hidden sm:inline">New ODC</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--brand-brass)' }} />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <BigStatCard label="Total ODC Records" value={stats.total} sub="All time" icon={TrendingUp} color="var(--brand-navy)" />
                <BigStatCard label="Students Enrolled" value={stats.totalStudents} sub="Across all ODCs" icon={Users} color="var(--brand-brass)" />
                <BigStatCard label="Pending Approvals" value={stats.pending} sub="Awaiting sign-off" icon={Clock} color="#F59E0B" />
                <BigStatCard
                  label="Total Disbursed"
                  value={formatINR(totalDisbursed)}
                  sub="All time stipends"
                  icon={CalendarCheck}
                  color="#10B981"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Monthly chart */}
                <div className="lg:col-span-2">
                  <SectionCard title="Monthly ODC Records" icon={Activity}>
                    {records.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: 'var(--brand-slate)' }}>
                        No records yet — create your first ODC to see trends here.
                      </p>
                    ) : (
                      <MonthlyChart records={records} />
                    )}
                  </SectionCard>
                </div>

                {/* Status breakdown */}
                <SectionCard title="Status Breakdown" icon={CheckCircle}>
                  <StatusBreakdown records={records} />
                  <div className="mt-4 pt-3 border-t flex justify-between text-xs"
                    style={{ borderColor: 'hsl(var(--border))' }}>
                    <span style={{ color: 'var(--brand-slate)' }}>Total</span>
                    <span className="font-bold" style={{ color: 'var(--brand-navy)' }}>{records.length} ODCs</span>
                  </div>
                </SectionCard>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* Recent activity */}
                <SectionCard
                  title="Recent Activity"
                  icon={CalendarCheck}
                  action={
                    <Link href="/" className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: 'var(--brand-brass)' }}>
                      View all <ArrowRight size={12} />
                    </Link>
                  }
                >
                  <RecentActivity records={records} />
                </SectionCard>

                {/* Top companies */}
                <SectionCard title="Top Companies" icon={Building2}>
                  <TopCompanies records={records} />
                </SectionCard>
              </div>

              {/* Quick actions */}
              <div
                className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                style={{ background: 'var(--brand-navy)' }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--brand-sand)' }}>Quick Actions</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
                    Manage records and view detailed reports
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setDialogOpen(true)} size="sm"
                    className="text-white text-xs gap-1.5 font-semibold"
                    style={{ background: 'var(--brand-brass)' }}>
                    <Plus size={14} /> New ODC
                  </Button>
                  <Link href="/reports">
                    <Button variant="outline" size="sm"
                      className="text-xs gap-1.5 border-white/20 hover:bg-white/10"
                      style={{ color: 'var(--brand-sand)', background: 'transparent' }}>
                      View Reports <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <OdcFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={load} />
    </div>
    </AuthGuard>
  );
}
