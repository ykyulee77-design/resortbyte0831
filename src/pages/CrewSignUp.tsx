import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, ArrowLeft, Eye, EyeOff, AlertCircle, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import NaverLogin from '../components/NaverLogin';
import KakaoConsentModal from '../components/KakaoConsentModal';
import GoogleLogin from '../components/GoogleLogin';
import AppleLogin from '../components/AppleLogin';

const CrewSignUp: React.FC = () => {
  const [showKakaoConsent, setShowKakaoConsent] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);


  const handleKakaoSignUpClick = () => setShowKakaoConsent(true);

  const handleKakaoConsentAgree = () => {
    setShowKakaoConsent(false);
    // 카카오 로그인 처리 (실제 구현 필요)
    alert('카카오 회원가입 기능은 개발 중입니다.');
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      await signUp(formData.email, formData.password, formData.displayName, 'jobseeker');
      navigate('/jobseeker-dashboard');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호가 너무 약합니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다: ' + error.message);
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
          <div className="text-center">
            <Link
              to="/signup"
              className="inline-flex items-center text-sm text-gray-600 hover:text-resort-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              역할 선택으로 돌아가기
            </Link>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              크루 회원가입
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              리조트에서 일할 기회를 찾아보세요
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {/* 네이버 */}
              <NaverLogin
                selectedRole="jobseeker"
                onSuccess={() => {
                  console.log('네이버 로그인 성공');
                  setSocialLoading(false);
                }}
                onError={(error) => {
                  setError(error);
                  setSocialLoading(false);
                }}
              />

              {/* 카카오 */}
              <button
                onClick={handleKakaoSignUpClick}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#FEE500"/>
                  <path d="M12 6c-3.3 0-6 2.1-6 4.7 0 1.5.8 2.8 2 3.7l-.5 1.8c-.1.3.2.5.4.3l2.2-1.5c.6.1 1.2.2 1.9.2 3.3 0 6-2.1 6-4.7S15.3 6 12 6z" fill="#3C1E1E"/>
                </svg>
                카카오로 회원가입
              </button>

              {/* 구글 */}
              <GoogleLogin
                selectedRole="jobseeker"
                onSuccess={() => {
                  console.log('구글 로그인 성공');
                  setSocialLoading(false);
                  // GoogleLogin 컴포넌트 내부에서 이미 navigation 처리하므로 여기서는 제거
                }}
                onError={(error) => {
                  setError(error);
                  setSocialLoading(false);
                }}
                onLoadingChange={(isLoading) => setSocialLoading(isLoading)}
              />

              {/* 애플 */}
              <AppleLogin
                selectedRole="jobseeker"
                onSuccess={() => {
                  console.log('애플 로그인 성공');
                  setSocialLoading(false);
                  // AppleLogin 컴포넌트 내부에서 이미 navigation 처리하므로 여기서는 제거
                }}
                onError={(error) => {
                  setError(error);
                  setSocialLoading(false);
                }}
                onLoadingChange={(isLoading) => setSocialLoading(isLoading)}
              />
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* 직접 입력 토글 버튼 */}
            <div className="mt-6">
              <button
                onClick={() => setShowDirectInput(!showDirectInput)}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Mail className="w-5 h-5 mr-2 text-gray-500" />
                직접 입력
                {showDirectInput ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </button>
            </div>

            {/* 직접 입력 폼 */}
            {showDirectInput && (
              <div className="bg-gray-50 rounded-lg p-4">
                <form onSubmit={handleDirectSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                    이름
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="실명을 입력해주세요"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="최소 6자 이상"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="비밀번호를 다시 입력해주세요"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || socialLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      가입 중...
                    </>
                  ) : socialLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      소셜 로그인 중...
                    </>
                  ) : (
                    '크루로 가입하기'
                  )}
                </button>
                </form>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  로그인하기
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 소셜 로그인 정보제공 동의 모달들 */}
      <KakaoConsentModal
        isOpen={showKakaoConsent}
        onClose={() => setShowKakaoConsent(false)}
        onAgree={handleKakaoConsentAgree}
        selectedRole="jobseeker"
      />
      
      
    </div>
  );
};

export default CrewSignUp;
