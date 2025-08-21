import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CompanyInfo } from '../types';
import { Building, MapPin, Phone, Mail, Globe, Users, Calendar, Home, Star, CheckCircle, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
// import AddressSearch, { Address } from '../components/AddressSearch';

const CompanyInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
          foundedYear: undefined,
          benefits: [],
          culture: '',
          images: [],
          contactEmail: '',
          contactPhone: '',
          contactPerson: '',
          address: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          region: '',
          dormitory: false,
          dormitoryFacilities: [],
          salaryRange: '',
          environment: '도심' as const,
          workTimeType: '고정제' as const
        };
        setFormData(defaultData);
      }
    } catch (error) {
      console.error('회사 정보 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, [employerId]);

  // 현재 사용자가 이 회사의 소유자인지 확인
  const isOwner = user?.uid === employerId;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!employerId) return;
    
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date()
      };

      if (companyInfo?.id) {
        // 기존 데이터 업데이트
        await updateDoc(doc(db, 'companyInfo', employerId), dataToSave);
      } else {
        // 새 데이터 생성
        await setDoc(doc(db, 'companyInfo', employerId), {
          ...dataToSave,
          createdAt: new Date()
        });
      }

      await fetchCompanyInfo();
      setIsEditing(false);
    } catch (error) {
      console.error('회사 정보 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(companyInfo || {});
    setIsEditing(false);
  };

  if (loading) return <LoadingSpinner />;
  
  // 데이터가 없어도 기본 구조는 표시하되, 데이터는 공란으로 처리
  const displayInfo = formData;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? (
              <input
                type="text"
                value={displayInfo.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                placeholder="회사명을 입력하세요"
              />
            ) : (
              displayInfo.name || '회사명 미등록'
            )}
          </h1>
          <div className="flex items-center text-gray-600">
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
        <div className="flex space-x-2">
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
            </>
          )}
          <Link to="/employer-dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            대시보드로
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 회사 소개 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">회사 소개</h2>
            <p className="text-gray-800 leading-7 whitespace-pre-wrap">
              {isEditing ? (
                <textarea
                  value={displayInfo.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full h-full bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="회사 소개를 입력하세요"
                />
              ) : (
                displayInfo.description || '회사 소개가 등록되지 않았습니다.'
              )}
            </p>
          </div>

          {/* 회사 이미지 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">회사 이미지</h2>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayInfo.images && displayInfo.images.length > 0 ? (
                  displayInfo.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`회사 이미지 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeArrayItem('images', index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100"
                        title="이미지 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">등록된 회사 이미지가 없습니다.</p>
                )}
                <button
                  onClick={() => addArrayItem('images')}
                  className="aspect-video bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200"
                >
                  <Plus className="h-6 w-6" />
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
                  <p className="text-gray-500">등록된 회사 이미지가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 복리후생 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">복리후생</h2>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayInfo.benefits && displayInfo.benefits.length > 0 ? (
                  displayInfo.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                        className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                        placeholder="복리후생 항목"
                      />
                      <button
                        onClick={() => removeArrayItem('benefits', index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="항목 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">등록된 복리후생 정보가 없습니다.</p>
                )}
                <button
                  onClick={() => addArrayItem('benefits')}
                  className="col-span-full md:col-span-1 bg-green-100 text-green-600 rounded-lg p-3 flex items-center justify-center hover:bg-green-200"
                >
                  <Plus className="h-6 w-6 mr-2" />
                  복리후생 항목 추가
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayInfo.benefits && displayInfo.benefits.length > 0 ? (
                  displayInfo.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-gray-800">{benefit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">등록된 복리후생 정보가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 회사 문화 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">회사 문화</h2>
            <p className="text-gray-800 leading-7">
              {isEditing ? (
                <textarea
                  value={displayInfo.culture || ''}
                  onChange={(e) => handleInputChange('culture', e.target.value)}
                  className="w-full h-full bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="회사 문화를 입력하세요"
                />
              ) : (
                displayInfo.culture || '회사 문화 정보가 등록되지 않았습니다.'
              )}
            </p>
          </div>

          {/* 근무 환경 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">근무 환경</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">환경</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <select
                      value={displayInfo.environment}
                      onChange={(e) => handleInputChange('environment', e.target.value as '도심' | '외곽' | '기타')}
                      className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <div className="text-sm font-medium text-gray-700 mb-1">근무타입</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <select
                      value={displayInfo.workTimeType}
                      onChange={(e) => handleInputChange('workTimeType', e.target.value as '고정제' | '유연제' | '기타')}
                      className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <div className="text-sm font-medium text-gray-700 mb-1">급여 범위</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.salaryRange || ''}
                      onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                      className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="예시: 3000만원 ~ 5000만원"
                    />
                  ) : (
                    displayInfo.salaryRange || '급여 정보 미등록'
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">지역</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="주소를 입력하세요"
                    />
                  ) : (
                    displayInfo.address || '주소 미등록'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 기숙사 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              기숙사 정보
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">기숙사 제공</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <select
                        value={displayInfo.dormitory ? '제공' : '미제공'}
                        onChange={(e) => handleInputChange('dormitory', e.target.value === '제공')}
                        className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="제공">제공</option>
                        <option value="미제공">미제공</option>
                      </select>
                    ) : (
                      displayInfo.dormitory ? '제공' : '미제공'
                    )}
                  </div>
                </div>
                {displayInfo.dormitory && (
                  <Link
                    to={`/accommodation/${employerId}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    기숙사 상세정보
                  </Link>
                )}
              </div>
              
              {displayInfo.dormitory && displayInfo.dormitoryFacilities && displayInfo.dormitoryFacilities.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">기숙사 시설</div>
                  <div className="flex flex-wrap gap-2">
                    {displayInfo.dormitoryFacilities.map((facility: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={facility}
                            onChange={(e) => handleArrayChange('dormitoryFacilities', index, e.target.value)}
                            className="bg-transparent border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="시설 항목"
                          />
                        ) : (
                          facility
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
            <div className="space-y-4">
              {displayInfo.foundedYear && (
                <div>
                  <div className="text-sm font-medium text-gray-700">설립년도</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        value={displayInfo.foundedYear || ''}
                        onChange={(e) => handleInputChange('foundedYear', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="예시: 2000"
                      />
                    ) : (
                      displayInfo.foundedYear + '년'
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-700">업종</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="업종을 입력하세요"
                    />
                  ) : (
                    displayInfo.industry || '업종 미등록'
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">회사 규모</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.companySize || ''}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="회사 규모를 입력하세요"
                    />
                  ) : (
                    displayInfo.companySize || '규모 미등록'
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">지역</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.region || ''}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="지역을 입력하세요"
                    />
                  ) : (
                    displayInfo.region || '지역 미등록'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">연락처</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="주소를 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.address || '주소 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="연락처를 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.contactPhone || '연락처 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="email"
                    value={displayInfo.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="이메일을 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.contactEmail || '이메일 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="담당자를 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.contactPerson || '담당자 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="url"
                    value={displayInfo.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="웹사이트 URL을 입력하세요"
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
                    <span className="text-gray-800">웹사이트 미등록</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 등록 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">등록 정보</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">등록일</div>
                <div className="text-gray-900">
                  {displayInfo.createdAt instanceof Date ? 
                    displayInfo.createdAt.toLocaleDateString('ko-KR') : 
                    displayInfo.createdAt.toDate().toLocaleDateString('ko-KR')}
                </div>
              </div>
              
              {displayInfo.updatedAt && (
                <div>
                  <div className="text-sm font-medium text-gray-700">수정일</div>
                  <div className="text-gray-900">
                    {displayInfo.updatedAt instanceof Date ? 
                      displayInfo.updatedAt.toLocaleDateString('ko-KR') : 
                      displayInfo.updatedAt.toDate().toLocaleDateString('ko-KR')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
