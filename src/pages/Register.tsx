import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AddressSearch, { Address } from '../components/AddressSearch';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    userType: 'jobseeker' as 'jobseeker' | 'employer' | 'admin',
    adminCode: '',
    // 구인자 직장정보 필드들
    companyName: '',
    companyAddress: '',
    companyDetailAddress: '', // 상세주소 필드 추가
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // URL 파라미터에서 회원유형 자동 설정
  useEffect(() => {
    const userType = searchParams.get('type');
    if (userType === 'employer') {
      setFormData(prev => ({
        ...prev,
        userType: 'employer',
      }));
    }
  }, [searchParams]);

  // 관리자 등록 코드 (실제 환경에서는 환경변수나 보안된 설정에서 관리)
  const ADMIN_REGISTRATION_CODE = 'RESORT_ADMIN_2024';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

    // 구인자 필수 필드 검증
    if (formData.userType === 'employer') {
      if (!formData.companyName || !formData.companyAddress || !formData.companyPhone) {
        setError('구인자 정보의 필수 항목(회사명, 회사주소, 회사전화번호)을 모두 입력해주세요.');
        return;
      }
    }

    // 관리자 등록 시 코드 검증
    if (formData.userType === 'admin') {
      if (!formData.adminCode) {
        setError('관리자 등록을 위해서는 관리자 코드가 필요합니다.');
        return;
      }
      if (formData.adminCode !== ADMIN_REGISTRATION_CODE) {
        setError('관리자 코드가 올바르지 않습니다.');
        return;
      }
    }

    try {
      setError('');
      setLoading(true);
      
      // 구인자인 경우 직장정보 포함하여 회원가입
      if (formData.userType === 'employer') {
        const employerInfo = {
          workplaceName: formData.companyName,
          workplaceLocation: formData.companyAddress,
          contactPerson: formData.contactPerson || '',
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyDetailAddress: formData.companyDetailAddress, // 상세주소 추가
          companyPhone: formData.companyPhone,
          companyWebsite: formData.companyWebsite,
          businessNumber: formData.businessNumber,
          industry: formData.industry,
          companySize: formData.companySize,
          contactPhone: formData.contactPhone,
        };
        await signUp(formData.email, formData.password, formData.displayName, formData.userType, employerInfo);
      } else {
        await signUp(formData.email, formData.password, formData.displayName, formData.userType);
      }
      
      navigate('/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {searchParams.get('type') === 'employer' ? '리조트 회원가입' : '회원가입'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {searchParams.get('type') === 'employer' 
              ? '리조트바이트에 리조트로 가입하고 크루를 찾아보세요'
              : '리조트바이트에 가입하고 일자리를 찾아보세요'
            }
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
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                placeholder="이름을 입력하세요"
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

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                회원 유형
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                disabled={searchParams.get('type') === 'employer'}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-resort-500 focus:border-resort-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="jobseeker">크루</option>
                <option value="employer">리조트</option>
                <option value="admin">관리자</option>
              </select>
              {searchParams.get('type') === 'employer' && (
                <p className="mt-1 text-sm text-blue-600">
                  리조트로 회원가입하시는 경우입니다.
                </p>
              )}
            </div>

            {/* 구인자 직장정보 필드들 */}
            {formData.userType === 'employer' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">직장 정보</h3>
                
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                    회사 주소 <span className="text-red-500">*</span>
                  </label>
                  <AddressSearch
                    onAddressSelect={(address: Address) => {
                      setFormData(prev => ({
                        ...prev,
                        companyAddress: address.address,
                        companyDetailAddress: address.detailAddress || ''
                      }));
                    }}
                    placeholder="회사 주소를 검색하세요 (예: 서울특별시 강남구 테헤란로 427)"
                    value={formData.companyAddress}
                    showDetailAddress={true}
                    detailAddressPlaceholder="사무실 번호 또는 층수 (예: 3층 301호, A동 2층)"
                  />
                </div>

                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                    회사 전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    required
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="회사 전화번호를 입력하세요"
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
                    placeholder="https://www.example.com"
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
                    placeholder="000-00-00000"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    업종
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-resort-500 focus:border-resort-500 sm:text-sm"
                  >
                    <option value="">업종을 선택하세요</option>
                    <option value="resort">리조트/호텔</option>
                    <option value="restaurant">음식점/카페</option>
                    <option value="retail">소매/유통</option>
                    <option value="manufacturing">제조업</option>
                    <option value="service">서비스업</option>
                    <option value="construction">건설업</option>
                    <option value="education">교육업</option>
                    <option value="healthcare">의료/헬스케어</option>
                    <option value="it">IT/소프트웨어</option>
                    <option value="other">기타</option>
                  </select>
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
                    <option value="">회사 규모를 선택하세요</option>
                    <option value="1-10">1-10명</option>
                    <option value="11-50">11-50명</option>
                    <option value="51-200">51-200명</option>
                    <option value="201-500">201-500명</option>
                    <option value="501-1000">501-1000명</option>
                    <option value="1000+">1000명 이상</option>
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
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                    placeholder="담당자명을 입력하세요"
                  />
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
            )}

            {formData.userType === 'admin' && (
              <div>
                <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">
                  관리자 코드
                </label>
                <input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  value={formData.adminCode}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                  placeholder="관리자 코드를 입력하세요"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-resort-600 hover:bg-resort-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-resort-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="font-medium text-resort-600 hover:text-resort-500">
                로그인하기
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 