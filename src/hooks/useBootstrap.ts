import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/auth.api';


export function useBootstrap() {
  const { setReady, login, logout } = useAuthStore();

  useEffect(() => {
    const token = Cookies.get('attend_token');

    if (!token) {
      setReady(true);
      return;
    }

    const init = async () => {
      try {
        const res = await authApi.me();
        login({
          user: res.data.data.user,
          officeSettings: res.data.data.officeSettings,
          token,
        });
      } catch (error) {
        const refreshToken = Cookies.get('attend_refresh');
        if (refreshToken) {
          try {
            const refreshRes = await authApi.refresh(refreshToken);
            const newToken = refreshRes.data.data.accessToken;
            Cookies.set('attend_token', newToken, { expires: 7, sameSite: 'strict' });

            const meRes = await authApi.me();
            login({
              user: meRes.data.data.user,
              officeSettings: meRes.data.data.officeSettings,
              token: newToken,
            });
          } catch {
            Cookies.remove('attend_token');
            Cookies.remove('attend_refresh');
            logout();
          }
        } else {
          Cookies.remove('attend_token');
          logout();
        }
      } finally {
        setReady(true);
      }
    };

    init();
  }, [setReady, login, logout]);
}