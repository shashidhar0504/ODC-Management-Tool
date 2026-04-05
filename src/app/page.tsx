'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Menu, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/layout/Sidebar';
import StatsCards from '@/components/odc/StatsCards';
import OdcTable from '@/components/odc/OdcTable';
import OdcFormDialog from '@/components/odc/OdcFormDialog';
import SetupBanner from '@/components/odc/SetupBanner';
import { getOdcRecords, getOdcStats } from '@/lib/odc-service';
import { supabase } from '@/lib/supabase';
import type { OdcRecord } from '@/lib/types';

export default function DashboardPage() {
  const [records, setRecords] = useState<OdcRecord[]>([]);
  const [filtered, setFiltered] = useState<OdcRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, totalStudents: 0, thisMonth: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tableReady, setTableReady] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // mobile search toggle

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { error: probeErr } = await supabase
        .from('odc_records')
        .select('id')
        .limit(1);
      setTableReady(!probeErr);

      const [recs, st] = await Promise.all([getOdcRecords(), getOdcStats()]);
      setRecords(recs);
      setFiltered(recs);
      setStats(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) { setFiltered(records); return; }
    const q = search.toLowerCase();
    setFiltered(
      records.filter(
        (r) =>
          r.odc_name.toLowerCase().includes(q) ||
          r.company_name.toLowerCase().includes(q) ||
          r.candidates.some((c) => c.toLowerCase().includes(q))
      )
    );
  }, [search, records]);

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  return (
    <AuthGuard>
    <div className="flex min-h-screen" style={{ background: 'var(--brand-sand)' }}>
      {/* Sidebar — passes mobile state */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content — md+ has left offset, mobile is full-width */}
      <main className="flex-1 min-w-0 md:ml-60 transition-all duration-300">

        {/* ── Top header ── */}
        <header
          className="sticky top-0 z-20 border-b"
          style={{
            background: 'rgba(245,240,232,0.97)',
            backdropFilter: 'blur(8px)',
            borderColor: 'hsl(var(--border))',
          }}
        >
          {/* Main header row */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden flex-shrink-0 -ml-1"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} style={{ color: 'var(--brand-navy)' }} />
            </Button>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: 'var(--brand-navy)' }}>
                ODC Management
              </h1>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--brand-slate)' }}>
                On-Duty Certificate records for student candidates
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Mobile search toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                {searchOpen ? <X size={16} /> : <Search size={16} />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={load}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>

              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-1.5 sm:gap-2 font-semibold text-white text-xs sm:text-sm"
                style={{ background: 'var(--brand-brass)' }}
              >
                <Plus size={15} />
                <span className="hidden xs:inline sm:inline">New ODC</span>
                <span className="xs:hidden sm:hidden">New</span>
              </Button>
            </div>
          </div>

          {/* Mobile search bar — expands below header */}
          {searchOpen && (
            <div className="px-4 pb-3 sm:hidden">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--brand-slate)' }}
                />
                <Input
                  placeholder="Search by event, company, candidate…"
                  className="pl-8 h-8 text-xs bg-white w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}
        </header>

        {/* ── Page content ── */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Setup banner */}
          <SetupBanner tableExists={tableReady} />

          {/* Stats cards */}
          <StatsCards {...stats} />

          {/* Table section */}
          <div
            className="bg-white rounded-xl border animate-fade-slide-up"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            {/* Table toolbar */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              {/* Desktop search */}
              <div className="relative flex-1 max-w-xs hidden sm:block">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--brand-slate)' }}
                />
                <Input
                  placeholder="Search by event, company, candidate…"
                  className="pl-8 h-8 text-xs bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <span className="text-xs sm:ml-auto" style={{ color: 'var(--brand-slate)' }}>
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Table / loading */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--brand-brass)' }} />
              </div>
            ) : (
              <OdcTable records={filtered} onRefresh={load} />
            )}
          </div>
        </div>
      </main>

      {/* New ODC dialog */}
      <OdcFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
      />
    </div>
    </AuthGuard>
  );
}
