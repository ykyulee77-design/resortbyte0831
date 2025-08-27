import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Home, ChevronRight, ChevronDown, Plus, FileText, Users, Eye, MapPin, DollarSign, Clock, CheckCircle, EyeOff, Globe, Camera, Upload, Trash2, RefreshCw, Star, Phone, Mail, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { workTypeService } from '../utils/scheduleMatchingService';
import { uploadImage, deleteImage, compressImage } from '../utils/imageUpload';
import NaverMap from '../components/NaverMap';

interface JobPost {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: { min: number; max: number; type: string };
  workTypes?: any[];
  isActive: boolean;
  createdAt: any;
  applications: any[];
}

interface Application {
  id: string;
  jobPostId: string;
  jobseekerName: string;
  status: string;
  appliedAt: any;
  phone?: string;
  hourlyWage?: number;
  email?: string;
}

// 총 근무시간 계산 함수
const calculateTotalHoursPerWeek = (schedules: any[]): number => {
  return schedules.reduce((total, slot) => {
    const hoursInSlot = slot.end > slot.start ? slot.end - slot.start : (24 - slot.start) + slot.end;
    return total + hoursInSlot;
  }, 0);
};

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCompanySectionCollapsed, setIsCompanySectionCollapsed] = useState(true);
  const [isAccommodationSectionCollapsed, setIsAccommodationSectionCollapsed] = useState(true);


  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companyRegistrants, setCompanyRegistrants] = useState<any[]>([]); // 등록자 목록 추가
  const [workTypes, setWorkTypes] = useState<any[]>([]); // 근무타입 목록 추가
  const [accommodationAvgRating, setAccommodationAvgRating] = useState<number | null>(null);
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 기숙사 편집 상태 (더 이상 사용하지 않지만 참조를 위해 유지)
  const [isAccommodationEditing] = useState(false);
  const [accommodationEditData] = useState<any>({});

  // 이미지 미리보기 핸들러
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '이미지');
  };

  // 회사 정보 수정 페이지로 이동
  const handleCompanyEdit = () => {
    if (user?.uid) {
      navigate(`/company/${user.uid}?mode=edit`);
    }
  };

  // 기숙사 정보 수정 페이지로 이동
  const handleAccommodationEdit = () => {
    if (user?.uid) {
      navigate(`/accommodation-info/${user.uid}?mode=edit`);
    }
  };

  // 기숙사 편집 관련 함수들 (더 이상 사용하지 않지만 참조를 위해 유지)
  const handleAccommodationEditStart = () => {};
  const handleAccommodationEditCancel = () => {};
  const handleAccommodationEditSave = () => {};
  const handleAccommodationInputChange = (field: string, value: any) => {};
  const handlePaymentTypeChange = (value: string) => {};
  const handleRoomTypeOptionChange = (key: string, checked: boolean) => {};
  const handleRoomPriceChange = (key: string, value: string) => {};
  const handleRoomFacilityChange = (key: string, checked: boolean) => {};
  const handleFacilityOptionChange = (key: string, checked: boolean) => {};

  // 기숙사 공개/비공개 토글 핸들러
  const handleAccommodationVisibilityToggle = async () => {
    if (!user?.uid || !accommodationInfo) return;
    
    try {
      const ref = doc(db, 'accommodationInfo', user.uid);
      const newVisibility = !accommodationInfo.isPublic;
      
      await setDoc(ref, {
        ...accommodationInfo,
        isPublic: newVisibility,
        updatedAt: new Date(),
      }, { merge: true });
      
      // 로컬 상태 업데이트
      setAccommodationInfo({
        ...accommodationInfo,
        isPublic: newVisibility,
      });
      
      alert(newVisibility ? '기숙사 정보가 공개되었습니다.' : '기숙사 정보가 비공개되었습니다.');
    } catch (error) {
      console.error('기숙사 공개 상태 변경 실패:', error);
      alert('공개 상태 변경에 실패했습니다.');
    }
  };

  // URL 앵커 감지 및 스크롤
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#job-posts') {
      const element = document.getElementById('job-posts');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 500); // 데이터 로딩 후 스크롤
      }
    }
  }, [jobPosts]); // jobPosts가 로드된 후 실행

  // 브라우저 히스토리 정리 - 편집 페이지로의 이동 기록 제거
  useEffect(() => {
    if (window.location.pathname === '/employer-dashboard') {
      // 현재 URL이 대시보드인데 히스토리에 편집 페이지가 남아있을 수 있으므로 정리
      window.history.replaceState(null, '', '/employer-dashboard');
    }
  }, []);

  // Firebase에서 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

    try {
      setLoading(true);
      
        // 1. 회사 정보 로딩
        let companyData = null;
        
        // companyInfo 컬렉션에서 검색 (employerId로)
        try {
          const companyInfoQuery = query(
            collection(db, 'companyInfo'),
            where('employerId', '==', user.uid),
          );
          const companySnapshot = await getDocs(companyInfoQuery);
          
          if (!companySnapshot.empty) {
            companyData = companySnapshot.docs[0].data();
          }
        } catch (error) {
          console.error('companyInfo 컬렉션 검색 오류:', error);
        }

        // employerId로 찾지 못한 경우, document ID로 직접 검색
        if (!companyData) {
          try {
            const companyDocRef = doc(db, 'companyInfo', user.uid);
            const companyDoc = await getDoc(companyDocRef);
            
            if (companyDoc.exists()) {
              companyData = companyDoc.data();
            }
          } catch (error) {
            console.error('companyInfo document 직접 검색 오류:', error);
          }
        }

        // users 컬렉션에서 검색 (fallback)
        if (!companyData) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as any;
              
              if (userData.employerInfo) {
                companyData = userData.employerInfo;
              } else if (userData.companyName) {
                // 기존 구인자 데이터를 companyInfo로 마이그레이션
                companyData = {
                  employerId: user.uid,
                  name: userData.companyName,
                  address: userData.companyAddress,
                  phone: userData.companyPhone,
                  website: userData.companyWebsite,
                  businessNumber: userData.businessNumber,
                  industry: userData.industry,
                  companySize: userData.companySize,
                  contactPerson: userData.contactPerson,
                  contactPhone: userData.contactPhone,
                };
                
                // companyInfo 컬렉션에 저장
                try {
                  await setDoc(doc(db, 'companyInfo', user.uid), {
                    ...companyData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                  console.log('기존 구인자 데이터를 companyInfo로 마이그레이션 완료');
                } catch (migrationError) {
                  console.error('마이그레이션 오류:', migrationError);
                }
              } else {
                companyData = userData;
              }
            }
          } catch (error) {
            console.error('users 컬렉션 검색 오류:', error);
          }
        }

        setCompanyInfo(companyData);

        // 3. 같은 회사의 등록자 목록 가져오기
        if (companyData?.name) {
          try {
            // companyInfo 컬렉션에서 같은 회사명을 가진 모든 등록자 검색
            const registrantsQuery = query(
              collection(db, 'companyInfo'),
              where('name', '==', companyData.name),
            );
            const registrantsSnapshot = await getDocs(registrantsQuery);
            
            // 각 등록자의 상세 정보를 users 컬렉션에서 가져오기
            const registrantsWithDetails = await Promise.all(
              registrantsSnapshot.docs.map(async (docSnapshot) => {
                const registrantData = docSnapshot.data();
                
                // users 컬렉션에서 이메일 정보 가져오기
                try {
                  const userDocRef = doc(db, 'users', docSnapshot.id);
                  const userDoc = await getDoc(userDocRef);
                  
                  if (userDoc.exists()) {
                    const userData = userDoc.data() as any;
                    return {
                      id: docSnapshot.id,
                      ...registrantData,
                      contactEmail: userData.email || registrantData.contactEmail || '이메일 미등록',
                    };
                  }
                } catch (userError) {
                  console.error(`사용자 ${docSnapshot.id} 정보 가져오기 오류:`, userError);
                }
                
                return {
                  id: docSnapshot.id,
                  ...registrantData,
                  contactEmail: registrantData.contactEmail || '이메일 미등록',
                };
              }),
            );
            
            setCompanyRegistrants(registrantsWithDetails);
          } catch (error) {
            console.error('등록자 목록 가져오기 오류:', error);
            setCompanyRegistrants([]);
          }
        } else {
          setCompanyRegistrants([]);
        }

        // 2. 기숙사 정보 로딩
        try {
          // 먼저 문서 ID로 직접 조회 시도
          const accommodationDocRef = doc(db, 'accommodationInfo', user.uid);
          const accommodationDoc = await getDoc(accommodationDocRef);
          
          if (accommodationDoc.exists()) {
            const accommodationData = accommodationDoc.data();
            setAccommodationInfo(accommodationData);
          } else {
            // 문서가 없으면 employerId로 쿼리 시도 (하위 호환성)
            const accommodationInfoQuery = query(
              collection(db, 'accommodationInfo'),
              where('employerId', '==', user.uid),
            );
            const accommodationSnapshot = await getDocs(accommodationInfoQuery);
            
            if (!accommodationSnapshot.empty) {
              const accommodationData = accommodationSnapshot.docs[0].data();
              setAccommodationInfo(accommodationData);
            }
          }
        } catch (error) {
          console.error('accommodationInfo 로딩 오류:', error);
        }

        // 2-1. 기숙사 평균 평점 로딩 (reviews 컬렉션의 accommodationRating)
        try {
          const reviewsSnap = await getDocs(
            query(collection(db, 'reviews'), where('resort', '==', user.uid))
          );
          console.log('기숙사 리뷰 데이터:', reviewsSnap.docs.map(d => d.data()));
          
          const ratings: number[] = reviewsSnap.docs
            .map(d => (d.data() as any).accommodationRating || 0)
            .filter((n: number) => typeof n === 'number' && n > 0);
          
          console.log('기숙사 평점 배열:', ratings);
          
          if (ratings.length > 0) {
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            const finalAvg = parseFloat(avg.toFixed(1));
            console.log('기숙사 평균 평점:', finalAvg);
            setAccommodationAvgRating(finalAvg);
          } else {
            console.log('기숙사 평점이 없음');
            setAccommodationAvgRating(null);
          }
        } catch (e) {
          console.log('기숙사 평균 평점 로딩 실패:', e);
          setAccommodationAvgRating(null);
        }

        // 3. 구인공고 로딩
        try {
          const jobPostsQuery = query(
        collection(db, 'jobPosts'),
            where('employerId', '==', user.uid),
      );
          const jobPostsSnapshot = await getDocs(jobPostsQuery);
          const jobPostsData = jobPostsSnapshot.docs.map(doc => ({
        id: doc.id,
            ...doc.data(),
      })) as JobPost[];
      
          setJobPosts(jobPostsData);
        } catch (error) {
          console.error('jobPosts 로딩 오류:', error);
        }

        // 4. 지원서 로딩
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('employerId', '==', user.uid),
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Application[];
          
          setApplications(applicationsData);
        } catch (error) {
          console.error('applications 로딩 오류:', error);
        }

        // 5. 근무타입 로딩
        try {
          const workTypesData = await workTypeService.getWorkTypesByEmployer(user.uid);
          setWorkTypes(workTypesData);
        } catch (error) {
          console.error('workTypes 로딩 오류:', error);
        }

    } catch (error) {
        console.error('전체 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

    if (user?.uid) {
      loadData();
    }
  }, [user?.uid]);

  // 특정 공고의 지원자 수 계산
  const getApplicationsForJob = (jobId: string) => {
    return applications.filter((app: any) => app.jobPostId === jobId);
  };

  // 지원자 관리: 공고 제목, 지원일 포맷 보조 함수
  const getJobTitleById = (jobId: string): string => {
    const post = jobPosts.find((p: any) => p.id === jobId);
    return post?.title || '공고 없음';
  };

  const formatAppliedDate = (value: any): string => {
    try {
      const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
      return date ? new Date(date).toLocaleDateString() : '날짜 없음';
    } catch {
      return '날짜 없음';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">회사 대시보드</h1>
          <p className="mt-1 text-gray-600">회사 정보와 구인 현황을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* 1. 회사 정보 섹션 */}
          <div className="space-y-3">
            {/* 회사 기본 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Building className="w-5 h-5 text-blue-600" />
              </div>
                      회사
                    <button
                      onClick={() => setIsCompanySectionCollapsed(!isCompanySectionCollapsed)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {isCompanySectionCollapsed ? '펼치기' : '접기'}
                    </button>
                  </h3>
                  <div className="flex items-center gap-2">
                        <button
                      onClick={handleCompanyEdit}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                      {companyInfo ? '수정' : '등록'}
                      </button>
              </div>
              </div>
              
                {/* 통합된 회사 정보 헤더 */}
              {!isCompanySectionCollapsed && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          {companyInfo?.name || '회사명 미등록'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {companyInfo?.industry && (
                            <span className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
                              {companyInfo.industry}
                            </span>
                          )}
                          {companyInfo?.size || companyInfo?.companySize ? (
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {companyInfo.size || companyInfo.companySize}
                            </span>
                          ) : null}
                          {companyInfo?.businessNumber && (
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {companyInfo.businessNumber}
                            </span>
                        )}
                      </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {companyInfo?.website || companyInfo?.companyWebsite ? (
                          <a 
                            href={companyInfo.website || companyInfo.companyWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <Globe className="w-4 h-4 mr-1" />
                            웹사이트
                          </a>
                        ) : null}
            </div>
          </div>

                    {companyInfo?.address || companyInfo?.companyAddress ? (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                        <span className="text-sm">
                            {companyInfo.address || companyInfo.companyAddress}
                        </span>
              </div>
                        ) : (
                      <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <span className="text-sm font-medium">주소 정보가 등록되지 않았습니다</span>
              </div>
                        )}
            </div>
                        )}
          </div>

              {!isCompanySectionCollapsed && (
                <div className="p-6 space-y-6">

                  {/* 회사 상세 정보 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 기본 정보 */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* 회사 소개 */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          회사 소개
                        </h3>
                        
                        {companyInfo?.description ? (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {companyInfo.description}
                          </p>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">회사 소개가 등록되지 않았습니다</p>
                            <p className="text-xs mt-1">구직자들이 회사를 더 잘 이해할 수 있도록 소개를 작성해주세요</p>
              </div>
                        )}
              </div>

                      {/* 복리후생 */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <Star className="w-5 h-5 mr-2 text-green-600" />
                          복리후생
                        </h3>
                        
                        {(companyInfo?.benefits && companyInfo.benefits.length > 0) ? (
                          <div className="flex flex-wrap gap-2">
                            {companyInfo.benefits.map((benefit: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                                {benefit}
                              </span>
                            ))}
            </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Star className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">등록된 복리후생 정보가 없습니다</p>
                            <p className="text-xs mt-1">구직자들이 관심을 가질 수 있는 복리후생을 등록해보세요</p>
                          </div>
                        )}
          </div>

                      {/* 회사 문화 */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <Users className="w-5 h-5 mr-2 text-purple-600" />
                          회사 문화
                        </h3>
                        
                        {companyInfo?.culture ? (
                          <p className="text-gray-700 leading-relaxed">{companyInfo.culture}</p>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">등록된 회사 문화 정보가 없습니다</p>
              </div>
                        )}
              </div>
            </div>

                    {/* 사이드바 정보 */}
                    <div className="space-y-4">
                  {/* 연락처 정보 */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <Phone className="w-5 h-5 mr-2 text-blue-600" />
                          연락처
                        </h3>
                        
                        <div className="space-y-3">
                          {companyInfo?.phone || companyInfo?.companyPhone ? (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 font-medium">
                                {companyInfo.phone || companyInfo.companyPhone}
                              </span>
                          </div>
                          ) : (
                            <div className="text-center py-3 text-gray-500">
                              <p className="text-sm">전화번호 미등록</p>
                          </div>
                        )}
          </div>
        </div>


                    </div>
                  </div>



                  {/* 회사 이미지 */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-blue-600" />
                        회사 이미지
                      {(companyInfo?.images || []).length > 0 && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({(companyInfo?.images || []).length}장)
                        </span>
                      )}
                    </h3>
                    
                    {(companyInfo?.images || []).length > 0 ? (
                      <div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(companyInfo?.images || []).map((image: string, index: number) => {
                            const description = (companyInfo?.imageDescriptions || [])[index] || '';
                          
                          return (
                              <div key={index} className="group">
                                <div 
                                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImagePreview(image, `회사 이미지 ${index + 1}`);
                                  }}
                                >
                                <img
                                  src={image}
                                  alt={`회사 이미지 ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                                    {index + 1}
              </div>
                                  <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    클릭하여 크게 보기
            </div>
                                </div>
                                {description && (
                                  <p className="text-xs text-gray-600 mt-1 text-center truncate px-1">
                                    {description}
                                  </p>
                              )}
                            </div>
                          );
                        })}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">
                          썸네일을 클릭하면 크게 볼 수 있습니다
                        </p>
                </div>
              ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">등록된 회사 이미지가 없습니다</p>
                        <p className="text-sm">회사 이미지를 등록하여 구직자들에게 더 나은 인상을 남겨보세요</p>
                          </div>
                    )}
                        </div>

                  {/* 담당자 목록 */}
                  {companyRegistrants.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        담당자 ({companyRegistrants.length}명)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companyRegistrants.map((registrant, index) => (
                          <div 
                            key={registrant.id} 
                            className={`p-4 rounded-xl border cursor-pointer hover:shadow-lg transition-all ${
                              registrant.id === user?.uid 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-50 hover:bg-white'
                            }`}
                            onClick={() => {
                              // 담당자 상세 정보를 alert로 표시 (나중에 모달로 개선 가능)
                              const details = `
담당자 정보:
• 담당자명: ${registrant.contactPerson || '미등록'}
• 이메일: ${registrant.contactEmail || '미등록'}
• 연락처: ${registrant.contactPhone || '미등록'}
• 회사명: ${registrant.name || '미등록'}
• 주소: ${registrant.address || '미등록'}
• 전화번호: ${registrant.phone || '미등록'}
• 웹사이트: ${registrant.website || '미등록'}
• 사업자번호: ${registrant.businessNumber || '미등록'}
• 업종: ${registrant.industry || '미등록'}
• 회사규모: ${registrant.companySize || '미등록'}
• 등록일: ${registrant.createdAt ? new Date(registrant.createdAt.toDate()).toLocaleDateString() : '미상'}
                              `.trim();
                              alert(details);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                                registrant.id === user?.uid 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-300 text-gray-700'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                  {registrant.contactPerson || '담당자명 미등록'}
                                  </p>
                                  {registrant.id === user?.uid && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                      나
                          </span>
                                  )}
                        </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p className="truncate flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {registrant.contactEmail || '이메일 미등록'}
                                  </p>
                                  <p className="truncate flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {registrant.contactPhone || '연락처 미등록'}
                                  </p>
                                </div>
                                </div>
                              </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-400">
                                등록일: {registrant.createdAt ? new Date(registrant.createdAt.toDate()).toLocaleDateString() : '미상'}
                              </p>
                      </div>
                    </div>
                  ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-4 text-center">
                        * 같은 회사에 등록된 모든 담당자 목록입니다. 클릭하면 상세 정보를 볼 수 있습니다.
                      </p>
                    </div>
                  )}
                  



                </div>
              )}
          </div>

            {/* 2. 기숙사 상세 정보 */}
            {accommodationInfo ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-green-100 bg-green-50 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                        <Home className="w-5 h-5 text-green-600" />
                      </div>
                        기숙사
                      <button
                        onClick={() => setIsAccommodationSectionCollapsed(!isAccommodationSectionCollapsed)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        {isAccommodationSectionCollapsed ? '펼치기' : '접기'}
                      </button>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAccommodationVisibilityToggle}
                        className={`text-xs px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                          accommodationInfo.isPublic 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={accommodationInfo.isPublic ? '현재 공개됨' : '현재 비공개됨'}
                      >
                        {accommodationInfo.isPublic ? (
                          <>
                            <Globe className="w-3 h-3" />
                            공개
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            비공개
                          </>
                        )}
                      </button>
                          <button
                        onClick={handleAccommodationEdit}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                          수정
                        </button>
              </div>
            </div>
                  
                  {/* 통합된 기숙사 정보 헤더 */}
                  {!isAccommodationSectionCollapsed && (
                    <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {accommodationInfo?.name || '기숙사명 미등록'}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            {accommodationAvgRating !== null ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
                                <span className="mr-1">★</span>
                                {accommodationAvgRating}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-full">
                                <span className="mr-1">★</span>
                                평점 없음
                              </span>
                            )}
                            {accommodationInfo?.type && (
                              <span className="flex items-center">
                                <Home className="w-4 h-4 mr-1" />
                                {accommodationInfo.type === 'dormitory' && '기숙사'}
                                {accommodationInfo.type === 'apartment' && '아파트'}
                                {accommodationInfo.type === 'house' && '단독주택'}
                                {accommodationInfo.type === 'other' && '기타'}
                              </span>
                            )}
                            {accommodationInfo?.capacity && (
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {accommodationInfo.capacity}
                              </span>
                            )}
                      </div>
                      </div>
                    </div>
                      {accommodationInfo?.address ? (
                        <div className="flex items-start gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                          <span className="text-sm">
                            {accommodationInfo.address}
                      </span>
                    </div>
              ) : (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                          <span className="text-sm font-medium">주소 정보가 등록되지 않았습니다</span>
                        </div>
                      )}
                    </div>
                  )}
                  </div>

                {!isAccommodationSectionCollapsed && (
                  <div className="p-4 space-y-3">
                    

                    
                    {/* 지도 */}
                    {accommodationInfo?.address && (
                      <div className="bg-white rounded-lg border p-3">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">위치</h3>
                      <NaverMap
                        address={accommodationInfo.address}
                          latitude={(accommodationInfo as any)?.latitude}
                          longitude={(accommodationInfo as any)?.longitude}
                          zoom={15}
                          height="220px"
                      />
                    </div>
                  )}

                    {/* 기숙사 이미지 */}
                    {(accommodationInfo?.images || []).length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Camera className="w-5 h-5 mr-2 text-green-600" />
                          기숙사 이미지
                          <span className="ml-2 text-sm text-gray-500">({(accommodationInfo?.images || []).length}장)</span>
                        </h3>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(accommodationInfo?.images || []).map((image: string, index: number) => (
                            <div key={index} className="group">
                              <div
                                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImagePreview(image, `기숙사 이미지 ${index + 1}`);
                                }}
                              >
                                <img
                                  src={image}
                                  alt={`기숙사 이미지 ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">{index + 1}</div>
                                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  클릭하여 크게 보기
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">썸네일을 클릭하면 크게 볼 수 있습니다</p>
                      </div>
                    )}

                    {/* 이용규칙 */}
                    {accommodationInfo?.rules && (
                      <div className="bg-white rounded-lg border p-3">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">이용규칙</h3>
                        <p className="text-xs text-gray-700 line-clamp-3 whitespace-pre-wrap">{accommodationInfo.rules}</p>
                      </div>
                    )}



                    {/* 객실 유형 */}
                    {accommodationInfo?.roomTypeOptions && (
                      <div className="bg-white rounded-lg border p-3">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">객실 유형</h3>
                        <div className="flex flex-wrap gap-2">
                          {accommodationInfo.roomTypeOptions.singleRoom && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              1인실
                              {accommodationInfo.roomPrices?.singleRoom && Number(accommodationInfo.roomPrices.singleRoom) > 0 && (
                                <span className="ml-1 font-medium">{Number(accommodationInfo.roomPrices.singleRoom).toLocaleString()}원</span>
                              )}
                      </span>
                          )}
                          {accommodationInfo.roomTypeOptions.doubleRoom && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              2인실
                              {accommodationInfo.roomPrices?.doubleRoom && Number(accommodationInfo.roomPrices.doubleRoom) > 0 && (
                                <span className="ml-1 font-medium">{Number(accommodationInfo.roomPrices.doubleRoom).toLocaleString()}원</span>
                              )}
                            </span>
                          )}
                          {accommodationInfo.roomTypeOptions.tripleRoom && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              3인실
                              {accommodationInfo.roomPrices?.tripleRoom && Number(accommodationInfo.roomPrices.tripleRoom) > 0 && (
                                <span className="ml-1 font-medium">{Number(accommodationInfo.roomPrices.tripleRoom).toLocaleString()}원</span>
                              )}
                            </span>
                          )}
                          {accommodationInfo.roomTypeOptions.quadRoom && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              4인실
                              {accommodationInfo.roomPrices?.quadRoom && Number(accommodationInfo.roomPrices.quadRoom) > 0 && (
                                <span className="ml-1 font-medium">{Number(accommodationInfo.roomPrices.quadRoom).toLocaleString()}원</span>
                              )}
                            </span>
                          )}
                          {accommodationInfo.roomTypeOptions.otherRoom && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              기타{accommodationInfo.otherRoomType && ` (${accommodationInfo.otherRoomType})`}
                              {accommodationInfo.roomPrices?.otherRoom && Number(accommodationInfo.roomPrices.otherRoom) > 0 && (
                                <span className="ml-1 font-medium">{Number(accommodationInfo.roomPrices.otherRoom).toLocaleString()}원</span>
                              )}
                            </span>
                          )}
                    </div>
                  </div>
                    )}

                    {/* 객실 시설 */}
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">객실 시설</h3>
                      {(accommodationInfo?.facilities && accommodationInfo.facilities.length > 0) ? (
                        <div className="flex flex-wrap gap-1">
                          {accommodationInfo.facilities.map((f: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              {f}
                        </span>
                      ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">등록된 객실 시설이 없습니다.</p>
                    </div>
                  )}
                    </div>

                    {/* 부대 시설 */}
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">부대 시설</h3>
                      {(accommodationInfo?.amenities && accommodationInfo.amenities.length > 0) ? (
                        <div className="flex flex-wrap gap-1">
                          {accommodationInfo.amenities.map((a: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                              {a}
                        </span>
                      ))}
                            </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">등록된 부대시설이 없습니다.</p>
                          </div>
                      )}
                    </div>

                    {/* 비용 정보 */}
                    {(accommodationInfo.deposit || accommodationInfo.mealCostType || accommodationInfo.utilitiesCostType) && (
                      <div className="bg-white rounded-lg border p-3">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">비용 정보</h3>
                        <div className="space-y-2 text-xs">
                          {typeof accommodationInfo.deposit === 'number' && accommodationInfo.deposit > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">보증금</span>
                              <span className="text-gray-900 font-medium">{(accommodationInfo.deposit || 0).toLocaleString()}원</span>
                  </div>
                          )}
                          
                          {/* 식사 비용 정보 */}
                          {accommodationInfo.mealCostType && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">식사</span>
                              <span className="text-gray-900 font-medium">
                                {accommodationInfo.mealCostType === '무료' ? '무료' : `${(accommodationInfo.mealCostAmount || 0).toLocaleString()}원`}
                        </span>
                </div>
              )}
                          
                          {/* 부대비용 정보 */}
                          {accommodationInfo.utilitiesCostType && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">부대비용</span>
                              <span className="text-gray-900 font-medium">
                                {accommodationInfo.utilitiesCostType === '무료' ? '무료' : 
                                  accommodationInfo.utilitiesCostType === '실비' ? '실비' : 
                                    `${(accommodationInfo.utilitiesCostAmount || 0).toLocaleString()}원`}
                              </span>
            </div>
                          )}
          </div>
        </div>
              )}

                    {/* 기타 */}
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">기타</h3>
                      {isAccommodationEditing ? (
                        <textarea
                          value={accommodationEditData.description || accommodationInfo?.description || ''}
                          onChange={(e) => handleAccommodationInputChange('description', e.target.value)}
                          className="w-full text-sm text-gray-800 border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                          placeholder="기숙사에 대한 설명을 입력하세요"
                          rows={3}
                        />
                      ) : (
                        accommodationInfo?.description ? (
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{accommodationInfo.description}</p>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">등록된 기타 설명이 없습니다.</p>
            </div>
                        )
                      )}
          </div>



                    {/* 연락처 */}
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">연락처</h3>
                      {isAccommodationEditing ? (
                        // 편집 모드
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                            <input
                              type="text"
                              value={accommodationEditData.contactPerson || accommodationInfo?.contactPerson || ''}
                              onChange={(e) => handleAccommodationInputChange('contactPerson', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
                              placeholder="담당자명을 입력하세요"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                            <input
                              type="text"
                              value={accommodationEditData.contactPhone || accommodationInfo?.contactPhone || ''}
                              onChange={(e) => handleAccommodationInputChange('contactPhone', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
                              placeholder="연락처를 입력하세요"
                            />
                          </div>
                        </div>
                      ) : (
                        // 표시 모드
                        (accommodationInfo?.contactPerson || accommodationInfo?.contactPhone || (accommodationInfo as any)?.contactEmail || companyInfo?.contactPerson || companyInfo?.contactPhone || companyInfo?.phone || companyInfo?.contactEmail || user?.email) ? (
                          <div className="space-y-1 text-sm">
                            {(accommodationInfo?.contactPerson || companyInfo?.contactPerson) && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">담당자</span>
                                <span className="text-gray-900">{accommodationInfo?.contactPerson || companyInfo?.contactPerson}</span>
                              </div>
                            )}
                            {(accommodationInfo?.contactPhone || companyInfo?.contactPhone || companyInfo?.phone) && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">연락처</span>
                                <span className="text-gray-900">{accommodationInfo?.contactPhone || companyInfo?.contactPhone || companyInfo?.phone}</span>
                              </div>
                            )}
                            {((accommodationInfo as any)?.contactEmail || companyInfo?.contactEmail || user?.email) && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">이메일</span>
                                <span className="text-gray-900">{(accommodationInfo as any)?.contactEmail || companyInfo?.contactEmail || user?.email}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">등록된 연락처가 없습니다.</p>
                          </div>
                        )
                      )}
        </div>

                    {/* 관련 링크 */}
                    {accommodationInfo.externalLinks && accommodationInfo.externalLinks.length > 0 && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">관련 링크</h3>
                        <div className="space-y-2">
                          {accommodationInfo.externalLinks.map((link: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{link.type}</span>
                                <span className="text-sm font-medium text-gray-900">{link.title}</span>
                                {link.description && (
                                  <span className="text-sm text-gray-600">{link.description}</span>
                                )}
                              </div>
                              {link.url && (
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                                  방문
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-green-100 bg-green-50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-orange-600" />
                      </div>
                        기숙사
                    </h3>
                    <div className="flex items-center gap-2">
                      {isAccommodationEditing ? (
                        <>
                          <button
                            onClick={handleAccommodationEditSave}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleAccommodationEditCancel}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleAccommodationEdit}
                          className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                        >
                          {accommodationInfo ? '수정' : '등록'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
          <div className="p-6">
                  {!accommodationInfo ? (
                    <>
                      {/* 기숙사 정보 없을 때 안내문 */}
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-green-600 text-xs">ℹ</span>
                          </div>
                          <div className="text-xs text-green-700">
                            <p className="font-medium mb-1">기숙사 정보 등록 안내</p>
                            <p>기숙사 정보를 등록하면 구직자들이 기숙사 목록에서 해당 정보를 확인할 수 있습니다. 등록 후에는 공개/비공개 설정을 통해 정보 노출을 관리할 수 있습니다.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Home className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">기숙사 정보가 등록되지 않았습니다</h4>
                        <p className="text-sm text-gray-600 mb-4">구직자들이 기숙사 정보를 확인할 수 있도록 상세 정보를 등록해보세요</p>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">• 기숙사 유형 및 위치 정보</p>
                          <p className="text-xs text-gray-500">• 객실별 비용 및 시설 정보</p>
                          <p className="text-xs text-gray-500">• 기숙사 이미지 및 규칙</p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* 구인 현황 (메인 영역) */}
          {/* 섹션 임시 제거: 파싱 오류 해결 후 재도입 예정 */}
          {/* <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">구인 현황</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-xl border border-blue-100 p-6 bg-blue-50">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3"></div>
                <div className="text-sm font-medium text-gray-700">총 공고</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{jobPosts.length}개</div>
              </div>
              <div className="rounded-xl border border-emerald-100 p-6 bg-emerald-50">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3"></div>
                <div className="text-sm font-medium text-gray-700">총 지원자</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{applications.length}명</div>
              </div>
              <div className="rounded-xl border border-amber-100 p-6 bg-amber-50">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3"></div>
                <div className="text-sm font-medium text-gray-700">검토 대기</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{applications.filter(app => app.status === 'pending').length}명</div>
              </div>
              <div className="rounded-xl border border-purple-100 p-6 bg-purple-50">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3"></div>
                <div className="text-sm font-medium text-gray-700">채용 완료</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{applications.filter(app => app.status === 'accepted').length}명</div>
              </div>
            </div>
          </div> */}

          {/* 4. 구인공고 */}
          <div id="job-posts" className="mt-8 lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    구인공고
                  </h3>
                  <div className="flex items-center gap-2">
              <Link
                      to="/job-post/new"
                      className="inline-flex items-center px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold border border-gray-300"
                    >
                      <Plus className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">새 공고 등록</span>
                    </Link>
                </div>
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                {/* 공고 목록 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    공고 목록
                  </h4>
                  {jobPosts.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-4">등록된 공고가 없습니다.</p>
              <Link
                        to="/job-post/new"
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="w-4 w-4 mr-1" />
                        첫 공고 등록하기
                      </Link>
                </div>
                  ) : (
                    <div className="space-y-2">
                      {jobPosts.map((post) => (
                        <div key={post.id} className="group flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900 flex-shrink-0">{post.title}</h5>
                                <span className="text-sm text-gray-500 truncate">{post.description}</span>
                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
                              <span className="text-green-600 whitespace-nowrap">
                                {post.location}
                              </span>
                              <span className="text-blue-600 font-medium whitespace-nowrap">
                                {post.salary.min.toLocaleString()}~{post.salary.max.toLocaleString()}원
                              </span>
                              <span className="text-emerald-600 font-medium whitespace-nowrap">
                                지원자 {getApplicationsForJob(post.id).length}명
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                post.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {post.isActive ? '활성' : '비활성'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Link
                              to={`/job/${post.id}`}
                              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                            >
                              보기
              </Link>
                            <Link
                              to={`/applications?jobId=${post.id}`}
                              className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                            >
                              지원자
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 근무타입 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      근무타입
                    </h4>
              <Link
                to="/work-types"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      관리
                    </Link>
                </div>
                  
                  {workTypes.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-3">등록된 근무타입이 없습니다.</p>
                      <Link
                        to="/job-post/new"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <Plus className="w-4 w-4 mr-1" />
                        근무타입 생성하기
                      </Link>
                </div>
                  ) : (
                    <div className="space-y-2">
                      {workTypes.map((workType) => (
                        <div key={workType.id} className="group flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900 flex-shrink-0">{workType.name}</h5>
                                {workType.description && (
                                  <span className="text-sm text-gray-500 truncate">{workType.description}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
                              <span className="text-emerald-600 font-medium whitespace-nowrap">
                                주 {calculateTotalHoursPerWeek(workType.schedules || [])}시간
                              </span>
                              {workType.hourlyWage && workType.hourlyWage > 0 && (
                                <span className="text-green-600 whitespace-nowrap">
                                  시급 {workType.hourlyWage.toLocaleString()}원
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                workType.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {workType.isActive !== false ? '활성' : '비활성'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 지원자 관리 */}
        <div className="mt-8 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  지원자 관리
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium border border-blue-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span>새로고침</span>
                  </button>
                  <Link
                    to="/applications"
                    className="inline-flex items-center px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    <span>전체 관리로 이동</span>
              </Link>
            </div>
          </div>
        </div>
            <div className="p-5 space-y-5">
              {/* 지원자 요약 */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">지원자 요약</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <div className="text-sm text-gray-600">총 지원</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">{applications.length}명</div>
                  </div>
                  <div className="rounded-lg border border-blue-100 p-4 bg-blue-50">
                    <div className="text-sm text-gray-700">검토중</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'pending').length}명</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 p-4 bg-emerald-50">
                    <div className="text-sm text-gray-700">채용됨</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'accepted').length}명</div>
                  </div>
                  <div className="rounded-lg border border-rose-100 p-4 bg-rose-50">
                    <div className="text-sm text-gray-700">거절됨</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'rejected').length}명</div>
                  </div>
                </div>
              </div>

              {/* 최신 지원 리스트 */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  최근 지원자 ({applications.length}명)
                </h4>
                {applications.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-600">
                    <p>아직 지원자가 없습니다.</p>
                    <p className="text-sm text-gray-500 mt-1">공고를 등록하면 지원자들이 나타날 것입니다.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...applications]
                      .sort((a: any, b: any) => {
                        const ta = a.appliedAt?.toDate ? a.appliedAt.toDate().getTime() : (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
                        const tb = b.appliedAt?.toDate ? b.appliedAt.toDate().getTime() : (b.appliedAt ? new Date(b.appliedAt).getTime() : 0);
                        return tb - ta;
                      })
                      .slice(0, 5)
                      .map((app) => (
                        <div 
                          key={app.id} 
                          className="group flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/applications?jobId=${app.jobPostId}`)}
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900 flex-shrink-0 truncate">{app.jobseekerName || '지원자'}</h5>
                                <span className="text-sm text-gray-500 truncate">{getJobTitleById(app.jobPostId)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">{app.phone || '연락처 없음'}</span>
                                {app.hourlyWage && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    희망시급: {app.hourlyWage.toLocaleString()}원
                                  </span>
                                )}
                                {app.email && (
                                  <span className="text-xs text-gray-500">
                                    {app.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  app.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {app.status === 'accepted' ? '채용됨' :
                                  app.status === 'pending' ? '검토중' :
                                    app.status === 'rejected' ? '거절됨' : '상태 없음'}
                              </span>
                              <span className="text-gray-500 whitespace-nowrap">{formatAppliedDate(app.appliedAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={`/applications?jobId=${app.jobPostId}`}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              상세보기
                            </Link>
                            <Link
                              to={'/applications'}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                            >
                              전체보기
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 이미지 미리보기 모달 */}
        <ImagePreviewModal
          isOpen={!!previewImage}
          imageUrl={previewImage || ''}
          imageName={previewImageName}
          onClose={() => {
            setPreviewImage(null);
            setPreviewImageName('');
          }}
        />
      </div>
    </div>
  );
};

export default EmployerDashboard;


