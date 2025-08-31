import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadImage, deleteImage, validateImageFile } from '../utils/imageUpload';
import { useAuth } from '../contexts/AuthContext';
import { Building, FileText, Home, Users, MessageSquare, MapPin, Edit, Save, X, Settings, Send, CheckCircle, Star, Share2, Eye, Clock } from 'lucide-react';
import { JobPost, Application, CompanyInfo, AccommodationInfo, WorkType, TimeSlot } from '../types';
import { MapLocation } from '../types/naverMap';
import LoadingSpinner from '../components/LoadingSpinner';
import ApplicationPreview from '../components/ApplicationPreview';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';
import NaverMap from '../components/NaverMap';
import NaverMapScript from '../components/NaverMapScript';
import { searchAddress } from '../utils/geocoding';

import ImagePreviewModal from '../components/ImagePreviewModal';

const JobPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditMode = searchParams.get('mode') === 'edit';

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
  const [showResumeConfirmModal, setShowResumeConfirmModal] = useState(false);
  const [showApplicationPreview, setShowApplicationPreview] = useState(false);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [applyMessage, setApplyMessage] = useState('');
  const [application, setApplication] = useState<Partial<Application>>({
    coverLetter: '',
    selectedWorkTypeIds: [],
  });
  
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
  const [editData, setEditData] = useState<any>({
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
    accommodation: { provided: false, info: '' },
    meal: { provided: false, info: '' },
  });

  // 회사 이미지 관리 상태
  const [companyImages, setCompanyImages] = useState<string[]>([]);
  const [uploadingCompanyImages, setUploadingCompanyImages] = useState(false);
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 스케줄 그리드 모달 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);

  // 지도 관련 상태
  const [mapLocation, setMapLocation] = useState<MapLocation>({
    lat: 37.5665, // 서울 시청 기본 좌표
    lng: 126.9780
  });
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

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
          employerName: companyInfo?.name || job.employerName || job.workplaceName || '회사명 없음',
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
    
    const shareText = `🏖️ 리조트 일자리 추천!\n\n${job.title}\n${companyInfo?.name || job.employerName || job.workplaceName || '회사명 없음'}\n${job.location}\n${job.salary ? `${job.salary.min.toLocaleString()}원 ~ ${job.salary.max.toLocaleString()}원` : '급여 협의'}\n\n자세히 보기: ${window.location.href}`;
    
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

  // 이력서 완성도 검증
  const isResumeComplete = () => {
    if (!user?.resume) return false;
    
    const resume = user.resume;
    const jobTypeValid = Array.isArray(resume.jobType) 
      ? resume.jobType.length > 0 
      : resume.jobType && resume.jobType.toString().trim() !== '';
    
    const requiredFields = [
      resume.phone,
      resume.birth,
      resume.hourlyWage,
    ];
    
    const otherFieldsValid = requiredFields.every(field => 
      field && field.toString().trim() !== '',
    );
    
    return jobTypeValid && otherFieldsValid;
  };

  const isResumeFilled = isResumeComplete();

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

  // 지도 관련 함수들
  const handleMapToggle = () => {
    setShowMap(!showMap);
  };

  const handleLocationSearch = async () => {
    if (!job?.location) return;
    
    setMapLoading(true);
    try {
      const result = await searchAddress(job.location);
      if (result) {
        setMapLocation({
          lat: result.lat,
          lng: result.lng,
          address: result.address
        });
        setShowMap(true);
      } else {
        alert('주소를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주소 검색 실패:', error);
      alert('주소 검색에 실패했습니다.');
    } finally {
      setMapLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log('지도 클릭:', lat, lng);
  };

  // 모든 모달 닫기
  const closeAllModals = () => {
    setShowApplyModal(false);
    setShowResumeConfirmModal(false);
    setShowApplicationPreview(false);
    setShowScheduleModal(false);
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

  // 근무유형 클릭 시 스케줄 그리드 모달 열기
  const handleWorkTypeClick = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setShowScheduleModal(true);
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
      setShowApplicationPreview(false);
      setShowResumeConfirmModal(false);
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
            accommodation: (jobWithId as any).accommodation || { provided: false, info: '' },
            meal: (jobWithId as any).meal || { provided: false, info: '' },

          });
        }

        // 회사 정보 자동 로딩
        if (jobWithId.employerId && !autoFilled) {
          await loadCompanyInfo(jobWithId.employerId);
          await loadAccommodationInfo(jobWithId.employerId);
          
          // workTypes가 없거나 비어있을 때만 별도로 로드
          if (!jobWithId.workTypes || jobWithId.workTypes.length === 0) {
            console.log('근무타입 로딩 시작...');
            await loadWorkTypes(jobWithId.employerId);
          } else {
            console.log('기존 근무타입 사용:', jobWithId.workTypes.length, '개');
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
    setEditData((prev: any) => ({
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
      
      // 근무지 자동 대체: 입력이 비어있으면 회사 주소 사용
      const resolvedLocation = (cleanEditData.location && String(cleanEditData.location).trim().length > 0)
        ? cleanEditData.location
        : (companyInfo?.address || companyInfo?.region || job.location || '');
      
      const updateData = {
        ...cleanEditData,
        location: resolvedLocation,
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
      // 저장 후 조회 모드 URL로 이동
      navigate(`/job-post/${id}`);
      
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
        accommodation: (job as any).accommodation || { provided: false, info: '' },
        meal: (job as any).meal || { provided: false, info: '' },

      });
    }
    // 취소 후 조회 모드 URL로 이동
    navigate(`/job-post/${id}`);
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
            <p className="text-xl font-semibold text-blue-600 mb-1">
              {companyInfo?.name || job?.employerName || job?.workplaceName || '회사명 없음'}
            </p>
            <p className="text-gray-600">
              {job.employerId === user?.uid ? '내가 등록한 공고' : '채용 공고'}
            </p>
          </div>
          
            <div className="flex gap-2">
            {/* 구직자인 경우 지원 버튼 표시 */}
            {user?.role === 'jobseeker' && job.employerId !== user?.uid && (
              <div className="flex gap-2">
                {hasApplied ? (
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    지원 완료
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!isResumeFilled) {
                        setShowResumeConfirmModal(true);
                      } else {
                        setShowApplyModal(true);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    지원하기
                  </button>
                )}
              </div>
            )}
            
            {/* 공고 작성자인 경우 수정 버튼 표시 */}
            {job.employerId === user?.uid && (
              <>
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
                      // 편집 모드 URL로 이동
                      navigate(`/job-post/${id}?mode=edit`);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </button>
              )}
              </>
          )}
          </div>
        </div>
      </div>



      <div className="space-y-6">
        {/* 메인 콘텐츠 - 채용 섹션 */}
        <div className="space-y-6">
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
                    placeholder={(companyInfo?.address || companyInfo?.region) ? `미입력 시 회사주소 사용: ${companyInfo?.address || companyInfo?.region}` : '근무지를 입력하세요'}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-900">{job.location || companyInfo?.address || companyInfo?.region || '미입력'}</p>
                    {(job.location || companyInfo?.address || companyInfo?.region) && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleLocationSearch}
                          disabled={mapLoading}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          {mapLoading ? '검색 중...' : '지도에서 보기'}
                        </button>
                        <button
                          onClick={handleMapToggle}
                          className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                        >
                          {showMap ? '지도 숨기기' : '지도 보기'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 지도 표시 */}
              {showMap && !isEditing && (
                <div className="mt-4">
                  <NaverMapScript>
                    <NaverMap
                      center={mapLocation}
                      zoom={15}
                      markers={[
                        {
                          position: mapLocation,
                          title: job.jobTitle || '근무지',
                          content: job.location || companyInfo?.address || companyInfo?.region || '위치 정보'
                        }
                      ]}
                      onMapClick={handleMapClick}
                    />
                  </NaverMapScript>
                </div>
              )}
              
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

              {/* 숙식 제공 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">숙식 제공</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 기숙사 제공 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                {isEditing ? (
                        <input
                          type="checkbox"
                          checked={!!editData.accommodation?.provided}
                          onChange={(e) => handleInputChange('accommodation', { ...(editData.accommodation || { provided: false, info: '' }), provided: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      ) : (
                        <input type="checkbox" checked={!!(job as any).accommodation?.provided} readOnly className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      )}
                      <span className="text-sm font-medium text-gray-700">기숙사 제공</span>
                  </div>
                    {(isEditing ? editData.accommodation?.provided : (job as any).accommodation?.provided) && (
              <div>
                        <label className="block text-xs text-gray-500 mb-1">기숙사 정보</label>
                {isEditing ? (
                  <textarea
                            value={editData.accommodation?.info || ''}
                            onChange={(e) => handleInputChange('accommodation', { ...(editData.accommodation || { provided: false, info: '' }), info: e.target.value })}
                            rows={2}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="방 유형, 비용, 위치 등"
                  />
                ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{(job as any).accommodation?.info || '정보 없음'}</p>
                )}
              </div>
                    )}
          </div>

                  {/* 식사 제공 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                {isEditing ? (
                  <input
                          type="checkbox"
                          checked={!!editData.meal?.provided}
                          onChange={(e) => handleInputChange('meal', { ...(editData.meal || { provided: false, info: '' }), provided: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                ) : (
                        <input type="checkbox" checked={!!(job as any).meal?.provided} readOnly className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                )}
                      <span className="text-sm font-medium text-gray-700">식사 제공</span>
              </div>
                    {(isEditing ? editData.meal?.provided : (job as any).meal?.provided) && (
              <div>
                        <label className="block text-xs text-gray-500 mb-1">식사 정보</label>
                {isEditing ? (
                          <textarea
                            value={editData.meal?.info || ''}
                            onChange={(e) => handleInputChange('meal', { ...(editData.meal || { provided: false, info: '' }), info: e.target.value })}
                            rows={2}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="제공 식사, 시간, 비용 등"
                  />
                ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{(job as any).meal?.info || '정보 없음'}</p>
                )}
                      </div>
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
                  <div 
                    key={workType.id} 
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    onClick={() => handleWorkTypeClick(workType)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{workType.name}</h3>
                      <Clock className="h-4 w-4 text-blue-500" />
                </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>시급: {workType.hourlyWage?.toLocaleString()}원</p>
                      <p>스케줄: {workType.schedules?.length || 0}개</p>
                      <p className="text-blue-600 text-xs mt-2">클릭하여 스케줄 확인</p>
                  </div>
                  </div>
                ))}
                </div>
            </div>
          )}

          {/* 회사 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
              <Building className="h-5 w-5 mr-2" />
              회사 정보
            </h2>
              {job?.employerId === user?.uid && isEditing && (
                <Link
                  to={`/company/${job.employerId}?mode=edit`}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  수정
                </Link>
              )}
            </div>
            {loadingCompanyInfo ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">회사 정보 로딩 중...</p>
              </div>
            ) : companyInfo ? (
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
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {companyInfo.address || companyInfo.region || '미입력'}
                  </div>
                    </div>

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
              <p className="text-gray-500">회사 정보가 없습니다.</p>
            )}
          </div>

          {/* 기숙사 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Home className="h-5 w-5 mr-2" />
              기숙사 정보
            </h2>
              <div className="flex items-center gap-2">
                <Link
                  to={`/accommodation-info/${job?.employerId}`}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  기숙사 상세
                </Link>
                {job?.employerId === user?.uid && isEditing && (
                  <Link
                    to={`/accommodation-info/${job.employerId}?mode=edit`}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    수정
                  </Link>
                )}
              </div>
            </div>
            {loadingAccommodationInfo ? (
              <div className="text-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">기숙사 정보 로딩 중...</p>
              </div>
            ) : accommodationInfo ? (
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
                {accommodationInfo.roomTypeOptions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">방 타입 및 가격</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {accommodationInfo.roomTypeOptions.singleRoom && (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-sm font-medium text-gray-700">1인실</div>
                          <div className="text-gray-900">{accommodationInfo.roomPrices?.singleRoom || '가격 미정'}</div>
                        </div>
                        )}
                        {accommodationInfo.roomTypeOptions.doubleRoom && (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-sm font-medium text-gray-700">2인실</div>
                          <div className="text-gray-900">{accommodationInfo.roomPrices?.doubleRoom || '가격 미정'}</div>
                        </div>
                        )}
                        {accommodationInfo.roomTypeOptions.tripleRoom && (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-sm font-medium text-gray-700">3인실</div>
                          <div className="text-gray-900">{accommodationInfo.roomPrices?.tripleRoom || '가격 미정'}</div>
                        </div>
                        )}
                        {accommodationInfo.roomTypeOptions.quadRoom && (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-sm font-medium text-gray-700">4인실</div>
                          <div className="text-gray-900">{accommodationInfo.roomPrices?.quadRoom || '가격 미정'}</div>
                        </div>
                        )}
                        {accommodationInfo.roomTypeOptions.otherRoom && (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-sm font-medium text-gray-700">{accommodationInfo.otherRoomType || '기타'}</div>
                          <div className="text-gray-900">{accommodationInfo.roomPrices?.otherRoom || '가격 미정'}</div>
                  </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 편의시설 */}
                {(accommodationInfo as any)?.amenities && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">편의시설</label>
                    <div className="flex flex-wrap gap-2">
                      {(accommodationInfo as any).amenities.map((amenity: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                          {amenity}
                        </span>
                      ))}
                      {(accommodationInfo as any).otherAmenities && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                          {(accommodationInfo as any).otherAmenities}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 근린시설 */}
                {(accommodationInfo as any).nearbyFacilities && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">근린시설</label>
                    <p className="text-sm text-gray-900">{(accommodationInfo as any).nearbyFacilities}</p>
                  </div>
                )}
                
                {/* 규칙 */}
                {accommodationInfo.rules && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기숙사 규칙</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{accommodationInfo.rules}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">기숙사 정보가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 지원 정보 입력 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">지원 정보 입력</h3>
            </div>
            
            <div className="space-y-6">
              {/* 지원 정보 요약 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">지원 정보</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• 지원자: {user?.displayName}</div>
                  <div>• 공고: {job?.title}</div>
                  <div>• 회사: {companyInfo?.name || job?.workplaceName || job?.employerName || '회사명 없음'}</div>
                  <div>• 위치: {job?.location}</div>
                </div>
              </div>

              {/* 근무 타입 선택 */}
              {job?.workTypes && job.workTypes.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">근무 타입 선택 *</h4>
                  <div className="space-y-3">
                    {/* 무관 옵션 */}
                    <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-blue-50">
                      <input
                        type="checkbox"
                        checked={selectedWorkTypes.includes('any')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkTypes(['any']);
                          } else {
                            setSelectedWorkTypes([]);
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">무관 (어떤 근무타입이든 가능)</div>
                        <div className="text-sm text-gray-600 mt-1">모든 근무타입에 지원 가능합니다</div>
                      </div>
                    </label>
                    
                    {/* 개별 근무타입 옵션들 */}
                    {job.workTypes.map((workType) => (
                      <label key={workType.id} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWorkTypes.includes(workType.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkTypes(prev => 
                                prev.includes('any') 
                                  ? [workType.id]
                                  : [...prev, workType.id]
                              );
                            } else {
                              setSelectedWorkTypes(prev => prev.filter(id => id !== workType.id));
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{workType.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{workType.description}</div>
                          {workType.hourlyWage && (
                            <div className="text-sm text-blue-600 mt-1">
                              시급: {workType.hourlyWage.toLocaleString()}원
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedWorkTypes.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">근무 타입을 하나 이상 선택해주세요.</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">근무 타입 정보</h4>
                  <p className="text-sm text-yellow-700">이 공고에는 특정 근무 타입이 설정되지 않았습니다. 모든 근무 타입에 지원 가능합니다.</p>
                </div>
              )}

              {/* 지원 동기 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">지원 동기 (선택사항)</h4>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="이 공고에 지원하는 이유나 관련 경험을 간단히 작성해주세요."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  // 근무타입이 있는 경우에만 선택 필수
                  if (job?.workTypes && job.workTypes.length > 0 && selectedWorkTypes.length === 0) {
                    alert('근무 타입을 하나 이상 선택해주세요.');
                    return;
                  }
                  // 지원서 미리보기 대신 지원서 상세 페이지로 이동
                  const applicationData = {
                    coverLetter: applyMessage,
                    selectedWorkTypeIds: selectedWorkTypes,
                  };
                  // 임시로 세션스토리지에 저장
                  sessionStorage.setItem('tempApplication', JSON.stringify(applicationData));
                  sessionStorage.setItem('tempJobPost', JSON.stringify(job));
                  setShowApplyModal(false);
                  // 지원서 상세 페이지로 이동
                  navigate(`/application-detail/preview`);
                }}
                disabled={job?.workTypes && job.workTypes.length > 0 && selectedWorkTypes.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                지원서 미리보기
              </button>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedWorkTypes([]);
                  setApplyMessage('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이력서 확인 모달 */}
      {showResumeConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">이력서 확인</h3>
            </div>
            
            <div className="space-y-6">
              {/* 지원 정보 요약 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">지원 정보</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• 지원자: {user?.displayName}</div>
                  <div>• 공고: {job?.title}</div>
                  <div>• 회사: {companyInfo?.name || job?.workplaceName || job?.employerName || '회사명 없음'}</div>
                  <div>• 위치: {job?.location}</div>
                </div>
              </div>

              {/* 이력서 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">내 이력서 정보</h4>
                {user?.resume ? (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {/* 기본 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                          {user?.displayName || '미입력'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                          {user?.email || '미입력'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">전화번호</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                          {user?.resume?.phone || '미입력'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                          {user?.resume?.birth || '미입력'}
                        </div>
                      </div>
                    </div>

                    {/* 직무 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">희망 직무</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                          {user?.resume?.jobType ? 
                            (Array.isArray(user.resume.jobType) ? 
                              user.resume.jobType.join(', ') : 
                              user.resume.jobType
                            ) : 
                            '미입력'
                          }
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">희망 시급</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                          {user?.resume?.hourlyWage 
                            ? `${user?.resume?.hourlyWage?.toLocaleString?.()}원/시간` 
                            : '미입력'
                          }
                        </div>
                      </div>
                    </div>

                    {/* 경험 정보 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">관련 경험</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                        {user?.resume?.customerServiceExp && <span className="mr-2">• 고객 응대 경험</span>}
                        {user?.resume?.restaurantExp && <span>• 음식점/호텔 경험</span>}
                        {!user?.resume?.customerServiceExp && !user?.resume?.restaurantExp && 
                          <span className="text-red-500">미입력</span>
                        }
                      </div>
                    </div>

                    {/* 언어 능력 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">언어 능력</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm">
                        {user?.resume?.languages && user.resume.languages.length > 0 ? 
                          user.resume.languages.join(', ')
                          : '미입력'
                        }
                      </div>
                    </div>

                    {/* 자기소개 */}
                    {user?.resume?.intro && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">자기소개</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm whitespace-pre-wrap">
                          {user?.resume?.intro}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <h5 className="text-sm font-semibold text-red-800 mb-2">이력서가 없습니다</h5>
                    <p className="text-sm text-red-600 mb-3">지원하기 전에 이력서를 먼저 작성해주세요</p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      이력서 작성하기
                    </Link>
                  </div>
                )}
              </div>

              {/* 확인사항 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">지원 전 확인사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 위 이력서 정보가 정확한지 확인해주세요</li>
                  <li>• 지원 후에는 취소할 수 없습니다</li>
                  <li>• 지원 현황은 대시보드에서 확인 가능합니다</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              {user?.resume ? (
              <button
                  onClick={() => {
                    setShowResumeConfirmModal(false);
                    setShowApplyModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Send className="w-4 h-4" />
                  지원 계속하기
              </button>
              ) : (
              <button
                  disabled
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  이력서 작성 후 지원 가능
                </button>
              )}
              <button
                onClick={() => setShowResumeConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 스케줄 그리드 모달 */}
      {showScheduleModal && selectedWorkType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedWorkType.name} - 근무 스케줄
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">시급:</span>
                  <span className="ml-2 text-blue-600 font-semibold">
                    {selectedWorkType.hourlyWage?.toLocaleString()}원
                  </span>
          </div>
                <div>
                  <span className="font-medium text-gray-700">스케줄 수:</span>
                  <span className="ml-2 text-blue-600 font-semibold">
                    {selectedWorkType.schedules?.length || 0}개
                  </span>
                </div>
                {selectedWorkType.description && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">설명:</span>
                    <span className="ml-2 text-gray-600">{selectedWorkType.description}</span>
        </div>
      )}
              </div>
            </div>

            <UnifiedScheduleGrid
              selectedTimeSlots={selectedWorkType.schedules || []}
              mode="view"
              title={`${selectedWorkType.name} 근무 스케줄`}
              description="선택된 근무 시간대를 확인하세요"
              showStatistics={true}
              showActions={false}
              readOnly={true}
              employerView={true}
            />
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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


