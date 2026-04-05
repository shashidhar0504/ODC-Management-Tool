'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, ImageIcon, X, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <ImageIcon size={16} style={{ color: 'var(--brand-brass)' }} />;
  if (type === 'application/pdf') return <FileCheck size={16} className="text-red-500" />;
  return <FileText size={16} className="text-blue-500" />;
}

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export default function FileUpload({ files, onChange, error }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onChange([...files, ...accepted]);
    },
    [files, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
  });

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-[var(--brand-brass)] bg-[rgba(184,150,78,0.06)] scale-[1.01]'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 bg-gray-50 hover:border-[var(--brand-brass)] hover:bg-[rgba(184,150,78,0.03)]'
          }`}
      >
        <input {...getInputProps()} />
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: isDragActive ? 'rgba(184,150,78,0.15)' : 'rgba(184,150,78,0.08)' }}
        >
          <UploadCloud
            size={20}
            style={{ color: isDragActive ? 'var(--brand-brass)' : 'var(--brand-slate)' }}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--brand-navy)' }}>
            {isDragActive ? 'Drop files here…' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--brand-slate)' }}>
            JPG, PNG, PDF, DOC (multiple files supported)
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-md border bg-white animate-fade-in"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <FileIcon type={file.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--brand-navy)' }}>
                  {file.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-7 h-7 hover:text-red-500 hover:bg-red-50"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
