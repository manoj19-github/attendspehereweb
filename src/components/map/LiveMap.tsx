import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '@/stores/auth.store';
import { useSocketStore } from '@/stores/socket.store';
import { formatDistanceToNow } from 'date-fns';
import {
  Navigation, NavigationOff, Users, Wifi, WifiOff,
  MapPin, Clock, Ruler, Activity, ChevronLeft,
  ChevronRight, Crosshair, Layers, X, TrendingUp,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Brand palette ─────────────────────────────────────────────────────────────
const C = {
  primary:     '#4A7FD9',
  primaryDark: '#2E5BB5',
  darkBlue:    '#2B7FFF',
  success:     '#34C759',
  danger:      '#E7000B',
  warning:     '#F5A623',
  gray400:     '#9CA3AF',
  gray500:     '#6B7280',
  gray700:     '#374151',
  textPrimary: '#1A1A2E',
};

// ─── Inject styles ─────────────────────────────────────────────────────────────
const STYLE_ID = 'livemap-v2';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    .lm2-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
    .lm2-display { font-family:'Sora',sans-serif !important; }

    @keyframes lm2-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.3)} }
    @keyframes lm2-ring   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
    @keyframes lm2-in-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes lm2-in-right{ from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
    @keyframes lm2-in-left { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }

    .lm2-badge-in  { animation:lm2-in-up    .35s cubic-bezier(.16,1,.3,1) both; }
    .lm2-panel-in  { animation:lm2-in-right .4s  cubic-bezier(.16,1,.3,1) both; }
    .lm2-tbar-in   { animation:lm2-in-left  .4s  cubic-bezier(.16,1,.3,1) both; }
    .lm2-pulse-dot { animation:lm2-pulse 2s ease-in-out infinite; }

    /* Leaflet popup */
    .lm2-popup .leaflet-popup-content-wrapper {
      padding:0; border-radius:16px; overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,0.2),0 4px 16px rgba(74,127,217,0.15);
      border:1.5px solid rgba(255,255,255,0.7);
    }
    .lm2-popup .leaflet-popup-content { margin:0; width:auto !important; }
    .lm2-popup .leaflet-popup-tip-container { display:none; }

    /* Glass */
    .lm2-glass {
      background:rgba(255,255,255,0.94);
      backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);
      border:1.5px solid rgba(255,255,255,0.7);
    }

    /* User row */
    .lm2-user-row {
      cursor:pointer;
      transition:background .13s ease, transform .12s ease;
    }
    .lm2-user-row:hover { background:rgba(74,127,217,0.05) !important; transform:translateX(2px); }

    /* Map ctrl btn */
    .lm2-ctrl {
      width:36px; height:36px; border-radius:10px;
      background:rgba(255,255,255,0.95);
      border:1.5px solid rgba(255,255,255,0.7);
      box-shadow:0 2px 12px rgba(0,0,0,0.1);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:all .15s ease;
      color:#6B7280; backdrop-filter:blur(12px);
    }
    .lm2-ctrl:hover {
      background:#4A7FD9; color:white;
      border-color:#4A7FD9;
      box-shadow:0 4px 16px rgba(74,127,217,0.35);
    }
  `;
  document.head.appendChild(s);
}

// ─── Office icon ───────────────────────────────────────────────────────────────
const buildOfficeIcon = () => L.divIcon({
  className:'', iconAnchor:[0,0],
  html:`
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);filter:drop-shadow(0 6px 18px rgba(74,127,217,0.5));">
      <div style="position:relative;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:rgba(74,127,217,0.15);animation:lm2-ring 2.5s ease-out infinite;"></div>
        <div style="width:46px;height:46px;border-radius:50% 50% 50% 4px;background:linear-gradient(135deg,#4A7FD9,#2B7FFF);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 6px 24px rgba(74,127,217,0.55),0 0 0 6px rgba(74,127,217,0.12);transform:rotate(-45deg);position:relative;z-index:1;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="transform:rotate(45deg)">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div style="background:linear-gradient(135deg,#4A7FD9,#2B7FFF);color:white;font-size:9px;font-weight:900;padding:3px 10px;border-radius:20px;margin-top:6px;white-space:nowrap;letter-spacing:.14em;box-shadow:0 3px 10px rgba(74,127,217,0.45);border:1.5px solid rgba(255,255,255,0.35);font-family:'Sora',sans-serif;">OFFICE</div>
    </div>
  `,
});

// ─── User icon ─────────────────────────────────────────────────────────────────
const buildUserIcon = (fullName: string, status: string) => {
  const isInside = status === 'in_office_area';
  const bg   = isInside ? `linear-gradient(135deg,#4A7FD9,#2B7FFF)` : `linear-gradient(135deg,#6B7280,#374151)`;
  const glow = isInside ? `0 4px 18px rgba(74,127,217,0.6),0 0 0 5px rgba(74,127,217,0.15)` : `0 4px 12px rgba(107,114,128,0.45)`;
  const dot  = isInside ? '#34C759' : '#9CA3AF';
  const initials = fullName.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2);
  const first    = fullName.split(' ')[0];
  return L.divIcon({
    className:'', iconSize:[48,64], iconAnchor:[24,64], popupAnchor:[0,-66],
    html:`
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="position:relative;width:42px;height:42px;border-radius:50%;background:${bg};color:white;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:${glow};font-family:'Sora',sans-serif;">
          ${initials}
          <div style="position:absolute;bottom:-2px;right:-2px;width:13px;height:13px;border-radius:50%;background:${dot};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>
        </div>
        <div style="background:rgba(26,26,46,0.88);color:white;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;margin-top:4px;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(6px);letter-spacing:.03em;">${first}</div>
        <div style="width:2px;height:7px;background:${isInside?'#4A7FD9':'#6B7280'};opacity:.7;margin-top:0;border-radius:0 0 2px 2px;"></div>
      </div>
    `,
  });
};

// ─── LiveMap ───────────────────────────────────────────────────────────────────
export function LiveMap() {
  const officeSettings = useAuthStore(s => s.officeSettings);
  const locationMap    = useSocketStore(s => s.locationMap);
  const connected      = useSocketStore(s => s.connected);
  const mapRef         = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
  const el = containerRef.current;
  if (!el) return;

  if (!document.fullscreenElement) {
    el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch((err) => {
      console.error('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch((err) => {
      console.error('Exit fullscreen error:', err);
    });
  }
}, []);
useEffect(() => {
  const handler = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener('fullscreenchange', handler);
  return () => document.removeEventListener('fullscreenchange', handler);
}, []);

  const [panelOpen,    setPanelOpen]    = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => { injectStyles(); }, []);

  const officeIcon   = useMemo(() => buildOfficeIcon(), []);
  const users        = useMemo(() => Object.values(locationMap), [locationMap]);
  const insideCount  = useMemo(() => users.filter(u => u.status === 'in_office_area').length, [users]);
  const outsideCount = users.length - insideCount;

  const flyTo = useCallback((lat: number, lng: number, userId: string) => {
    mapRef.current?.flyTo([lat, lng], 18, { duration: 1 });
    setSelectedUser(userId);
  }, []);

  if (!officeSettings) return null;
  const { OFFICE_LAT, OFFICE_LNG, OFFICE_RADIUS } = officeSettings;

  return (
    <div className="lm2-root"  ref={containerRef} style={{
      position:'fixed',
      top:64, left:240, right:0, bottom:0,
      zIndex:10, overflow:'hidden',
    }}>

      {/* ═══ FULL-SCREEN MAP ═══ */}
      <MapContainer
        center={[OFFICE_LAT, OFFICE_LNG]}
        zoom={16}
        style={{ height:'100%', width:'100%' }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {/* Outer ambient ring */}
        <Circle center={[OFFICE_LAT,OFFICE_LNG]} radius={OFFICE_RADIUS*1.25}
          pathOptions={{ color:C.primary,weight:1,dashArray:'4 10',fillOpacity:0,opacity:.2 }} />
        {/* Geofence boundary */}
        <Circle center={[OFFICE_LAT,OFFICE_LNG]} radius={OFFICE_RADIUS}
          pathOptions={{ color:C.primary,weight:2.5,dashArray:'8 5',fillColor:C.primary,fillOpacity:.06 }} />
        {/* Inner soft fill */}
        <Circle center={[OFFICE_LAT,OFFICE_LNG]} radius={OFFICE_RADIUS*0.4}
          pathOptions={{ color:C.primary,weight:0,fillColor:C.primary,fillOpacity:.04 }} />

        <Marker position={[OFFICE_LAT,OFFICE_LNG]} icon={officeIcon} />

        {users.map(user => (
          <Marker
            key={user.userId}
            position={[user.lat, user.lng]}
            icon={buildUserIcon(user.fullName, user.status)}
            eventHandlers={{ click:() => flyTo(user.lat, user.lng, user.userId) }}
          >
            <Popup className="lm2-popup" closeButton={false} offset={[0,-10]}>
              <div style={{ minWidth:230, fontFamily:'DM Sans,sans-serif', overflow:'hidden' }}>
                <div style={{
                  background:`linear-gradient(135deg,${C.primary},${C.darkBlue})`,
                  padding:'14px 16px', display:'flex', alignItems:'center', gap:10,
                }}>
                  <div style={{
                    width:38,height:38,borderRadius:'50%',
                    background:'rgba(255,255,255,0.2)',border:'2px solid rgba(255,255,255,0.4)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:'white',fontWeight:800,fontSize:14,flexShrink:0,
                    fontFamily:'Sora,sans-serif',
                  }}>
                    {user.fullName.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <div style={{ color:'white',fontWeight:700,fontSize:13,lineHeight:1.2,fontFamily:'Sora,sans-serif' }}>{user.fullName}</div>
                    <div style={{ color:'rgba(255,255,255,0.72)',fontSize:11 }}>{user.email}</div>
                  </div>
                  <div style={{
                    marginLeft:'auto',padding:'4px 9px',borderRadius:20,
                    background:user.status==='in_office_area'?'rgba(52,199,89,0.25)':'rgba(255,255,255,0.15)',
                    border:`1px solid ${user.status==='in_office_area'?'rgba(52,199,89,0.5)':'rgba(255,255,255,0.25)'}`,
                    fontSize:9,fontWeight:800,color:'white',letterSpacing:'.06em',flexShrink:0,
                    fontFamily:'Sora,sans-serif',
                  }}>
                    {user.status==='in_office_area' ? '● IN' : '○ OUT'}
                  </div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:0 }}>
                  {[
                    { label:'Distance',   value:`${user.distance.toFixed(0)} m`,  color:user.status==='in_office_area'?C.success:C.warning },
                    { label:'Last seen',  value:`${formatDistanceToNow(new Date(user.lastSeen))} ago`, color:C.gray500 },
                    { label:'Hours today',value:`${user.totalHours}h`,            color:C.primary },
                    { label:'Status',     value:user.status==='in_office_area'?'Inside ✓':'Outside ✗', color:user.status==='in_office_area'?C.success:C.danger },
                  ].map((d,i) => (
                    <div key={d.label} style={{
                      padding:'10px 14px',
                      borderRight:i%2===0?'1px solid #F3F4F6':'none',
                      borderBottom:i<2?'1px solid #F3F4F6':'none',
                    }}>
                      <div style={{ fontSize:9,color:C.gray500,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:3 }}>{d.label}</div>
                      <div style={{ fontSize:13,fontWeight:800,color:d.color,fontFamily:'Sora,sans-serif' }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ═══ CUSTOM MAP CONTROLS ═══ */}
      <div style={{ position:'absolute',bottom:80,left:12,zIndex:1000,display:'flex',flexDirection:'column',gap:6 }}>
        <button className="lm2-ctrl" onClick={() => mapRef.current?.zoomIn()}>
          <span style={{ fontSize:18,fontWeight:700,lineHeight:1 }}>+</span>
        </button>
        <button className="lm2-ctrl" onClick={() => mapRef.current?.zoomOut()}>
          <span style={{ fontSize:18,fontWeight:700,lineHeight:1 }}>−</span>
        </button>
        
        <button className="lm2-ctrl" title="Recenter" onClick={() => mapRef.current?.flyTo([OFFICE_LAT,OFFICE_LNG],16,{duration:1.2})}>
          <Crosshair size={14} />
        </button>
      </div>


      {/* ═══ TOP-LEFT FLOATING PANEL ═══ */}
      <div className="lm2-tbar-in" style={{
        position:'absolute',top:16,left:16,zIndex:1000,
        display:'flex',flexDirection:'column',gap:8,
        pointerEvents:'none',
      }}>
        {/* Title + connection */}
        <div className="lm2-glass" style={{
          display:'inline-flex',alignItems:'center',gap:10,
          padding:'9px 14px',borderRadius:15,
          boxShadow:'0 4px 24px rgba(0,0,0,0.1)',
          pointerEvents:'auto',
        }}>
          <div style={{
            width:32,height:32,borderRadius:10,flexShrink:0,
            background:`linear-gradient(135deg,${C.primary},${C.darkBlue})`,
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:`0 2px 10px rgba(74,127,217,0.4)`,
          }}>
            <Layers size={15} color="white" />
          </div>
          <div>
            <div className="lm2-display" style={{ fontSize:13,fontWeight:800,color:C.textPrimary,lineHeight:1 }}>Live Map</div>
            <div style={{ fontSize:10,color:C.gray500,marginTop:1 }}>Real-time tracking</div>
          </div>
          <div style={{
            marginLeft:4,display:'flex',alignItems:'center',gap:5,
            padding:'4px 10px',borderRadius:20,
            background:connected?'rgba(52,199,89,0.1)':'rgba(231,0,11,0.08)',
            border:`1px solid ${connected?'rgba(52,199,89,0.3)':'rgba(231,0,11,0.25)'}`,
          }}>
            <span className={connected?'lm2-pulse-dot':''} style={{
              width:6,height:6,borderRadius:'50%',display:'inline-block',
              background:connected?C.success:C.danger,
            }} />
            {connected
              ? <><Wifi size={10} color={C.success} /><span style={{ fontSize:10,fontWeight:700,color:C.success }}>LIVE</span></>
              : <><WifiOff size={10} color={C.danger} /><span style={{ fontSize:10,fontWeight:700,color:C.danger }}>OFFLINE</span></>
            }
          </div>
        </div>

        {/* Inside / outside pills */}
        <div style={{ display:'flex',gap:6 }}>
          <div className="lm2-glass lm2-badge-in" style={{
            display:'inline-flex',alignItems:'center',gap:6,
            padding:'6px 12px',borderRadius:20,
            boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
            fontSize:11,fontWeight:700,color:C.success,
            animationDelay:'80ms',
          }}>
            <Navigation size={11} />
            {insideCount} inside
          </div>
          {outsideCount > 0 && (
            <div className="lm2-glass lm2-badge-in" style={{
              display:'inline-flex',alignItems:'center',gap:6,
              padding:'6px 12px',borderRadius:20,
              boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
              fontSize:11,fontWeight:700,color:C.warning,
              animationDelay:'140ms',
            }}>
              <NavigationOff size={11} />
              {outsideCount} outside
            </div>
          )}
        </div>
      </div>


      {/* ═══ BOTTOM-LEFT STAT BAR ═══ */}
      <div className="lm2-badge-in" style={{
        position:'absolute',bottom:20,left:16,zIndex:1000,
        display:'flex',gap:8,pointerEvents:'none',
        animationDelay:'200ms',
      }}>
        {[
          { icon:Users,      label:'Active',    value:users.length,  color:C.primary },
          { icon:Activity,   label:'In office', value:insideCount,   color:C.success },
          { icon:MapPin,     label:'Outside',   value:outsideCount,  color:C.warning },
          { icon:TrendingUp, label:'Coverage',  value:`${users.length?Math.round((insideCount/users.length)*100):0}%`, color:C.darkBlue },
        ].map(s => (
          <div key={s.label} className="lm2-glass" style={{
            display:'flex',alignItems:'center',gap:7,
            padding:'8px 13px',borderRadius:12,
            boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
          }}>
            <div style={{ width:26,height:26,borderRadius:8,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <s.icon size={12} color={s.color} />
            </div>
            <div>
              <div className="lm2-display" style={{ fontSize:13,fontWeight:800,color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9,color:C.gray500,fontWeight:600,marginTop:1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>


<div
  className="lm2-panel-in"
  style={{
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    width:panelOpen ? 300 : 0,
    overflow:'hidden',
    transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform .32s cubic-bezier(.16,1,.3,1)',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderLeft: '1.5px solid rgba(255,255,255,0.6)',
    boxShadow: panelOpen ? '-12px 0 48px rgba(0,0,0,0.1)' : 'none',
    pointerEvents: panelOpen ? 'auto' : 'none',
  }}
>
  {/* Panel header */}
  <div style={{
    padding: '18px 16px 14px',
    background: `linear-gradient(135deg,rgba(74,127,217,0.08),rgba(43,127,255,0.04))`,
    borderBottom: '1.5px solid rgba(229,231,235,0.8)',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 11,
        background: `linear-gradient(135deg,${C.primary},${C.darkBlue})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 14px rgba(74,127,217,0.35)`,
      }}>
        <Users size={16} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <div className="lm2-display" style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Active Users</div>
        <div style={{ fontSize: 11, color: C.gray500, marginTop: 1 }}>{users.length} online now</div>
      </div>
      {selectedUser && (
        <button onClick={() => setSelectedUser(null)} style={{
          width: 26, height: 26, borderRadius: 8,
          border: `1px solid #E5E7EB`, background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.gray500,
        }}>
          <X size={12} />
        </button>
      )}
    </div>
    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {[
        { label: 'In office', value: insideCount, color: C.success, bg: `${C.success}12`, bd: `${C.success}25` },
        { label: 'Outside', value: outsideCount, color: C.warning, bg: `${C.warning}12`, bd: `${C.warning}25` },
      ].map(s => (
        <div key={s.label} style={{ padding: '8px 12px', borderRadius: 11, textAlign: 'center', background: s.bg, border: `1px solid ${s.bd}` }}>
          <div className="lm2-display" style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 9, color: C.gray500, fontWeight: 700, marginTop: 2, letterSpacing: '.05em' }}>{s.label.toUpperCase()}</div>
        </div>
      ))}
    </div>
  </div>

  {/* User list */}
  <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
    {users.length === 0 ? (
      <div style={{ padding: '40px 16px' }}>
        <EmptyState icon={Users} message="No active users" />
      </div>
    ) : users.map(user => {
      const isInside = user.status === 'in_office_area';
      const isSelected = selectedUser === user.userId;
      return (
        <div
          key={user.userId}
          className="lm2-user-row"
          onClick={() => flyTo(user.lat, user.lng, user.userId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px',
            borderBottom: '1px solid rgba(243,244,246,0.8)',
            borderLeft: `3px solid ${isSelected ? C.primary : 'transparent'}`,
            background: isSelected ? `rgba(74,127,217,0.06)` : 'transparent',
          }}
        >
          <div style={{
            position: 'relative', flexShrink: 0,
            width: 38, height: 38, borderRadius: '50%',
            background: isInside ? `linear-gradient(135deg,${C.primary},${C.darkBlue})` : `linear-gradient(135deg,${C.gray500},${C.gray700})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 800,
            boxShadow: isInside ? `0 3px 12px rgba(74,127,217,0.4)` : 'none',
            fontFamily: 'Sora,sans-serif',
          }}>
            {user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: isInside ? C.success : C.gray400, border: '2px solid white' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
            <div style={{ fontSize: 10, color: C.gray500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{user.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={9} color={C.gray400} />
                <span style={{ fontSize: 9, color: C.gray400 }}>{formatDistanceToNow(new Date(user.lastSeen))} ago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Ruler size={9} color={C.gray400} />
                <span style={{ fontSize: 9, color: C.gray400 }}>{user.distance.toFixed(0)}m</span>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
            letterSpacing: '.05em', flexShrink: 0,
            background: isInside ? `${C.success}14` : `${C.warning}14`,
            color: isInside ? C.success : C.warning,
            border: `1px solid ${isInside ? C.success + '30' : C.warning + '30'}`,
            fontFamily: 'Sora,sans-serif',
          }}>
            {isInside ? 'IN' : 'OUT'}
          </div>
        </div>
      );
    })}
  </div>

  {/* Panel footer */}
  <div style={{
    padding: '12px 16px',
    borderTop: '1.5px solid rgba(229,231,235,0.8)',
    background: 'rgba(249,250,251,0.8)', flexShrink: 0,
  }}>
    <div style={{ fontSize: 10, color: C.gray500, textAlign: 'center', fontWeight: 500 }}>
      Click a user to fly to their location
    </div>
  </div>
</div>


{/* ═══ PANEL TOGGLE BUTTON ═══ */}
<button
  onClick={() => setPanelOpen(p => !p)}
  style={{
    position: 'absolute',
    right: panelOpen ? 300 : 0,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1001,
    width: 28,
    height: 52,
    background:C.darkBlue,
    backdropFilter: 'blur(12px)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    borderRight: panelOpen ? '1.5px solid rgba(255,255,255,0.7)' : 'none',
    borderRadius: '10px 0 0 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '-3px 0 14px rgba(0,0,0,0.08)',
    transition: 'right .32s cubic-bezier(.16,1,.3,1)',
    color: "#fff",
    opacity: 1,
    visibility: 'visible',
  }}
>
  {panelOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
</button>

    </div>
  );
}