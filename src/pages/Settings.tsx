import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Loader2, MapPin, Clock, Radio, Save, RotateCcw,
  Building2, Navigation, Timer, Gauge, Settings2,
  CheckCircle2, AlertCircle, Wifi, Crosshair,
} from 'lucide-react';
import { settingsApi } from '@/api/settings.api';
import { useAuthStore } from '@/stores/auth.store';
import { OfficeConfig } from '@/types/api';
import toast from 'react-hot-toast';


// ─── Brand palette ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#4A7FD9',
  primaryDark:   '#2E5BB5',
  darkBlue:      '#2B7FFF',
  success:       '#34C759',
  danger:        '#E7000B',
  warning:       '#F5A623',
  purple:        '#8B5CF6',
  purpleDark:    '#6D28D9',
  teal:          '#0EA5E9',
  tealDark:      '#0369A1',
  orange:        '#F97316',
  orangeDark:    '#C2410C',
  textPrimary:   '#1A1A2E',
  textSecondary: '#6B7280',
  gray50:        '#F9FAFB',
  gray100:       '#F3F4F6',
  gray200:       '#E5E7EB',
  background:    '#F5F8FC',
};

const DAYS = [
  { label: 'Sun', value: 0, short: 'S' },
  { label: 'Mon', value: 1, short: 'M' },
  { label: 'Tue', value: 2, short: 'T' },
  { label: 'Wed', value: 3, short: 'W' },
  { label: 'Thu', value: 4, short: 'T' },
  { label: 'Fri', value: 5, short: 'F' },
  { label: 'Sat', value: 6, short: 'S' },
];

// ─── Inject styles ─────────────────────────────────────────────────────────────
const STYLE_ID = 'settings-styles-v2';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    .st2-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
    .st2-display { font-family: 'Sora', sans-serif !important; }

    @keyframes st2-fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes st2-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes st2-pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.5; transform:scale(1.4); }
    }
    @keyframes st2-bar {
      from { width:0; }
      to   { width: var(--w); }
    }

    .st2-enter { animation: st2-fade-up .5s cubic-bezier(.16,1,.3,1) both; }

    .st2-shimmer {
      background: linear-gradient(90deg,#e8edf5 25%,#f0f4fa 50%,#e8edf5 75%);
      background-size:600px 100%;
      animation: st2-shimmer 1.4s ease-in-out infinite;
      border-radius:10px;
    }

    /* ─ Card ─ */
    .st2-card {
      background: white;
      border-radius: 20px;
      border: 1.5px solid rgba(0,0,0,0.06);
      box-shadow: 0 4px 24px rgba(74,127,217,0.06);
      overflow: hidden;
      transition: box-shadow .2s ease;
    }
    .st2-card:hover { box-shadow: 0 8px 32px rgba(74,127,217,0.1); }

    .st2-card-head {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1.5px solid ${C.gray100};
    }

    .st2-card-body { padding: 20px; }

    /* ─ Input ─ */
    .st2-input {
      width: 100%;
      padding: 10px 13px;
      border-radius: 11px;
      border: 1.5px solid ${C.gray200};
      font-size: 13px;
      font-weight: 600;
      color: ${C.textPrimary};
      background: ${C.gray50};
      outline: none;
      transition: all .18s ease;
      font-family: 'DM Sans', sans-serif;
    }
    .st2-input:focus {
      border-color: var(--fc, ${C.primary});
      background: white;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--fc, ${C.primary}) 10%, transparent);
    }
    .st2-input[type="number"]::-webkit-inner-spin-button { opacity:.4; }

    /* ─ Label ─ */
    .st2-label {
      font-size: 10px;
      font-weight: 700;
      color: ${C.textSecondary};
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* ─ Helper ─ */
    .st2-helper {
      font-size: 11px;
      color: ${C.textSecondary};
      margin-top: 4px;
    }

    /* ─ Mini bar ─ */
    .st2-mini-bar-wrap {
      height: 3px; border-radius: 2px;
      background: ${C.gray100};
      overflow: hidden; margin-top: 5px;
    }
    .st2-mini-bar {
      height: 100%; border-radius: 2px;
      animation: st2-bar .6s cubic-bezier(.16,1,.3,1) both;
    }

    /* ─ Day btn ─ */
    .st2-day {
      width: 40px; height: 40px;
      border-radius: 11px;
      border: 1.5px solid;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 11px; font-weight: 800;
      transition: all .18s cubic-bezier(.16,1,.3,1);
      font-family: 'Sora', sans-serif;
      position: relative;
    }
    .st2-day:hover { transform: translateY(-2px); }
    .st2-day.on { transform: translateY(-2px) scale(1.06); }

    /* ─ Summary chip ─ */
    .st2-chip {
      padding: 10px 14px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid;
    }

    /* ─ Sidebar nav ─ */
    .st2-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      border: 1.5px solid transparent;
      transition: all .15s ease;
      color: ${C.textSecondary};
    }
    .st2-nav-item:hover { background: ${C.gray50}; color: ${C.textPrimary}; }
    .st2-nav-item.active { color: white; border-color: transparent; }

    /* ─ Footer ─ */
    .st2-footer {
      position: fixed;
      bottom: 0; left: 240px; right: 0;
      z-index: 30;
      height: 66px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(20px);
      border-top: 1.5px solid rgba(74,127,217,0.1);
      box-shadow: 0 -8px 32px rgba(74,127,217,0.07);
    }

    .st2-btn-save {
      display:inline-flex; align-items:center; gap:7px;
      padding: 10px 22px; border-radius:12px; border:none;
      background: linear-gradient(135deg,${C.primary},${C.darkBlue});
      color:white; font-size:13px; font-weight:700;
      cursor:pointer; transition:all .18s ease;
      box-shadow: 0 4px 16px rgba(74,127,217,0.35);
      font-family:'DM Sans',sans-serif;
    }
    .st2-btn-save:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(74,127,217,0.45); }
    .st2-btn-save:disabled { opacity:.45; cursor:not-allowed; }

    .st2-btn-discard {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 18px; border-radius:12px;
      border:1.5px solid ${C.gray200}; background:white;
      color:${C.textSecondary}; font-size:13px; font-weight:700;
      cursor:pointer; transition:all .18s ease;
      font-family:'DM Sans',sans-serif;
    }
    .st2-btn-discard:hover:not(:disabled) { border-color:${C.danger}; color:${C.danger}; }
    .st2-btn-discard:disabled { opacity:.4; cursor:not-allowed; }

    .st2-dirty-pill {
      display:flex; align-items:center; gap:7px;
      padding:7px 14px; border-radius:20px;
      background:rgba(245,166,35,0.1);
      border:1.5px solid rgba(245,166,35,0.3);
      font-size:12px; font-weight:700; color:${C.warning};
    }
    .st2-pulse { animation: st2-pulse 2s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
function fmtHour(h: number) {
  const sfx = h >= 12 ? 'PM' : 'AM';
  const d   = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${d}:00 ${sfx}`;
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label, helper, color = C.primary, icon: Icon, children,
}: {
  label:string; helper?:string; color?:string; icon?:React.ElementType; children:React.ReactNode;
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <div className="st2-label">
        {Icon && <Icon size={11} color={color} />}
        {label}
      </div>
      <div style={{ '--fc': color } as any}>{children}</div>
      {helper && <p className="st2-helper">{helper}</p>}
    </div>
  );
}

// ─── Styled input ──────────────────────────────────────────────────────────────
function SInput({
  value, onChange, type='text', placeholder, min, max, step,
}: {
  value:any; onChange:(v:any)=>void; type?:string;
  placeholder?:string; min?:number; max?:number; step?:string;
}) {
  return (
    <input
      className="st2-input"
      type={type} value={value ?? ''}
      placeholder={placeholder} min={min} max={max} step={step}
      onChange={e => onChange(
        type === 'number'
          ? (step ? parseFloat(e.target.value) : parseInt(e.target.value))
          : e.target.value
      )}
    />
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SCard({
  id, title, subtitle, gradient, icon:Icon, delay=0, children,
}: {
  id?:string; title:string; subtitle:string; gradient:string;
  icon:React.ElementType; delay?:number; children:React.ReactNode;
}) {
  return (
    <div id={id} className="st2-card st2-enter" style={{ animationDelay:`${delay}ms` }}>
      <div className="st2-card-head">
        <div style={{
          width:38, height:38, borderRadius:12,
          background:gradient, display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 14px rgba(0,0,0,0.15)', flexShrink:0,
        }}>
          <Icon size={17} color="white" />
        </div>
        <div>
          <h2 className="st2-display" style={{ fontSize:14, fontWeight:800, color:C.textPrimary, margin:0 }}>{title}</h2>
          <p style={{ fontSize:11, color:C.textSecondary, margin:0, marginTop:1 }}>{subtitle}</p>
        </div>
      </div>
      <div className="st2-card-body">{children}</div>
    </div>
  );
}

// ─── Mini bar ──────────────────────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct:number; color:string }) {
  return (
    <div className="st2-mini-bar-wrap">
      <div className="st2-mini-bar" style={{ '--w':`${pct}%`, width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}cc)` } as any} />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonSettings() {
  return (
    <div className="st2-root" style={{ width:'100%', paddingBottom:100 }}>
      <div className="st2-shimmer" style={{ height:140, marginBottom:22, borderRadius:20 }} />
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20 }}>
        <div className="st2-shimmer" style={{ height:300, borderRadius:20 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {[180,220,200].map((h,i) => <div key={i} className="st2-shimmer" style={{ height:h, borderRadius:20 }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function Settings() {
  const { setOfficeSettings }       = useAuthStore();
  const [form,  setForm]            = useState<OfficeConfig | null>(null);
  const [dirty, setDirty]           = useState(false);
  const [activeSection, setActive]  = useState('location');

  useEffect(() => { injectStyles(); }, []);

  // ── Query (unchanged) ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['office-settings'],
    queryFn:  () => settingsApi.getConfig(),
  });

  useEffect(() => {
    if (data?.data.data) { setForm(data.data.data); setDirty(false); }
  }, [data]);

  // ── Mutation (unchanged) ─────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (payload: OfficeConfig) => settingsApi.updateConfig(payload),
    onSuccess: (res) => {
      toast.success('Settings updated');
      setOfficeSettings(res.data.data);
      setDirty(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });

  // ── Handlers (unchanged) ─────────────────────────────────────────────────────
  const handleChange = (field: string, value: any) => {
    if (!form) return;
    const keys = field.split('.');
    if (keys.length === 2) {
      setForm({ ...form, [keys[0]]: { ...(form as any)[keys[0]], [keys[1]]: value } });
    } else {
      setForm({ ...form, [field]: value });
    }
    setDirty(true);
  };

  const toggleDay = (day: number) => {
    if (!form) return;
    const cur     = form.WORKING_HOURS.days;
    const updated = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day];
    handleChange('WORKING_HOURS.days', updated);
  };

  const handleDiscard = () => {
    if (data?.data.data) { setForm(data.data.data); setDirty(false); }
  };

  if (isLoading || !form) return <div className="st2-root"><SkeletonSettings /></div>;

  // ── Sidebar nav items ────────────────────────────────────────────────────────
  const NAV = [
    { id:'location',  label:'Office Location',    icon:Building2, gradient:`linear-gradient(135deg,${C.primary},${C.darkBlue})` },
    { id:'hours',     label:'Working Hours',       icon:Clock,     gradient:`linear-gradient(135deg,${C.purple},${C.purpleDark})` },
    { id:'tracking',  label:'Tracking Config',     icon:Gauge,     gradient:`linear-gradient(135deg,${C.teal},${C.tealDark})` },
  ];

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  return (
    <div className="st2-root" style={{ width:'100%', paddingBottom:100 }}>

      {/* ── Hero banner ── */}
      <div className="st2-card st2-enter" style={{
        background:`linear-gradient(135deg,${C.primary} 0%,${C.darkBlue} 55%,#1A3A8F 100%)`,
        marginBottom:22, boxShadow:`0 12px 48px rgba(74,127,217,0.28)`,
        animationDelay:'0ms',
      }}>
        <div style={{ padding:'22px 28px', position:'relative', overflow:'hidden' }}>
          {/* Decorative circles */}
          <div style={{ position:'absolute',top:-50,right:-30,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }} />
          <div style={{ position:'absolute',bottom:-60,right:120,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none' }} />
          <div style={{ position:'absolute',top:16,right:24,opacity:.07 }}><Settings2 size={96} color="white" /></div>

          <div style={{ position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                <div className="st2-pulse" style={{ width:7,height:7,borderRadius:'50%',background:'#93C5FD',boxShadow:'0 0 0 3px rgba(147,197,253,0.25)' }} />
                <span style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)',letterSpacing:'.08em' }}>APPLICATION SETTINGS</span>
              </div>
              <h1 className="st2-display" style={{ fontSize:22,fontWeight:800,color:'white',margin:'0 0 5px',lineHeight:1.1 }}>
                Office Configuration
              </h1>
              <p style={{ fontSize:13,color:'rgba(255,255,255,0.7)',margin:0,fontWeight:500 }}>
                Configure geofence, working hours and tracking behaviour
              </p>
            </div>

            {/* Live config chips */}
            <div style={{ display:'flex',gap:10,flexShrink:0 }}>
              {[
                { label:'Radius',   value:`${form.OFFICE_RADIUS}m`,                                      icon:Radio   },
                { label:'Hours',    value:`${fmtHour(form.WORKING_HOURS.start)}–${fmtHour(form.WORKING_HOURS.end)}`, icon:Clock   },
                { label:'Ping',     value:`${(form.LOCATION_POLLING_INTERVAL/1000).toFixed(0)}s`,         icon:Wifi    },
              ].map(c => (
                <div key={c.label} style={{
                  background:'rgba(255,255,255,0.12)',
                  backdropFilter:'blur(12px)',
                  border:'1.5px solid rgba(255,255,255,0.2)',
                  borderRadius:14,padding:'10px 16px',textAlign:'center',minWidth:96,
                }}>
                  <c.icon size={14} color="rgba(255,255,255,0.8)" style={{ margin:'0 auto 4px',display:'block' }} />
                  <div className="st2-display" style={{ fontSize:12,fontWeight:800,color:'white',whiteSpace:'nowrap' }}>{c.value}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,0.6)',fontWeight:600,marginTop:2 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20, alignItems:'start' }}>

        {/* ── Left sticky nav ── */}
        <div className="st2-card st2-enter" style={{ position:'sticky', top:80, animationDelay:'60ms' }}>
          <div style={{ padding:'16px 14px 12px', borderBottom:`1.5px solid ${C.gray100}` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.textSecondary,letterSpacing:'.08em',textTransform:'uppercase' }}>
              Sections
            </div>
          </div>
          <div style={{ padding:'10px 10px 14px', display:'flex', flexDirection:'column', gap:4 }}>
            {NAV.map(n => (
              <button
                key={n.id}
                className={`st2-nav-item${activeSection === n.id ? ' active' : ''}`}
                onClick={() => scrollTo(n.id)}
                style={{
                  background: activeSection === n.id ? n.gradient : 'transparent',
                  boxShadow:  activeSection === n.id ? '0 4px 14px rgba(0,0,0,0.14)' : 'none',
                }}
              >
                <div style={{
                  width:26,height:26,borderRadius:8,flexShrink:0,
                  background: activeSection === n.id ? 'rgba(255,255,255,0.2)' : `${n.gradient.match(/#[A-Fa-f0-9]{6}/)?.[0] ?? C.primary}15`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  <n.icon size={13} color={activeSection === n.id ? 'white' : (n.gradient.match(/#[A-Fa-f0-9]{6}/)?.[0] ?? C.primary)} />
                </div>
                {n.label}
              </button>
            ))}
          </div>

          {/* Live preview card */}
          <div style={{ margin:'0 10px 14px', padding:'14px', borderRadius:14, background:`${C.primary}07`, border:`1.5px solid ${C.primary}15` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.primary,letterSpacing:'.07em',marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
              <Crosshair size={10} /> LIVE PREVIEW
            </div>
            {[
              { label:'Office',   value: form.OFFICE_NAME || '—',                                  color:C.primary   },
              { label:'Radius',   value: `${form.OFFICE_RADIUS} m`,                                color:C.primary   },
              { label:'Window',   value: `${fmtHour(form.WORKING_HOURS.start)}`,                   color:C.purple    },
              { label:'Days',     value: `${form.WORKING_HOURS.days.length} active`,               color:C.purple    },
              { label:'Ping',     value: `${(form.LOCATION_POLLING_INTERVAL/1000).toFixed(0)}s`,   color:C.teal      },
            ].map(r => (
              <div key={r.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
                <span style={{ fontSize:10,color:C.textSecondary,fontWeight:600 }}>{r.label}</span>
                <span className="st2-display" style={{ fontSize:11,fontWeight:700,color:r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right content ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* ── Section 1: Office Location ── */}
          <SCard
            id="section-location"
            title="Office Location"
            subtitle="Coordinates, name and geofence radius"
            gradient={`linear-gradient(135deg,${C.primary},${C.darkBlue})`}
            icon={Building2}
            delay={120}
          >
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <Field label="Office Name" icon={Building2} color={C.primary}>
                <SInput value={form.OFFICE_NAME} onChange={v => handleChange('OFFICE_NAME', v)} placeholder="AttendSphere HQ" />
              </Field>
              <Field label="Office Address" icon={MapPin} color={C.primary}>
                <SInput value={form.OFFICE_ADDRESS} onChange={v => handleChange('OFFICE_ADDRESS', v)} placeholder="123 Main St, City" />
              </Field>
              <Field label="Latitude" icon={Navigation} color={C.teal}>
                <SInput value={form.OFFICE_LAT} onChange={v => handleChange('OFFICE_LAT', v)} type="number" step="0.000001" placeholder="22.572646" />
              </Field>
              <Field label="Longitude" icon={Navigation} color={C.teal}>
                <SInput value={form.OFFICE_LNG} onChange={v => handleChange('OFFICE_LNG', v)} type="number" step="0.000001" placeholder="88.363895" />
              </Field>
            </div>

            {/* Radius row */}
            <div style={{ padding:'16px', borderRadius:14, background:`${C.primary}06`, border:`1.5px solid ${C.primary}15` }}>
              <Field label="Geofence Radius (metres)" icon={Radio} color={C.primary} helper="Distance from office centre that defines the attendance zone">
                <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:2 }}>
                  <div style={{ flex:1 }}>
                    <SInput value={form.OFFICE_RADIUS} onChange={v => handleChange('OFFICE_RADIUS', v)} type="number" />
                    <MiniBar pct={Math.min((form.OFFICE_RADIUS / 1000) * 100, 100)} color={C.primary} />
                  </div>
                  <div style={{
                    padding:'10px 18px', borderRadius:12, flexShrink:0,
                    background:`linear-gradient(135deg,${C.primary},${C.darkBlue})`,
                    color:'white', fontSize:14, fontWeight:800,
                    fontFamily:"'Sora',sans-serif",
                    boxShadow:`0 4px 14px rgba(74,127,217,0.35)`,
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    <Radio size={13} />
                    {form.OFFICE_RADIUS} m
                  </div>
                </div>
              </Field>
            </div>
          </SCard>

          {/* ── Section 2: Working Hours ── */}
          <SCard
            id="section-hours"
            title="Working Hours"
            subtitle="Active tracking window and working days"
            gradient={`linear-gradient(135deg,${C.purple},${C.purpleDark})`}
            icon={Clock}
            delay={180}
          >
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
              <Field label="Start Hour (0–23)" icon={Clock} color={C.purple}>
                <SInput value={form.WORKING_HOURS.start} onChange={v => handleChange('WORKING_HOURS.start', v)} type="number" min={0} max={23} />
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:6,padding:'7px 12px',borderRadius:10,background:`${C.purple}08`,border:`1px solid ${C.purple}20` }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:C.success,flexShrink:0 }} />
                  <span className="st2-display" style={{ fontSize:12,fontWeight:700,color:C.purple }}>{fmtHour(form.WORKING_HOURS.start)}</span>
                  <span style={{ fontSize:10,color:C.textSecondary }}>opens</span>
                </div>
              </Field>
              <Field label="End Hour (0–23)" icon={Clock} color={C.purple}>
                <SInput value={form.WORKING_HOURS.end} onChange={v => handleChange('WORKING_HOURS.end', v)} type="number" min={0} max={23} />
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:6,padding:'7px 12px',borderRadius:10,background:`${C.purple}08`,border:`1px solid ${C.purple}20` }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:C.danger,flexShrink:0 }} />
                  <span className="st2-display" style={{ fontSize:12,fontWeight:700,color:C.purple }}>{fmtHour(form.WORKING_HOURS.end)}</span>
                  <span style={{ fontSize:10,color:C.textSecondary }}>closes</span>
                </div>
              </Field>
            </div>

            {/* Shift summary bar */}
            <div style={{
              display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
              borderRadius:13,marginBottom:18,
              background:`linear-gradient(90deg,rgba(139,92,246,0.07),transparent)`,
              border:`1.5px solid rgba(139,92,246,0.14)`,
            }}>
              <Timer size={14} color={C.purple} />
              <span style={{ fontSize:12,fontWeight:600,color:C.textSecondary }}>Shift window:</span>
              <span className="st2-display" style={{ fontSize:13,fontWeight:800,color:C.purple }}>
                {fmtHour(form.WORKING_HOURS.start)} – {fmtHour(form.WORKING_HOURS.end)}
              </span>
              <div style={{ marginLeft:'auto',padding:'3px 10px',borderRadius:20,background:`rgba(139,92,246,0.1)`,color:C.purple,fontSize:11,fontWeight:700,border:`1px solid rgba(139,92,246,0.22)` }}>
                {Math.max(form.WORKING_HOURS.end - form.WORKING_HOURS.start, 0)}h shift
              </div>
            </div>

            {/* Working days */}
            <div>
              <div style={{ fontSize:10,fontWeight:700,color:C.textSecondary,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10 }}>Working Days</div>
              <div style={{ display:'flex',gap:8 }}>
                {DAYS.map(day => {
                  const on = form.WORKING_HOURS.days.includes(day.value);
                  return (
                    <div key={day.value} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                      <button
                        className={`st2-day${on ? ' on' : ''}`}
                        onClick={() => toggleDay(day.value)}
                        style={{
                          background: on ? `linear-gradient(135deg,${C.purple},${C.purpleDark})` : C.gray50,
                          color:       on ? 'white' : C.textSecondary,
                          borderColor: on ? C.purple : C.gray200,
                          boxShadow:   on ? `0 4px 14px rgba(139,92,246,0.4)` : 'none',
                        }}
                      >
                        {day.short}
                      </button>
                      <span style={{ fontSize:9,color: on ? C.purple : C.textSecondary,fontWeight:700,letterSpacing:'.02em' }}>{day.label.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </SCard>

          {/* ── Section 3: Tracking Config ── */}
          <SCard
            id="section-tracking"
            title="Tracking Configuration"
            subtitle="Fine-tune location capture frequency and distance triggers"
            gradient={`linear-gradient(135deg,${C.teal},${C.tealDark})`}
            icon={Gauge}
            delay={240}
          >
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
              <Field label="Polling Interval (ms)" icon={Timer} color={C.teal} helper="How often the mobile app sends a ping">
                <SInput value={form.LOCATION_POLLING_INTERVAL} onChange={v => handleChange('LOCATION_POLLING_INTERVAL', v)} type="number" />
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:4 }}>
                  <MiniBar pct={Math.min((form.LOCATION_POLLING_INTERVAL/60000)*100,100)} color={C.teal} />
                  <span style={{ fontSize:10,color:C.teal,fontWeight:700,flexShrink:0 }}>{(form.LOCATION_POLLING_INTERVAL/1000).toFixed(0)}s</span>
                </div>
              </Field>

              <Field label="Distance Threshold (m)" icon={Navigation} color={C.teal} helper="Movement that triggers a location log">
                <SInput value={form.DISTANCE_THRESHOLD} onChange={v => handleChange('DISTANCE_THRESHOLD', v)} type="number" />
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:4 }}>
                  <MiniBar pct={Math.min((form.DISTANCE_THRESHOLD/500)*100,100)} color={C.teal} />
                  <span style={{ fontSize:10,color:C.teal,fontWeight:700,flexShrink:0 }}>{form.DISTANCE_THRESHOLD}m</span>
                </div>
              </Field>
            </div>

            <Field label="Time Interval (ms)" icon={Clock} color={C.teal} helper="Minimum time between interval-based logs">
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ flex:1 }}>
                  <SInput value={form.TIME_INTERVAL_MS} onChange={v => handleChange('TIME_INTERVAL_MS', v)} type="number" />
                  <MiniBar pct={Math.min((form.TIME_INTERVAL_MS/300000)*100,100)} color={C.teal} />
                </div>
                <div style={{
                  padding:'9px 16px',borderRadius:11,flexShrink:0,
                  background:`${C.teal}10`,border:`1.5px solid ${C.teal}30`,
                  fontSize:13,fontWeight:800,color:C.teal,
                  fontFamily:"'Sora',sans-serif",
                }}>
                  {(form.TIME_INTERVAL_MS/1000).toFixed(0)}s
                </div>
              </div>
            </Field>

            {/* Summary chips */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:18 }}>
              {[
                { label:'Ping every',   value:`${(form.LOCATION_POLLING_INTERVAL/1000).toFixed(0)}s`, color:C.teal    },
                { label:'Log after',    value:`${form.DISTANCE_THRESHOLD}m`,                          color:C.primary },
                { label:'Min interval', value:`${(form.TIME_INTERVAL_MS/1000).toFixed(0)}s`,           color:C.purple  },
              ].map(c => (
                <div key={c.label} className="st2-chip" style={{ background:`${c.color}08`, borderColor:`${c.color}22` }}>
                  <div className="st2-display" style={{ fontSize:16,fontWeight:800,color:c.color }}>{c.value}</div>
                  <div style={{ fontSize:10,color:C.textSecondary,fontWeight:600,marginTop:3 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </SCard>

        </div>{/* end right col */}
      </div>{/* end two-col grid */}

      {/* ── Sticky footer ── */}
      <div className="st2-footer">
        <div>
          {dirty ? (
            <div className="st2-dirty-pill">
              <div className="st2-pulse" style={{ width:7,height:7,borderRadius:'50%',background:C.warning }} />
              <AlertCircle size={13} />
              Unsaved changes
            </div>
          ) : (
            <div style={{ display:'flex',alignItems:'center',gap:7,fontSize:12,color:C.textSecondary,fontWeight:600 }}>
              <CheckCircle2 size={14} color={C.success} />
              All changes saved
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="st2-btn-discard" onClick={handleDiscard} disabled={!dirty}>
            <RotateCcw size={13} /> Discard
          </button>
          <button
            className="st2-btn-save"
            onClick={() => mutation.mutate(form)}
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending
              ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> Saving…</>
              : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>

    </div>
  );
}