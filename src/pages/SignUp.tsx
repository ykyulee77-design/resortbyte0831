import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, Building, User, Home } from 'lucide-react';
import { Resume } from '../types';
import Navbar from '../components/Navbar';
import AddressSearch, { Address } from '../components/AddressSearch';
import NaverMapScript from '../components/NaverMapScript';

const SignUp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as 'jobseeker' | 'employer' | 'admin' | null;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: (roleParam || 'jobseeker') as 'jobseeker' | 'employer' | 'admin',
    adminCode: '',
    // 구인자 직장 정보
    workplaceName: '',
    workplaceLocation: '',
    contactPerson: '',
    // 구인자 추가 정보
    companyName: '',
    companyAddress: '',
    companyDetailAddress: '',
    companyPhone: '',
    companyWebsite: '',
    businessNumber: '',
    industry: '',
    companySize: '',
    contactPhone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (roleParam && roleParam !== formData.role) {
      setFormData(prev => ({ ...prev, role: roleParam as 'jobseeker' | 'employer' | 'admin' }));
    }
  }, [roleParam]);

  // 관리자 등록 코드 (실제 환경에서는 환경변수나 보안된 설정에서 관리)
  const ADMIN_REGISTRATION_CODE = 'RESORT_ADMIN_2024';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // 구인자인 경우 담당자명을 가입회원명으로 자동 설정
      if (name === 'displayName' && prev.role === 'employer') {
        newData.contactPerson = value;
      }
      
      // 역할이 구인자로 변경될 때 담당자명을 가입회원명으로 자동 설정
      if (name === 'role' && value === 'employer' && prev.displayName) {
        newData.contactPerson = prev.displayName;
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

    // 구인자 직장 정보 검증
    if (formData.role === 'employer') {
      if (!formData.companyName || !formData.companyAddress || !formData.companyPhone) {
        setError('리조트 정보의 필수 항목(리조트명, 주소, 연락처)을 모두 입력해주세요.');
        return;
      }
    }

    // 관리자 등록 시 코드 검증
    if (formData.role === 'admin') {
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
      setLoading(true);

      // 구인자 정보 준비
      const employerInfo = formData.role === 'employer' ? {
        workplaceName: formData.workplaceName,
        workplaceLocation: formData.workplaceLocation,
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
      } : undefined;

      // 디버깅: 회원가입 정보 로그
      console.log('📝 회원가입 정보:', {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        employerInfo: employerInfo
      });

      // 구직자는 기본 정보만으로 회원가입 (이력서는 별도 페이지에서 작성)
      const resume = formData.role === 'jobseeker' ? {} : undefined;

      await signUp(formData.email, formData.password, formData.displayName, formData.role, employerInfo, resume);
      
      // 회원가입 후 역할에 따른 리다이렉트
      if (formData.role === 'employer') {
        navigate('/employer-dashboard');
      } else if (formData.role === 'jobseeker') {
        navigate('/jobseeker-dashboard');
      } else if (formData.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate(redirectTo);
      }
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
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              회원가입
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              리조트바이트에 가입하고 크루로 참여하거나 리조트를 등록해보세요
            </p>
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900 mb-2">🎯 어떤 회원이신가요?</h3>
                <div className="flex justify-center space-x-6 text-xs text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-blue-600" />
                    <span><strong>크루</strong> - 일자리를 찾는 구직자</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1 text-green-600" />
                    <span><strong>리조트</strong> - 인재를 찾는 고용주</span>
                  </div>
                </div>
              </div>
            </div>
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
                  {formData.role === 'employer' ? '담당자명' : '이름'}
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
                  placeholder={formData.role === 'employer' ? '담당자명을 입력하세요' : '이름을 입력하세요'}
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
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  회원 유형
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-resort-500 focus:border-resort-500 sm:text-sm"
                >
                  <option value="jobseeker">크루 (구직자)</option>
                  <option value="employer">리조트 (고용주)</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              {/* 구인자 직장 정보 */}
              {formData.role === 'employer' && (
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
              )}



              {formData.role === 'admin' && (
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

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-resort-600 hover:text-resort-500">
                  로그인하기
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
      <NaverMapScript />
    </div>
  );
};

export default SignUp; 