import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, Search, RotateCcw, CheckCircle2, XCircle,
  Clock, Calendar, Filter, ChevronRight, Activity,
  ArrowUpRight, Users, Zap,
} from 'lucide-react';
import { attendanceApi } from '@/api/attendance.api';
import { useDateStore } from '@/stores/date.store';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/date';
import { Pagination } from '@/components/ui/Pagination';
import toast from 'react-hot-toast';
import { C } from '@/utils/colors';

// ─── Brand palette ─────────────────────────────────────────────────────────────

// ─── Inject styles ─────────────────────────────────────────────────────────────
const STYLE_ID = 'attendance-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    .ar-root * { font-family: 'DM Sans', sans-serif; }
    .ar-display { font-family: 'Sora', sans-serif !important; }

    @keyframes ar-fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes ar-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes ar-pulse-ring {
      0%,100% { box-shadow: 0 0 0 0 rgba(74,127,217,0.3); }
      50%      { box-shadow: 0 0 0 5px rgba(74,127,217,0); }
    }
    @keyframes ar-row-in {
      from { opacity:0; transform:translateX(-8px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes ar-bar-grow {
      from { width: 0%; }
      to   { width: var(--bar-w); }
    }
    @keyframes ar-count-up {
      from { opacity:0; transform:translateY(6px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .ar-card-enter { animation: ar-fade-up .5s cubic-bezier(.16,1,.3,1) both; }

    .ar-shimmer-line {
      background: linear-gradient(90deg, #e8edf5 25%, #f0f4fa 50%, #e8edf5 75%);
      background-size: 600px 100%;
      animation: ar-shimmer 1.4s ease-in-out infinite;
      border-radius: 8px;
    }

    .ar-filter-card {
      background: white;
      border-radius: 22px;
      border: 1.5px solid rgba(74,127,217,0.1);
      box-shadow: 0 4px 32px rgba(74,127,217,0.07), 0 1px 4px rgba(0,0,0,0.04);
      padding: 20px 24px;
    }

    .ar-input-field {
      width: 100%;
      padding: 10px 14px 10px 38px;
      border-radius: 12px;
      border: 1.5px solid ${C.gray200};
      font-size: 13px;
      font-weight: 500;
      color: ${C.textPrimary};
      background: ${C.gray50};
      outline: none;
      transition: all .18s ease;
      font-family: 'DM Sans', sans-serif;
    }
    .ar-input-field:focus {
      border-color: ${C.primary};
      background: white;
      box-shadow: 0 0 0 4px rgba(74,127,217,0.1);
    }

    .ar-date-field {
      padding: 9px 12px;
      border-radius: 12px;
      border: 1.5px solid ${C.gray200};
      font-size: 13px;
      font-weight: 600;
      color: ${C.textPrimary};
      background: ${C.gray50};
      outline: none;
      transition: all .18s ease;
      font-family: 'Sora', sans-serif;
      cursor: pointer;
    }
    .ar-date-field:focus {
      border-color: ${C.primary};
      background: white;
      box-shadow: 0 0 0 4px rgba(74,127,217,0.1);
    }
    .ar-date-field::-webkit-calendar-picker-indicator {
      opacity: 0.5;
      cursor: pointer;
    }

    .ar-select-field {
      padding: 10px 14px;
      border-radius: 12px;
      border: 1.5px solid ${C.gray200};
      font-size: 13px;
      font-weight: 600;
      color: ${C.textPrimary};
      background: ${C.gray50};
      outline: none;
      transition: all .18s ease;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      appearance: none;
      padding-right: 32px;
    }
    .ar-select-field:focus {
      border-color: ${C.primary};
      background: white;
      box-shadow: 0 0 0 4px rgba(74,127,217,0.1);
    }

    .ar-btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, ${C.primary}, ${C.darkBlue});
      color: white;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all .18s ease;
      box-shadow: 0 4px 16px rgba(74,127,217,0.35);
      font-family: 'DM Sans', sans-serif;
      white-space: nowrap;
    }
    .ar-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(74,127,217,0.45);
    }
    .ar-btn-primary:active { transform: translateY(0); }

    .ar-btn-secondary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 18px;
      border-radius: 12px;
      border: 1.5px solid ${C.gray200};
      background: white;
      color: ${C.textSecondary};
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all .18s ease;
      font-family: 'DM Sans', sans-serif;
      white-space: nowrap;
    }
    .ar-btn-secondary:hover {
      border-color: ${C.primary};
      color: ${C.primary};
      background: rgba(74,127,217,0.04);
    }

    .ar-btn-export {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 18px;
      border-radius: 12px;
      border: 1.5px solid rgba(52,199,89,0.35);
      background: rgba(52,199,89,0.07);
      color: ${C.success};
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all .18s ease;
      font-family: 'DM Sans', sans-serif;
      white-space: nowrap;
    }
    .ar-btn-export:hover {
      background: ${C.success};
      color: white;
      border-color: ${C.success};
      box-shadow: 0 4px 16px rgba(52,199,89,0.35);
      transform: translateY(-1px);
    }

    .ar-table-wrap {
      background: white;
      border-radius: 22px;
      border: 1.5px solid rgba(74,127,217,0.08);
      box-shadow: 0 4px 32px rgba(74,127,217,0.06);
      overflow: hidden;
    }

    .ar-thead-row th {
      padding: 13px 16px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: ${C.textSecondary};
      background: linear-gradient(90deg, rgba(74,127,217,0.04), rgba(43,127,255,0.02));
      border-bottom: 1.5px solid ${C.gray100};
      white-space: nowrap;
      font-family: 'DM Sans', sans-serif;
    }

    .ar-row {
      border-bottom: 1px solid rgba(229,231,235,0.6);
      transition: background .15s ease, transform .12s ease;
      animation: ar-row-in .35s cubic-bezier(.16,1,.3,1) both;
    }
    .ar-row:last-child { border-bottom: none; }
    .ar-row:hover {
      background: linear-gradient(90deg, rgba(74,127,217,0.04), transparent 60%);
      transform: translateX(2px);
    }
    .ar-row td { padding: 13px 16px; vertical-align: middle; }

    .ar-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; flex-shrink: 0;
      font-family: 'Sora', sans-serif;
    }

    .ar-status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
      border: 1.5px solid;
      letter-spacing: 0.02em;
    }

    .ar-hours-bar-wrap {
      height: 4px; border-radius: 2px;
      background: ${C.gray100};
      overflow: hidden; margin-top: 3px; width: 64px;
    }
    .ar-hours-bar-fill {
      height: 100%; border-radius: 2px;
      animation: ar-bar-grow .7s cubic-bezier(.16,1,.3,1) both;
    }

    .ar-stat-chip {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 20px;
      border-radius: 14px;
      min-width: 80px;
    }

    .ar-label {
      font-size: 11px;
      font-weight: 700;
      color: ${C.textSecondary};
      margin-bottom: 5px;
      letter-spacing: 0.01em;
    }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getTodayISO() { return new Date().toISOString().split('T')[0]; }

function Avatar({ name, color = C.primary }: { name: string; color?: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="ar-avatar" style={{ background: `${color}18`, color, border: `1.5px solid ${color}30` }}>
      {initials}
    </div>
  );
}

function StatusBadge({ variant, text }: { variant: 'green' | 'amber' | 'red' | 'gray'; text: string }) {
  const map = {
    green: { bg: `${C.success}12`, color: C.success, border: `${C.success}30`, dot: C.success },
    amber: { bg: `${C.warning}12`, color: C.warning, border: `${C.warning}30`, dot: C.warning },
    red:   { bg: `${C.danger}10`,  color: C.danger,  border: `${C.danger}25`,  dot: C.danger  },
    gray:  { bg: C.gray100,        color: C.textSecondary, border: C.gray200,  dot: C.textSecondary },
  };
  const t = map[variant];
  return (
    <span className="ar-status-badge" style={{ background: t.bg, color: t.color, borderColor: t.border }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.dot, display: 'inline-block', flexShrink: 0 }} />
      {text}
    </span>
  );
}

function HoursCell({ hours }: { hours: number }) {
  const pct   = Math.min((hours / 8) * 100, 100);
  const color = hours >= 8 ? C.success : hours >= 4 ? C.warning : C.danger;
  return (
    <div>
      <span className="ar-display" style={{ fontSize: 14, fontWeight: 800, color }}>{hours}h</span>
      <div className="ar-hours-bar-wrap">
        <div
          className="ar-hours-bar-fill"
          style={{ '--bar-w': `${pct}%`, width: `${pct}%`, background: color } as any}
        />
      </div>
    </div>
  );
}

function CheckBadge({ yes }: { yes: boolean }) {
  return yes
    ? <CheckCircle2 size={18} style={{ color: C.success }} />
    : <XCircle     size={18} style={{ color: C.gray200 }} />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="ar-label">{children}</div>;
}

function SkeletonRow() {
  return (
    <tr className="ar-row">
      {[40, 90, 60, 48, 48, 70].map((w, i) => (
        <td key={i} style={{ padding: '13px 16px' }}>
          {i === 0 ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="ar-shimmer-line" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="ar-shimmer-line" style={{ width: 110, height: 12 }} />
                <div className="ar-shimmer-line" style={{ width: 80, height: 10 }} />
              </div>
            </div>
          ) : (
            <div className="ar-shimmer-line" style={{ width: w, height: 14 }} />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── AttendanceRegistry ────────────────────────────────────────────────────────
export function AttendanceRegistry() {
  const { startDate, endDate, setRange, resetToToday } = useDateStore();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [hoursFilter, setHoursFilter] = useState<string>('');
  const [localStart, setLocalStart]   = useState(startDate);
  const [localEnd, setLocalEnd]       = useState(endDate);

  useEffect(() => { injectStyles(); }, []);

  const debouncedSearch = useDebounce(search, 300);

  // ── Query (unchanged) ────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attendance', page, debouncedSearch, hoursFilter, startDate, endDate],
    queryFn: () =>
      attendanceApi.getPaginated({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        hoursFilter: hoursFilter || undefined,
        startDate,
        endDate,
      }),
  });

  // ── Handlers (unchanged) ─────────────────────────────────────────────────────
  const handleApply = () => { setRange(localStart, localEnd); setPage(1); refetch(); };

  const handleReset = () => {
    setSearch(''); setHoursFilter(''); setPage(1);
    resetToToday();
    setLocalStart(getTodayISO()); setLocalEnd(getTodayISO());
  };

  const handleExport = async () => {
    try {
      const res = await attendanceApi.getMISReport({ startDate, endDate });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `AttendSphere_MIS_${startDate}_${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('MIS report downloaded');
    } catch { toast.error('Failed to download report'); }
  };

  const pagination  = data?.data.data.pagination;
  const rows        = data?.data.data.data || [];

  // ── Derived summary stats ─────────────────────────────────────────────────
  const completeCount = rows.filter((r: any) => r.working_hours >= 8).length;
  const partialCount  = rows.filter((r: any) => r.has_checkin && r.working_hours < 8).length;
  const absentCount   = rows.filter((r: any) => !r.has_checkin).length;

  const HOURS_OPTIONS = [
    { value: '',          label: 'All hours' },
    { value: 'below_8',   label: 'Below 8 hrs' },
    { value: 'above_8',   label: 'Above 8 hrs' },
  ];

  return (
    <div className="ar-root" style={{ minHeight: '100vh', background: C.background, padding: '0 0 32px' }}>

      {/* ── Hero header ── */}
      <div className="ar-card-enter" style={{
        background: `linear-gradient(135deg, #8B5CF6 0%, #6D28D9 55%, #4C1D95 100%)`,
        borderRadius: 22,
        padding: '24px 28px',
        marginBottom: 22,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 48px rgba(139,92,246,0.28)',
        animationDelay: '0ms',
      }}>
        <div style={{ position:'absolute', top:-50, right:-30, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, right:120, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:16, right:28, opacity:0.08 }}>
          <Activity size={96} color="white" />
        </div>

        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#A78BFA', boxShadow:'0 0 0 3px rgba(167,139,250,0.25)' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:'0.07em' }}>ATTENDANCE REGISTRY</span>
            </div>
            <h1 className="ar-display" style={{ fontSize:24, fontWeight:800, color:'white', marginBottom:5, lineHeight:1.1 }}>
              Attendance Records
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>
              Track daily check-ins, check-outs and working hours
            </p>
          </div>

          {/* Summary chips */}
          {!isLoading && rows.length > 0 && (
            <div style={{ display:'flex', gap:10 }}>
              {[
                { label:'Complete', value: completeCount, color:'#A78BFA', bg:'rgba(167,139,250,0.2)' },
                { label:'Partial',  value: partialCount,  color:'#FDE68A', bg:'rgba(253,230,138,0.2)' },
                { label:'Absent',   value: absentCount,   color:'#FCA5A5', bg:'rgba(252,165,165,0.2)' },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.bg,
                  backdropFilter: 'blur(12px)',
                  border: `1.5px solid rgba(255,255,255,0.15)`,
                  borderRadius: 14,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 80,
                }}>
                  <div className="ar-display" style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:700, marginTop:2, letterSpacing:'0.04em' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter card ── */}
      <div className="ar-card-enter ar-filter-card" style={{ marginBottom: 18, animationDelay: '80ms' }}>

        {/* Row 1: search + hours + export */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap', marginBottom:16 }}>

          {/* Search */}
          <div style={{ flex:1, minWidth:220 }}>
            <FieldLabel>Search Employee</FieldLabel>
            <div style={{ position:'relative' }}>
              <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: C.textSecondary, pointerEvents:'none' }} />
              <input
                type="text"
                placeholder="Name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ar-input-field"
              />
            </div>
          </div>

          {/* Hours filter */}
          <div style={{ minWidth: 148 }}>
            <FieldLabel>Hours Filter</FieldLabel>
            <div style={{ position:'relative' }}>
              <select
                value={hoursFilter}
                onChange={e => setHoursFilter(e.target.value)}
                className="ar-select-field"
                style={{ width:'100%' }}
              >
                {HOURS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronRight size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:C.textSecondary, pointerEvents:'none' }} />
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }} />

          {/* Export */}
          <button className="ar-btn-export" onClick={handleExport}>
            <Download size={14} /> Export MIS
          </button>
        </div>

        {/* Row 2: date range + apply/reset */}
        <div style={{
          display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap',
          paddingTop:16,
          borderTop:`1.5px solid ${C.gray100}`,
        }}>

          {/* Date range section */}
          <div style={{
            display:'flex', alignItems:'center', gap:10, flex:1, flexWrap:'wrap',
            padding:'12px 16px',
            background: `linear-gradient(90deg, rgba(74,127,217,0.04), transparent)`,
            borderRadius:14,
            border:`1.5px solid rgba(74,127,217,0.1)`,
          }}>
            <div style={{
              width:32, height:32, borderRadius:10,
              background:`linear-gradient(135deg,${C.primary},${C.darkBlue})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <Calendar size={15} color="white" />
            </div>

            <div>
              <FieldLabel>From</FieldLabel>
              <input
                type="date"
                value={localStart}
                max={localEnd}
                onChange={e => setLocalStart(e.target.value)}
                className="ar-date-field"
              />
            </div>

            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:`linear-gradient(135deg,${C.primary},${C.darkBlue})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
              boxShadow:`0 2px 8px rgba(74,127,217,0.35)`,
            }}>
              <ChevronRight size={13} color="white" />
            </div>

            <div>
              <FieldLabel>To</FieldLabel>
              <input
                type="date"
                value={localEnd}
                min={localStart}
                max={getTodayISO()}
                onChange={e => setLocalEnd(e.target.value)}
                className="ar-date-field"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button className="ar-btn-secondary" onClick={handleReset}>
              <RotateCcw size={13} /> Reset
            </button>
            <button className="ar-btn-primary" onClick={handleApply}>
              <Zap size={14} /> Apply
            </button>
          </div>
        </div>
      </div>

      {/* ── Results meta row ── */}
      <div className="ar-card-enter" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:12, animationDelay:'160ms',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:28, height:28, borderRadius:8,
            background:`linear-gradient(135deg,#8B5CF6,#6D28D9)`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Filter size={13} color="white" />
          </div>
          <span className="ar-display" style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>
            Attendance Records
          </span>
          {pagination && (
            <span style={{
              fontSize:11, fontWeight:700,
              padding:'3px 10px', borderRadius:20,
              background:'rgba(139,92,246,0.1)',
              color:'#8B5CF6',
              border:'1px solid rgba(139,92,246,0.2)',
            }}>
              {pagination.total} total
            </span>
          )}
        </div>
        {pagination && (
          <span style={{ fontSize:12, color:C.textSecondary, fontWeight:500 }}>
            Showing{' '}
            <strong style={{ color:C.textPrimary }}>
              {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>
            {' '}of{' '}
            <strong style={{ color:C.textPrimary }}>{pagination.total}</strong>
            {' '}results
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="ar-card-enter ar-table-wrap" style={{ animationDelay:'200ms' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr className="ar-thead-row">
              <th>Employee</th>
              <th>Date</th>
              <th>Working Hours</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : rows.length === 0
              ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      padding:'64px 0', gap:12,
                    }}>
                      <div style={{
                        width:56, height:56, borderRadius:16,
                        background:'rgba(139,92,246,0.08)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <Users size={26} color="#8B5CF6" />
                      </div>
                      <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }} className="ar-display">No records found</div>
                      <div style={{ fontSize:13, color:C.textSecondary }}>Try adjusting your filters or date range</div>
                    </div>
                  </td>
                </tr>
              )
              : rows.map((row: any, idx: number) => {
                  let statusVariant: 'green' | 'amber' | 'red' = 'red';
                  let statusText = 'Absent';
                  if (row.working_hours >= 8)          { statusVariant = 'green'; statusText = 'Complete'; }
                  else if (row.has_checkin)             { statusVariant = 'amber'; statusText = 'Partial'; }

                  const avatarColor = statusVariant === 'green' ? C.success : statusVariant === 'amber' ? C.warning : '#8B5CF6';

                  return (
                    <tr key={`${row.user_id}-${row.event_date}`} className="ar-row" style={{ animationDelay: `${idx * 30}ms` }}>

                      {/* Employee */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={row.full_name} color={avatarColor} />
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{row.full_name}</div>
                            <div style={{ fontSize:11, color:C.textSecondary }}>{row.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{
                            width:26, height:26, borderRadius:7,
                            background:`rgba(139,92,246,0.1)`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            flexShrink:0,
                          }}>
                            <Calendar size={12} color="#8B5CF6" />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{formatDate(row.event_date)}</span>
                        </div>
                      </td>

                      {/* Working hours */}
                      <td><HoursCell hours={row.working_hours} /></td>

                      {/* Check-in */}
                      <td><CheckBadge yes={row.has_checkin} /></td>

                      {/* Check-out */}
                      <td><CheckBadge yes={row.has_checkout} /></td>

                      {/* Status */}
                      <td><StatusBadge variant={statusVariant} text={statusText} /></td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="ar-card-enter" style={{ marginTop:20, animationDelay:'280ms' }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

    </div>
  );
}