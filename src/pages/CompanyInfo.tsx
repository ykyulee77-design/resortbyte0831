import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CompanyInfo } from '../types';
import { Building, MapPin, Phone, Mail, Globe, Users, Calendar, Home, Star, CheckCircle, Edit, Save, X, Plus, Trash2, Briefcase, DollarSign, FileText, Camera } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const CompanyInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchCompanyInfo = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const ref = doc(db, 'companyInfo', employerId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as CompanyInfo;
        setCompanyInfo(data);
        setFormData(data);
      } else {
        // 새로 생성할 경우 기본값 설정
        const defaultData = {
          id: '',
          employerId: employerId,
          name: '',
          description: '',
          website: '',
          industry: '',
          companySize: '',
          businessNumber: '',
          culture: '',
          benefits: [],
          images: [],
          imageDescriptions: [],
          contactEmail: '',
          contactPhone: '',
          contactPerson: '',
          address: '',
          salaryRange: '',
          environment: '도심' as const,
          workTimeType: '고정제' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setFormData(defaultData);
      }
    } catch (error) {
      console.error('회사 정보 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자가 이 회사의 소유자인지 확인
  const isOwner = user?.uid === employerId;

  useEffect(() => {
    fetchCompanyInfo();
  }, [employerId]);

  // URL 파라미터에서 수정 모드 감지
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'edit' && isOwner) {
      setIsEditing(true);
    }
  }, [searchParams, isOwner]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => i === index ? value : item),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), ''],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index),
    }));
  };

  // 복리후생 체크박스 처리
  const handleBenefitChange = (benefit: string, checked: boolean) => {
    setFormData((prev: any) => {
      const currentBenefits = prev.benefits || [];
      if (checked) {
        // 체크된 경우 추가 (중복 방지)
        if (!currentBenefits.includes(benefit)) {
          return {
            ...prev,
            benefits: [...currentBenefits, benefit]
          };
        }
      } else {
        // 체크 해제된 경우 제거
        return {
          ...prev,
          benefits: currentBenefits.filter((b: string) => b !== benefit)
        };
      }
      return prev;
    });
  };

          // 복리후생 체크박스 항목 (핵심만)
        const benefitCheckboxes = [
          '기숙사 제공',
          '식사 제공',
          '시설이용권 및 할인',
          '교통비 지원',
          '정규직 전환시 경력인정'
        ];

  const handleSave = async () => {
    if (!employerId) return;
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date(),
      };
      
      if (companyInfo) {
        await updateDoc(doc(db, 'companyInfo', employerId), dataToSave);
      } else {
        await setDoc(doc(db, 'companyInfo', employerId), dataToSave);
      }
      
      setCompanyInfo(dataToSave);
      setIsEditing(false);
      alert('회사 정보가 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(companyInfo || {});
    setIsEditing(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const displayInfo = formData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                    placeholder="회사명을 입력하세요"
                  />
                ) : (
                  displayInfo.name || '회사명 미등록'
                )}
              </h1>
              <div className="flex items-center text-gray-600 mt-2">
                <Building className="h-4 w-4 mr-1" />
                <span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="업종"
                    />
                  ) : (
                    displayInfo.industry || '업종 미등록'
                  )}
                </span>
                <span className="mx-2">•</span>
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.companySize || ''}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="회사 규모"
                    />
                  ) : (
                    displayInfo.companySize || '규모 미등록'
                  )}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 mt-4 lg:mt-0">
              {isOwner && (
                <>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </button>
                  )}
                  <Link
                    to="/employer-dashboard"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    대시보드로
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 회사 소개 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                회사 소개
              </h2>
              {isEditing ? (
                <textarea
                  value={displayInfo.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full h-32 bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="회사에 대한 간단한 소개를 작성해주세요..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {displayInfo.description || '회사 소개가 등록되지 않았습니다.'}
                </p>
              )}
            </div>

            {/* 회사 문화 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                회사 문화
              </h2>
              {isEditing ? (
                <textarea
                  value={displayInfo.culture || ''}
                  onChange={(e) => handleInputChange('culture', e.target.value)}
                  className="w-full h-24 bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="회사의 문화와 분위기를 간단히 설명해주세요..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {displayInfo.culture || '회사 문화 정보가 등록되지 않았습니다.'}
                </p>
              )}
            </div>

            {/* 복리후생 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-green-600" />
                복리후생
              </h2>
                            {isEditing ? (
                <div className="space-y-4">
                  {/* 체크박스 항목들 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {benefitCheckboxes.map((benefit) => {
                      const isChecked = displayInfo.benefits && displayInfo.benefits.includes(benefit);
                      return (
                        <label key={benefit} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleBenefitChange(benefit, e.target.checked)}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          />
                          <span className="ml-3 text-sm text-gray-700">{benefit}</span>
                        </label>
                      );
                    })}
                  </div>
                  
                  {/* 기존 기타 항목들 */}
                  {displayInfo.benefits && displayInfo.benefits.length > 0 ? (
                    displayInfo.benefits
                      .filter((benefit: string) => 
                        !benefitCheckboxes.includes(benefit)
                      )
                      .map((benefit: string, index: number) => {
                        const originalIndex = displayInfo.benefits.indexOf(benefit);
                        return (
                          <div key={originalIndex} className="flex items-center">
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => handleArrayChange('benefits', originalIndex, e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="기타 복리후생 항목"
                            />
                            <button
                              onClick={() => removeArrayItem('benefits', originalIndex)}
                              className="ml-2 text-red-500 hover:text-red-700"
                              title="항목 삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                  ) : null}
                  
                  {/* 새로운 기타 항목 입력 */}
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="기타 복리후생 항목을 입력하세요"
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          addArrayItem('benefits');
                          // 새로 추가된 항목에 현재 입력값 설정
                          setTimeout(() => {
                            const newIndex = (displayInfo.benefits || []).length;
                            handleArrayChange('benefits', newIndex, e.currentTarget.value.trim());
                          }, 100);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          addArrayItem('benefits');
                          setTimeout(() => {
                            const newIndex = (displayInfo.benefits || []).length;
                            handleArrayChange('benefits', newIndex, input.value.trim());
                          }, 100);
                          input.value = '';
                        }
                      }}
                      className="ml-2 bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 transition-colors"
                      title="기타 항목 추가"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 모든 복리후생 표시 */}
                  {displayInfo.benefits && displayInfo.benefits.length > 0 ? (
                    <>
                      {/* 체크된 기본 복리후생 */}
                      {displayInfo.benefits
                        .filter((benefit: string) => benefitCheckboxes.includes(benefit))
                        .map((benefit: string) => (
                          <div key={benefit} className="flex items-center p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="h-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      
                      {/* 기타 복리후생 */}
                      {displayInfo.benefits
                        .filter((benefit: string) => !benefitCheckboxes.includes(benefit))
                        .map((benefit: string) => (
                          <div key={benefit} className="flex items-center p-2 bg-blue-50 rounded-lg">
                            <CheckCircle className="h-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </div>
                        ))}
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-4">등록된 복리후생 정보가 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 회사 이미지 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-purple-600" />
                회사 이미지
              </h2>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayInfo.images && displayInfo.images.length > 0 ? (
                    displayInfo.images.map((image: string, index: number) => (
                      <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`회사 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeArrayItem('images', index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100"
                          title="이미지 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-8">등록된 회사 이미지가 없습니다.</p>
                  )}
                  <button
                    onClick={() => addArrayItem('images')}
                    className="aspect-video bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors"
                  >
                    <Plus className="h-8 w-8" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayInfo.images && displayInfo.images.length > 0 ? (
                    displayInfo.images.map((image: string, index: number) => (
                      <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`회사 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-8">등록된 회사 이미지가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600" />
                기본 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">사업자번호</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayInfo.businessNumber || ''}
                        onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="사업자번호를 입력하세요"
                      />
                    ) : (
                      displayInfo.businessNumber || '사업자번호 미등록'
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">웹사이트</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="url"
                        value={displayInfo.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        placeholder="https://example.com"
                      />
                    ) : (
                      displayInfo.website ? (
                        <a 
                          href={displayInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {displayInfo.website}
                        </a>
                      ) : (
                        '웹사이트 미등록'
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 근무 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                근무 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">근무 환경</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <select
                        value={displayInfo.environment}
                        onChange={(e) => handleInputChange('environment', e.target.value as '도심' | '외곽' | '기타')}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="도심">도심</option>
                        <option value="외곽">외곽</option>
                        <option value="기타">기타</option>
                      </select>
                    ) : (
                      displayInfo.environment
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">근무 형태</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <select
                        value={displayInfo.workTimeType}
                        onChange={(e) => handleInputChange('workTimeType', e.target.value as '고정제' | '유연제' | '기타')}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="고정제">고정제</option>
                        <option value="유연제">유연제</option>
                        <option value="기타">기타</option>
                      </select>
                    ) : (
                      displayInfo.workTimeType
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    급여 범위
                  </div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayInfo.salaryRange || ''}
                        onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예시: 3000만원 ~ 5000만원"
                      />
                    ) : (
                      displayInfo.salaryRange || '급여 정보 미등록'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 연락처 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-green-600" />
                연락처
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">전화번호</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="tel"
                        value={displayInfo.contactPhone || ''}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="전화번호를 입력하세요"
                      />
                    ) : (
                      displayInfo.contactPhone || '전화번호 미등록'
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">이메일</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="email"
                        value={displayInfo.contactEmail || ''}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="이메일을 입력하세요"
                      />
                    ) : (
                      displayInfo.contactEmail || '이메일 미등록'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 주소 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                주소
              </h2>
              <div className="text-gray-900">
                {isEditing ? (
                  <textarea
                    value={displayInfo.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="회사 주소를 입력하세요"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">
                    {displayInfo.address || '주소 정보가 없습니다.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
