import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useSocketStore } from '@/stores/socket.store';

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const socket = useSocketStore((s) => s.socket);
  const initSocket = useSocketStore((s) => s.initSocket);
  const destroySocket = useSocketStore((s) => s.destroySocket);

  useEffect(() => {
    if (token && !socket) {
      initSocket(token);
    }
  }, [token, socket, initSocket]);

  useEffect(() => {
    return () => {
      // Socket persists across navigation
    };
  }, []);

  return { destroySocket };
}