'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Building2, CalendarDays, Users, IndianRupee, FileInput, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import TagInput from './TagInput';
import FileUpload from './FileUpload';
import SignaturePad from './SignaturePad';
import { createOdcRecord } from '@/lib/odc-service';

// ─── Validation Schema ───────────────────────────────────────────────────────
const schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  odc_name: z.string().min(1, 'ODC Event name is required'),
  candidates: z.array(z.string()).min(1, 'Add at least one candidate'),
  stipend: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
    message: 'Stipend must be a positive number',
  }),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;



interface OdcFormProps {
  onSuccess?: () => void;
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(184,150,78,0.12)' }}
      >
        <Icon size={15} style={{ color: 'var(--brand-brass)' }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>{title}</p>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--brand-slate)' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, error, children, hint }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--brand-navy)', letterSpacing: '0.07em' }}
      >
        {label}
        {required && <span className="ml-1 text-[var(--brand-brass)]">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Read-only computed display ────────────────────────────────────────────────
function ComputedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--brand-navy)', letterSpacing: '0.07em' }}
      >
        {label}
      </Label>
      <div
        className="flex items-center h-10 px-3 rounded-md text-sm font-semibold"
        style={{
          background: 'rgba(184,150,78,0.07)',
          border: '1px solid rgba(184,150,78,0.25)',
          color: 'var(--brand-navy)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OdcForm({ onSuccess }: OdcFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [guiderSig, setGuiderSig] = useState<string | null>(null);
  const [managerSig, setManagerSig] = useState<string | null>(null);
  const [sigErrors, setSigErrors] = useState<{ guider?: string; manager?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { candidates: [], stipend: '', remarks: '' },
  });

  // ─── Auto-calculation ──────────────────────────────────────────────────────
  const stipend = watch('stipend') ?? 0;
  const candidates = watch('candidates') ?? [];
  const studentCount = candidates.length;
  const totalAmount = Math.max(0, Number(stipend)) * studentCount;

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    // Validate signatures
    const sErr: typeof sigErrors = {};
    if (!guiderSig)  sErr.guider  = 'Guider signature is required';
    if (!managerSig) sErr.manager = 'Manager signature is required';
    if (sErr.guider || sErr.manager) {
      setSigErrors(sErr);
      return;
    }
    setSigErrors({});
    setSubmitting(true);

    try {
      await createOdcRecord(
        {
          ...values,
          stipend: Number(values.stipend),
          total_amount: totalAmount,
          document_urls: [],
          guider_signature: guiderSig ?? undefined,
          manager_signature: managerSig ?? undefined,
        },
        files
      );

      toast.success('ODC record created successfully!', {
        description: `${values.odc_name} — ${formatINR(totalAmount)} total`,
      });

      reset();
      setFiles([]);
      setGuiderSig(null);
      setManagerSig(null);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to create record', { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── Section 1: Basic Info ─────────────────────────────────────────── */}
      <div className="form-section animate-fade-slide-up stagger-1">
        <SectionHeader icon={Building2} title="Basic Information" subtitle="Company and event details" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" required error={errors.company_name?.message}>
            <Input
              {...register('company_name')}
              placeholder="e.g. Grand Hyatt Mumbai"
              className="bg-white"
            />
          </Field>
          <Field label="ODC Event Name" required error={errors.odc_name?.message}>
            <Input
              {...register('odc_name')}
              placeholder="e.g. Annual Hospitality Workshop 2025"
              className="bg-white"
            />
          </Field>
        </div>
      </div>

      {/* ── Section 2: Candidates & Financials ──────────────────────────────── */}
      <div className="form-section animate-fade-slide-up stagger-2">
        <SectionHeader
          icon={Users}
          title="Candidates & Stipend"
          subtitle="Add student names and configure financial details"
        />

        <div className="space-y-4">
          <Field
            label="Student Candidates"
            required
            error={errors.candidates?.message as string}
            hint="Press Enter or comma after each name"
          >
            <Controller
              name="candidates"
              control={control}
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.candidates?.message as string}
                />
              )}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Stipend per Student (₹)" required error={errors.stipend?.message}>
              <div className="relative">
                <IndianRupee
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--brand-slate)' }}
                />
                <Input
                  {...register('stipend')}
                  type="number"
                  min={0}
                  placeholder="0"
                  className="pl-7 bg-white"
                />
              </div>
            </Field>

            <ComputedField
              label="No. of Students"
              value={studentCount.toString()}
            />

            <ComputedField
              label="Total Amount"
              value={formatINR(totalAmount)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Documents ────────────────────────────────────────────── */}
      <div className="form-section animate-fade-slide-up stagger-3">
        <SectionHeader
          icon={FileInput}
          title="Document Upload"
          subtitle="Supporting documents (JPG, PNG, PDF, DOC)"
        />
        <FileUpload
          files={files}
          onChange={setFiles}
        />
      </div>

      {/* ── Section 4: Remarks ───────────────────────────────────────────────── */}
      <div className="form-section animate-fade-slide-up stagger-3">
        <SectionHeader icon={MessageSquare} title="Remarks" subtitle="Optional notes or comments" />
        <textarea
          {...register('remarks')}
          rows={3}
          placeholder="Add any additional notes here…"
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none
            focus:border-[var(--brand-brass)] focus:ring-1 focus:ring-[var(--brand-brass)]
            placeholder:text-muted-foreground resize-none transition-all duration-150"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      {/* ── Section 5: Signatures ────────────────────────────────────────────── */}
      <div className="form-section animate-fade-slide-up stagger-4">
        <SectionHeader
          icon={CalendarDays}
          title="Digital Signatures"
          subtitle="Guider and Manager must sign to authorise this ODC"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <SignaturePad
            label="Guider Signature"
            role="ODC Guider / Coordinator"
            onChange={(d) => { setGuiderSig(d); setSigErrors((e) => ({ ...e, guider: undefined })); }}
            error={sigErrors.guider}
          />
          <SignaturePad
            label="Manager Signature"
            role="Department Manager / HOD"
            onChange={(d) => { setManagerSig(d); setSigErrors((e) => ({ ...e, manager: undefined })); }}
            error={sigErrors.manager}
          />
        </div>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────────────────── */}
      {studentCount > 0 && (
        <div
          className="rounded-lg px-3 sm:px-4 py-3 flex items-center justify-between gap-2 flex-wrap animate-fade-in"
          style={{ background: 'var(--brand-navy)', color: 'var(--brand-sand)' }}
        >
          <span className="text-xs sm:text-sm">
            <span style={{ color: 'rgba(245,240,232,0.6)' }}>Summary: </span>
            {studentCount} student{studentCount !== 1 ? 's' : ''} × {formatINR(Number(stipend))}
          </span>
          <span className="text-sm sm:text-base font-bold" style={{ color: 'var(--brand-brass-light)' }}>
            = {formatINR(totalAmount)}
          </span>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => { reset(); setFiles([]); setGuiderSig(null); setManagerSig(null); }}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          style={{ background: 'var(--brand-brass)', color: 'white' }}
          className="gap-2 font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit ODC Record'}
        </Button>
      </div>
    </form>
  );
}
