import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, Building, ArrowLeft, ChevronDown, ChevronUp, Mail, MapPin, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import NaverLogin from '../components/NaverLogin';
import NaverConsentModal from '../components/NaverConsentModal';
import KakaoLogin from '../components/KakaoLogin';
import GoogleLogin from '../components/GoogleLogin';
import AppleLogin from '../components/AppleLogin';
import AddressSearch, { Address } from '../components/AddressSearch';
import AddressMarkerMap from '../components/AddressMarkerMap';

const ResortSignUp: React.FC = () => {
  // 회사 정보 (1단계)
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyAddress: '',
    companyDetailAddress: '',
    companyPhone: '',
    companyWebsite: '',
    businessNumber: '',
    industry: '',
    companySize: '',
    description: '',
    culture: '',
    benefits: [] as string[],
  });
  
  // 담당자 정보 (2단계)
  const [contactData, setContactData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    contactPhone: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNaverConsent, setShowNaverConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: 회사정보, 2: 담당자정보
  const [newBenefit, setNewBenefit] = useState('');
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // 콜백 후 자동 채우기: 담당자 이름/이메일/전화번호
  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    })();
    const src = (user as any) || stored || {};
    const next = { ...contactData };
    let changed = false;
    if (!next.displayName && src.displayName) { next.displayName = src.displayName; changed = true; }
    if (!next.email && src.email) { next.email = src.email; changed = true; }
    if (!next.contactPhone && (src.contactPhone || src.phoneNumber)) { next.contactPhone = src.contactPhone || src.phoneNumber; changed = true; }
    if (changed) setContactData(next);
  }, [user]);

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

  const handleCompanyInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setContactData(prev => ({
        ...prev,
        [name]: value,
    }));
  };

  // 주소 선택 핸들러
  const handleAddressSelect = (address: Address) => {
    setCompanyData(prev => ({
      ...prev,
      companyAddress: address.roadAddress,
    }));
  };

  // 복리혜택 추가 (현재 사용하지 않음)
  // const handleAddBenefit = () => {
  //   if (newBenefit.trim() && !companyData.benefits.includes(newBenefit.trim())) {
  //     setCompanyData(prev => ({
  //       ...prev,
  //       benefits: [...prev.benefits, newBenefit.trim()],
  //     }));
  //     setNewBenefit('');
  //   }
  // };

  // 복리혜택 제거 (현재 사용하지 않음)
  // const handleRemoveBenefit = (benefitToRemove: string) => {
  //   setCompanyData(prev => ({
  //     ...prev,
  //     benefits: prev.benefits.filter((benefit: string) => benefit !== benefitToRemove),
  //   }));
  // };

  // 1단계: 회사 정보 검증
  const validateCompanyInfo = () => {
    if (!companyData.companyName || !companyData.companyAddress || !companyData.companyPhone) {
      setError('회사명, 회사주소, 회사전화번호는 필수 입력 항목입니다.');
      return false;
    }
    return true;
  };

  // 2단계: 담당자 정보 검증
  const validateContactInfo = () => {
    if (!contactData.email || !contactData.password || !contactData.confirmPassword || !contactData.displayName) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }

    if (contactData.password !== contactData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (contactData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    return true;
  };

  // 다음 단계로 이동
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1 && validateCompanyInfo()) {
      setCurrentStep(2);
    }
  };

  // 이전 단계로 이동
  const handlePrevStep = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 최종 검증
    if (!validateCompanyInfo() || !validateContactInfo()) {
      return;
    }

    try {
      setLoading(true);

      // 회사 정보와 담당자 정보를 모두 포함하여 가입
      const employerInfo = {
        workplaceName: companyData.companyName,
        workplaceLocation: companyData.companyAddress,
        contactPerson: contactData.displayName,
        companyName: companyData.companyName,
        companyAddress: companyData.companyAddress,
        companyDetailAddress: companyData.companyDetailAddress,
        companyPhone: companyData.companyPhone,
        companyWebsite: companyData.companyWebsite,
        businessNumber: companyData.businessNumber,
        industry: companyData.industry,
        companySize: companyData.companySize,
        contactPhone: contactData.contactPhone,
        description: companyData.description,
        culture: companyData.culture,
        benefits: companyData.benefits,
      };

      await signUp(contactData.email, contactData.password, contactData.displayName, 'employer', employerInfo, undefined);
      
      navigate('/employer-dashboard');
    } catch (error: unknown) {
      console.error('회원가입 실패:', error);
      if (error instanceof Error && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'auth/email-already-in-use') {
          setError('이미 사용 중인 이메일입니다.');
        } else if (errorCode === 'auth/weak-password') {
          setError('비밀번호가 너무 약합니다.');
        } else if (errorCode === 'auth/invalid-email') {
          setError('유효하지 않은 이메일 형식입니다.');
        } else {
          setError('회원가입 중 오류가 발생했습니다.');
        }
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
        <div className="max-w-2xl w-full space-y-8">
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
                회사 정보를 먼저 입력하고 담당자 정보를 등록하세요
              </p>
              
              {/* 진행 단계 표시 */}
              <div className="mt-6 flex items-center justify-center space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">회사 정보</span>
                </div>
                <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">담당자 정보</span>
                </div>
              </div>
            </div>
          </div>

          {/* 간편 로그인 섹션 (1단계에서만 표시) */}
          {currentStep === 1 && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">간편 로그인</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <NaverLogin
                selectedRole="employer"
                onSuccess={() => {
                  // 콜백 이후 이 페이지로 돌아오면 회사정보 입력을 이어갑니다
                  setSocialLoading(false);
                }}
                onError={(error) => {
                  setError(error);
                  setSocialLoading(false);
                }}
              />
              <KakaoLogin
                selectedRole="employer"
                onSuccess={() => {
                  console.log('카카오 로그인 성공');
                    navigate('/company/info');
                }}
                onError={(error) => setError(error)}
              />
              <GoogleLogin
                selectedRole="employer"
                onSuccess={() => {
                  console.log('구글 로그인 성공');
                  setSocialLoading(false);
                    navigate('/company/info');
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
                    navigate('/company/info');
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
                    <span className="px-2 bg-gray-50 text-gray-500">또는</span>
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
          )}

          {/* 1단계: 회사 정보 입력 폼 */}
          {showDirectInput && currentStep === 1 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                <Building className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">1단계: 회사 정보</h3>
          </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
                {/* 회사명 */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={companyData.companyName}
                    onChange={handleCompanyInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                {/* 회사 주소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    회사 주소 <span className="text-red-500">*</span>
                  </label>
                  <AddressSearch onAddressSelect={handleAddressSelect} />
                  {companyData.companyAddress && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{companyData.companyAddress}</span>
                      </div>
                    </div>
                  )}
                  {companyData.companyAddress && (
                    <div className="mt-3">
                      <AddressMarkerMap address={companyData.companyAddress} height={320} />
                    </div>
                  )}
                  <input
                    type="text"
                    name="companyDetailAddress"
                    value={companyData.companyDetailAddress}
                    onChange={handleCompanyInputChange}
                    className="mt-2 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="상세주소 (선택사항)"
                  />
                </div>

                {/* 회사 전화번호 */}
                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                    회사 전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    required
                    value={companyData.companyPhone}
                    onChange={handleCompanyInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="02-1234-5678"
                  />
                </div>

                {/* 회사 웹사이트 */}
                <div>
                  <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                    회사 웹사이트
                  </label>
                  <input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    value={companyData.companyWebsite}
                    onChange={handleCompanyInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="https://www.company.com"
                  />
                </div>

                {/* 사업자등록번호 */}
                <div>
                  <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700">
                    사업자등록번호
                  </label>
                  <input
                    id="businessNumber"
                    name="businessNumber"
                    type="text"
                    value={companyData.businessNumber}
                    onChange={handleCompanyInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="123-45-67890"
                  />
                </div>

                {/* 산업군 */}
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    산업군
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={companyData.industry}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">산업군을 선택하세요</option>
                    <option value="hospitality">호텔/리조트</option>
                    <option value="food">음식/외식</option>
                    <option value="retail">유통/소매</option>
                    <option value="service">서비스업</option>
                    <option value="manufacturing">제조업</option>
                    <option value="construction">건설업</option>
                    <option value="education">교육업</option>
                    <option value="healthcare">의료/건강</option>
                    <option value="finance">금융/보험</option>
                    <option value="technology">IT/기술</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                {/* 회사 규모 */}
                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                    회사 규모
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={companyData.companySize}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">회사 규모를 선택하세요</option>
                    <option value="1-10">1-10명</option>
                    <option value="11-50">11-50명</option>
                    <option value="51-200">51-200명</option>
                    <option value="201-500">201-500명</option>
                    <option value="500+">500명 이상</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  다음 단계
                </button>
              </div>
            </div>
          )}

          {/* 2단계: 담당자 정보 입력 폼 */}
          {currentStep === 2 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">2단계: 담당자 정보</h3>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 담당자명 */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    담당자명 <span className="text-red-500">*</span>
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                    value={contactData.displayName}
                    onChange={handleContactInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="담당자명을 입력하세요"
                />
              </div>

                {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                    value={contactData.email}
                    onChange={handleContactInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="이메일을 입력하세요"
                />
              </div>

                {/* 담당자 연락처 */}
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                    담당자 연락처
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={contactData.contactPhone}
                    onChange={handleContactInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="010-1234-5678"
                  />
                </div>

                {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                      value={contactData.password}
                      onChange={handleContactInputChange}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
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

                {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                      value={contactData.confirmPassword}
                      onChange={handleContactInputChange}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
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

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    이전 단계
                  </button>
              <button
                type="submit"
                disabled={loading || socialLoading}
                    className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                    {loading ? '가입 중...' : '리조트 등록 완료'}
              </button>
            </div>
              </form>
            </div>
          )}

          {/* 로그인 링크 */}
          {currentStep === 1 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                  로그인하기
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

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
