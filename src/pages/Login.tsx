import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import logo from "../assets/logo.png";

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await authApi.login({
        email,
        password,
        androidId: 'ANDROID-987654321',
        fingerPrint: 'abc123-device-fingerprint',
      });

      const { accessToken, refreshToken, user, officeSettings } = res.data.data;

      Cookies.set('attend_token', accessToken, { expires: 7, sameSite: 'strict' });
      Cookies.set('attend_refresh', refreshToken, { expires: 7, sameSite: 'strict' });

      login({ user, officeSettings, token: accessToken });
      navigate('/dashboard', { replace: true });
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={logo} alt="logo" className="w-12 h-12" />
          <h1 className="text-2xl font-bold text-gray-900">AttendSphere</h1>
        </div>
        <p className="text-center text-sm text-gray-500 mb-6">
          Admin Dashboard · Workforce Presence
        </p>

        <hr className="my-6 border-gray-200" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="button" className="w-full mt-2" onClick={()=>{
            setEmail("santramanoj1999@gmail.com")
            setPassword("Abcd@1234")

          }}>
            Fetch Default Login Details
          </Button>

          <Button type="submit" className="w-full mt-16" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}