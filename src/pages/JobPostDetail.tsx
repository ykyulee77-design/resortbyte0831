import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadImage, deleteImage, validateImageFile } from '../utils/imageUpload';
import { useAuth } from '../contexts/AuthContext';
import { Building, FileText, Home, Users, MessageSquare, MapPin, Edit, Save, X, List, Settings, Send, CheckCircle, Star, Share2 } from 'lucide-react';
import { JobPost, Application, CompanyInfo, AccommodationInfo, WorkType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

import ImagePreviewModal from '../components/ImagePreviewModal';

const JobPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditMode = searchParams.get('edit') === 'true';

  // 상태 관리
  const [job, setJob] = useState<JobPost | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditMode);

  
  // 지원 관련 상태
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [applyMessage, setApplyMessage] = useState('');
  
  // 관심공고 관련 상태
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  
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
      phone: '',
    },
    workSchedule: { days: [], hours: '' },
    startDate: undefined,
    endDate: undefined,
  });

  // 회사 이미지 관리 상태
  const [companyImages, setCompanyImages] = useState<string[]>([]);
  const [uploadingCompanyImages, setUploadingCompanyImages] = useState(false);
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 지원 여부 확인
  const checkApplicationStatus = useCallback(async () => {
    if (!user?.uid || !id) return;
    
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('jobPostId', '==', id),
        where('jobseekerId', '==', user.uid),
      );
      const querySnapshot = await getDocs(applicationsQuery);
      setHasApplied(!querySnapshot.empty);
    } catch (error) {
      console.error('지원 상태 확인 실패:', error);
    }
  }, [user?.uid, id]);

  // 관심공고 상태 확인
  const checkFavoriteStatus = useCallback(async () => {
    if (!user?.uid || !id) return;
    
    try {
      const favoritesQuery = query(
        collection(db, 'favoriteJobs'),
        where('jobseekerId', '==', user.uid),
        where('jobPostId', '==', id),
      );
      const querySnapshot = await getDocs(favoritesQuery);
      
      if (!querySnapshot.empty) {
        setIsFavorite(true);
        setFavoriteId(querySnapshot.docs[0].id);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('관심공고 상태 확인 실패:', error);
    }
  }, [user?.uid, id]);

  // 관심공고 토글
  const handleToggleFavorite = async () => {
    if (!user?.uid || !job) return;
    
    try {
      if (isFavorite && favoriteId) {
        // 관심공고 제거
        await deleteDoc(doc(db, 'favoriteJobs', favoriteId));
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // 관심공고 추가
        const favoriteData = {
          jobseekerId: user.uid,
          jobPostId: id,
          jobTitle: job.title || '제목 없음',
          employerName: job.employerName || job.workplaceName || '회사명 없음',
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'favoriteJobs'), favoriteData);
        setIsFavorite(true);
        setFavoriteId(docRef.id);
      }
    } catch (error) {
      console.error('관심공고 토글 실패:', error);
    }
  };

  // 공고 공유
  const handleJobShare = async () => {
    if (!job) return;
    
    const shareText = `🏖️ 리조트 일자리 추천!\n\n${job.title}\n${job.employerName}\n${job.location}\n${job.salary ? `${job.salary.min.toLocaleString()}원 ~ ${job.salary.max.toLocaleString()}원` : '급여 협의'}\n\n자세히 보기: ${window.location.href}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('공고 정보가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  // 근무 타입 선택 토글
  const toggleWorkType = (workTypeId: string) => {
    setSelectedWorkTypes(prev => 
      prev.includes(workTypeId) 
        ? prev.filter(id => id !== workTypeId)
        : [...prev, workTypeId],
    );
  };

  // 회사 이미지 업로드
  const handleCompanyImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploadingCompanyImages(true);
    try {
      const fileArray = Array.from(files);
      
      // 파일 검증
      for (const file of fileArray) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }
      }
      
      // 이미지 업로드
      const results = await Promise.all(
        fileArray.map(file => 
          uploadImage(file, {
            folder: 'company-images',
            metadata: {
              uploadedBy: user?.uid,
              uploadType: 'company-image',
            },
          }),
        ),
      );
      
      // 성공한 업로드만 추가
      const newImageUrls = results
        .filter(result => result.success)
        .map(result => result.url!)
        .filter(Boolean);
      
      setCompanyImages(prev => [...prev, ...newImageUrls]);
      
      if (newImageUrls.length < fileArray.length) {
        alert('일부 이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('회사 이미지 업로드 실패:', error);
      alert('회사 이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingCompanyImages(false);
    }
  };

  // 회사 이미지 삭제
  const handleCompanyImageDelete = async (imageUrl: string, index: number) => {
    try {
      // 이미지 삭제
      const result = await deleteImage(imageUrl);
      
      if (result.success) {
        // 로컬 상태에서 이미지 제거
        setCompanyImages(prev => prev.filter((_, i) => i !== index));
      } else {
        alert('이미지 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('회사 이미지 삭제 실패:', error);
      alert('회사 이미지 삭제에 실패했습니다.');
    }
  };

  // 모든 모달 닫기
  const closeAllModals = () => {
    setShowApplyModal(false);
    setPreviewImage(null);
    setPreviewImageName('');
    
    // body 스타일 강제 초기화
    document.body.style.overflow = 'unset';
    document.body.style.pointerEvents = 'auto';
    
    // 모든 모달 관련 요소 제거
    setTimeout(() => {
      const modalElements = document.querySelectorAll('.fixed.bg-black, .fixed.bg-opacity');
      modalElements.forEach(el => {
        if (el !== document.querySelector('.fixed.top-4.right-4')) {
          el.remove();
        }
      });
    }, 100);
  };

  // 페이지 로드 시 모든 모달 초기화
  useEffect(() => {
    closeAllModals();
    // 강제로 previewImage 초기화
    setPreviewImage(null);
    setPreviewImageName('');
  }, []);

  // 이미지 미리보기
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    console.log('이미지 미리보기 호출:', imageUrl, imageName);
    // 다른 모달들만 닫기 (previewImage는 제외)
    setShowApplyModal(false);
    
    // body 스타일 강제 초기화
    document.body.style.overflow = 'unset';
    document.body.style.pointerEvents = 'auto';
    
    // 유효한 이미지 URL인지 확인
    if (imageUrl && imageUrl.trim() !== '') {
      setPreviewImage(imageUrl);
      setPreviewImageName(imageName || '이미지');
    }
  };

  // 지원하기
  const handleApply = async () => {
    if (!user?.uid || !job) return;
    
    // 근무 타입이 있는데 선택하지 않은 경우
    if (job.workTypes && job.workTypes.length > 0 && selectedWorkTypes.length === 0) {
      alert('근무 타입을 하나 이상 선택해주세요.');
      return;
    }
    
    setApplying(true);
    try {
      const applicationData = {
        jobPostId: job.id,
        jobseekerId: user.uid,
        jobseekerName: user.displayName || '이름 없음',
        employerId: job.employerId, // 구인자 ID 추가
        status: 'pending',
        appliedAt: serverTimestamp(),
        message: applyMessage,
        resume: user.resume || {},
        selectedWorkTypeIds: selectedWorkTypes,
      };
      
      await addDoc(collection(db, 'applications'), applicationData);
      setHasApplied(true);
      setShowApplyModal(false);
      setSelectedWorkTypes([]);
      setApplyMessage('');
      alert('지원이 완료되었습니다!');
    } catch (error) {
      console.error('지원 실패:', error);
      alert('지원 중 오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

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
        
        // 회사 이미지 로드
        if (companyData.images && companyData.images.length > 0) {
          setCompanyImages(companyData.images);
        }
      } else {
        // 쿼리로 조회 시도
        const companyQuery = query(
          collection(db, 'companyInfo'),
          where('employerId', '==', employerId),
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
          where('employerId', '==', employerId),
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
        where('employerId', '==', employerId),
      );
      const workTypesSnapshot = await getDocs(workTypesQuery);
      
      if (!workTypesSnapshot.empty) {
        const workTypesData = workTypesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as WorkType[];
        
        // job 상태 업데이트하여 workTypes 추가 (기존 데이터 유지)
        setJob(prevJob => prevJob ? {
          ...prevJob,
          workTypes: workTypesData,
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

  useEffect(() => {
    if (user?.uid && id) {
      checkApplicationStatus();
      checkFavoriteStatus();
    }
  }, [user?.uid, id, checkApplicationStatus, checkFavoriteStatus]);

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
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
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(db, 'jobPosts', job.id), updateData);
      
      // 회사 정보 이미지 업데이트
      if (companyInfo && companyImages.length !== companyInfo.images?.length) {
        await updateDoc(doc(db, 'companyInfo', companyInfo.id), {
          images: companyImages,
          updatedAt: serverTimestamp(),
        });
        
        // 회사 정보 다시 불러오기
        await loadCompanyInfo(job.employerId);
      }
      
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
                <div className="flex items-center gap-3">
                  {job.title}
                  {user?.role === 'jobseeker' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-lg transition-colors ${
                          isFavorite 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isFavorite ? '관심공고에서 제거' : '관심공고에 추가'}
                      >
                        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={handleJobShare}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="공고 공유하기"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
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
                  onClick={() => {
                    // 편집 모드로 전환할 때 기존 데이터를 editData에 복사
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

                        workTypes: job.workTypes || [],
                        employerId: job.employerId,
                      });
                    }
                    setIsEditing(true);
                  }}
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



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 콘텐츠 - 채용 섹션 */}
        <div className="lg:col-span-3 space-y-6">
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
                        min: Number(e.target.value), 
                      })}
                      placeholder="최소"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={editData.salary?.max || 0}
                      onChange={(e) => handleInputChange('salary', { 
                        ...editData.salary, 
                        max: Number(e.target.value), 
                      })}
                      placeholder="최대"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={editData.salary?.type || 'hourly'}
                      onChange={(e) => handleInputChange('salary', { 
                        ...editData.salary, 
                        type: e.target.value as 'hourly' | 'daily' | 'monthly', 
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
                      <p>스케줄: {workType.schedules?.length || 0}개</p>
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
                {isEditing ? (
                  <div className="space-y-3">
                    {editData.benefits?.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...(editData.benefits || [])];
                            newBenefits[index] = e.target.value;
                            handleInputChange('benefits', newBenefits);
                          }}
                          placeholder="복리후생을 입력하세요"
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBenefits = editData.benefits?.filter((_, i) => i !== index) || [];
                            handleInputChange('benefits', newBenefits);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newBenefits = [...(editData.benefits || []), ''];
                        handleInputChange('benefits', newBenefits);
                      }}
                      className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      + 복리후생 추가
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {job.benefits && job.benefits.length > 0 ? (
                      job.benefits.filter(benefit => benefit && benefit.trim() !== '').map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-gray-900">{benefit}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">등록된 복리후생이 없습니다.</p>
                    )}
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
                      email: e.target.value,
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
                      phone: e.target.value,
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
          {/* 지원 버튼 (구직자만) */}
          {user?.role === 'jobseeker' && job && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center">
                <Send className="h-4 w-4 mr-2 text-green-600" />
                지원하기
              </h2>
              
              {hasApplied ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-green-700 mb-1">이미 지원했습니다</h3>
                  <Link
                    to="/dashboard"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    지원 현황 보기
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-4 hidden">
                    <h3 className="font-semibold text-green-800 mb-2">지원 전 확인사항</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 이력서가 완성되어 있는지 확인해주세요</li>
                      <li>• 지원 후에는 취소할 수 없습니다</li>
                      <li>• 지원 현황은 대시보드에서 확인 가능합니다</li>
                    </ul>
                  </div>
                  
                  <Link
                    to={`/apply/${id}`}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                  >
                    <Send className="w-4 h-4" />
                    지원하기
                  </Link>
                  
                  <div className="text-center">
                    <Link
                      to="/profile"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      이력서 수정
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

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
                <div className="bg-yellow-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-yellow-700 mb-2">회사 이미지</h4>
                   
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* 기존 이미지 표시 및 삭제 */}
                      {companyImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {companyImages.map((image, index) => (
                            <div key={`edit-image-${index}`} className="relative aspect-square bg-white rounded overflow-hidden group">
                              <img
                                src={image}
                                alt={`회사 이미지 ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}
                              />
                              <button
                                onClick={() => handleCompanyImageDelete(image, index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                title="이미지 삭제"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                                   클릭하여 크게 보기
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                       
                      {/* 이미지 업로드 */}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => e.target.files && handleCompanyImageUpload(e.target.files)}
                          className="hidden"
                          id="company-image-upload"
                          disabled={uploadingCompanyImages}
                        />
                        <label
                          htmlFor="company-image-upload"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploadingCompanyImages ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                               업로드 중...
                            </>
                          ) : (
                            <>
                              <Edit className="w-4 h-4" />
                               이미지 추가
                            </>
                          )}
                        </label>
                        <span className="text-xs text-gray-500">
                           최대 4개까지 업로드 가능
                        </span>
                      </div>
                    </div>
                  ) : (
                  /* 보기 모드 */
                    companyImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {companyImages.slice(0, 4).map((image, index) => (
                          <div key={`view-image-${index}`} className="aspect-square bg-white rounded overflow-hidden group cursor-pointer">
                            <img
                              src={image}
                              alt={`회사 이미지 ${index + 1}`}
                              className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                              onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}
                            />
                            {/* 임시로 hover 효과 비활성화 */}
                            {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                               <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                                 클릭하여 크게 보기
                               </div>
                             </div> */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">등록된 이미지가 없습니다.</p>
                    )
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">회사 정보가 없습니다.</p>
            )}
          </div>

          {/* 기숙사 정보 */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center">
              <Home className="h-4 w-4 mr-2" />
              기숙사 정보
            </h2>
            {loadingAccommodationInfo ? (
              <div className="text-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">기숙사 정보 로딩 중...</p>
              </div>
            ) : accommodationInfo ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{accommodationInfo.name}</h3>
                  <p className="text-sm text-gray-600">
                    {accommodationInfo.type === 'dormitory' && '기숙사'}
                    {accommodationInfo.type === 'apartment' && '아파트'}
                    {accommodationInfo.type === 'house' && '단독주택'}
                    {accommodationInfo.type === 'other' && '기타'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">주소</h4>
                  <p className="text-sm text-gray-900">{accommodationInfo.address}</p>
                </div>

                {accommodationInfo.distanceFromWorkplace && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">직장까지 거리</h4>
                    <p className="text-sm text-gray-900">{accommodationInfo.distanceFromWorkplace}</p>
                  </div>
                )}
                
                {/* 객실 유형 및 요금 정보 */}
                {accommodationInfo.roomTypeOptions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">객실 유형</h4>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">
                        요금 유형: {accommodationInfo.paymentType === 'free' ? '무료' : '유료'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {accommodationInfo.roomTypeOptions.singleRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            1인실{accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.singleRoom ? ` (${accommodationInfo.roomPrices.singleRoom}천원)` : ''}
                          </span>
                        )}
                        {accommodationInfo.roomTypeOptions.doubleRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            2인실{accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.doubleRoom ? ` (${accommodationInfo.roomPrices.doubleRoom}천원)` : ''}
                          </span>
                        )}
                        {accommodationInfo.roomTypeOptions.tripleRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            3인실{accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.tripleRoom ? ` (${accommodationInfo.roomPrices.tripleRoom}천원)` : ''}
                          </span>
                        )}
                        {accommodationInfo.roomTypeOptions.quadRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            4인실{accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.quadRoom ? ` (${accommodationInfo.roomPrices.quadRoom}천원)` : ''}
                          </span>
                        )}
                        {accommodationInfo.roomTypeOptions.otherRoom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            기타{accommodationInfo.otherRoomType && ` (${accommodationInfo.otherRoomType})`}{accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.otherRoom ? ` - ${accommodationInfo.roomPrices.otherRoom}천원` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 객실 시설 */}
                {(accommodationInfo.wifi || accommodationInfo.tv || accommodationInfo.refrigerator || 
                  accommodationInfo.airConditioning || accommodationInfo.laundry || accommodationInfo.kitchen || 
                  accommodationInfo.parkingAvailable || accommodationInfo.petAllowed || accommodationInfo.smokingAllowed || 
                  accommodationInfo.otherFacilities) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">객실 시설</h4>
                    <div className="flex flex-wrap gap-1">
                      {accommodationInfo.wifi && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">와이파이</span>
                      )}
                      {accommodationInfo.tv && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">TV</span>
                      )}
                      {accommodationInfo.refrigerator && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">냉장고</span>
                      )}
                      {accommodationInfo.airConditioning && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">에어컨</span>
                      )}
                      {accommodationInfo.laundry && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">세탁기</span>
                      )}
                      {accommodationInfo.kitchen && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">주방</span>
                      )}
                      {accommodationInfo.parkingAvailable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">주차 가능</span>
                      )}
                      {accommodationInfo.petAllowed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">반려동물 허용</span>
                      )}
                      {accommodationInfo.smokingAllowed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">흡연 허용</span>
                      )}
                      {accommodationInfo.otherFacilities && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                     기타{accommodationInfo.otherFacilityText && ` (${accommodationInfo.otherFacilityText})`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 부대 시설 */}
                {accommodationInfo.facilityOptions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">부대 시설</h4>
                    <div className="flex flex-wrap gap-1">
                      {accommodationInfo.facilityOptions.parking && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">주차장</span>
                      )}
                      {accommodationInfo.facilityOptions.laundry && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">세탁실</span>
                      )}
                      {accommodationInfo.facilityOptions.kitchen && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">공용주방</span>
                      )}
                      {accommodationInfo.facilityOptions.gym && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">체육관</span>
                      )}
                      {accommodationInfo.facilityOptions.studyRoom && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">스터디룸</span>
                      )}
                      {accommodationInfo.facilityOptions.lounge && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">휴게실</span>
                      )}
                      {accommodationInfo.facilityOptions.wifi && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">와이파이</span>
                      )}
                      {accommodationInfo.facilityOptions.security && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">보안시설</span>
                      )}
                      {accommodationInfo.facilityOptions.elevator && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">엘리베이터</span>
                      )}
                      {accommodationInfo.facilityOptions.other && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          기타{accommodationInfo.otherFacilityText && ` (${accommodationInfo.otherFacilityText})`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 하위 호환성을 위한 기존 facilities 표시 */}
                {(accommodationInfo.facilities && accommodationInfo.facilities.length > 0 && !accommodationInfo.facilityOptions) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">시설</h4>
                    <div className="flex flex-wrap gap-1">
                      {accommodationInfo.facilities.filter(facility => facility && facility.trim() !== '').slice(0, 5).map((facility, index) => (
                        <span key={`acc-facility-${index}-${facility}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {accommodationInfo.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">기타</h4>
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

      {/* 지원 확인 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">지원하기</h3>
            </div>
            
            <div className="space-y-6">
              {/* 지원 정보 요약 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">지원 정보</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• 지원자: {user?.displayName}</div>
                  <div>• 공고: {job?.title}</div>
                  <div>• 회사: {job?.workplaceName}</div>
                  <div>• 위치: {job?.location}</div>
                </div>
              </div>

              {/* 근무 타입 선택 */}
              {job?.workTypes && job.workTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">근무 타입 선택 *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {job.workTypes.map((workType) => (
                      <div
                        key={workType.id}
                        onClick={() => toggleWorkType(workType.id)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedWorkTypes.includes(workType.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{workType.name}</h5>
                            <p className="text-sm text-gray-600">{workType.description}</p>
                          </div>
                          {selectedWorkTypes.includes(workType.id) && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedWorkTypes.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">근무 타입을 하나 이상 선택해주세요.</p>
                  )}
                </div>
              )}

              {/* 추가 메시지 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">추가 메시지 (선택사항)</h4>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="지원 동기나 특별히 전달하고 싶은 내용이 있다면 작성해주세요..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* 지원 전 확인사항 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">지원 전 확인사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 이력서가 완성되어 있는지 확인해주세요</li>
                  <li>• 지원 후에는 취소할 수 없습니다</li>
                  <li>• 지원 현황은 대시보드에서 확인 가능합니다</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApply}
                disabled={applying || (job?.workTypes && job.workTypes.length > 0 && selectedWorkTypes.length === 0)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    지원 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    지원하기
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedWorkTypes([]);
                  setApplyMessage('');
                }}
                disabled={applying}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지원 확인 모달 - 임시 비활성화 */}



      {/* 이미지 미리보기 모달 */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        imageName={previewImageName}
      />
    </div>
  );
};

export default JobPostDetail; 


