import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { LocationPayload } from '@/types/api';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  locationMap: Record<string, LocationPayload>;
  initSocket: (token: string) => void;
  destroySocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  locationMap: {},
  initSocket: (token) => {
    if (get().socket) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('location:latest-all', ({ users }: { users: any[] }) => {
      const map: Record<string, LocationPayload> = {};
      users.forEach((u) => {
        map[u.userId] = {
          ...u,
          lat: u.latitude,
          lng: u.longitude,
        };
      });
      set({ locationMap: map });
    });

    socket.on('location:update', (payload: LocationPayload) => {
      set((state) => ({
        locationMap: { ...state.locationMap, [payload.userId]: payload },
      }));
    });

    set({ socket, connected: false });
  },
  destroySocket: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false, locationMap: {} });
  },
}));