import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Building, Calendar, Clock, FileText, Home, Users, MessageSquare, User, MapPin, Edit, Save, X, List, Settings } from 'lucide-react';
import { JobPost, Application, CompanyInfo, AccommodationInfo, WorkType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import WorkTypeManager from '../components/WorkTypeManager';
import ScheduleBadge from '../components/ScheduleBadge';

const JobPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isEditMode = searchParams.get('edit') === 'true';

  // 상태 관리
  const [job, setJob] = useState<JobPost | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [showWorkTypeManager, setShowWorkTypeManager] = useState(false);
  const [isWorkTypeSelectionMode, setIsWorkTypeSelectionMode] = useState(false);
  
  // 회사 및 기숙사 정보
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<AccommodationInfo | null>(null);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  const [loadingAccommodationInfo, setLoadingAccommodationInfo] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // 편집 데이터
  const [editData, setEditData] = useState<Partial<JobPost>>({
    title: '',
     jobTitle: '',
    description: '',
    location: '',
    workplaceName: '',
    salary: { min: 0, max: 0, type: 'hourly' },
    requirements: [''],
    benefits: [''],
    workTimeType: '무관',
    memo: '',
    contactInfo: {
      email: '',
      phone: ''
    },
    workSchedule: { days: [], hours: '' },
    startDate: undefined,
    endDate: undefined,
    accommodation: {
      provided: false,
      info: ''
    },
     meal: { provided: false, info: '' },
     employeeBenefits: '',
  });

  // 공고 정보 불러오기
  const fetchJob = useCallback(async () => {
      if (!id) return;
      setLoading(true);
      try {
      const jobDoc = await getDoc(doc(db, 'jobPosts', id));
      if (jobDoc.exists()) {
        const jobData = jobDoc.data() as JobPost;
        const jobWithId = { ...jobData, id: jobDoc.id };
        
        setJob(jobWithId);
        
        // 편집 모드일 때 편집 데이터 초기화
        if (isEditMode) {
        setEditData({
            title: jobWithId.title || '',
            jobTitle: jobWithId.jobTitle || '',
            description: jobWithId.description || '',
            location: jobWithId.location || '',
            workplaceName: jobWithId.workplaceName || '',
            salary: jobWithId.salary || { min: 0, max: 0, type: 'hourly' },
            requirements: jobWithId.requirements || [''],
            benefits: jobWithId.benefits || [''],
            workTimeType: jobWithId.workTimeType || '무관',
            memo: jobWithId.memo || '',
            contactInfo: jobWithId.contactInfo || { email: '', phone: '' },
            workSchedule: jobWithId.workSchedule || { days: [], hours: '' },
            startDate: jobWithId.startDate,
            endDate: jobWithId.endDate,
            accommodation: jobWithId.accommodation || { provided: false, info: '' },
            meal: (() => {
              if (typeof jobWithId.meal === 'object' && jobWithId.meal && 'provided' in jobWithId.meal && 'info' in jobWithId.meal) {
                return jobWithId.meal as { provided: boolean; info: string };
              }
              return { provided: false, info: '' };
            })(),
            employeeBenefits: jobWithId.employeeBenefits || '',
          });
        }

        // 회사 정보 자동 로딩
        if (jobWithId.employerId && !autoFilled) {
          await loadCompanyInfo(jobWithId.employerId);
          await loadAccommodationInfo(jobWithId.employerId);
          
          // workTypes가 없거나 비어있을 때만 별도로 로드
          if (!jobWithId.workTypes || jobWithId.workTypes.length === 0) {
            await loadWorkTypes(jobWithId.employerId);
          }
          setAutoFilled(true);
        }
        }
      } catch (error) {
      console.error('공고 정보 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
  }, [id, isEditMode, autoFilled]);

  // 회사 정보 로딩
  const loadCompanyInfo = async (employerId: string) => {
    setLoadingCompanyInfo(true);
    try {
      // 먼저 문서 ID로 직접 조회 시도
      const companyDocRef = doc(db, 'companyInfo', employerId);
      const companyDocSnap = await getDoc(companyDocRef);
      
      if (companyDocSnap.exists()) {
        const companyData = companyDocSnap.data() as CompanyInfo;
        setCompanyInfo({ ...companyData, id: companyDocSnap.id });
      } else {
        // 쿼리로 조회 시도
        const companyQuery = query(
          collection(db, 'companyInfo'),
          where('employerId', '==', employerId)
        );
        const companySnapshot = await getDocs(companyQuery);
        
        if (!companySnapshot.empty) {
          const companyData = companySnapshot.docs[0].data() as CompanyInfo;
          setCompanyInfo({ ...companyData, id: companySnapshot.docs[0].id });
        }
      }
    } catch (error) {
      console.error('회사 정보 로딩 실패:', error);
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  // 기숙사 정보 로딩
  const loadAccommodationInfo = async (employerId: string) => {
    setLoadingAccommodationInfo(true);
    try {
      // 먼저 문서 ID로 직접 조회 시도
      const accommodationDocRef = doc(db, 'accommodationInfo', employerId);
      const accommodationDocSnap = await getDoc(accommodationDocRef);
      
      if (accommodationDocSnap.exists()) {
        const accommodationData = accommodationDocSnap.data() as AccommodationInfo;
        setAccommodationInfo({ ...accommodationData, id: accommodationDocSnap.id });
        } else {
        // 쿼리로 조회 시도
        const accommodationQuery = query(
          collection(db, 'accommodationInfo'),
          where('employerId', '==', employerId)
        );
        const accommodationSnapshot = await getDocs(accommodationQuery);
        
        if (!accommodationSnapshot.empty) {
          const accommodationData = accommodationSnapshot.docs[0].data() as AccommodationInfo;
          setAccommodationInfo({ ...accommodationData, id: accommodationSnapshot.docs[0].id });
        }
      }
    } catch (error) {
      console.error('기숙사 정보 로딩 실패:', error);
    } finally {
      setLoadingAccommodationInfo(false);
    }
  };

  // 근무 유형 로딩
  const loadWorkTypes = async (employerId: string) => {
    try {
      const workTypesQuery = query(
        collection(db, 'workTypes'),
        where('employerId', '==', employerId)
      );
      const workTypesSnapshot = await getDocs(workTypesQuery);
      
      if (!workTypesSnapshot.empty) {
        const workTypesData = workTypesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WorkType[];
        
        // job 상태 업데이트하여 workTypes 추가 (기존 데이터 유지)
        setJob(prevJob => prevJob ? {
          ...prevJob,
          workTypes: workTypesData
        } : null);
        
        console.log('근무 유형 로드됨:', workTypesData.length, '개');
      } else {
        console.log('해당 employerId의 근무 유형이 없습니다');
      }
    } catch (error) {
      console.error('근무 유형 로딩 실패:', error);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!job || !user) return;
    
    setSaving(true);
    try {
      // undefined 값들을 제거하여 Firebase 오류 방지
      const cleanEditData = { ...editData };
      
      // undefined 값들을 제거
      Object.keys(cleanEditData).forEach(key => {
        if (cleanEditData[key as keyof typeof cleanEditData] === undefined) {
          delete cleanEditData[key as keyof typeof cleanEditData];
        }
      });
      
      const updateData = {
        ...cleanEditData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'jobPosts', job.id), updateData);
      setIsEditing(false);
      
      // 업데이트된 정보 다시 불러오기
      await fetchJob();
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (job) {
      setEditData({
        title: job.title || '',
        jobTitle: job.jobTitle || '',
        description: job.description || '',
        location: job.location || '',
        workplaceName: job.workplaceName || '',
        salary: job.salary || { min: 0, max: 0, type: 'hourly' },
        requirements: job.requirements || [''],
        benefits: job.benefits || [''],
        workTimeType: job.workTimeType || '무관',
        memo: job.memo || '',
        contactInfo: job.contactInfo || { email: '', phone: '' },
        workSchedule: job.workSchedule || { days: [], hours: '' },
        startDate: job.startDate,
        endDate: job.endDate,
        accommodation: job.accommodation || { provided: false, info: '' },
        meal: (() => {
          if (typeof job.meal === 'object' && job.meal && 'provided' in job.meal && 'info' in job.meal) {
            return job.meal as { provided: boolean; info: string };
          }
          return { provided: false, info: '' };
        })(),
        employeeBenefits: job.employeeBenefits || '',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!job) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">공고를 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 공고가 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                job.title
              )}
            </h1>
            <p className="text-gray-600">
              {job.employerId === user?.uid ? '내가 등록한 공고' : '채용 공고'}
            </p>
          </div>
          
          {job.employerId === user?.uid && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
              <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 - 채용 섹션 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 채용 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              채용 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직무명</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{job.jobTitle}</p>
                )}
                </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{job.description}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무지</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{job.location}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">급여</label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={editData.salary?.min || 0}
                      onChange={(e) => handleInputChange('salary', { 
                        ...editData.salary, 
                        min: Number(e.target.value) 
                      })}
                      placeholder="최소"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={editData.salary?.max || 0}
                      onChange={(e) => handleInputChange('salary', { 
                        ...editData.salary, 
                        max: Number(e.target.value) 
                      })}
                      placeholder="최대"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={editData.salary?.type || 'hourly'}
                      onChange={(e) => handleInputChange('salary', { 
                        ...editData.salary, 
                        type: e.target.value as 'hourly' | 'daily' | 'monthly' 
                      })}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">시급</option>
                      <option value="daily">일급</option>
                      <option value="monthly">월급</option>
                    </select>
                </div>
                ) : (
                  <p className="text-gray-900">
                    {job.salary ? 
                      `${job.salary.min.toLocaleString()}원 ~ ${job.salary.max.toLocaleString()}원 (${job.salary.type === 'hourly' ? '시급' : job.salary.type === 'daily' ? '일급' : '월급'})` : 
                      '급여 정보 없음'
                    }
                  </p>
                    )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무 시간 유형</label>
                {isEditing ? (
                  <select
                    value={editData.workTimeType}
                    onChange={(e) => handleInputChange('workTimeType', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="무관">무관</option>
                    <option value="근무type 설정">근무type 설정</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{job.workTimeType}</p>
                )}
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">근무 기간</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    {isEditing ? (
                                                 <input
                           type="date"
                        value={editData.startDate ? (editData.startDate instanceof Date ? editData.startDate.toISOString().split('T')[0] : editData.startDate.toDate().toISOString().split('T')[0]) : ''}
                        onChange={(e) => handleInputChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {job.startDate ? 
                          (job.startDate instanceof Date ? 
                            job.startDate.toLocaleDateString('ko-KR') : 
                            (job.startDate && typeof job.startDate.toDate === 'function' ? 
                              job.startDate.toDate().toLocaleDateString('ko-KR') : 
                              '날짜 없음')) : 
                          '날짜 없음'}
                      </p>
                    )}
                      </div>
                      <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    {isEditing ? (
                                                 <input
                           type="date"
                        value={editData.endDate ? (editData.endDate instanceof Date ? editData.endDate.toISOString().split('T')[0] : editData.endDate.toDate().toISOString().split('T')[0]) : ''}
                        onChange={(e) => handleInputChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {job.endDate ? 
                          (job.endDate instanceof Date ? 
                            job.endDate.toLocaleDateString('ko-KR') : 
                            (job.endDate && typeof job.endDate.toDate === 'function' ? 
                              job.endDate.toDate().toLocaleDateString('ko-KR') : 
                              '날짜 없음')) : 
                          '날짜 없음'}
                      </p>
                    )}
                      </div>
                    </div>
              </div>
            </div>
          </div>

          {/* 근무 일정 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              근무 일정
            </h2>
            <div className="space-y-4">
                      <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무 요일</label>
                {isEditing ? (
                  <div className="grid grid-cols-7 gap-2">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                      <label key={day} className="flex items-center justify-center p-2 border border-gray-300 rounded-lg">
                        <input
                          type="checkbox"
                          checked={editData.workSchedule?.days?.includes(day) || false}
                          onChange={(e) => {
                                const currentDays = editData.workSchedule?.days || [];
                            const newDays = e.target.checked
                              ? [...currentDays, day]
                              : currentDays.filter(d => d !== day);
                                handleInputChange('workSchedule', { 
                                  ...editData.workSchedule, 
                                  days: newDays 
                                });
                              }}
                          className="mr-1"
                        />
                              {day}
                      </label>
                          ))}
                        </div>
                ) : (
                  <p className="text-gray-900">
                    {job.workSchedule?.days && job.workSchedule.days.length > 0 
                      ? job.workSchedule.days.join(', ') 
                      : '근무 요일 미정'}
                  </p>
                )}
                  </div>

                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무 시간</label>
                {isEditing ? (
                      <input
                        type="text"
                          value={editData.workSchedule?.hours || ''}
                          onChange={(e) => handleInputChange('workSchedule', { 
                            ...editData.workSchedule, 
                            hours: e.target.value 
                          })}
                        placeholder="예: 09:00-18:00"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{job.workSchedule?.hours || '근무 시간 미정'}</p>
                         )}
                       </div>
                    </div>
                  </div>

          {/* 근무 유형 */}
          {job.workTypes && job.workTypes.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                근무 유형
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.workTypes.map((workType) => (
                  <div key={workType.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{workType.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>시급: {workType.hourlyWage?.toLocaleString()}원</p>
                      <p>스케줄: {workType.schedules.length}개</p>
                  </div>
              </div>
                ))}
              </div>
          </div>
          )}

          {/* 요구사항 */}
            <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <List className="h-5 w-5 mr-2" />
              요구사항
              </h2>
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  {(editData.requirements || []).filter(req => req && req.trim() !== '').map((req, index) => (
                    <div key={`edit-req-${index}-${req}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => {
                          const newRequirements = [...(editData.requirements || [])];
                          newRequirements[index] = e.target.value;
                          handleInputChange('requirements', newRequirements);
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="요구사항을 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newRequirements = (editData.requirements || []).filter((_, i) => i !== index);
                          handleInputChange('requirements', newRequirements);
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        삭제
                          </button>
                          </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('requirements', [...(editData.requirements || []), '']);
                    }}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
                  >
                    + 요구사항 추가
                  </button>
                                        </div>
              ) : (
                <div className="space-y-2">
                  {(job.requirements || []).filter(req => req && req.trim() !== '').length > 0 ? (
                    (job.requirements || []).filter(req => req && req.trim() !== '').map((req, index) => (
                      <p key={`req-${index}-${req}`} className="text-gray-900">• {req}</p>
                    ))
                  ) : (
                    <p className="text-gray-500">요구사항 없음</p>
                  )}
                    </div>
                  )}
                </div>
            </div>

          {/* 복리후생 */}
            <div className="bg-white rounded-lg border p-6">
             <h2 className="text-xl font-semibold mb-4 flex items-center">
               <Home className="h-5 w-5 mr-2" />
              복리후생
             </h2>
            <div className="space-y-4">
                     <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기숙사 제공</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.accommodation?.provided || false}
                         onChange={(e) => handleInputChange('accommodation', { 
                           ...editData.accommodation, 
                          provided: e.target.checked
                        })}
                        className="mr-2"
                      />
                      기숙사 제공
                    </label>
                     {editData.accommodation?.provided && (
                         <textarea
                        value={editData.accommodation.info}
                           onChange={(e) => handleInputChange('accommodation', { 
                             ...editData.accommodation, 
                             info: e.target.value 
                           })}
                        placeholder="기숙사 정보를 입력하세요"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           rows={3}
                         />
                     )}
                    </div>
              ) : (
                  <div>
                    <p className="text-gray-900">{job.accommodation?.provided ? '제공' : '미제공'}</p>
                    {job.accommodation?.provided && job.accommodation.info && (
                      <p className="text-gray-600 mt-1">{job.accommodation.info}</p>
                       )}
                   </div>
              )}
            </div>

                     <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">식사 제공</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.meal?.provided || false}
                         onChange={(e) => handleInputChange('meal', { 
                           ...editData.meal, 
                          provided: e.target.checked
                        })}
                        className="mr-2"
                      />
                      식사 제공
                    </label>
                     {editData.meal?.provided && (
                         <textarea
                        value={editData.meal.info}
                           onChange={(e) => handleInputChange('meal', { 
                             ...editData.meal, 
                             info: e.target.value 
                           })}
                        placeholder="식사 정보를 입력하세요"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           rows={3}
                         />
                     )}
                   </div>
                 ) : (
                  <div>
                    <p className="text-gray-900">
                      {typeof job.meal === 'object' && 'provided' in job.meal && job.meal.provided
                        ? job.meal.info
                        : (typeof job.meal === 'string' ? job.meal : '미제공')}
                    </p>
                         </div>
                       )}
                   </div>
               </div>
             </div>

          {/* 메모 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              메모
            </h2>
            <div className="space-y-4">
                    <div>
                {isEditing ? (
                      <textarea
                    value={editData.memo}
                    onChange={(e) => handleInputChange('memo', e.target.value)}
                        rows={4}
                    placeholder="추가 메모를 입력하세요"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{job.memo || '메모 없음'}</p>
                    )}
                  </div>
                     </div>
                   </div>

          {/* 연락처 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              연락처 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            {isEditing ? (
                  <input
                    type="email"
                    value={editData.contactInfo?.email}
                    onChange={(e) => handleInputChange('contactInfo', {
                      ...editData.contactInfo,
                      email: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
                  <p className="text-gray-900">{job.contactInfo?.email || '없음'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.contactInfo?.phone}
                    onChange={(e) => handleInputChange('contactInfo', {
                      ...editData.contactInfo,
                      phone: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{job.contactInfo?.phone || '없음'}</p>
                )}
              </div>
            </div>
            </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 회사 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              회사 정보
            </h2>
            {loadingCompanyInfo ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">회사 정보 로딩 중...</p>
              </div>
                         ) : companyInfo ? (
               <div className="space-y-4">
                 {/* 기본 정보 */}
                 <div className="bg-gray-50 rounded-lg p-3">
                   <h3 className="font-semibold text-gray-900 mb-2">{companyInfo.name}</h3>
                   <div className="grid grid-cols-1 gap-2 text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-600">업종:</span>
                       <span className="font-medium text-gray-900">{companyInfo.industry || '미등록'}</span>
              </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">규모:</span>
                       <span className="font-medium text-gray-900">{companyInfo.companySize || '미등록'}</span>
            </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">설립년도:</span>
                       <span className="font-medium text-gray-900">{companyInfo.foundedYear ? `${companyInfo.foundedYear}년` : '미등록'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">지역:</span>
                       <span className="font-medium text-gray-900">{companyInfo.region || '미등록'}</span>
                     </div>
        </div>
      </div>

                 {/* 연락처 */}
                 <div className="bg-blue-50 rounded-lg p-3">
                   <h4 className="text-sm font-semibold text-blue-700 mb-2">연락처</h4>
                   <div className="space-y-1 text-sm">
                     <div className="flex justify-between">
                       <span className="text-blue-600">담당자:</span>
                       <span className="font-medium text-blue-900">{companyInfo.contactPerson || '미등록'}</span>
              </div>
                     <div className="flex justify-between">
                       <span className="text-blue-600">이메일:</span>
                       <span className="font-medium text-blue-900">{companyInfo.contactEmail || '미등록'}</span>
                        </div>
                     <div className="flex justify-between">
                       <span className="text-blue-600">전화번호:</span>
                       <span className="font-medium text-blue-900">{companyInfo.contactPhone || '미등록'}</span>
                        </div>
                     {companyInfo.website && (
                       <div className="flex justify-between">
                         <span className="text-blue-600">웹사이트:</span>
                         <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-900 hover:underline">
                           {companyInfo.website}
                         </a>
                      </div>
                     )}
                  </div>
                  </div>

                 {/* 주소 */}
                 <div className="bg-green-50 rounded-lg p-3">
                   <h4 className="text-sm font-semibold text-green-700 mb-2">주소</h4>
                   <p className="text-sm font-medium text-green-900">{companyInfo.address || '미등록'}</p>
                           </div>

                 {/* 회사 소개 */}
                 {companyInfo.description && (
                   <div className="bg-purple-50 rounded-lg p-3">
                     <h4 className="text-sm font-semibold text-purple-700 mb-2">회사 소개</h4>
                     <p className="text-sm text-purple-900 leading-relaxed">{companyInfo.description}</p>
                         </div>
                 )}

                 {/* 회사 문화 */}
                 {companyInfo.culture && (
                   <div className="bg-orange-50 rounded-lg p-3">
                     <h4 className="text-sm font-semibold text-orange-700 mb-2">회사 문화</h4>
                     <p className="text-sm text-orange-900 leading-relaxed">{companyInfo.culture}</p>
                   </div>
                 )}

                 {/* 복리후생 */}
                 {companyInfo.benefits && companyInfo.benefits.length > 0 && (
                   <div className="bg-indigo-50 rounded-lg p-3">
                     <h4 className="text-sm font-semibold text-indigo-700 mb-2">복리후생</h4>
                     <div className="flex flex-wrap gap-1">
                       {companyInfo.benefits.filter(benefit => benefit && benefit.trim() !== '').map((benefit, index) => (
                         <span key={`benefit-${index}-${benefit}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 font-medium">
                           {benefit}
                         </span>
                       ))}
                            </div>
                               </div>
                 )}

                 {/* 근무 환경 */}
                 {(companyInfo.environment || companyInfo.workTimeType || companyInfo.salaryRange) && (
                   <div className="bg-teal-50 rounded-lg p-3">
                     <h4 className="text-sm font-semibold text-teal-700 mb-2">근무 환경</h4>
                     <div className="space-y-1 text-sm">
                       {companyInfo.environment && (
                         <div className="flex justify-between">
                           <span className="text-teal-600">환경:</span>
                           <span className="font-medium text-teal-900">{companyInfo.environment}</span>
                            </div>
                       )}
                       {companyInfo.workTimeType && (
                         <div className="flex justify-between">
                           <span className="text-teal-600">근무타입:</span>
                           <span className="font-medium text-teal-900">{companyInfo.workTimeType}</span>
                          </div>
                       )}
                       {companyInfo.salaryRange && (
                         <div className="flex justify-between">
                           <span className="text-teal-600">급여:</span>
                           <span className="font-medium text-teal-900">{companyInfo.salaryRange}</span>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                 {/* 기숙사 정보 */}
                 {companyInfo.dormitory && (
                   <div className="bg-pink-50 rounded-lg p-3">
                     <h4 className="text-sm font-semibold text-pink-700 mb-2">기숙사 정보</h4>
                     <div className="space-y-1 text-sm">
                       <div className="flex justify-between">
                         <span className="text-pink-600">기숙사 제공:</span>
                         <span className="font-medium text-pink-900">{companyInfo.dormitory ? '제공' : '미제공'}</span>
                       </div>
                       {companyInfo.dormitoryFacilities && companyInfo.dormitoryFacilities.length > 0 && (
                         <div>
                           <span className="text-pink-600">시설:</span>
                           <div className="flex flex-wrap gap-1 mt-1">
                             {companyInfo.dormitoryFacilities.filter(facility => facility && facility.trim() !== '').map((facility, index) => (
                               <span key={`facility-${index}-${facility}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-800">
                                 {facility}
                               </span>
                             ))}
                           </div>
                         </div>
                )}
          </div>
        </div>
      )}

                 {/* 회사 이미지 */}
                 {companyInfo.images && companyInfo.images.length > 0 && (
                   <div className="bg-yellow-50 rounded-lg p-3">
                     <h4 className="text-sm font-semibold text-yellow-700 mb-2">회사 이미지</h4>
                     <div className="grid grid-cols-2 gap-2">
                       {companyInfo.images.filter(image => image && image.trim() !== '').slice(0, 4).map((image, index) => (
                         <div key={`image-${index}-${image}`} className="aspect-square bg-white rounded overflow-hidden">
                           <img
                             src={image}
                             alt={`회사 이미지 ${index + 1}`}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            ) : (
              <p className="text-gray-500">회사 정보가 없습니다.</p>
            )}
          </div>

          {/* 기숙사 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              기숙사 정보
            </h2>
            {loadingAccommodationInfo ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">기숙사 정보 로딩 중...</p>
              </div>
            ) : accommodationInfo ? (
            <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{accommodationInfo.name}</h3>
                  <p className="text-sm text-gray-600">{accommodationInfo.type}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">주소</h4>
                  <p className="text-sm text-gray-900">{accommodationInfo.address}</p>
              </div>
              
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">월세</h4>
                  <p className="text-sm text-gray-900">{accommodationInfo.monthlyRent?.toLocaleString()}원</p>
              </div>
              
              <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">수용 인원</h4>
                  <p className="text-sm text-gray-900">{accommodationInfo.capacity}명</p>
                    </div>
                
                {(accommodationInfo.facilities || []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">시설</h4>
                    <div className="flex flex-wrap gap-1">
                      {(accommodationInfo.facilities || []).filter(facility => facility && facility.trim() !== '').slice(0, 3).map((facility, index) => (
                        <span key={`acc-facility-${index}-${facility}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {facility}
                        </span>
                      ))}
                    </div>
                      </div>
              )}
                
                {accommodationInfo.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">기숙사 소개</h4>
                    <p className="text-sm text-gray-900 line-clamp-3">{accommodationInfo.description}</p>
                  </div>
                )}
            </div>
            ) : (
              <p className="text-gray-500">기숙사 정보가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 근무 유형 관리 모달 */}
      {showWorkTypeManager && (
        <WorkTypeManager
           employerId={user?.uid || ''}
           onClose={() => setShowWorkTypeManager(false)}
           onSelectWorkType={isWorkTypeSelectionMode ? (workType: any) => {
             // 선택된 근무 유형 처리
            setShowWorkTypeManager(false);
           } : undefined}
          isSelectionMode={isWorkTypeSelectionMode}
        />
      )}
    </div>
  );
};

export default JobPostDetail; 


