import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, Building, ArrowLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import AddressSearch, { Address } from '../components/AddressSearch';
import NaverMapScript from '../components/NaverMapScript';
import NaverLogin from '../components/NaverLogin';
import NaverConsentModal from '../components/NaverConsentModal';
import KakaoLogin from '../components/KakaoLogin';
import GoogleLogin from '../components/GoogleLogin';
import AppleLogin from '../components/AppleLogin';

const ResortSignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    // 리조트 정보
    companyName: '',
    companyAddress: '',
    companyDetailAddress: '',
    companyPhone: '',
    companyWebsite: '',
    businessNumber: '',
    industry: '',
    companySize: '',
    contactPerson: '',
    contactPhone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNaverConsent, setShowNaverConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleNaverSignUpClick = () => {
    setShowNaverConsent(true);
  };

  const handleNaverConsentAgree = () => {
    setShowNaverConsent(false);
    const clientId = process.env.REACT_APP_NAVER_CLIENT_ID || 'R0oImlUQC6DqKKV_V5BR';
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/naver/callback`);
    const state = encodeURIComponent('employer|signup');
    const scope = encodeURIComponent('name,email,mobile');
    
    const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    
    window.location.href = naverLoginUrl;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // 담당자명을 가입회원명으로 자동 설정
      if (name === 'displayName') {
        newData.contactPerson = value;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 기본 유효성 검사
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

    // 리조트 정보 검증
    if (!formData.companyName || !formData.companyAddress || !formData.companyPhone) {
      setError('리조트 정보의 필수 항목(리조트명, 주소, 연락처)을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // 리조트 정보 준비
      const employerInfo = {
        workplaceName: formData.companyName,
        workplaceLocation: formData.companyAddress,
        contactPerson: formData.contactPerson,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyDetailAddress: formData.companyDetailAddress,
        companyPhone: formData.companyPhone,
        companyWebsite: formData.companyWebsite,
        businessNumber: formData.businessNumber,
        industry: formData.industry,
        companySize: formData.companySize,
        contactPhone: formData.contactPhone,
      };

      await signUp(formData.email, formData.password, formData.displayName, 'employer', employerInfo, undefined);
      
      navigate('/employer-dashboard');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호가 너무 약합니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
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
            <div className="flex items-center mb-4">
              <Link 
                to="/signup" 
                className="flex items-center text-sm text-gray-600 hover:text-resort-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                역할 선택으로 돌아가기
              </Link>
            </div>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                리조트 회원가입
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                리조트에서 일할 크루를 찾고 있어요
              </p>
            </div>
          </div>

          {/* 간편 로그인 섹션 */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">간편 로그인</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={handleNaverSignUpClick}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="24" height="24" rx="4" fill="#03C75A"/>
                  <path
                    d="M16.273 12.845L13.376 8.5H11.624L8.727 12.845L11.624 17.19H13.376L16.273 12.845Z"
                    fill="white"
                  />
                </svg>
                네이버로 회원가입
              </button>
              <KakaoLogin
                selectedRole="employer"
                onSuccess={() => {
                  console.log('카카오 로그인 성공');
                  navigate('/employer-dashboard');
                }}
                onError={(error) => setError(error)}
              />
              <GoogleLogin
                selectedRole="employer"
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
              <AppleLogin
                selectedRole="employer"
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDirectInput(!showDirectInput)}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-resort-500 transition-colors"
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
          </div>

          {showDirectInput && (
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
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  담당자명
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                  placeholder="담당자명을 입력하세요"
                />
              </div>

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
                    autoComplete="new-password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm pr-10"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* 리조트 정보 섹션 */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-900 mb-3">🏢 리조트 정보</h3>
                
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    리조트명 *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="리조트명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                    리조트 주소 *
                  </label>
                  <AddressSearch
                    onAddressSelect={(address: Address) => {
                      setFormData(prev => ({
                        ...prev,
                        companyAddress: address.address,
                        companyRegion: address.region || '',
                        companyDetailAddress: address.detailAddress || '',
                      }));
                    }}
                    onInputChange={(text: string) => {
                      setFormData(prev => ({ ...prev, companyAddress: text }));
                    }}
                    value={formData.companyAddress}
                    placeholder="리조트 주소를 검색하세요"
                    showDetailAddress={true}
                    detailAddressPlaceholder="상세주소 (동/호수, 사무실 번호 등)"
                  />
                </div>

                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                    리조트 연락처 *
                  </label>
                  <input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    required
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="리조트 연락처를 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                    회사 웹사이트
                  </label>
                  <input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="회사 웹사이트를 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700">
                    사업자등록번호
                  </label>
                  <input
                    id="businessNumber"
                    name="businessNumber"
                    type="text"
                    value={formData.businessNumber}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="사업자등록번호를 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    업종
                  </label>
                  <input
                    id="industry"
                    name="industry"
                    type="text"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="업종을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                    회사 규모
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-resort-500 focus:border-resort-500 sm:text-sm"
                  >
                    <option value="">선택하세요</option>
                    <option value="1-10">1-10명</option>
                    <option value="11-50">11-50명</option>
                    <option value="51-200">51-200명</option>
                    <option value="201-500">201-500명</option>
                    <option value="500+">500명 이상</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                    담당자명
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm ${
                      formData.contactPerson === formData.displayName 
                        ? 'border-blue-300 bg-blue-50 placeholder-blue-400 text-blue-900' 
                        : 'border-gray-300 placeholder-gray-500 text-gray-900'
                    }`}
                    placeholder="담당자명을 입력하세요"
                  />
                  {formData.contactPerson === formData.displayName && (
                    <p className="mt-1 text-xs text-blue-600">
                      💡 담당자명이 가입회원명으로 자동 설정되었습니다. 필요시 수정하세요.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                    담당자 연락처
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="담당자 연락처를 입력하세요"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || socialLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '가입 중...' : socialLoading ? '소셜 로그인 중...' : '리조트로 가입하기'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-resort-600 hover:text-resort-500">
                  로그인하기
                </Link>
              </p>
            </div>
            </form>
          )}
        </div>
      </div>
      <NaverMapScript />

      {/* 네이버 정보제공 동의 모달 */}
      <NaverConsentModal
        isOpen={showNaverConsent}
        onClose={() => setShowNaverConsent(false)}
        onAgree={handleNaverConsentAgree}
        selectedRole="employer"
      />
    </div>
  );
};

export default ResortSignUp;
