import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '@/stores/auth.store';

export function MiniMap() {
  const officeSettings = useAuthStore((s) => s.officeSettings);

  if (!officeSettings) return null;

  const { OFFICE_LAT, OFFICE_LNG, OFFICE_RADIUS } = officeSettings;

  const officeIcon = L.divIcon({
    className: '',
    iconAnchor: [0, 0],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 18 12 18S24 20.25 24 12C24 5.373 18.627 0 12 0z" fill="#dc2626"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>
        <span style="background:#dc2626;color:white;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;margin-top:2px;white-space:nowrap;letter-spacing:0.08em;box-shadow:0 1px 3px rgba(0,0,0,0.3);">OFFICE</span>
      </div>
    `,
  });

  return (
    <div className="relative rounded-xl overflow-hidden">
      <MapContainer
        center={[OFFICE_LAT, OFFICE_LNG]}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        style={{ height: '280px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Circle
          center={[OFFICE_LAT, OFFICE_LNG]}
          radius={OFFICE_RADIUS}
          pathOptions={{
            color: '#dc2626',
            weight: 2,
            fillColor: '#dc2626',
            fillOpacity: 0.1,
          }}
        />
        <Marker position={[OFFICE_LAT, OFFICE_LNG]} icon={officeIcon} />
      </MapContainer>
    </div>
  );
}