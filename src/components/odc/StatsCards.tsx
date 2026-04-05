'use client';

import { TrendingUp, Users, Clock, CalendarCheck } from 'lucide-react';

interface OdcStatsProps {
  total: number;
  pending: number;
  totalStudents: number;
  thisMonth: number;
}

const ICON_MAP = [TrendingUp, Users, Clock, CalendarCheck];

export default function StatsCards({ total, pending, totalStudents, thisMonth }: OdcStatsProps) {
  const stats = [
    { label: 'Total ODC Records', value: total, sub: 'All time', icon: TrendingUp, color: 'var(--brand-navy)' },
    { label: 'Active Students', value: totalStudents, sub: 'Across all ODCs', icon: Users, color: 'var(--brand-brass)' },
    { label: 'Pending Approvals', value: pending, sub: 'Awaiting sign-off', icon: Clock, color: '#E97316' },
    { label: 'This Month', value: thisMonth, sub: 'New ODC records', icon: CalendarCheck, color: '#10B981' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map(({ label, value, sub, icon: Icon, color }, i) => (
        <div key={label} className={`stat-card animate-fade-slide-up stagger-${i + 1}`}>
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${color}15`, flexShrink: 0 }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${color}12`, color }}
            >
              {value}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--brand-navy)' }}>
            {value}
          </p>
          <p className="text-xs sm:text-sm font-medium mt-0.5 leading-tight" style={{ color: 'var(--brand-navy)' }}>{label}</p>
          <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--brand-slate)' }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}
