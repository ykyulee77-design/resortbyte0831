import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

import { JobPost, WorkType, TimeSlot } from '../types';
import { MapLocation } from '../types/naverMap';

import LoadingSpinner from '../components/LoadingSpinner';
import WorkTypeEditModal from '../components/WorkTypeEditModal';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';
import AddressSearch from '../components/AddressSearch';
import NaverMap from '../components/NaverMap';
import NaverMapScript from '../components/NaverMapScript';
import WorkTypeHelpBanner from '../components/WorkTypeHelpBanner';

import { useAuth } from '../contexts/AuthContext';
import { workTypeService } from '../utils/scheduleMatchingService';
import { Clock, Trash2, Maximize2, Building, FileText, Home, Save, CheckCircle, MapPin, Settings } from 'lucide-react';

interface JobPostFormData {
  title: string;
  jobTitle: string; // 채용직무 필드 추가
  description: string;
  
  // 회사 정보
  companyInfo: {
    name: string;
    industry: string;
    companySize: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    contactPerson: string;
  };
  

  
  workPeriod: {
    startDate: string;
    endDate: string;
  };
  salary: {
    min: number;
    max: number;
    type: 'hourly' | 'daily' | 'monthly';
  };
  scheduleType: 'traditional' | 'flexible' | 'smart_matching';
  workTypes: WorkType[];
  workTimeType: '추후 협의' | '기본형' | '설정형';
  workTimeText: string; // 기본형일 때 사용할 텍스트
  accommodation: { provided: false, info: '' };
  meal: { provided: false, info: '' };
}

// 총 근무시간 계산 함수
const calculateTotalHoursPerWeek = (schedules: TimeSlot[]): number => {
  return schedules.reduce((total, slot) => {
    const start = slot.start || 0;
    const end = slot.end || 0;
    const hoursInSlot = end > start ? end - start : (24 - start) + end;
    return total + hoursInSlot;
  }, 0);
};

const JobPostForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableWorkTypes, setAvailableWorkTypes] = useState<WorkType[]>([]);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(false);

  // 타임스케줄 그리드 관련 state
  const [workTypeFormData, setWorkTypeFormData] = useState({
    name: '',
    description: '',
    hourlyWage: 0,
    isActive: true,
  });
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [isSavingWorkType, setIsSavingWorkType] = useState(false);
  const [workTypeErrors, setWorkTypeErrors] = useState<{[key: string]: string}>({});

  const [selectedWorkTypeForDetail, setSelectedWorkTypeForDetail] = useState<WorkType | null>(null);
  const [showWorkTypeDetailModal, setShowWorkTypeDetailModal] = useState(false);

  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  const [loadingAccommodationInfo, setLoadingAccommodationInfo] = useState(false);

  // 지도 관련 상태
  const [mapLocation, setMapLocation] = useState<MapLocation>({
    lat: 37.5665, // 서울 시청 기본 좌표
    lng: 126.9780
  });
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  
  // 페이지 진입 시 상단으로 스크롤 고정
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);


  const [formData, setFormData] = useState<JobPostFormData>({
    title: '',
    jobTitle: '', // 채용직무 필드 추가
    description: '',
    
    // 회사 정보
    companyInfo: {
      name: '',
      industry: '',
      companySize: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      contactPerson: '',
    },
    

    
    workPeriod: {
      startDate: '',
      endDate: '',
    },
    salary: {
      min: 10000,
      max: 0,
      type: 'hourly',
    },
    
    scheduleType: 'smart_matching',
    workTypes: [],
    workTimeType: '추후 협의',
    workTimeText: '',
    accommodation: { provided: false, info: '' },
    meal: { provided: false, info: '' },
  });

  useEffect(() => {
    if (id) {
      loadJobPost();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      loadAvailableWorkTypes();
      loadCompanyInfo();
      loadAccommodationInfo();
    }
  }, [user]);









  const loadAvailableWorkTypes = async () => {
    if (!user) return;
    
    setLoadingWorkTypes(true);
    try {
      console.log('근무타입 로딩 시작, user.uid:', user.uid);
      const workTypes = await workTypeService.getWorkTypesByEmployer(user.uid);
      console.log('로딩된 근무타입들:', workTypes);
      setAvailableWorkTypes(workTypes);
    } catch (e) {
      console.error('근무 유형 불러오기 실패:', e);
    } finally {
      setLoadingWorkTypes(false);
    }
  };

  const loadCompanyInfo = async () => {
    if (!user) return;
    
    setLoadingCompanyInfo(true);
    try {
      const docRef = doc(db, 'companyInfo', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyInfo(data);
        console.log('회사정보 로딩 완료:', data);
      }
    } catch (error) {
      console.error('회사정보 불러오기 실패:', error);
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  const loadAccommodationInfo = async () => {
    if (!user) return;
    
    setLoadingAccommodationInfo(true);
    try {
      const docRef = doc(db, 'accommodationInfo', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAccommodationInfo(data);
        console.log('기숙사정보 로딩 완료:', data);
      }
    } catch (error) {
      console.error('기숙사정보 불러오기 실패:', error);
    } finally {
      setLoadingAccommodationInfo(false);
    }
  };



  const selectWorkType = (workType: WorkType) => {
    console.log('선택된 근무 유형:', workType);
    
    // 이미 선택된 근무 유형인지 확인
    const isAlreadySelected = formData.workTypes.some(wt => wt.id === workType.id);
    if (isAlreadySelected) {
      alert('이미 선택된 근무 유형입니다.');
      return;
    }
    
    // 근무 유형을 선택 목록에 추가
    const updatedWorkTypes = [...formData.workTypes, workType];
    console.log('업데이트된 근무 유형 목록:', updatedWorkTypes);
    handleInputChange('workTypes', updatedWorkTypes);
    

  };

  const removeWorkType = (workTypeId: string) => {
    const updatedWorkTypes = formData.workTypes.filter(wt => wt.id !== workTypeId);
    handleInputChange('workTypes', updatedWorkTypes);
  };

  const validateWorkTypeForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!workTypeFormData.name.trim()) {
      newErrors.name = '근무타입명을 입력해주세요';
    }

    if (schedules.length === 0) {
      newErrors.schedules = '최소 하나의 스케줄을 설정해주세요';
    }

    setWorkTypeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveWorkType = async () => {
    if (!user || !validateWorkTypeForm()) return;

    setIsSavingWorkType(true);
    try {
      const newWorkType = await workTypeService.createWorkType({
        employerId: user.uid,
        name: workTypeFormData.name.trim(),
        description: workTypeFormData.description.trim(),
        hourlyWage: workTypeFormData.hourlyWage,
        schedules: schedules,
        isActive: workTypeFormData.isActive,
      });
      
      // 생성 후 자동으로 선택
      selectWorkType(newWorkType);
      
      // availableWorkTypes 목록 새로고침
      await loadAvailableWorkTypes();
      
      // 폼 초기화
      setWorkTypeFormData({
        name: '',
        description: '',
        hourlyWage: 0,
        isActive: true,
      });
      setSchedules([]);
      setWorkTypeErrors({});
      
      // 성공 메시지 표시
      alert(`새 근무 타입 "${newWorkType.name}"이(가) 생성되었습니다!`);
    } catch (error) {
      console.error('근무 유형 생성 실패:', error);
      alert('근무 유형 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSavingWorkType(false);
    }
  };

  // 지도 관련 함수들
  const handleAddressSelect = (result: any) => {
    setMapLocation({
      lat: result.lat,
      lng: result.lng,
      address: result.address
    });
    setFormData(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        address: result.address
      }
    }));
    setShowMap(true);
  };

  const handleMapToggle = () => {
    setShowMap(!showMap);
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log('지도 클릭:', lat, lng);
  };

  // const handleWorkTypeClick = (workType: WorkType) => {
  //   setSelectedWorkTypeForDetail(workType);
  //   setShowWorkTypeDetailModal(true);
  // };



  const loadJobPost = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'jobPosts', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as JobPost;
        setFormData({
          title: data.title,
          jobTitle: data.jobTitle || data.title || '', // jobTitle이 없으면 title을 기본값으로 사용
          description: data.description,
          companyInfo: (data as any).companyInfo || {
            name: '',
            industry: '',
            companySize: '',
            address: '',
            contactEmail: '',
            contactPhone: '',
            contactPerson: '',
          },

          workPeriod: { 
            startDate: data.startDate ? new Date(data.startDate.seconds * 1000).toISOString().split('T')[0] : '',
            endDate: data.endDate ? new Date(data.endDate.seconds * 1000).toISOString().split('T')[0] : '',
          },
          salary: data.salary,
          
          scheduleType: data.scheduleType || 'traditional',
          workTypes: data.workTypes || [],
          workTimeType: data.workTimeType === '주간 근무타입' || data.workTimeType === '야간 근무타입' || data.workTimeType === '주말근무타입' || data.workTimeType === '주중근무타입' ? '설정형' : (data.workTimeType === '무관' || data.workTimeType === '무관-추후협의' ? '추후 협의' : (data.workTimeType || '추후 협의')),
          workTimeText: (data as any).workTimeText || '',
          accommodation: (data as any).accommodation || { provided: false, info: '' },
          meal: (data as any).meal || { provided: false, info: '' },
        });
      }
    } catch (error) {
      console.error('Error loading job post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof JobPostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSalaryChange = (field: keyof typeof formData.salary, value: number) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value,
      },
    }));
  };

  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('폼 제출 시작');
    
    // 필수 필드 검증
    if (!formData.title.trim()) {
      alert('공고 제목을 입력해주세요.');
      return;
    }
    
    if (!formData.jobTitle.trim()) {
      alert('채용 직무를 입력해주세요.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('직무 설명을 입력해주세요.');
      return;
    }
    

    

    
    setSaving(true);

    try {
      
      const jobPostData = {
        title: formData.title.trim(),
        jobTitle: formData.jobTitle.trim(),
        description: formData.description.trim(),
        companyInfo: companyInfo || formData.companyInfo, // 기존 회사 정보 사용
        workPeriod: formData.workPeriod,
        salary: formData.salary,
        
        scheduleType: formData.scheduleType,
        workTypes: formData.workTypes,
        workTimeType: formData.workTimeType,
        workTimeText: formData.workTimeText,
        accommodation: formData.accommodation,
        meal: formData.meal,
        employerId: user?.uid, // 고용주 ID 추가
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any;

      // 디버깅을 위한 로그
      console.log('저장할 리조트 공고 데이터:', jobPostData);
      console.log('선택된 근무 유형:', formData.workTypes);
      console.log('근무 유형 개수:', formData.workTypes.length);
      console.log('현재 사용자 ID:', user?.uid);

      if (id) {
        console.log('기존 공고 수정:', id);
        const docRef = doc(db, 'jobPosts', id);
        await updateDoc(docRef, jobPostData);
        console.log('공고 수정 완료');
      } else {
        console.log('새 공고 등록 시작');
        const docRef = await addDoc(collection(db, 'jobPosts'), jobPostData);
        console.log('새 공고 등록 완료, 문서 ID:', docRef.id);
      }

      alert(id ? '리조트 공고가 수정되었습니다.' : '리조트 공고가 등록되었습니다.');
      navigate('/employer-dashboard');
    } catch (error) {
      console.error('리조트 공고 저장 실패:', error);
      alert('리조트 공고 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 헤더 영역 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {id ? '리조트 공고 수정' : '새 리조트 공고 등록'}
              </h1>
              <p className="text-gray-600">
                {id ? '기존 리조트 공고를 수정합니다.' : '새로운 리조트 공고를 등록합니다.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/employer-dashboard#job-posts')}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>

        {/* 근무타입 도움말 배너 */}
        <WorkTypeHelpBanner storageKey="rtb_worktype_help_jobpost" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 폼 제출 버튼 (숨김) */}
          <button type="submit" style={{ display: 'none' }} />
          
          {/* 리조트 공고 정보 - 최상단으로 이동 */}
          <div className="bg-blue-50 rounded-lg border-2 border-blue-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                리조트 공고 정보
              </h2>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700">입력</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공고 제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 2024년 하계 알바 모집"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">채용직무 *</label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서빙, 주방보조, 정리정돈"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무기간</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">시작일</label>
                    <input
                      type="date"
                      value={formData.workPeriod.startDate}
                      onChange={(e) => handleInputChange('workPeriod', {
                        ...formData.workPeriod,
                        startDate: e.target.value,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">종료일</label>
                    <input
                      type="date"
                      value={formData.workPeriod.endDate}
                      onChange={(e) => handleInputChange('workPeriod', {
                        ...formData.workPeriod,
                        endDate: e.target.value,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    <Settings className="w-4 h-4" /> 근무타입 설정
                  </span>
                </label>
                <select
                  value={formData.workTimeType}
                  onChange={(e) => handleInputChange('workTimeType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="설정형">설정형</option>
                  <option value="추후 협의">추후 협의</option>
                </select>
              </div>

              {formData.workTimeType === '기본형' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">근무시간 설명</label>
                  <textarea
                    value={formData.workTimeText}
                    onChange={(e) => handleInputChange('workTimeText', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="근무시간에 대한 상세 설명을 입력하세요 (예: 주간 9시-18시, 야간 22시-06시 등)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">급여</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={formData.salary.min}
                    onChange={(e) => handleSalaryChange('min', Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최소"
                    min={10000}
                    step={1000}
                  />
                  <input
                    type="number"
                    value={formData.salary.max}
                    onChange={(e) => handleSalaryChange('max', Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최대"
                    min={10000}
                    step={1000}
                  />
                  <select
                    value={formData.salary.type}
                    onChange={(e) => handleSalaryChange('type', e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">시급</option>
                    <option value="daily">일급</option>
                    <option value="monthly">월급</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">직무 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="담당 업무, 근무 환경, 필요한 자격 등을 상세히 설명해주세요"
                />
              </div>

              {/* 숙식 제공 */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  숙식 제공
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 기숙사 제공 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="accommodation"
                        checked={formData.accommodation.provided}
                        onChange={(e) => handleInputChange('accommodation', {
                          ...formData.accommodation,
                          provided: e.target.checked,
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="accommodation" className="text-sm font-medium text-gray-700">
                        기숙사 제공
                      </label>
            </div>
                    
                    {formData.accommodation.provided && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          기숙사 정보
                        </label>
                        <textarea
                          value={formData.accommodation.info}
                          onChange={(e) => handleInputChange('accommodation', {
                            ...formData.accommodation,
                            info: e.target.value,
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="기숙사 위치, 시설, 비용 등을 입력하세요"
                        />
                      </div>
                    )}
          </div>

                  {/* 식사 제공 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="meal"
                        checked={formData.meal.provided}
                        onChange={(e) => handleInputChange('meal', {
                          ...formData.meal,
                          provided: e.target.checked,
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="meal" className="text-sm font-medium text-gray-700">
                        식사 제공
                      </label>
                    </div>
                    
                    {formData.meal.provided && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          식사 정보
                        </label>
                        <textarea
                          value={formData.meal.info}
                          onChange={(e) => handleInputChange('meal', {
                            ...formData.meal,
                            info: e.target.value,
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="식사 종류, 시간, 비용 등을 입력하세요"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 근무시간 유형 섹션 (설정형 선택 시 표시) */}
          {formData.workTimeType === '설정형' && (
            <div className="bg-blue-50 rounded-lg border-2 border-blue-300 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="text-blue-800">근무타입 설정</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">핵심</span>
                </h2>
                <p className="text-sm text-gray-500">근무시간 유형을 생성하고 관리하세요</p>
              </div>

              {/* 근무 유형 생성 폼 */}
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      근무 유형명 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={workTypeFormData.name}
                      onChange={(e) => {
                        setWorkTypeFormData(prev => ({ ...prev, name: e.target.value }));
                        if (workTypeErrors.name && e.target.value.trim()) {
                          setWorkTypeErrors(prev => ({
                            ...prev,
                            name: '',
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 주간 근무, 야간 근무"
                    />
                    {workTypeErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{workTypeErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={workTypeFormData.description}
                      onChange={(e) => setWorkTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="근무 유형에 대한 설명"
                    />
                  </div>
                </div>

                {/* 시급 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시급 (원)
                  </label>
                  <input
                    type="number"
                    name="hourlyWage"
                    value={workTypeFormData.hourlyWage}
                    onChange={(e) => setWorkTypeFormData(prev => ({ ...prev, hourlyWage: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                    min={10000}
                    step={1000}
                  />
                </div>

                {/* 스케줄 그리드와 생성된 유형 목록 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    근무 스케줄 *
                  </label>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <UnifiedScheduleGrid
                        selectedTimeSlots={schedules}
                        onChange={(newSchedules) => {
                          setSchedules(newSchedules);
                          if (workTypeErrors.schedules && newSchedules.length > 0) {
                            setWorkTypeErrors(prev => ({
                              ...prev,
                              schedules: '',
                            }));
                          }
                        }}
                        mode="create"
                        showActions={false}
                      />
                      {schedules.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-700 font-medium">
                              총 근무시간: 주 {calculateTotalHoursPerWeek(schedules)}시간
                            </span>
                            <span className="text-blue-600">
                              {schedules.length}개 시간대 선택
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-1/2">
                      <div className="bg-gray-50 rounded-lg border p-4 h-full">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">생성된 근무시간 유형</h4>
                        {availableWorkTypes.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableWorkTypes.map((workType) => (
                              <div
                                key={workType.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  formData.workTypes.some(wt => wt.id === workType.id)
                                    ? 'bg-blue-100 border-blue-300'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => {
                                  const isSelected = formData.workTypes.some(wt => wt.id === workType.id);
                                  if (isSelected) {
                                    handleInputChange('workTypes', formData.workTypes.filter(wt => wt.id !== workType.id));
                                  } else {
                                    handleInputChange('workTypes', [...formData.workTypes, workType]);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">{workType.name}</div>
                                    {workType.description && (
                                      <div className="text-xs text-gray-600 mt-1">{workType.description}</div>
                                    )}
                                    <div className="flex items-center gap-3 mt-1">
                                      <div className="text-xs text-green-600">
                                        주 {calculateTotalHoursPerWeek(workType.schedules || [])}시간
                                      </div>
                                      {workType.hourlyWage && workType.hourlyWage > 0 && (
                                        <div className="text-xs text-blue-600">
                                          시급 {workType.hourlyWage.toLocaleString()}원
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {formData.workTypes.some(wt => wt.id === workType.id) && (
                                      <CheckCircle className="w-4 h-4 text-blue-600" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">생성된 근무시간 유형이 없습니다</p>
                            <p className="text-xs mt-1">왼쪽에서 새로운 유형을 생성해보세요</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {workTypeErrors.schedules && (
                    <p className="text-red-500 text-sm mt-1">{workTypeErrors.schedules}</p>
                  )}
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveWorkType}
                    disabled={isSavingWorkType}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingWorkType ? '저장 중...' : '근무 유형 저장'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 회사 정보 (고정값) */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                회사 정보
              </h2>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">조회</span>
              <div className="flex items-center gap-2">
                <Link
                  to={`/company/${user?.uid}?edit=true`}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  회사 정보 수정
                </Link>
                {(loadingCompanyInfo) && (
                  <span className="text-sm text-gray-500">정보 로딩 중...</span>
                )}
              </div>
            </div>
            
            {companyInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.name || '미입력'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">업종</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.industry || '미입력'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회사 규모</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.companySize || '미입력'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회사 주소</label>
                  <div className="space-y-2">
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {companyInfo.address || companyInfo.region || '미입력'}
                    </div>
                    {(companyInfo.address || companyInfo.region) && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleMapToggle}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          {showMap ? '지도 숨기기' : '지도 보기'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 지도 표시 */}
                {showMap && (companyInfo.address || companyInfo.region) && (
                  <div className="md:col-span-2 mt-4">
                    <NaverMapScript />
                    <NaverMap
                      center={mapLocation}
                      zoom={15}
                      markers={[
                        {
                          position: mapLocation,
                          title: companyInfo.name || '회사',
                          content: companyInfo.address || companyInfo.region || '위치 정보'
                        }
                      ]}
                      onMapClick={handleMapClick}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.contactPerson || '미입력'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자 연락처</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.contactPhone || '미입력'}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">회사 이메일</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.contactEmail || '미입력'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 mb-2">회사 정보가 등록되지 않았습니다</p>
                <Link
                  to={`/company/${user?.uid}?edit=true`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  회사 정보 등록하기
                </Link>
              </div>
            )}
          </div>



          {/* 기숙사 정보 섹션 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Home className="h-5 w-5 mr-2" />
                기숙사 정보
              </h2>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">조회</span>
              <div className="flex items-center gap-2">
                <Link
                  to={`/accommodation-info/${user?.uid}?mode=edit`}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  기숙사 정보 수정
                </Link>
              </div>
            </div>
            
            {accommodationInfo ? (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기숙사 주소</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {accommodationInfo.address || '미입력'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {accommodationInfo.contactPerson || '미입력'}
                    </div>
                  </div>
                </div>

                {/* 기숙사 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기숙사 설명</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[60px]">
                    {accommodationInfo.description || '미입력'}
                  </div>
                </div>

                {/* 수용 인원 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">총 수용 인원</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {accommodationInfo.capacity || 0}명
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">현재 입주 인원</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {accommodationInfo.currentOccupancy || 0}명
                    </div>
                  </div>
                </div>

                {/* 방 타입 및 가격 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">방 타입 및 가격</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {accommodationInfo.roomTypeOptions?.singleRoom && (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="text-sm font-medium text-gray-700">1인실</div>
                        <div className="text-gray-900">{accommodationInfo.roomPrices?.singleRoom || '가격 미정'}</div>
                      </div>
                    )}
                    {accommodationInfo.roomTypeOptions?.doubleRoom && (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="text-sm font-medium text-gray-700">2인실</div>
                        <div className="text-gray-900">{accommodationInfo.roomPrices?.doubleRoom || '가격 미정'}</div>
                      </div>
                    )}
                    {accommodationInfo.roomTypeOptions?.tripleRoom && (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="text-sm font-medium text-gray-700">3인실</div>
                        <div className="text-gray-900">{accommodationInfo.roomPrices?.tripleRoom || '가격 미정'}</div>
                      </div>
                    )}
                    {accommodationInfo.roomTypeOptions?.quadRoom && (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="text-sm font-medium text-gray-700">4인실</div>
                        <div className="text-gray-900">{accommodationInfo.roomPrices?.quadRoom || '가격 미정'}</div>
                      </div>
                    )}
                    {accommodationInfo.roomTypeOptions?.otherRoom && (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="text-sm font-medium text-gray-700">{accommodationInfo.otherRoomType || '기타'}</div>
                        <div className="text-gray-900">{accommodationInfo.roomPrices?.otherRoom || '가격 미정'}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 편의시설 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">편의시설</label>
                  <div className="flex flex-wrap gap-2">
                    {accommodationInfo.amenities?.map((amenity: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                        {amenity}
                      </span>
                    ))}
                    {accommodationInfo.otherAmenities && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                        {accommodationInfo.otherAmenities}
                      </span>
                    )}
                  </div>
                </div>

                {/* 근린시설 */}
                {accommodationInfo.nearbyFacilities && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">근린시설</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {accommodationInfo.nearbyFacilities}
                    </div>
                  </div>
                )}

                {/* 기숙사 규칙 */}
                {accommodationInfo.rules && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기숙사 규칙</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[60px]">
                      {accommodationInfo.rules}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Home className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 mb-2">기숙사 정보가 등록되지 않았습니다</p>
                <Link
                  to={`/accommodation-info/${user?.uid}?mode=edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  기숙사 정보 등록하기
                </Link>
              </div>
            )}
          </div>





          {/* 폼 제출 버튼 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/employer-dashboard#job-posts')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : (id ? '수정' : '등록')}
              </button>
            </div>
          </div>

        </form>




        {/* 근무타입 상세 정보 모달 */}
        <WorkTypeEditModal
          workType={selectedWorkTypeForDetail}
          isOpen={showWorkTypeDetailModal}
          onClose={() => {
            setShowWorkTypeDetailModal(false);
            setSelectedWorkTypeForDetail(null);
          }}
          onUpdate={(updatedWorkType) => {
            setSelectedWorkTypeForDetail(updatedWorkType);
          }}
        />


      </div>
    </div>
  );
};

export default JobPostForm; 