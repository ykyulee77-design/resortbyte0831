import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_CANDIDATES = [
  (process.env.REACT_APP_AUTH_BACKEND_URL || '').replace(/\/$/, ''),
  'http://localhost:3004',
].filter(Boolean);
const FRONTEND_CALLBACK = `${window.location.origin}/auth/naver/callback`;

const SimpleNaverCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithNaver } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handle = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state') || '';

      if (!code) {
        navigate('/login?error=missing_code');
        return;
      }

      try {
        let json: any = null;
        let ok = false;
        for (const base of BACKEND_CANDIDATES) {
          try {
            const res = await fetch(`${base}/auth/naver/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, state, redirectUri: FRONTEND_CALLBACK }),
              credentials: 'include',
            });
            json = await res.json();
            ok = res.ok && !!json?.success;
            if (ok) break;
          } catch (_) {
            continue;
          }
        }

        if (!ok) {
          navigate('/login?error=callback_failed');
          return;
        }

        const roleFromState = (state.split('|')[0] || '').trim();
        const parsedRole = roleFromState === 'employer' ? 'employer' : 'jobseeker';

        const userPayload = json.user || {};
        const mergedUser = {
          uid: userPayload.uid || '',
          email: userPayload.email || '',
          displayName: userPayload.displayName || userPayload.name || '',
          contactPhone: userPayload.contactPhone || userPayload.mobile_e164 || userPayload.mobile || '',
          provider: 'naver',
          naverId: userPayload.naverId || userPayload.id || '',
          role: userPayload.role || parsedRole,
        } as any;

        if (signInWithNaver) {
          await signInWithNaver(mergedUser, mergedUser.role);
        }

        navigate(mergedUser.role === 'employer' ? '/employer-dashboard' : '/jobseeker-dashboard');
      } catch (_) {
        navigate('/login?error=network_error');
      }
    };

    handle();
  }, [searchParams, navigate, signInWithNaver]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto mb-4" />
        <p className="text-gray-600">네이버 인증을 처리 중입니다...</p>
      </div>
    </div>
  );
};

export default SimpleNaverCallback;
