'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import OdcForm from './OdcForm';

interface OdcFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function OdcFormDialog({ open, onOpenChange, onSuccess }: OdcFormDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[92vh] p-0 gap-0 overflow-hidden rounded-none sm:rounded-xl"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0"
          style={{
            background: 'var(--brand-navy)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <DialogTitle className="text-sm sm:text-base font-semibold" style={{ color: 'var(--brand-sand)' }}>
            New ODC Record
          </DialogTitle>
          <DialogDescription className="text-xs mt-0.5 hidden sm:block" style={{ color: 'rgba(245,240,232,0.5)' }}>
            Fill in all details and collect digital signatures before submitting
          </DialogDescription>
        </div>

        {/* Scrollable form body */}
        <ScrollArea className="flex-1 h-[calc(100dvh-56px)] sm:max-h-[calc(92vh-70px)]">
          <div className="p-4 sm:p-6" style={{ background: 'var(--brand-sand)' }}>
            <OdcForm onSuccess={handleSuccess} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
