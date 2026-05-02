import { useLocation } from 'react-router-dom';
import { useDateStore } from '@/stores/date.store';
import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  RotateCcw,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';

// ─── Brand palette ─────────────────────────────────────────────────────────────
const C = {
  primary:     '#4A7FD9',
  primaryDark: '#2E5BB5',
  darkBlue:    '#2B7FFF',
  accent:      '#8FB8FF',
  success:     '#34C759',
  warning:     '#F5A623',
  textPrimary: '#1A1A2E',
  textSecondary:'#6B7280',
  gray100:     '#F3F4F6',
  gray200:     '#E5E7EB',
  background:  '#F5F8FC',
};

// ─── Route meta ────────────────────────────────────────────────────────────────
const ROUTE_META: Record<string, { title: string; subtitle: string; color: string; icon: string }> = {
  '/dashboard':  { title: 'Dashboard',          subtitle: 'Overview & live stats',    color: C.primary,   icon: '⚡' },
  '/live-map':   { title: 'Live Map',            subtitle: 'Real-time user positions', color: '#10B981',   icon: '🗺️' },
  '/attendance': { title: 'Attendance Registry', subtitle: 'Check-in / check-out log', color: '#8B5CF6',   icon: '📋' },
  '/location':   { title: 'Location Registry',   subtitle: 'GPS location history',     color: C.warning,   icon: '📍' },
  '/settings':   { title: 'Settings',            subtitle: 'App configuration',        color: '#6B7280',   icon: '⚙️' },
};

// ─── Inject styles once ────────────────────────────────────────────────────────
const STYLE_ID = 'topbar-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tb-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes tb-pulse-ring {
      0%,100% { box-shadow: 0 0 0 0 rgba(74,127,217,0.3); }
      50%      { box-shadow: 0 0 0 6px rgba(74,127,217,0); }
    }
    @keyframes tb-fade-in {
      from { opacity:0; transform:translateY(-6px) scale(0.97); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes tb-slide-down {
      from { opacity:0; transform:translateY(-8px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .tb-date-input {
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      font-weight: 700;
      color: ${C.textPrimary};
      cursor: pointer;
      width: 108px;
      font-family: 'Sora', 'DM Sans', system-ui, sans-serif;
      letter-spacing: 0.01em;
    }
    .tb-date-input::-webkit-calendar-picker-indicator {
      display: none;
    }
    .tb-date-input::-webkit-inner-spin-button { display: none; }

    .tb-quick-chip {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all .15s ease;
      white-space: nowrap;
      border: 1.5px solid transparent;
      letter-spacing: 0.02em;
    }
    .tb-quick-chip:hover {
      transform: translateY(-1px);
    }

    .tb-reset-btn {
      width: 30px; height: 30px;
      border-radius: 10px;
      border: 1.5px solid ${C.gray200};
      background: white;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all .15s ease;
      color: ${C.textSecondary};
    }
    .tb-reset-btn:hover {
      background: ${C.primary};
      border-color: ${C.primary};
      color: white;
      transform: rotate(-30deg) scale(1.05);
    }

    .tb-date-field {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: white;
      border: 1.5px solid ${C.gray200};
      border-radius: 14px;
      cursor: pointer;
      transition: all .18s ease;
      position: relative;
      overflow: hidden;
    }
    .tb-date-field:hover {
      border-color: ${C.primary};
      box-shadow: 0 0 0 3px rgba(74,127,217,0.1);
    }
    .tb-date-field.active {
      border-color: ${C.primary};
      box-shadow: 0 0 0 4px rgba(74,127,217,0.12);
    }
    .tb-date-field::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
      animation: tb-shimmer 2.5s ease-in-out infinite;
    }

    .tb-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(74,127,217,0.1);
      border: 1.5px solid rgba(74,127,217,0.12);
      padding: 16px;
      width: 340px;
      z-index: 999;
      animation: tb-slide-down .22s cubic-bezier(.16,1,.3,1) both;
    }
  `;
  document.head.appendChild(s);
}

// ─── Format date for display ───────────────────────────────────────────────────
function fmtDisplay(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getOffsetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Quick range option ────────────────────────────────────────────────────────
interface QuickRange { label: string; start: string; end: string; color: string }
const QUICK_RANGES: QuickRange[] = [
  { label: 'Today',      start: getTodayISO(),     end: getTodayISO(),     color: C.primary },
  { label: 'Yesterday',  start: getOffsetISO(-1),  end: getOffsetISO(-1),  color: '#8B5CF6' },
  { label: 'Last 7 days',start: getOffsetISO(-6),  end: getTodayISO(),     color: '#10B981' },
  { label: 'Last 30 days',start: getOffsetISO(-29),end: getTodayISO(),     color: C.warning },
];

// ─── DateRangeWidget ───────────────────────────────────────────────────────────
function DateRangeWidget({
  startDate, endDate, onChange, onReset,
}: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen]     = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  const containerRef        = useRef<HTMLDivElement>(null);
  const startRef            = useRef<HTMLInputElement>(null);
  const endRef              = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isToday = startDate === getTodayISO() && endDate === getTodayISO();

  const handleQuick = (r: QuickRange) => {
    onChange(r.start, r.end);
  };

  const activeQuick = QUICK_RANGES.find(r => r.start === startDate && r.end === endDate);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Trigger pill ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 6px 7px 14px',
          background: open
            ? `linear-gradient(135deg, ${C.primary}10, ${C.darkBlue}08)`
            : 'white',
          border: `1.5px solid ${open ? C.primary : C.gray200}`,
          borderRadius: 16,
          cursor: 'pointer',
          transition: 'all .18s ease',
          boxShadow: open
            ? `0 0 0 4px rgba(74,127,217,0.1), 0 4px 20px rgba(74,127,217,0.12)`
            : '0 1px 4px rgba(0,0,0,0.06)',
          userSelect: 'none',
          minWidth: 300,
        }}
      >
        {/* Calendar icon */}
        <div style={{
          width: 28, height: 28,
          borderRadius: 9,
          background: `linear-gradient(135deg, ${C.primary}, ${C.darkBlue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 2px 8px rgba(74,127,217,0.35)`,
        }}>
          <Calendar size={14} color="white" />
        </div>

        {/* Date display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.textSecondary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>From</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: "'Sora', sans-serif", whiteSpace: 'nowrap' }}>
              {fmtDisplay(startDate)}
            </span>
          </div>

          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: `${C.primary}12`,
            border: `1px solid ${C.primary}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ArrowRight size={10} color={C.primary} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.textSecondary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>To</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: "'Sora', sans-serif", whiteSpace: 'nowrap' }}>
              {fmtDisplay(endDate)}
            </span>
          </div>
        </div>

        {/* Active quick label badge */}
        {activeQuick && (
          <div style={{
            padding: '3px 9px',
            borderRadius: 20,
            background: `${activeQuick.color}15`,
            border: `1px solid ${activeQuick.color}30`,
            fontSize: 10,
            fontWeight: 700,
            color: activeQuick.color,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            {activeQuick.label}
          </div>
        )}

        {/* Chevron */}
        <div style={{
          width: 26, height: 26,
          borderRadius: 8,
          background: C.gray100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform .2s ease',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          <ChevronRight size={14} color={C.textSecondary} />
        </div>
      </div>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="tb-dropdown">

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: `linear-gradient(135deg,${C.primary},${C.darkBlue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Clock size={13} color="white" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: "'Sora', sans-serif" }}>
                Select Date Range
              </span>
            </div>
            <button
              className="tb-reset-btn"
              onClick={() => { onReset(); setOpen(false); }}
              title="Reset to today"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Quick ranges */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Quick Select
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {QUICK_RANGES.map((r) => {
                const isActive = startDate === r.start && endDate === r.end;
                return (
                  <button
                    key={r.label}
                    className="tb-quick-chip"
                    onClick={() => { handleQuick(r); setOpen(false); }}
                    style={{
                      background: isActive ? r.color : `${r.color}10`,
                      color: isActive ? 'white' : r.color,
                      borderColor: isActive ? r.color : `${r.color}30`,
                      textAlign: 'left',
                    }}
                  >
                    {isActive && <Zap size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.gray100, margin: '12px 0' }} />

          {/* Custom range inputs */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Custom Range
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {/* From */}
              <div
                className={`tb-date-field${activeField === 'start' ? ' active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => { setActiveField('start'); startRef.current?.showPicker?.(); startRef.current?.focus(); }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.primary, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 1 }}>From</span>
                  <input
                    ref={startRef}
                    type="date"
                    className="tb-date-input"
                    value={startDate}
                    max={endDate || getTodayISO()}
                    onChange={e => onChange(e.target.value, endDate)}
                    onFocus={() => setActiveField('start')}
                    onBlur={() => setActiveField(null)}
                  />
                </div>
                <Calendar size={13} color={C.primary} style={{ flexShrink: 0, opacity: 0.7 }} />
              </div>

              {/* Arrow */}
              <div style={{
                width: 28, height: 28,
                background: `linear-gradient(135deg,${C.primary},${C.darkBlue})`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: `0 2px 8px ${C.primary}40`,
              }}>
                <ArrowRight size={12} color="white" />
              </div>

              {/* To */}
              <div
                className={`tb-date-field${activeField === 'end' ? ' active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => { setActiveField('end'); endRef.current?.showPicker?.(); endRef.current?.focus(); }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.darkBlue, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 1 }}>To</span>
                  <input
                    ref={endRef}
                    type="date"
                    className="tb-date-input"
                    value={endDate}
                    min={startDate}
                    max={getTodayISO()}
                    onChange={e => onChange(startDate, e.target.value)}
                    onFocus={() => setActiveField('end')}
                    onBlur={() => setActiveField(null)}
                  />
                </div>
                <Calendar size={13} color={C.darkBlue} style={{ flexShrink: 0, opacity: 0.7 }} />
              </div>
            </div>
          </div>

          {/* Apply / Today footer */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => { onReset(); setOpen(false); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 12,
                border: `1.5px solid ${C.gray200}`,
                background: 'white',
                fontSize: 12,
                fontWeight: 700,
                color: C.textSecondary,
                cursor: 'pointer',
                transition: 'all .15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.primary; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.gray200; (e.currentTarget as HTMLElement).style.color = C.textSecondary; }}
            >
              <RotateCcw size={12} /> Today
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                flex: 2,
                padding: '8px 0',
                borderRadius: 12,
                border: 'none',
                background: `linear-gradient(135deg, ${C.primary}, ${C.darkBlue})`,
                fontSize: 12,
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${C.primary}40`,
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${C.primary}50`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${C.primary}40`; }}
            >
              Apply Range
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────────────────
export function Topbar() {
  const location = useLocation();
  const { startDate, endDate, setRange, resetToToday } = useDateStore();

  useEffect(() => { injectStyles(); }, []);

  const meta = ROUTE_META[location.pathname] || ROUTE_META['/dashboard'];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 240,
        right: 0,
        height: 64,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid rgba(74,127,217,0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 20,
        boxShadow: '0 2px 20px rgba(74,127,217,0.07)',
      }}
    >
      {/* Left: page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Coloured accent bar */}
        <div style={{
          width: 4, height: 28,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${meta.color}, ${meta.color}60)`,
          flexShrink: 0,
        }} />

        <div style={{
          width: 34, height: 34,
          borderRadius: 11,
          background: `${meta.color}15`,
          border: `1.5px solid ${meta.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}>
          {meta.icon}
        </div>

        <div>
          <h1 style={{
            fontSize: 16,
            fontWeight: 800,
            color: C.textPrimary,
            lineHeight: 1.1,
            fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif",
            margin: 0,
          }}>
            {meta.title}
          </h1>
          <p style={{
            fontSize: 11,
            color: C.textSecondary,
            margin: 0,
            fontWeight: 500,
            lineHeight: 1,
          }}>
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: date range widget */}
      {
        location.pathname!== "/live-map" ? 
      
      <DateRangeWidget
        startDate={startDate}
        endDate={endDate}
        onChange={setRange}
        onReset={resetToToday}
      />:(<></>)
}
    </header>
  );
}