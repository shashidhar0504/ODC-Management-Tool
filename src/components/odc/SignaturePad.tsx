'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Check, PenLine } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  role?: string;
  value?: string;
  onChange: (dataUrl: string | null) => void;
  error?: string;
}

export default function SignaturePad({ label, role, value, onChange, error }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#1B2A4A';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  };

  // Init canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = 128;

    // If value provided, draw it
    if (value && value.startsWith('data:')) {
      const img = new Image();
      img.onload = () => canvas.getContext('2d')?.drawImage(img, 0, 0);
      img.src = value;
      setIsSigned(true);
      setIsSaved(true);
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    setIsSigned(true);
    setIsSaved(false);
    const dataUrl = canvasRef.current?.toDataURL('image/png') ?? null;
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
    setIsSaved(false);
    onChange(null);
  };

  const handleSave = () => {
    if (!isSigned) return;
    const dataUrl = canvasRef.current?.toDataURL('image/png') ?? null;
    onChange(dataUrl);
    setIsSaved(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--brand-navy)' }}>
            {label}
          </p>
          {role && (
            <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>
              {role}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isSigned && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSave}
              className="h-7 text-xs gap-1.5"
              style={{
                borderColor: isSaved ? 'var(--brand-brass)' : undefined,
                color: isSaved ? 'var(--brand-brass)' : undefined,
              }}
            >
              <Check size={12} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="h-7 text-xs gap-1.5 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={12} />
            Clear
          </Button>
        </div>
      </div>

      <div
        className={`rounded-lg overflow-hidden transition-all duration-200
          ${error ? 'ring-1 ring-red-400' : isSaved ? 'ring-1 ring-[var(--brand-brass)]' : ''}`}
      >
        <canvas
          ref={canvasRef}
          className="sig-canvas w-full block"
          style={{ height: '128px', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {!isSigned && !error && (
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-slate)' }}>
          <PenLine size={11} />
          Sign in the area above
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
