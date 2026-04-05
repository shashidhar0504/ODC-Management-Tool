'use client';

import { useState } from 'react';
import {
  Settings, Building2, Database, Bell, ShieldAlert,
  Info, Save, RotateCcw, CheckCircle2, AlertCircle,
  Download, Menu, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/lib/use-settings';
import { getOdcRecords } from '@/lib/odc-service';
import { supabase } from '@/lib/supabase';

// ─── Section card ─────────────────────────────────────────────────────────────
function SettingsSection({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden animate-fade-slide-up"
      style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(184,150,78,0.12)' }}>
            <Icon size={15} style={{ color: 'var(--brand-brass)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--brand-slate)' }}>{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--brand-navy)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--brand-slate)' }}>{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none"
        style={{ background: value ? 'var(--brand-brass)' : 'hsl(var(--border))' }}
      >
        <span
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: value ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function FormField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--brand-navy)', letterSpacing: '0.07em' }}>
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { settings, save, reset, loaded } = useSettings();
  const [localOrg, setLocalOrg] = useState('');
  const [localApp, setLocalApp] = useState('');
  const [orgReady, setOrgReady] = useState(false);

  // Initialize local form state from settings once loaded
  const [initialized, setInitialized] = useState(false);
  if (loaded && !initialized) {
    setLocalOrg(settings.orgName);
    setLocalApp(settings.appName);
    setInitialized(true);
  }

  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveGeneral = () => {
    setSaving(true);
    save({ orgName: localOrg, appName: localApp });
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved successfully');
    }, 400);
  };

  const handleTestConnection = async () => {
    setConnStatus('testing');
    try {
      const { error } = await supabase.from('odc_records').select('id').limit(1);
      setConnStatus(error ? 'fail' : 'ok');
    } catch {
      setConnStatus('fail');
    }
  };

  const handleExportAll = async () => {
    try {
      const records = await getOdcRecords();
      if (!records.length) { toast.info('No records to export'); return; }
      const header = ['#', 'Event', 'Company', 'Candidates', 'Students', 'Stipend', 'Total', 'Status', 'Created'];
      const rows = records.map((r, i) => [
        i + 1,
        `"${r.odc_name}"`,
        `"${r.company_name}"`,
        `"${(r.candidates ?? []).join('; ')}"`,
        r.candidate_count ?? r.candidates?.length ?? 0,
        r.stipend, r.total_amount, r.status,
        format(new Date(r.created_at), 'dd/MM/yyyy'),
      ]);
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `odc-all-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${records.length} records`);
    } catch {
      toast.error('Export failed');
    }
  };

  const handleResetPrefs = () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    reset();
    setLocalOrg('Hotel Management');
    setLocalApp('ODC Manager');
    toast.success('Settings reset to defaults');
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const maskedKey   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12)}••••••••••••`
    : '(not set)';

  return (
    <AuthGuard developerOnly>
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
              <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--brand-navy)' }}>Settings</h1>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--brand-slate)' }}>
                Configure your ODC Management System
              </p>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5 max-w-2xl">

          {/* General */}
          <SettingsSection icon={Building2} title="General" subtitle="Organisation and application identity">
            <FormField label="Organisation Name" id="orgName">
              <Input
                id="orgName"
                value={localOrg}
                onChange={e => setLocalOrg(e.target.value)}
                placeholder="e.g. Grand Hyatt Hotel"
                className="bg-white"
              />
            </FormField>
            <FormField label="Application Name" id="appName">
              <Input
                id="appName"
                value={localApp}
                onChange={e => setLocalApp(e.target.value)}
                placeholder="e.g. ODC Manager"
                className="bg-white"
              />
            </FormField>
            <FormField label="Currency Display" id="currency">
              <div
                className="flex items-center h-10 px-3 rounded-md text-sm"
                style={{ background: 'rgba(184,150,78,0.07)', border: '1px solid rgba(184,150,78,0.25)', color: 'var(--brand-slate)' }}>
                Indian Rupee (₹ · en-IN) — fixed
              </div>
            </FormField>
            <Button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="gap-2 text-white font-semibold"
              style={{ background: 'var(--brand-brass)' }}
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save General Settings'}
            </Button>
          </SettingsSection>

          {/* Supabase connection */}
          <SettingsSection icon={Database} title="Supabase Connection" subtitle="Database and storage configuration">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--brand-slate)', letterSpacing: '0.07em' }}>
                  Project URL
                </p>
                <div className="flex items-center h-10 px-3 rounded-md text-xs font-mono"
                  style={{ background: '#f9f9f9', border: '1px solid hsl(var(--border))', color: 'var(--brand-navy)' }}>
                  {supabaseUrl || '(not set — check .env.local)'}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--brand-slate)', letterSpacing: '0.07em' }}>
                  Anon Key (masked)
                </p>
                <div className="flex items-center h-10 px-3 rounded-md text-xs font-mono"
                  style={{ background: '#f9f9f9', border: '1px solid hsl(var(--border))', color: 'var(--brand-slate)' }}>
                  {maskedKey}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={handleTestConnection}
                disabled={connStatus === 'testing'}
              >
                {connStatus === 'testing' ? (
                  <><Wifi size={13} className="animate-pulse" /> Testing…</>
                ) : (
                  <><Wifi size={13} /> Test Connection</>
                )}
              </Button>

              {connStatus === 'ok' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={13} /> Connected successfully
                </span>
              )}
              {connStatus === 'fail' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                  <WifiOff size={13} /> Connection failed — check .env.local
                </span>
              )}
            </div>

            <div className="rounded-md px-3 py-2.5 text-xs"
              style={{ background: 'rgba(184,150,78,0.07)', border: '1px solid rgba(184,150,78,0.2)', color: 'var(--brand-slate)' }}>
              <strong style={{ color: 'var(--brand-navy)' }}>Tip:</strong> Edit{' '}
              <code className="font-mono text-xs">.env.local</code> to update{' '}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Restart the dev server after changes.
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={Bell} title="Notification Preferences" subtitle="Control in-app feedback behaviour">
            <ToggleRow
              label="Show toast on submit"
              description="Display a success notification after creating or updating a record"
              value={settings.showToastOnSubmit}
              onChange={v => save({ showToastOnSubmit: v })}
            />
            <div style={{ height: 1, background: 'hsl(var(--border))' }} />
            <ToggleRow
              label="Confirm before delete"
              description="Show a confirmation prompt before permanently deleting a record"
              value={settings.confirmBeforeDelete}
              onChange={v => save({ confirmBeforeDelete: v })}
            />
          </SettingsSection>

          {/* Data management */}
          <SettingsSection icon={ShieldAlert} title="Data Management" subtitle="Export and reset application data">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>Export All Records</p>
                <p className="text-xs mb-2" style={{ color: 'var(--brand-slate)' }}>
                  Download every ODC record in your database as a CSV file.
                </p>
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportAll}>
                  <Download size={13} /> Export All as CSV
                </Button>
              </div>

              <div style={{ height: 1, background: 'hsl(var(--border))' }} />

              <div>
                <p className="text-sm font-medium mb-1 text-red-600">Reset Preferences</p>
                <p className="text-xs mb-2" style={{ color: 'var(--brand-slate)' }}>
                  Clear all local settings and restore defaults. This does <strong>not</strong> delete any database records.
                </p>
                <Button variant="outline" size="sm" className="gap-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleResetPrefs}>
                  <RotateCcw size={13} /> Reset to Defaults
                </Button>
              </div>
            </div>
          </SettingsSection>

          {/* About */}
          <SettingsSection icon={Info} title="About" subtitle="Application information">
            <div className="space-y-2">
              {[
                { label: 'Application', value: 'ODC Manager' },
                { label: 'Version',     value: '1.0.0' },
                { label: 'Framework',   value: 'Next.js 16 + React 19' },
                { label: 'Database',    value: 'Supabase (PostgreSQL)' },
                { label: 'UI Library',  value: 'shadcn/ui + Tailwind CSS v4' },
                { label: 'Theme',       value: 'Sand & Slate' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs py-1 border-b last:border-0"
                  style={{ borderColor: 'hsl(var(--border))' }}>
                  <span style={{ color: 'var(--brand-slate)' }}>{label}</span>
                  <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>{value}</span>
                </div>
              ))}
            </div>
          </SettingsSection>
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
