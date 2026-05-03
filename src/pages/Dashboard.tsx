import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import {
  Users, UserCheck, UserX, CalendarCheck, MapPin,
  ChevronRight, ArrowUpRight, Zap, Clock, Navigation,
  TrendingUp, Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLine } from '@/components/ui/Skeleton';
import { MiniMap } from '@/components/map/MiniMap';
import { adminApi } from '@/api/admin.api';
import { attendanceApi } from '@/api/attendance.api';
import { locationApi } from '@/api/location.api';
import { useAuthStore } from '@/stores/auth.store';
import { useDateStore } from '@/stores/date.store';
import { formatDate, getTodayISO } from '@/utils/date';
import { cn } from '@/utils/cn';
import { C } from '@/utils/colors';

// ─── Brand palette ─────────────────────────────────────────────────────────────


// ─── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = 'dashboard-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    .ds-root * { font-family: 'DM Sans', sans-serif; }
    .ds-display { font-family: 'Sora', sans-serif !important; }

    @keyframes ds-fade-up {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ds-scale-in {
      from { opacity: 0; transform: scale(0.93); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes ds-count-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ds-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes ds-ping {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.5; transform:scale(1.35); }
    }
    @keyframes ds-float {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-5px); }
    }
    @keyframes ds-spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes ds-gradient-shift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .ds-card-enter {
      animation: ds-fade-up .5s cubic-bezier(.16,1,.3,1) both;
    }
    .ds-stat-value {
      animation: ds-count-up .6s cubic-bezier(.16,1,.3,1) both;
    }
    .ds-ping-dot {
      animation: ds-ping 2s ease-in-out infinite;
    }
    .ds-float {
      animation: ds-float 4s ease-in-out infinite;
    }

    .ds-stat-card {
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      padding: 22px;
      cursor: default;
      transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease;
      border: 1.5px solid rgba(255,255,255,0.7);
    }
    .ds-stat-card:hover {
      transform: translateY(-3px) scale(1.015);
      box-shadow: 0 16px 48px rgba(0,0,0,0.12) !important;
    }
    .ds-stat-card::before {
      content: '';
      position: absolute;
      top: -40%;
      right: -20%;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      opacity: .08;
      background: white;
    }
    .ds-stat-card::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      opacity: .06;
      background: white;
    }

    .ds-table-row {
      transition: background .15s ease, transform .15s ease;
      border-bottom: 1px solid rgba(229,231,235,0.6);
    }
    .ds-table-row:hover {
      background: linear-gradient(90deg, rgba(74,127,217,0.04), transparent);
      transform: translateX(2px);
    }
    .ds-table-row:last-child { border-bottom: none; }

    .ds-section-card {
      background: white;
      border-radius: 20px;
      border: 1.5px solid ${C.gray100};
      box-shadow: 0 4px 24px rgba(74,127,217,0.06);
      overflow: hidden;
      transition: box-shadow .2s ease;
    }
    .ds-section-card:hover {
      box-shadow: 0 8px 32px rgba(74,127,217,0.1);
    }

    .ds-view-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: ${C.primary};
      padding: 5px 10px;
      border-radius: 20px;
      background: rgba(74,127,217,0.08);
      border: 1px solid rgba(74,127,217,0.2);
      transition: all .15s ease;
      cursor: pointer;
    }
    .ds-view-btn:hover {
      background: ${C.primary};
      color: white;
      border-color: ${C.primary};
    }

    .ds-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
      font-family: 'Sora', sans-serif;
    }

    .ds-gradient-heading {
      background: linear-gradient(135deg, ${C.primary}, ${C.darkBlue}, ${C.primaryLight});
      background-size: 200% 200%;
      animation: ds-gradient-shift 4s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .ds-shimmer-skeleton {
      background: linear-gradient(90deg, #e8edf5 25%, #f0f4fa 50%, #e8edf5 75%);
      background-size: 400px 100%;
      animation: ds-shimmer 1.5s infinite;
      border-radius: 8px;
    }

    .ds-hours-bar {
      height: 4px;
      border-radius: 2px;
      background: ${C.gray100};
      overflow: hidden;
      margin-top: 3px;
    }
    .ds-hours-fill {
      height: 100%;
      border-radius: 2px;
      transition: width .8s cubic-bezier(.16,1,.3,1);
    }
  `;
  document.head.appendChild(s);
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number | string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof value !== 'number' || !el.current) return;
    const target = value;
    let start = 0;
    const duration = 900;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (el.current) el.current.textContent = String(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame((t) => step(t, startTime));
    };
    requestAnimationFrame((t) => step(t, t));
  }, [value]);
  return <span ref={el}>{typeof value === 'number' ? 0 : value}</span>;
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
const STAT_THEMES = [
  {
    gradient: `linear-gradient(135deg, ${C.primary}, ${C.darkBlue})`,
    iconBg: 'rgba(255,255,255,0.2)',
    shadow: `0 8px 32px rgba(74,127,217,0.35)`,
    accent: C.orange,
  },
  {
    gradient: `linear-gradient(135deg, #27AE60, ${C.success})`,
    iconBg: 'rgba(255,255,255,0.2)',
    shadow: `0 8px 32px rgba(52,199,89,0.3)`,
    accent: '#81C784',
  },
  {
    gradient: `linear-gradient(135deg, #E74C3C, ${C.danger})`,
    iconBg: 'rgba(255,255,255,0.2)',
    shadow: `0 8px 32px rgba(231,0,11,0.28)`,
    accent: '#FFCDD2',
  },
  {
    gradient: `linear-gradient(135deg, #E67E22, ${C.warning})`,
    iconBg: 'rgba(255,255,255,0.2)',
    shadow: `0 8px 32px rgba(245,166,35,0.3)`,
    accent: '#FFB74D',
  },
];

function StatCard({
  icon: Icon,
  title,
  value,
  loading,
  themeIndex,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  loading: boolean;
  themeIndex: number;
  delay?: number;
}) {
  const t = STAT_THEMES[themeIndex];
  return (
    <div
      className="ds-stat-card ds-card-enter"
      style={{
        background: t.gradient,
        boxShadow: t.shadow,
        animationDelay: `${delay}ms`,
        color: 'white',
      }}
    >
      {/* Decorative ring */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 88, height: 88, borderRadius: '50%',
        border: '20px solid rgba(255,255,255,0.08)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13,
          background: t.iconBg,
          backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <Icon size={20} color="white" />
        </div>

        {loading ? (
          <div>
            <div className="ds-shimmer-skeleton" style={{ width: 60, height: 36, marginBottom: 8, background: 'rgba(255,255,255,0.2)' }} />
            <div className="ds-shimmer-skeleton" style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.15)' }} />
          </div>
        ) : (
          <>
            <div className="ds-stat-value ds-display" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
              <AnimatedNumber value={value} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>{title}</div>
          </>
        )}

        {/* Trend arrow decoration */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          opacity: 0.35,
        }}>
          <TrendingUp size={18} color="white" />
        </div>
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  onViewAll,
  icon: Icon,
}: {
  title: string;
  onViewAll: () => void;
  icon?: React.ElementType;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.primary}, ${C.darkBlue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} color="white" />
          </div>
        )}
        <span className="ds-display" style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
          {title}
        </span>
      </div>
      <button className="ds-view-btn" onClick={onViewAll}>
        View all <ArrowUpRight size={12} />
      </button>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, color = C.primary }: { name: string; color?: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="ds-avatar" style={{
      background: `${color}18`,
      color,
      border: `1.5px solid ${color}30`,
    }}>
      {initials}
    </div>
  );
}

// ─── Working hours mini bar ────────────────────────────────────────────────────
function HoursBar({ hours }: { hours: number }) {
  const pct = Math.min((hours / 8) * 100, 100);
  const color = hours >= 8 ? C.success : hours >= 4 ? C.warning : C.danger;
  return (
    <div>
      <span className="ds-display" style={{ fontSize: 13, fontWeight: 700, color }}>{hours}h</span>
      <div className="ds-hours-bar">
        <div className="ds-hours-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate      = useNavigate();
  const officeSettings = useAuthStore((s) => s.officeSettings);
  const { startDate, endDate } = useDateStore();

  useEffect(() => { injectStyles(); }, []);

  // ── Queries (unchanged) ──────────────────────────────────────────────────────
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 1, 1],
    queryFn:  () => adminApi.getUsers({ page: 1, limit: 1 }),
  });

  const { data: allUsersData, isLoading: allUsersLoading } = useQuery({
    queryKey: ['users', 1, 200],
    queryFn:  () => adminApi.getUsers({ page: 1, limit: 200 }),
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 1, 5, startDate, endDate],
    queryFn:  () => attendanceApi.getPaginated({
      page: 1, limit: 5,
      startDate: startDate || getTodayISO(),
      endDate:   endDate   || getTodayISO(),
    }),
  });

  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ['location', 1, 5, startDate, endDate],
    queryFn:  () => locationApi.getPaginated({
      page: 1, limit: 5,
      startDate: startDate || getTodayISO(),
      endDate:   endDate   || getTodayISO(),
    }),
  });

  console.log('allUsersData?.data?.data: ', allUsersData?.data?.data);
  console.log('locationData data data >>>   73', locationData?.data?.data?.data);

  // ── Derived (unchanged) ──────────────────────────────────────────────────────
  const totalEmployees = usersData?.data.pagination.total || 0;
  const presentToday   =
    Array.isArray(allUsersData?.data.data) &&
    allUsersData?.data?.data.filter((u: any) => u.is_present).length || 0;
  const absentToday    = totalEmployees - presentToday;
  const today          = new Date().getDay();
  const workingDays    = officeSettings?.WORKING_HOURS?.days || [];
  const isWorkingDay   = workingDays.includes(today);

  const stats = [
    { icon: Users,        title: 'Total Employees', value: totalEmployees,                     themeIndex: 0 },
    { icon: UserCheck,    title: 'Present Today',   value: presentToday,                       themeIndex: 1 },
    { icon: UserX,        title: 'Absent Today',    value: absentToday,                        themeIndex: 2 },
    { icon: CalendarCheck,title: "Today's Status",  value: isWorkingDay ? 'Working Day' : 'Off Day', themeIndex: 3 },
  ];

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayName = dayNames[today];

  return (
    <div className="ds-root" style={{ minHeight: '100vh', background: C.background, padding: '0 0 32px' }}>

      {/* ── Hero greeting bar ── */}
      <div className="ds-card-enter" style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.darkBlue} 60%, #1A3A8F 100%)`,
        borderRadius: 24,
        padding: '28px 32px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 12px 48px rgba(74,127,217,0.3)`,
        animationDelay: '0ms',
      }}>
        {/* Background decoration */}
        <div style={{ position:'absolute', top:-60, right:-40, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, right:100, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:20, right:200, opacity:0.07 }}>
          <Activity size={120} color="white" />
        </div>

        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div className="ds-ping-dot" style={{ width:8, height:8, borderRadius:'50%', background:C.success, boxShadow:`0 0 0 3px rgba(52,199,89,0.25)` }} />
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.75)', letterSpacing:'0.06em' }}>LIVE DASHBOARD</span>
            </div>
            <h1 className="ds-display" style={{ fontSize:28, fontWeight:800, color:'white', marginBottom:6, lineHeight:1.1 }}>
              AttendSphere
            </h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.72)', fontWeight:500 }}>
              {isWorkingDay
                ? `Today is ${todayName} — a working day. Tracking is active.`
                : `Today is ${todayName} — off day. No tracking required.`}
            </p>
          </div>

          <div style={{ display:'flex', gap:12, flexShrink:0 }}>
            {[
              { label:'Present', value: presentToday, color: C.success, icon: UserCheck },
              { label:'Absent',  value: absentToday,  color: '#FFB74D',  icon: UserX },
            ].map(s => (
              <div key={s.label} style={{
                background:'rgba(255,255,255,0.12)',
                backdropFilter:'blur(12px)',
                border:'1.5px solid rgba(255,255,255,0.2)',
                borderRadius:16,
                padding:'14px 20px',
                textAlign:'center',
                minWidth:90,
              }}>
                <div className="ds-display" style={{ fontSize:26, fontWeight:800, color:s.color }}>
                  {(usersLoading || allUsersLoading) ? '—' : s.value}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {stats.map((s, i) => (
          <StatCard
            key={i}
            icon={s.icon}
            title={s.title}
            value={s.value}
            loading={usersLoading || allUsersLoading}
            themeIndex={s.themeIndex}
            delay={i * 80}
          />
        ))}
      </div>

      {/* ── Row 2: Users + MiniMap ── */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:20, marginBottom:20 }}>

        {/* Users table */}
        <div className="ds-card-enter" style={{ animationDelay:'320ms' }}>
          <SectionHeader title="Employees Today" onViewAll={() => navigate('/attendance')} icon={Users} />
          <div className="ds-section-card">
            {/* Table head */}
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 100px 44px',
              padding:'10px 16px',
              background:`linear-gradient(90deg, rgba(74,127,217,0.06), transparent)`,
              borderBottom:`1.5px solid ${C.gray100}`,
            }}>
              {['Employee','Status',''].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.08em', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>

            <div>
              {allUsersLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="ds-table-row" style={{ padding:'12px 16px', display:'flex', gap:12, alignItems:'center' }}>
                      <div className="ds-shimmer-skeleton" style={{ width:34, height:34, borderRadius:'50%', flexShrink:0 }} />
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                        <div className="ds-shimmer-skeleton" style={{ width:'60%', height:12 }} />
                        <div className="ds-shimmer-skeleton" style={{ width:'40%', height:10 }} />
                      </div>
                    </div>
                  ))
                : allUsersData?.data?.data.slice(0, 10).map((user: any) => (
                    <div key={user.id} className="ds-table-row" style={{
                      display:'grid', gridTemplateColumns:'1fr 100px 44px',
                      alignItems:'center', padding:'11px 16px',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={user.full_name} color={C.primary} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>{user.full_name}</div>
                          <div style={{ fontSize:11, color:C.textSecondary }}>{user.email}</div>
                        </div>
                      </div>
                      <div>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:5,
                          fontSize:11, fontWeight:700,
                          padding:'3px 9px', borderRadius:20,
                          background: user.is_present ? `${C.success}15` : `${C.danger}12`,
                          color: user.is_present ? C.success : C.danger,
                          border: `1px solid ${user.is_present ? C.success+'30' : C.danger+'25'}`,
                        }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background: user.is_present ? C.success : C.danger, display:'inline-block' }} />
                          {user.is_present ? 'Present' : 'Absent'}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/live-map')}
                        style={{
                          width:28, height:28, borderRadius:8,
                          background:`${C.primary}10`,
                          border:`1px solid ${C.primary}25`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', transition:'all .15s ease',
                          color:C.primary,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.primary; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${C.primary}10`; (e.currentTarget as HTMLElement).style.color = C.primary; }}
                      >
                        <MapPin size={13} />
                      </button>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Mini Map */}
        <div className="ds-card-enter" style={{ animationDelay:'400ms' }}>
          <SectionHeader title="Office Location" onViewAll={() => navigate('/live-map')} icon={MapPin} />
          <div className="ds-section-card" style={{ overflow:'hidden' }}>
            {/* Map header accent */}
            <div style={{
              padding:'10px 14px',
              background:`linear-gradient(90deg, ${C.primary}10, ${C.darkBlue}06)`,
              borderBottom:`1.5px solid ${C.gray100}`,
              display:'flex', alignItems:'center', gap:8,
            }}>
              <div className="ds-ping-dot" style={{ width:7, height:7, borderRadius:'50%', background:C.success }} />
              <span style={{ fontSize:11, fontWeight:700, color:C.textSecondary, letterSpacing:'0.05em' }}>LIVE · MAP VIEW</span>
            </div>

            <MiniMap />

            <div style={{ padding:'12px 14px', background:C.cardLight, borderTop:`1px solid ${C.gray100}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                <div style={{ width:24, height:24, borderRadius:7, background:`linear-gradient(135deg,${C.primary},${C.darkBlue})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <MapPin size={12} color="white" />
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:C.textPrimary }} className="ds-display">
                  {officeSettings?.OFFICE_NAME}
                </span>
              </div>
              <div style={{ fontSize:11, color:C.textSecondary, marginBottom:3, paddingLeft:31 }}>
                {officeSettings?.OFFICE_ADDRESS}
              </div>
              {officeSettings?.WORKING_HOURS && (
                <div style={{ display:'flex', alignItems:'center', gap:5, paddingLeft:31 }}>
                  <Clock size={10} color={C.primary} />
                  <span style={{ fontSize:11, color:C.primary, fontWeight:600 }}>
                    {officeSettings.WORKING_HOURS.start}:00 – {officeSettings.WORKING_HOURS.end}:00
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Attendance + Location snippets ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Attendance snippet */}
        <div className="ds-card-enter" style={{ animationDelay:'480ms' }}>
          <SectionHeader title="Recent Attendance" onViewAll={() => navigate('/attendance')} icon={Activity} />
          <div className="ds-section-card">
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 90px 60px 44px 44px',
              padding:'9px 16px',
              background:`linear-gradient(90deg, rgba(52,199,89,0.05), transparent)`,
              borderBottom:`1.5px solid ${C.gray100}`,
            }}>
              {['Employee','Date','Hours','In','Out'].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.07em', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>

            {attendanceLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="ds-table-row" style={{ padding:'11px 16px', display:'flex', gap:10 }}>
                    <div className="ds-shimmer-skeleton" style={{ width:32, height:32, borderRadius:'50%', flexShrink:0 }} />
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                      <div className="ds-shimmer-skeleton" style={{ width:'55%', height:11 }} />
                      <div className="ds-shimmer-skeleton" style={{ width:'35%', height:10 }} />
                    </div>
                  </div>
                ))
              : attendanceData?.data.data?.data.map((record: any) => (
                  <div key={`${record.user_id}-${record.event_date}`} className="ds-table-row" style={{
                    display:'grid', gridTemplateColumns:'1fr 90px 60px 44px 44px',
                    alignItems:'center', padding:'10px 16px',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <Avatar name={record.full_name} color={C.success} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{record.full_name}</div>
                        <div style={{ fontSize:10, color:C.textSecondary }}>{record.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:C.textSecondary, fontWeight:500 }}>{formatDate(record.event_date)}</div>
                    <HoursBar hours={record.working_hours} />
                    <div>
                      <span style={{
                        display:'inline-block', padding:'2px 7px', borderRadius:20,
                        fontSize:10, fontWeight:700,
                        background: record.has_checkin ? `${C.success}15` : C.gray100,
                        color: record.has_checkin ? C.success : C.textSecondary,
                        border: `1px solid ${record.has_checkin ? C.success+'30' : C.gray200}`,
                      }}>
                        {record.has_checkin ? 'In' : '—'}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        display:'inline-block', padding:'2px 7px', borderRadius:20,
                        fontSize:10, fontWeight:700,
                        background: record.has_checkout ? `${C.primary}12` : C.gray100,
                        color: record.has_checkout ? C.primary : C.textSecondary,
                        border: `1px solid ${record.has_checkout ? C.primary+'30' : C.gray200}`,
                      }}>
                        {record.has_checkout ? 'Out' : '—'}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Location snippet */}
        <div className="ds-card-enter" style={{ animationDelay:'560ms' }}>
          <SectionHeader title="Recent Locations" onViewAll={() => navigate('/location')} icon={Navigation} />
          <div className="ds-section-card">
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 90px 56px 70px',
              padding:'9px 16px',
              background:`linear-gradient(90deg, rgba(74,127,217,0.05), transparent)`,
              borderBottom:`1.5px solid ${C.gray100}`,
            }}>
              {['Employee','Status','Dist','Time'].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:C.textSecondary, letterSpacing:'0.07em', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>

            {locationLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="ds-table-row" style={{ padding:'11px 16px', display:'flex', gap:10 }}>
                    <div className="ds-shimmer-skeleton" style={{ width:32, height:32, borderRadius:'50%', flexShrink:0 }} />
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                      <div className="ds-shimmer-skeleton" style={{ width:'55%', height:11 }} />
                      <div className="ds-shimmer-skeleton" style={{ width:'35%', height:10 }} />
                    </div>
                  </div>
                ))
              : locationData?.data?.data?.data?.map((record: any) => (
                  <div key={record.id} className="ds-table-row" style={{
                    display:'grid', gridTemplateColumns:'1fr 90px 56px 70px',
                    alignItems:'center', padding:'10px 16px',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <Avatar name={record.full_name} color={record.is_inside ? C.success : C.warning} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{record.full_name}</div>
                        <div style={{ fontSize:10, color:C.textSecondary }}>{record.email}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        padding:'3px 8px', borderRadius:20,
                        fontSize:10, fontWeight:700,
                        background: record.is_inside ? `${C.success}15` : `${C.warning}15`,
                        color: record.is_inside ? C.success : C.warning,
                        border: `1px solid ${record.is_inside ? C.success+'30' : C.warning+'30'}`,
                      }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background: record.is_inside ? C.success : C.warning, display:'inline-block' }} />
                        {record.is_inside ? 'Inside' : 'Outside'}
                      </span>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:C.textSecondary }}>
                      {record.distance.toFixed(0)}<span style={{ fontSize:9, color:C.textSecondary, fontWeight:400 }}> m</span>
                    </div>
                    <div style={{ fontSize:11, color:C.textSecondary, fontWeight:500 }}>
                      {formatDate(record.recorded_at, 'hh:mm a')}
                    </div>
                  </div>
                ))}
          </div>
        </div>

      </div>
    </div>
  );
}