import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { JobPost, WorkType, TimeSlot } from '../types';

import LoadingSpinner from '../components/LoadingSpinner';
import WorkTypeManager from '../components/WorkTypeManager';
import WorkTypeEditModal from '../components/WorkTypeEditModal';
import ImageDetailModal from '../components/ImageDetailModal';
import ScheduleDisplay from '../components/ScheduleDisplay';
import { useAuth } from '../contexts/AuthContext';
import { workTypeService } from '../utils/scheduleMatchingService';
import { Clock, Trash2, Eye, Maximize2, Building, Calendar, FileText, Users, Home } from 'lucide-react';

interface JobPostFormData {
  title: string;
  jobTitle: string; // 채용직무 필드 추가
  description: string;
  location: string;
  workPeriod: {
    startDate: string;
    endDate: string;
  };
  salary: {
    min: number;
    max: number;
    type: 'hourly' | 'daily' | 'monthly';
  };
  requirements: string[];
  benefits: string[];
  scheduleType: 'traditional' | 'flexible' | 'smart_matching';
  workTypes: WorkType[];
  workTimeType: '무관' | '근무타입 설정';
  images: File[];
  contactInfo: {
    email: string;
    phone: string;
  };
  accommodation: { provided: false, info: '' };
  meal: { provided: false, info: '' };
  employeeBenefits: string;
}

const JobPostForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWorkTypeManager, setShowWorkTypeManager] = useState(false);
  const [availableWorkTypes, setAvailableWorkTypes] = useState<WorkType[]>([]);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(false);
  const [isWorkTypeSelectionMode, setIsWorkTypeSelectionMode] = useState(false);
  const [selectedWorkTypeForDetail, setSelectedWorkTypeForDetail] = useState<WorkType | null>(null);
  const [showWorkTypeDetailModal, setShowWorkTypeDetailModal] = useState(false);
  const [selectedImageForDetail, setSelectedImageForDetail] = useState<File | null>(null);
  const [showImageDetailModal, setShowImageDetailModal] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  const [loadingAccommodationInfo, setLoadingAccommodationInfo] = useState(false);

  const [formData, setFormData] = useState<JobPostFormData>({
    title: '',
    jobTitle: '', // 채용직무 필드 추가
    description: '',
    location: '',
    workPeriod: {
      startDate: '',
      endDate: ''
    },
    salary: {
      min: 0,
      max: 0,
      type: 'hourly'
    },
    requirements: [''],
    benefits: [''],
    scheduleType: 'smart_matching',
    workTypes: [],
    workTimeType: '무관',
    images: [],
    contactInfo: {
      email: '',
      phone: ''
    },
    accommodation: { provided: false, info: '' },
    meal: { provided: false, info: '' },
    employeeBenefits: ''
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

  useEffect(() => {
    if (companyInfo || accommodationInfo) {
      loadExistingInfo();
    }
  }, [companyInfo, accommodationInfo]);

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

  const loadExistingInfo = () => {
    if (companyInfo) {
      // 회사정보를 폼에 자동으로 채우기
      setFormData(prev => ({
        ...prev,
        title: companyInfo.name ? `${companyInfo.name} 채용공고` : prev.title,
        location: companyInfo.address || companyInfo.region || prev.location,
        contactInfo: {
          email: companyInfo.contactEmail || prev.contactInfo.email,
          phone: companyInfo.contactPhone || prev.contactInfo.phone
        }
      }));
    }

    if (accommodationInfo) {
      // 기숙사정보를 폼에 자동으로 채우기
      setFormData(prev => ({
        ...prev,
        accommodation: {
          provided: accommodationInfo.isAvailable || false,
          info: accommodationInfo.description || accommodationInfo.name || ''
        }
      }));
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
    
    // 선택 모드 종료
    setIsWorkTypeSelectionMode(false);
    setShowWorkTypeManager(false);
  };

  const removeWorkType = (workTypeId: string) => {
    const updatedWorkTypes = formData.workTypes.filter(wt => wt.id !== workTypeId);
    handleInputChange('workTypes', updatedWorkTypes);
  };

  const handleWorkTypeClick = (workType: WorkType) => {
    setSelectedWorkTypeForDetail(workType);
    setShowWorkTypeDetailModal(true);
  };

  const handleImageClick = (image: File) => {
    setSelectedImageForDetail(image);
    setShowImageDetailModal(true);
  };

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
          location: data.location,
          workPeriod: data.workPeriod || { startDate: '', endDate: '' },
          salary: data.salary,
          requirements: data.requirements || [''],
          benefits: data.benefits || [''],
          scheduleType: data.scheduleType || 'traditional',
          workTypes: data.workTypes || [],
          workTimeType: data.workTimeType === '근무타입 설정' ? '근무타입 설정' : '무관',
          images: [],
          contactInfo: (data as any).contactInfo || { email: '', phone: '' },
          accommodation: (data as any).accommodation || { provided: false, info: '' },
          meal: (data as any).meal || { provided: false, info: '' },
          employeeBenefits: (data as any).employeeBenefits || ''
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
      [field]: value
    }));
  };

  const handleSalaryChange = (field: keyof typeof formData.salary, value: number) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field: 'requirements' | 'benefits', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'requirements' | 'benefits') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'benefits', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const uploadImages = async (images: File[]): Promise<string[]> => {
    const uploadPromises = images.map(async (image) => {
      const storageRef = ref(storage, `job-posts/${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(storageRef, image);
      return getDownloadURL(snapshot.ref);
    });
    
    return Promise.all(uploadPromises);
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
    
    if (!formData.location.trim()) {
      alert('근무 위치를 입력해주세요.');
      return;
    }
    
    setSaving(true);

    try {
      console.log('이미지 업로드 시작...');
      const imageUrls = await uploadImages(formData.images);
      console.log('이미지 업로드 완료:', imageUrls);
      
      const jobPostData = {
        title: formData.title.trim(),
        jobTitle: formData.jobTitle.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        workPeriod: formData.workPeriod,
        salary: formData.salary,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        scheduleType: formData.scheduleType,
        workTypes: formData.workTypes,
        workTimeType: formData.workTimeType,
        images: imageUrls,
        contactInfo: formData.contactInfo,
        accommodation: formData.accommodation,
        meal: formData.meal,
        employeeBenefits: formData.employeeBenefits,
        employerId: user?.uid, // 고용주 ID 추가
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      } as any;

      // 디버깅을 위한 로그
      console.log('저장할 구인공고 데이터:', jobPostData);
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

      alert(id ? '구인공고가 수정되었습니다.' : '구인공고가 등록되었습니다.');
      navigate('/dashboard');
    } catch (error) {
      console.error('구인공고 저장 실패:', error);
      alert('구인공고 저장에 실패했습니다. 다시 시도해주세요.');
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
                {id ? '구인공고 수정' : '새 구인공고 등록'}
              </h1>
              <p className="text-gray-600">
                {id ? '기존 구인공고를 수정합니다.' : '새로운 구인공고를 등록합니다.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 폼 제출 버튼 (숨김) */}
          <button type="submit" style={{ display: 'none' }} />
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                기본 정보
              </h2>
              <div className="flex items-center gap-2">
                {(companyInfo || accommodationInfo) && (
                  <button
                    type="button"
                    onClick={loadExistingInfo}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    기존 정보 불러오기
                  </button>
                )}
                {(loadingCompanyInfo || loadingAccommodationInfo) && (
                  <span className="text-sm text-gray-500">정보 로딩 중...</span>
                )}
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">근무 위치 *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울시 강남구"
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
                        startDate: e.target.value
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
                        endDate: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무타입</label>
                <select
                  value={formData.workTimeType}
                  onChange={(e) => handleInputChange('workTimeType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="무관">무관</option>
                  <option value="근무타입 설정">근무타입 설정</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">급여</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={formData.salary.min}
                    onChange={(e) => handleSalaryChange('min', Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최소"
                  />
                  <input
                    type="number"
                    value={formData.salary.max}
                    onChange={(e) => handleSalaryChange('max', Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최대"
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
            </div>
          </div>







          {/* 근무 Type 선택 */}
          {formData.workTimeType === '근무타입 설정' && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    근무 유형
                  </h2>
                  <p className="text-sm text-gray-500">근무타입 설정을 선택한 경우에만 표시됩니다. 근무 유형을 선택하세요</p>
                </div>
                <Link
                  to="/work-types"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  새 근무 type
                </Link>
              </div>

              {/* 선택된 근무 유형 표시 */}
              {formData.workTypes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-2">선택된 근무 유형이 없습니다</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkTypeSelectionMode(true);
                      setShowWorkTypeManager(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    근무 유형 선택하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      선택된 근무 유형 ({formData.workTypes.length}개)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWorkTypeSelectionMode(true);
                        setShowWorkTypeManager(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + 추가
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.workTypes.map((workType) => (
                      <div key={workType.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-blue-900">{workType.name}</div>
                            {workType.description && (
                              <div className="text-sm text-blue-700">{workType.description}</div>
                            )}
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeWorkType(workType.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="제거"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 요구사항 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              요구사항
            </h2>
            
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="요구사항을 입력하세요"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => addArrayItem('requirements')}
              className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              + 요구사항 추가
            </button>
          </div>

          {/* 복리후생 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              복리후생
            </h2>
            
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="복리후생을 입력하세요"
                />
                {formData.benefits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits', index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => addArrayItem('benefits')}
              className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              + 복리후생 추가
            </button>
          </div>

          {/* 숙식 제공 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              숙식 제공
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기숙사 제공 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="accommodation"
                    checked={formData.accommodation.provided}
                    onChange={(e) => handleInputChange('accommodation', {
                      ...formData.accommodation,
                      provided: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="accommodation" className="text-sm font-medium text-gray-700">
                    기숙사 제공
                  </label>
                </div>
                
                {formData.accommodation.provided && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기숙사 정보
                    </label>
                    <textarea
                      value={formData.accommodation.info}
                      onChange={(e) => handleInputChange('accommodation', {
                        ...formData.accommodation,
                        info: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="기숙사 위치, 시설, 비용 등을 입력하세요"
                    />
                  </div>
                )}
              </div>

              {/* 식사 제공 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="meal"
                    checked={formData.meal.provided}
                    onChange={(e) => handleInputChange('meal', {
                      ...formData.meal,
                      provided: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="meal" className="text-sm font-medium text-gray-700">
                    식사 제공
                  </label>
                </div>
                
                {formData.meal.provided && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      식사 정보
                    </label>
                    <textarea
                      value={formData.meal.info}
                      onChange={(e) => handleInputChange('meal', {
                        ...formData.meal,
                        info: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="식사 종류, 시간, 비용 등을 입력하세요"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 직원 혜택 */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직원 혜택
              </label>
              <textarea
                value={formData.employeeBenefits}
                onChange={(e) => handleInputChange('employeeBenefits', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="건강보험, 퇴직연금, 교육지원, 복리후생 등을 입력하세요"
              />
            </div>
          </div>

          {/* 연락처 정보 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">연락처 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo', {
                    ...formData.contactInfo,
                    email: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo', {
                    ...formData.contactInfo,
                    phone: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">이미지 업로드</h2>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group cursor-pointer" onClick={() => handleImageClick(image)}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-md flex items-center justify-center">
                      <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-6 h-6" />
                    </div>
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 폼 제출 버튼 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
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

        {/* 근무 유형 관리 모달 */}
        {showWorkTypeManager && (
          <WorkTypeManager
            employerId={user?.uid}
            onClose={() => {
              setShowWorkTypeManager(false);
              setIsWorkTypeSelectionMode(false);
              loadAvailableWorkTypes();
            }}
            onSelectWorkType={isWorkTypeSelectionMode ? selectWorkType : undefined}
            isSelectionMode={isWorkTypeSelectionMode}
            onWorkTypeCreated={(newWorkType) => {
              // 새 근무 타입이 생성되면 자동으로 선택
              if (isWorkTypeSelectionMode) {
                selectWorkType(newWorkType);
              }
              // 성공 메시지 표시
              alert(`새 근무 타입 "${newWorkType.name}"이(가) 생성되었습니다!`);
            }}
          />
        )}


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

        {/* 이미지 상세 정보 모달 */}
        <ImageDetailModal
          image={selectedImageForDetail}
          isOpen={showImageDetailModal}
          onClose={() => {
            setShowImageDetailModal(false);
            setSelectedImageForDetail(null);
          }}
        />
      </div>
    </div>
  );
};

export default JobPostForm; 