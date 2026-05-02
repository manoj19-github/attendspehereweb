import { LiveMap } from '@/components/map/LiveMap';
import { useSocket } from '@/hooks/useSocket';

export function LiveMapPage() {
  useSocket();

  return (
    <div className="h-[calc(100vh)] w-full relative" style={{ marginTop: '-3.5rem' }}>
      <LiveMap />
    </div>
  );
}