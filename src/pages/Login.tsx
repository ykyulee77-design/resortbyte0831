import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, Home } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import NaverLogin from '../components/NaverLogin';
import KakaoLogin from '../components/KakaoLogin';
import GoogleLogin from '../components/GoogleLogin';
import AppleLogin from '../components/AppleLogin';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer'>('jobseeker');
  const { signIn, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // 관리자 페이지 로그인 함수 제거됨 - 보안상 문제로 삭제

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // 모든 사용자 동일한 Firebase Auth 로그인
      await signIn(formData.email, formData.password);
      // 로그인 후 사용자 정보 확인
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      if (user && user.role === 'employer') {
        navigate('/employer-dashboard');
        return;
      } else if (user && user.role === 'jobseeker') {
        navigate('/jobseeker-dashboard');
        return;
      } else if (user && user.role === 'admin') {
        navigate('/admin-dashboard');
        return;
      }
      navigate(redirectTo);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        setError('등록되지 않은 이메일입니다.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않습니다.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              리조트바이트에 로그인하세요
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm pr-10"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-resort-600 hover:bg-resort-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-resort-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">또는</span>
              </div>
            </div>

            {/* 역할 선택 */}
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">간편 로그인</p>
                <p className="text-xs text-gray-500 mb-4">로그인할 계정 유형을 선택하세요</p>
              </div>
              
              <div className="flex space-x-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole('jobseeker')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                    selectedRole === 'jobseeker'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  크루 (구직자)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('employer')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                    selectedRole === 'employer'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  리조트 (고용주)
                </button>
              </div>
              
              <NaverLogin 
                selectedRole={selectedRole}
                onSuccess={() => {
                  // 로그인 성공 시 처리는 NaverCallback에서 처리됨
                }}
                onError={(error) => {
                  setError(error);
                }}
              />
              
              <KakaoLogin 
                selectedRole={selectedRole}
                onSuccess={() => {
                  // 로그인 성공 시 처리
                }}
                onError={(error) => {
                  setError(error);
                }}
              />
              
              <GoogleLogin 
                selectedRole={selectedRole}
                onSuccess={() => {
                  // 로그인 성공 시 처리
                }}
                onError={(error) => {
                  setError(error);
                }}
              />
              
              <AppleLogin 
                selectedRole={selectedRole}
                onSuccess={() => {
                  // 로그인 성공 시 처리
                }}
                onError={(error) => {
                  setError(error);
                }}
              />

              {/* 관리자 페이지 임시 버튼 제거됨 - 보안상 문제로 삭제 */}
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link to="/signup" className="font-medium text-resort-600 hover:text-resort-500">
                  회원가입하기
                </Link>
              </p>
              <div className="pt-2">
                <Link 
                  to="/" 
                  className="inline-flex items-center text-sm text-gray-600 hover:text-resort-600 transition-colors"
                >
                  <Home className="w-4 h-4 mr-1" />
                  홈페이지로 돌아가기
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 