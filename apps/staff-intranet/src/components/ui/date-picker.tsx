'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: string;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const selected = parseDate(value);
  const min = parseDate(minDate ?? '');

  const [viewDate, setViewDate] = useState<Date>(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  // Shift so week starts on Monday (0=Mon ... 6=Sun)
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isSelected = (d: number) => {
    if (!selected) return false;
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;
  };

  const isDisabled = (d: number) => {
    if (!min) return false;
    const candidate = new Date(year, month, d);
    return candidate < min;
  };

  const isToday = (d: number) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-sm border border-surface-border bg-surface-raised p-3 select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-sm text-text-muted hover:bg-surface-card hover:text-text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-mono text-xs font-medium text-text-primary">
          {MESES[month]} {year}
        </span>
        <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-sm text-text-muted hover:bg-surface-card hover:text-text-primary transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {DIAS.map((d) => (
          <div key={d} className="py-1 text-center font-mono text-[10px] text-text-muted">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const sel  = isSelected(day);
          const dis  = isDisabled(day);
          const tod  = isToday(day);
          return (
            <button
              key={day}
              type="button"
              disabled={dis}
              onClick={() => onChange(toStr(new Date(year, month, day)))}
              className={[
                'flex h-8 w-full items-center justify-center rounded-sm font-mono text-xs transition-colors',
                dis  ? 'cursor-not-allowed opacity-25 text-text-muted' : 'hover:bg-surface-card',
                sel  ? 'bg-accent-green/20 text-accent-green font-semibold' : 'text-text-primary',
                tod && !sel ? 'ring-1 ring-accent-green/40' : '',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {value && (
        <div className="mt-3 border-t border-surface-border pt-2 text-center font-mono text-[10px] text-text-muted">
          Seleccionado: {value}
        </div>
      )}
    </div>
  );
}
