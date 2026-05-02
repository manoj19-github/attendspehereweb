import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, RotateCcw, Calendar, ChevronRight,
  Navigation, Zap, Filter, Navigation2, Layers,
  ArrowUpRight, Clock, Ruler, X,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { locationApi } from '@/api/location.api';
import { useDateStore } from '@/stores/date.store';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/date';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '@/stores/auth.store';

// ─── Brand palette ─────────────────────────────────────────────────────────────
const C = {
  primary:      '#4A7FD9',
  primaryDark:  '#2E5BB5',
  darkBlue:     '#2B7FFF',
  teal:         '#0EA5E9',
  tealDark:     '#0369A1',
  success:      '#34C759',
  danger:       '#E7000B',
  warning:      '#F5A623',
  orange:       '#F97316',
  purple:       '#8B5CF6',
  textPrimary:  '#1A1A2E',
  textSecondary:'#6B7280',
  gray50:       '#F9FAFB',
  gray100:      '#F3F4F6',
  gray200:      '#E5E7EB',
  background:   '#F5F8FC',
};

// ─── Inject styles ─────────────────────────────────────────────────────────────
const STYLE_ID = 'locregistry-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    .lr-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
    .lr-display { font-family:'Sora',sans-serif !important; }

    @keyframes lr-fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes lr-shimmer {
      0%   { background-position:-600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes lr-row-in {
      from { opacity:0; transform:translateX(-8px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes lr-pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.5; transform:scale(1.4); }
    }
    @keyframes lr-modal-in {
      from { opacity:0; transform:scale(0.94) translateY(12px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }

    .lr-enter { animation: lr-fade-up .5s cubic-bezier(.16,1,.3,1) both; }

    .lr-shimmer-line {
      background: linear-gradient(90deg,#e8edf5 25%,#f0f4fa 50%,#e8edf5 75%);
      background-size:600px 100%;
      animation: lr-shimmer 1.4s ease-in-out infinite;
      border-radius:8px;
    }

    .lr-filter-card {
      background:white;
      border-radius:22px;
      border:1.5px solid rgba(74,127,217,0.1);
      box-shadow:0 4px 28px rgba(74,127,217,0.07);
      padding:20px 22px;
    }

    .lr-input {
      width:100%;
      padding:10px 13px 10px 38px;
      border-radius:12px;
      border:1.5px solid ${C.gray200};
      font-size:13px; font-weight:500; color:${C.textPrimary};
      background:${C.gray50}; outline:none;
      transition:all .18s ease;
      font-family:'DM Sans',sans-serif;
    }
    .lr-input:focus {
      border-color:${C.teal};
      background:white;
      box-shadow:0 0 0 4px rgba(14,165,233,0.1);
    }

    .lr-uid-input {
      width:100%;
      padding:10px 13px;
      border-radius:12px;
      border:1.5px solid ${C.gray200};
      font-size:13px; font-weight:500; color:${C.textPrimary};
      background:${C.gray50}; outline:none;
      transition:all .18s ease;
      font-family:'DM Sans',sans-serif;
    }
    .lr-uid-input:focus {
      border-color:${C.orange};
      background:white;
      box-shadow:0 0 0 4px rgba(249,115,22,0.1);
    }

    .lr-date-field {
      padding:9px 12px;
      border-radius:12px;
      border:1.5px solid ${C.gray200};
      font-size:13px; font-weight:600; color:${C.textPrimary};
      background:${C.gray50}; outline:none;
      transition:all .18s ease;
      font-family:'Sora',sans-serif; cursor:pointer;
    }
    .lr-date-field:focus {
      border-color:${C.primary};
      background:white;
      box-shadow:0 0 0 4px rgba(74,127,217,0.1);
    }
    .lr-date-field::-webkit-calendar-picker-indicator { opacity:.45; cursor:pointer; }

    .lr-btn-primary {
      display:inline-flex; align-items:center; gap:6px;
      padding:10px 20px; border-radius:12px; border:none;
      background:linear-gradient(135deg,${C.teal},${C.tealDark});
      color:white; font-size:13px; font-weight:700;
      cursor:pointer; transition:all .18s ease;
      box-shadow:0 4px 16px rgba(14,165,233,0.35);
      font-family:'DM Sans',sans-serif; white-space:nowrap;
    }
    .lr-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(14,165,233,0.45); }

    .lr-btn-secondary {
      display:inline-flex; align-items:center; gap:6px;
      padding:10px 16px; border-radius:12px;
      border:1.5px solid ${C.gray200}; background:white;
      color:${C.textSecondary}; font-size:13px; font-weight:700;
      cursor:pointer; transition:all .18s ease;
      font-family:'DM Sans',sans-serif; white-space:nowrap;
    }
    .lr-btn-secondary:hover { border-color:${C.teal}; color:${C.teal}; background:rgba(14,165,233,0.04); }

    .lr-table-wrap {
      background:white;
      border-radius:22px;
      border:1.5px solid rgba(14,165,233,0.08);
      box-shadow:0 4px 28px rgba(14,165,233,0.06);
      overflow:hidden;
    }

    .lr-thead th {
      padding:12px 16px;
      text-align:left;
      font-size:10px; font-weight:700;
      letter-spacing:.09em; text-transform:uppercase;
      color:${C.textSecondary};
      background:linear-gradient(90deg,rgba(14,165,233,0.05),rgba(74,127,217,0.03));
      border-bottom:1.5px solid ${C.gray100};
      white-space:nowrap;
    }

    .lr-row {
      border-bottom:1px solid rgba(229,231,235,0.6);
      transition:background .15s ease, transform .12s ease;
      animation:lr-row-in .35s cubic-bezier(.16,1,.3,1) both;
    }
    .lr-row:last-child { border-bottom:none; }
    .lr-row:hover {
      background:linear-gradient(90deg,rgba(14,165,233,0.04),transparent 60%);
      transform:translateX(2px);
    }
    .lr-row td { padding:12px 16px; vertical-align:middle; }

    .lr-avatar {
      width:34px; height:34px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:800; flex-shrink:0;
      font-family:'Sora',sans-serif;
    }

    .lr-action-btn {
      width:30px; height:30px; border-radius:9px;
      display:flex; align-items:center; justifycontent:center;
      cursor:pointer; transition:all .15s ease;
      border:1.5px solid; background:transparent;
      display:flex; align-items:center; justify-content:center;
    }
    .lr-action-btn:hover { transform:translateY(-1px) scale(1.05); }

    /* ─ Modal overlay ─ */
    .lr-overlay {
      position:fixed; inset:0; z-index:9000;
      background:rgba(0,0,0,0.5);
      backdrop-filter:blur(6px);
      display:flex; align-items:center; justify-content:center;
      padding:24px;
    }
    .lr-modal {
      background:white;
      border-radius:22px;
      box-shadow:0 24px 80px rgba(0,0,0,0.2);
      width:100%; max-width:640px;
      overflow:hidden;
      animation:lr-modal-in .28s cubic-bezier(.16,1,.3,1) both;
    }
    .lr-modal-head {
      padding:18px 22px;
      display:flex; align-items:center; gap:12px;
      border-bottom:1.5px solid ${C.gray100};
    }
    .lr-modal-close {
      margin-left:auto;
      width:30px; height:30px; border-radius:9px;
      border:1.5px solid ${C.gray200}; background:white;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      color:${C.textSecondary}; transition:all .15s ease;
    }
    .lr-modal-close:hover { border-color:${C.danger}; color:${C.danger}; background:rgba(231,0,11,0.05); }

    .lr-pulse { animation:lr-pulse 2s ease-in-out infinite; }

    .lr-field-label {
      font-size:10px; font-weight:700; color:${C.textSecondary};
      letter-spacing:.08em; text-transform:uppercase;
      margin-bottom:5px;
    }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getTodayISO() { return new Date().toISOString().split('T')[0]; }

function Avatar({ name, color = C.teal }: { name: string; color?: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="lr-avatar" style={{ background:`${color}18`, color, border:`1.5px solid ${color}30` }}>
      {initials}
    </div>
  );
}

function StatusPill({ inside }: { inside: boolean }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 10px', borderRadius:20,
      fontSize:11, fontWeight:700,
      background: inside ? `${C.success}12` : `${C.warning}12`,
      color: inside ? C.success : C.warning,
      border:`1.5px solid ${inside ? C.success+'30' : C.warning+'30'}`,
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: inside ? C.success : C.warning, display:'inline-block' }} />
      {inside ? 'Inside Office' : 'Outside'}
    </span>
  );
}

function LogTypePill({ type }: { type: string }) {
  const isInterval = type === 'interval';
  const color = isInterval ? C.purple : C.teal;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 8px', borderRadius:20,
      fontSize:10, fontWeight:700,
      background:`${color}10`, color,
      border:`1px solid ${color}25`,
    }}>
      {isInterval ? <Clock size={9} /> : <Navigation2 size={9} />}
      {type}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="lr-row">
      {[1,2,3,4,5,6,7].map((_, i) => (
        <td key={i} style={{ padding:'12px 16px' }}>
          {i === 0 ? (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div className="lr-shimmer-line" style={{ width:34, height:34, borderRadius:'50%', flexShrink:0 }} />
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <div className="lr-shimmer-line" style={{ width:100, height:12 }} />
                <div className="lr-shimmer-line" style={{ width:72, height:10 }} />
              </div>
            </div>
          ) : (
            <div className="lr-shimmer-line" style={{ width:[90,64,52,52,90,28][i-1] || 60, height:14 }} />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── Leaflet icons (same logic as original) ────────────────────────────────────
function buildUserIcon(fullName: string, isInside: boolean) {
  const bgColor  = isInside ? '#2563eb' : '#6b7280';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return L.divIcon({
    className:'',
    iconSize:[40,52], iconAnchor:[20,52], popupAnchor:[0,-54],
    html:`
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:34px;height:34px;border-radius:50%;background:${bgColor};color:white;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${initials}</div>
        <div style="background:rgba(0,0,0,0.65);color:white;font-size:9px;font-weight:500;padding:1px 5px;border-radius:3px;margin-top:3px;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${fullName.split(' ')[0]}</div>
      </div>
    `,
  });
}

const OFFICE_ICON = L.divIcon({
  className:'', iconAnchor:[0,0],
  html:`
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 12px rgba(74,127,217,0.45));">
      <div style="width:44px;height:44px;border-radius:50% 50% 50% 4px;background:linear-gradient(135deg,#4A7FD9,#2B7FFF);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 20px rgba(74,127,217,0.5),0 0 0 6px rgba(74,127,217,0.15);transform:rotate(-45deg);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="transform:rotate(45deg)">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="background:linear-gradient(135deg,#4A7FD9,#2B7FFF);color:white;font-size:9px;font-weight:800;padding:3px 9px;border-radius:20px;margin-top:5px;white-space:nowrap;letter-spacing:.12em;box-shadow:0 2px 8px rgba(74,127,217,0.4);border:1.5px solid rgba(255,255,255,0.3);">OFFICE</div>
    </div>
  `,
});

// ─── LocationRegistry ──────────────────────────────────────────────────────────
export function LocationRegistry() {
  const { startDate, endDate, setRange, resetToToday } = useDateStore();
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [userId, setUserId]             = useState('');
  const [localStart, setLocalStart]     = useState(startDate);
  const [localEnd, setLocalEnd]         = useState(endDate);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => { injectStyles(); }, []);

  const debouncedSearch = useDebounce(search, 300);
  const officeSettings  = useAuthStore(s => s.officeSettings);

  // ── Query (unchanged) ────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['location', page, debouncedSearch, userId, startDate, endDate],
    queryFn: () => locationApi.getPaginated({
      page, limit:15,
      search: debouncedSearch || undefined,
      userId: userId || undefined,
      startDate, endDate,
    }),
  });

  // ── Handlers (unchanged) ─────────────────────────────────────────────────────
  const handleApply = () => { setRange(localStart, localEnd); setPage(1); refetch(); };
  const handleReset = () => {
    setSearch(''); setUserId(''); setPage(1);
    resetToToday();
    setLocalStart(getTodayISO()); setLocalEnd(getTodayISO());
  };

  const rows       = data?.data.data.data || [];
  const pagination = data?.data.data.pagination;

  const insideCount  = rows.filter((r: any) =>  r.is_inside).length;
  const outsideCount = rows.filter((r: any) => !r.is_inside).length;

  return (
    <div className="lr-root" style={{ minHeight:'100vh', background:C.background, paddingBottom:32 }}>

      {/* ── Hero ── */}
      <div className="lr-enter" style={{
        background:`linear-gradient(135deg, ${C.teal} 0%, ${C.tealDark} 55%, #0C4A6E 100%)`,
        borderRadius:22, padding:'22px 28px',
        marginBottom:22, position:'relative', overflow:'hidden',
        boxShadow:`0 12px 48px rgba(14,165,233,0.28)`,
        animationDelay:'0ms',
      }}>
        <div style={{ position:'absolute',top:-50,right:-30,width:190,height:190,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:-60,right:120,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',top:16,right:26,opacity:.07 }}><Layers size={96} color="white" /></div>

        <div style={{ position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
              <div className="lr-pulse" style={{ width:7,height:7,borderRadius:'50%',background:'#7DD3FC',boxShadow:'0 0 0 3px rgba(125,211,252,0.25)' }} />
              <span style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)',letterSpacing:'.08em' }}>LOCATION REGISTRY</span>
            </div>
            <h1 className="lr-display" style={{ fontSize:23,fontWeight:800,color:'white',margin:'0 0 5px',lineHeight:1.1 }}>
              Location History
            </h1>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.7)',margin:0,fontWeight:500 }}>
              GPS pings, geofence status and movement logs
            </p>
          </div>

          {!isLoading && rows.length > 0 && (
            <div style={{ display:'flex',gap:10 }}>
              {[
                { label:'Inside',   value:insideCount,  color:'#A7F3D0', bg:'rgba(167,243,208,0.2)' },
                { label:'Outside',  value:outsideCount, color:'#FED7AA', bg:'rgba(254,215,170,0.2)' },
                { label:'Total',    value:pagination?.total || rows.length, color:'#BAE6FD', bg:'rgba(186,230,253,0.2)' },
              ].map(s => (
                <div key={s.label} style={{
                  background:s.bg, backdropFilter:'blur(12px)',
                  border:'1.5px solid rgba(255,255,255,0.15)',
                  borderRadius:14, padding:'10px 18px', textAlign:'center', minWidth:80,
                }}>
                  <div className="lr-display" style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,0.65)',fontWeight:700,marginTop:2,letterSpacing:'.04em' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter card ── */}
      <div className="lr-enter lr-filter-card" style={{ marginBottom:18, animationDelay:'80ms' }}>

        {/* Row 1 */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap', marginBottom:16 }}>

          {/* Search */}
          <div style={{ flex:1, minWidth:200 }}>
            <div className="lr-field-label">Search Employee</div>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.textSecondary,pointerEvents:'none' }} />
              <input
                type="text"
                className="lr-input"
                placeholder="Name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* User ID */}
          <div style={{ width:160 }}>
            <div className="lr-field-label">
              <Navigation2 size={9} style={{ display:'inline',marginRight:3 }} />User ID
            </div>
            <input
              type="text"
              className="lr-uid-input"
              placeholder="Optional filter"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>

          <div style={{ flex:1 }} />
          <button className="lr-btn-secondary" onClick={handleReset}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Row 2: date range */}
        <div style={{
          display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap',
          paddingTop:16, borderTop:`1.5px solid ${C.gray100}`,
        }}>
          <div style={{
            display:'flex', alignItems:'center', gap:10, flex:1, flexWrap:'wrap',
            padding:'12px 16px', borderRadius:14,
            background:`linear-gradient(90deg,rgba(14,165,233,0.05),transparent)`,
            border:`1.5px solid rgba(14,165,233,0.12)`,
          }}>
            <div style={{
              width:32,height:32,borderRadius:10,flexShrink:0,
              background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <Calendar size={15} color="white" />
            </div>

            <div>
              <div className="lr-field-label">From</div>
              <input type="date" className="lr-date-field" value={localStart} max={localEnd}
                onChange={e => setLocalStart(e.target.value)} />
            </div>

            <div style={{
              width:28,height:28,borderRadius:'50%',flexShrink:0,
              background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 2px 8px rgba(14,165,233,0.35)`,
            }}>
              <ChevronRight size={13} color="white" />
            </div>

            <div>
              <div className="lr-field-label">To</div>
              <input type="date" className="lr-date-field" value={localEnd} min={localStart} max={getTodayISO()}
                onChange={e => setLocalEnd(e.target.value)} />
            </div>
          </div>

          <button className="lr-btn-primary" onClick={handleApply}>
            <Zap size={13} /> Apply
          </button>
        </div>
      </div>

      {/* ── Results meta ── */}
      <div className="lr-enter" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,animationDelay:'160ms' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Filter size={13} color="white" />
          </div>
          <span className="lr-display" style={{ fontSize:13,fontWeight:700,color:C.textPrimary }}>Location Pings</span>
          {pagination && (
            <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:`rgba(14,165,233,0.1)`,color:C.teal,border:`1px solid rgba(14,165,233,0.2)` }}>
              {pagination.total} records
            </span>
          )}
        </div>
        {pagination && (
          <span style={{ fontSize:12,color:C.textSecondary,fontWeight:500 }}>
            Showing{' '}
            <strong style={{ color:C.textPrimary }}>{(pagination.page-1)*pagination.limit+1}–{Math.min(pagination.page*pagination.limit,pagination.total)}</strong>
            {' '}of <strong style={{ color:C.textPrimary }}>{pagination.total}</strong>
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="lr-enter lr-table-wrap" style={{ animationDelay:'200ms' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr className="lr-thead">
              <th>Employee</th>
              <th>Coordinates</th>
              <th>Status</th>
              <th>Distance</th>
              <th>Log Type</th>
              <th>Recorded At</th>
              <th style={{ width:48 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length:8 }).map((_,i) => <SkeletonRow key={i} />)
              : rows.length === 0
              ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'64px 0',gap:12 }}>
                      <div style={{ width:56,height:56,borderRadius:16,background:`rgba(14,165,233,0.08)`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <MapPin size={26} color={C.teal} />
                      </div>
                      <div className="lr-display" style={{ fontSize:15,fontWeight:700,color:C.textPrimary }}>No records found</div>
                      <div style={{ fontSize:13,color:C.textSecondary }}>Try adjusting your filters or date range</div>
                    </div>
                  </td>
                </tr>
              )
              : rows.map((row: any, idx: number) => (
                <tr key={row.id} className="lr-row" style={{ animationDelay:`${idx*30}ms` }}>

                  {/* Employee */}
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <Avatar name={row.full_name} color={row.is_inside ? C.teal : C.orange} />
                      <div>
                        <div style={{ fontSize:13,fontWeight:700,color:C.textPrimary }}>{row.full_name}</div>
                        <div style={{ fontSize:11,color:C.textSecondary }}>{row.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Coordinates */}
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <div style={{ width:20,height:20,borderRadius:6,background:`${C.teal}12`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <Navigation size={10} color={C.teal} />
                      </div>
                      <span style={{ fontFamily:'monospace',fontSize:11,color:C.textPrimary,fontWeight:600 }}>
                        {row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td><StatusPill inside={row.is_inside} /></td>

                  {/* Distance */}
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <Ruler size={12} color={row.is_inside ? C.success : C.warning} />
                      <span style={{ fontSize:13,fontWeight:700,color:row.is_inside ? C.success : C.warning }}>
                        {row.distance.toFixed(0)}
                      </span>
                      <span style={{ fontSize:10,color:C.textSecondary }}>m</span>
                    </div>
                  </td>

                  {/* Log type */}
                  <td><LogTypePill type={row.log_type} /></td>

                  {/* Recorded at */}
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <Clock size={11} color={C.textSecondary} />
                      <span style={{ fontSize:12,color:C.textSecondary,fontWeight:500 }}>{formatDateTime(row.recorded_at)}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td>
                    <button
                      className="lr-action-btn"
                      onClick={() => setSelectedRecord(row)}
                      style={{
                        color:C.teal, borderColor:`${C.teal}30`,
                        background:`${C.teal}08`,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=C.teal; (e.currentTarget as HTMLElement).style.color='white'; (e.currentTarget as HTMLElement).style.borderColor=C.teal; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=`${C.teal}08`; (e.currentTarget as HTMLElement).style.color=C.teal; (e.currentTarget as HTMLElement).style.borderColor=`${C.teal}30`; }}
                    >
                      <MapPin size={13} />
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="lr-enter" style={{ marginTop:20, animationDelay:'280ms' }}>
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* ── Modal ── */}
      {selectedRecord && officeSettings && (
        <div className="lr-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedRecord(null); }}>
          <div className="lr-modal">

            {/* Modal header */}
            <div className="lr-modal-head">
              <div style={{
                width:38,height:38,borderRadius:12,flexShrink:0,
                background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 4px 14px rgba(14,165,233,0.3)`,
              }}>
                <MapPin size={17} color="white" />
              </div>
              <div style={{ flex:1 }}>
                <div className="lr-display" style={{ fontSize:14,fontWeight:800,color:C.textPrimary }}>{selectedRecord.full_name}</div>
                <div style={{ fontSize:11,color:C.textSecondary,marginTop:1 }}>{formatDateTime(selectedRecord.recorded_at)}</div>
              </div>
              <button className="lr-modal-close" onClick={() => setSelectedRecord(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Ping details bar */}
            <div style={{
              display:'flex', gap:0,
              borderBottom:`1.5px solid ${C.gray100}`,
            }}>
              {[
                { icon:Navigation, label:'Coordinates', value:`${selectedRecord.latitude.toFixed(5)}, ${selectedRecord.longitude.toFixed(5)}`, color:C.teal },
                { icon:Ruler,      label:'Distance',    value:`${selectedRecord.distance.toFixed(0)} m`,                                       color:selectedRecord.is_inside ? C.success : C.warning },
                { icon:Layers,     label:'Log Type',    value:selectedRecord.log_type,                                                          color:C.purple },
              ].map((d,i) => (
                <div key={i} style={{
                  flex:1, padding:'12px 16px',
                  borderRight: i < 2 ? `1px solid ${C.gray100}` : 'none',
                  background: i===0 ? `${d.color}05` : 'transparent',
                }}>
                  <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:4 }}>
                    <d.icon size={11} color={d.color} />
                    <span style={{ fontSize:9,fontWeight:700,color:C.textSecondary,letterSpacing:'.07em',textTransform:'uppercase' }}>{d.label}</span>
                  </div>
                  <div className="lr-display" style={{ fontSize:12,fontWeight:800,color:d.color }}>{d.value}</div>
                </div>
              ))}
              <div style={{ flex:1, padding:'12px 16px' }}>
                <div style={{ fontSize:9,fontWeight:700,color:C.textSecondary,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:4 }}>Status</div>
                <StatusPill inside={selectedRecord.is_inside} />
              </div>
            </div>

            {/* Map */}
            <div style={{ height:340, position:'relative' }}>
              <MapContainer
                center={[selectedRecord.latitude, selectedRecord.longitude]}
                zoom={16} zoomControl scrollWheelZoom
                style={{ height:'100%', width:'100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Circle
                  center={[officeSettings.OFFICE_LAT, officeSettings.OFFICE_LNG]}
                  radius={officeSettings.OFFICE_RADIUS}
                  pathOptions={{ color:C.primary, weight:2, dashArray:'6 4', fillColor:C.primary, fillOpacity:.07 }}
                />
                <Marker position={[officeSettings.OFFICE_LAT, officeSettings.OFFICE_LNG]} icon={OFFICE_ICON} />
                <Marker
                  position={[selectedRecord.latitude, selectedRecord.longitude]}
                  icon={buildUserIcon(selectedRecord.full_name, selectedRecord.is_inside)}
                />
              </MapContainer>

              {/* Map overlay badge */}
              <div style={{ position:'absolute',top:10,right:10,zIndex:1000,pointerEvents:'none' }}>
                <StatusPill inside={selectedRecord.is_inside} />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

