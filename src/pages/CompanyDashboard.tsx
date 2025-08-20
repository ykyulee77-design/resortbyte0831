import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Home, ChevronRight, ChevronDown, Plus, FileText, Users, Eye, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { workTypeService } from '../utils/scheduleMatchingService';

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
}

// 총 근무시간 계산 함수
const calculateTotalHoursPerWeek = (schedules: any[]): number => {
  return schedules.reduce((total, slot) => {
    const hoursInSlot = slot.end > slot.start ? slot.end - slot.start : (24 - slot.start) + slot.end;
    return total + hoursInSlot;
  }, 0);
};

const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCompanySectionCollapsed, setIsCompanySectionCollapsed] = useState(false);
  const [isAccommodationSectionCollapsed, setIsAccommodationSectionCollapsed] = useState(false);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companyRegistrants, setCompanyRegistrants] = useState<any[]>([]); // 등록자 목록 추가
  const [workTypes, setWorkTypes] = useState<any[]>([]); // 근무타입 목록 추가
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 이미지 미리보기 핸들러
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '이미지');
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
            where('employerId', '==', user.uid)
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
              const userData = userDoc.data();
              
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
                  contactPhone: userData.contactPhone
                };
                
                // companyInfo 컬렉션에 저장
                try {
                  await setDoc(doc(db, 'companyInfo', user.uid), {
                    ...companyData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
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
              where('name', '==', companyData.name)
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
                      contactEmail: userData.email || registrantData.contactEmail || '이메일 미등록'
                    };
                  }
                } catch (userError) {
                  console.error(`사용자 ${docSnapshot.id} 정보 가져오기 오류:`, userError);
                }
                
                return {
                  id: docSnapshot.id,
                  ...registrantData,
                  contactEmail: registrantData.contactEmail || '이메일 미등록'
                };
              })
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
              where('employerId', '==', user.uid)
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

        // 3. 구인공고 로딩
        try {
          const jobPostsQuery = query(
            collection(db, 'jobPosts'),
            where('employerId', '==', user.uid)
          );
          const jobPostsSnapshot = await getDocs(jobPostsQuery);
          const jobPostsData = jobPostsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as JobPost[];
          
          setJobPosts(jobPostsData);
        } catch (error) {
          console.error('jobPosts 로딩 오류:', error);
        }

        // 4. 지원서 로딩
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('employerId', '==', user.uid)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
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
    return applications.filter(app => app.jobPostId === jobId);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">회사 대시보드</h1>
          <p className="mt-2 text-gray-600">회사 정보와 구인 현황을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. 회사 정보 섹션 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 회사 기본 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-4 h-4 text-blue-600" />
                      </div>
                      회사 정보
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/company/${user?.uid}?edit=true`}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => setIsCompanySectionCollapsed(!isCompanySectionCollapsed)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isCompanySectionCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              
              {!isCompanySectionCollapsed && (
                <div className="p-6 space-y-6">
                  {/* 회사 기본 정보 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">회사명</span>
                        {companyInfo?.name ? (
                          <p className="text-gray-900 font-medium">{companyInfo.name}</p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">필수 입력</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">주소</span>
                        {companyInfo?.address || companyInfo?.companyAddress ? (
                          <p className="text-gray-900 font-medium">
                            {companyInfo.address || companyInfo.companyAddress}
                          </p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">필수 입력</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">업종</span>
                        {companyInfo?.industry ? (
                          <p className="text-gray-900 font-medium">{companyInfo.industry}</p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">선택 입력</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">규모</span>
                        {companyInfo?.size || companyInfo?.companySize ? (
                          <p className="text-gray-900 font-medium">{companyInfo.size || companyInfo.companySize}</p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">선택 입력</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">사업자등록번호</span>
                        {companyInfo?.businessNumber ? (
                          <p className="text-gray-900 font-medium">{companyInfo.businessNumber}</p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">선택 입력</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">담당자명</span>
                        {companyInfo?.contactPerson ? (
                          <p className="text-gray-900 font-medium">{companyInfo.contactPerson}</p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">선택 입력</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 연락처 정보 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">연락처 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">회사 전화번호</span>
                        {companyInfo?.phone || companyInfo?.companyPhone ? (
                          <p className="text-gray-900 font-medium">{companyInfo.phone || companyInfo.companyPhone}</p>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">필수 입력</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">회사 웹사이트</span>
                        {companyInfo?.website || companyInfo?.companyWebsite ? (
                          <a 
                            href={companyInfo.website || companyInfo.companyWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            {companyInfo.website || companyInfo.companyWebsite}
                          </a>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-500 font-medium">미등록</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">선택 입력</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 담당자 목록 */}
                  {companyRegistrants.length > 0 && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        담당자 ({companyRegistrants.length}명)
                      </h3>
                      <div className="space-y-3">
                        {companyRegistrants.map((registrant, index) => (
                          <div 
                            key={registrant.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                              registrant.id === user?.uid 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-gray-50 border-gray-200'
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
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                registrant.id === user?.uid 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-300 text-gray-700'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {registrant.contactPerson || '담당자명 미등록'}
                                  {registrant.id === user?.uid && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      나
                                    </span>
                                  )}
                                </p>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <p>{registrant.contactEmail || '이메일 미등록'}</p>
                                  <p>{registrant.contactPhone || '연락처 미등록'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-gray-500">
                                {registrant.createdAt ? new Date(registrant.createdAt.toDate()).toLocaleDateString() : '등록일 미상'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        * 같은 회사에 등록된 모든 담당자 목록입니다. 클릭하면 상세 정보를 볼 수 있습니다.
                      </p>
                    </div>
                  )}
                  
                  {/* 회사 소개 & 이미지 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">회사 소개</h3>
                    {companyInfo?.description ? (
                      <p className="text-sm text-gray-800 leading-6 whitespace-pre-wrap mb-3">
                        {companyInfo.description}
                      </p>
                    ) : (
                      <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-orange-600 text-xs font-bold">!</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-800">회사 소개가 등록되지 않았습니다</p>
                            <p className="text-xs text-orange-600 mt-1">구직자들이 회사를 더 잘 이해할 수 있도록 소개를 작성해주세요</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {companyInfo?.images && companyInfo.images.length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {companyInfo.images.map((image: string, index: number) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer group" onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}>
                            <img
                              src={image}
                              alt={`회사 이미지 ${index + 1}`}
                              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 복리후생 & 회사 문화 & 근무 환경 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">복리후생</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">복리후생</h4>
                        {companyInfo?.benefits && companyInfo.benefits.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {companyInfo.benefits.map((benefit: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-600 mb-1">등록된 복리후생 정보가 없습니다</p>
                            <p className="text-xs text-orange-500">구직자들이 관심을 가질 수 있는 복리후생을 등록해보세요</p>
                          </div>
                        )}
                      </div>

                    </div>
                    {companyInfo?.culture && (
                      <div className="mt-3 p-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">회사 문화</h4>
                        <p className="text-sm font-medium text-gray-900">{companyInfo.culture}</p>
                      </div>
                    )}
                  </div>


                </div>
              )}
            </div>

            {/* 2. 기숙사 상세 정보 */}
            {accommodationInfo ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-orange-600" />
                      </div>
                      기숙사 상세 정보
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/accommodation/${user?.uid}?edit=true`}
                        className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => setIsAccommodationSectionCollapsed(!isAccommodationSectionCollapsed)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isAccommodationSectionCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {!isAccommodationSectionCollapsed && (
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">기본 정보</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">기숙사명:</span>
                            <span className="font-medium">{accommodationInfo.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">유형:</span>
                            <span className="font-medium">
                              {accommodationInfo.type === 'dormitory' && '기숙사'}
                              {accommodationInfo.type === 'apartment' && '아파트'}
                              {accommodationInfo.type === 'house' && '단독주택'}
                              {accommodationInfo.type === 'other' && '기타'}
                            </span>
                          </div>
                          {/* 유형은 위에서 이미 노출되므로 중복 제거 */}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">위치 정보</h3>
                        <div className="text-sm space-y-2">
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 shrink-0">주소</span>
                            <div className="font-medium text-gray-900 flex-1 break-words whitespace-pre-wrap">{accommodationInfo.address}</div>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 shrink-0">직장까지 거리</span>
                            <span className="font-medium text-gray-900">{accommodationInfo.distanceFromWorkplace}</span>
                          </div>
                          {accommodationInfo.contractPeriod && (
                            <div className="flex items-start">
                              <span className="text-gray-500 w-24 shrink-0">계약 기간</span>
                              <span className="font-medium text-gray-900">{accommodationInfo.contractPeriod}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {accommodationInfo?.images && accommodationInfo.images.length > 0 && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">기숙사 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {accommodationInfo.images.map((image: string, index: number) => (
                            <div key={index} className="cursor-pointer group" onClick={() => handleImagePreview(image, `기숙사 이미지 ${index + 1}`)}>
                              <img 
                                key={index} 
                                src={image} 
                                alt={`기숙사 이미지 ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 기타 */}
                    {accommodationInfo.description && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">기타</h3>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{accommodationInfo.description}</p>
                      </div>
                    )}

                    {/* 객실 유형 */}
                    {(accommodationInfo.roomTypeOptions || accommodationInfo.roomTypes) && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">객실 Type</h3>
                        {accommodationInfo.roomTypeOptions ? (
                          // 새로운 구조: roomTypeOptions 사용
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">요금 유형</span>
                              <span className="text-gray-900">
                                {accommodationInfo.paymentType === 'free' ? '무료' : '유료'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {accommodationInfo.roomTypeOptions.singleRoom && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">1인실</span>
                                  {accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.singleRoom && (
                                    <span className="text-gray-900">{accommodationInfo.roomPrices.singleRoom}천원</span>
                                  )}
                                </div>
                              )}
                              {accommodationInfo.roomTypeOptions.doubleRoom && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">2인실</span>
                                  {accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.doubleRoom && (
                                    <span className="text-gray-900">{accommodationInfo.roomPrices.doubleRoom}천원</span>
                                  )}
                                </div>
                              )}
                              {accommodationInfo.roomTypeOptions.tripleRoom && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">3인실</span>
                                  {accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.tripleRoom && (
                                    <span className="text-gray-900">{accommodationInfo.roomPrices.tripleRoom}천원</span>
                                  )}
                                </div>
                              )}
                              {accommodationInfo.roomTypeOptions.quadRoom && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">4인실</span>
                                  {accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.quadRoom && (
                                    <span className="text-gray-900">{accommodationInfo.roomPrices.quadRoom}천원</span>
                                  )}
                                </div>
                              )}
                              {accommodationInfo.roomTypeOptions.otherRoom && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    기타{accommodationInfo.otherRoomType && ` (${accommodationInfo.otherRoomType})`}
                                  </span>
                                  {accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices?.otherRoom && (
                                    <span className="text-gray-900">{accommodationInfo.roomPrices.otherRoom}천원</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          // 기존 구조: roomTypes 사용 (하위 호환성)
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {accommodationInfo.roomTypes.map((room: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-3">
                                <h4 className="font-semibold text-gray-900 mb-1">{room.type}</h4>
                                <div className="text-sm text-gray-700 space-y-0.5">
                                  {room.description && <div className="text-gray-600">{room.description}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 객실 시설 */}
                    {(accommodationInfo.wifi || accommodationInfo.tv || accommodationInfo.refrigerator || 
                      accommodationInfo.airConditioning || accommodationInfo.laundry || accommodationInfo.kitchen || 
                      accommodationInfo.parkingAvailable || accommodationInfo.petAllowed || accommodationInfo.smokingAllowed || 
                      accommodationInfo.otherFacilities) && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">객실 시설</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {accommodationInfo.wifi && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 와이파이</span>
                            </div>
                          )}
                          {accommodationInfo.tv && (
                            <div className="flex items-center text-green-600">
                              <span>✓ TV</span>
                            </div>
                          )}
                          {accommodationInfo.refrigerator && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 냉장고</span>
                            </div>
                          )}
                          {accommodationInfo.airConditioning && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 에어컨</span>
                            </div>
                          )}
                          {accommodationInfo.laundry && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 세탁기</span>
                            </div>
                          )}
                          {accommodationInfo.kitchen && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 주방</span>
                            </div>
                          )}
                          {accommodationInfo.parkingAvailable && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 주차 가능</span>
                            </div>
                          )}
                          {accommodationInfo.petAllowed && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 반려동물 허용</span>
                            </div>
                          )}
                          {accommodationInfo.smokingAllowed && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 흡연 허용</span>
                            </div>
                          )}
                          {accommodationInfo.otherFacilities && (
                            <div className="flex items-center text-green-600">
                              <span>✓ 기타</span>
                              {accommodationInfo.otherFacilitiesText && (
                                <span className="text-gray-700 text-sm ml-1">
                                  ({accommodationInfo.otherFacilitiesText})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 부대 시설 */}
                    {(accommodationInfo.facilityOptions || accommodationInfo.facilities) && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">부대 시설</h3>
                        {accommodationInfo.facilityOptions ? (
                          // 새로운 구조: facilityOptions 사용
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {accommodationInfo.facilityOptions.parking && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 주차장</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.laundry && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 세탁실</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.kitchen && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 공용주방</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.gym && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 체육관</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.studyRoom && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 스터디룸</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.lounge && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 휴게실</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.wifi && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 와이파이</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.security && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 보안시설</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.elevator && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 엘리베이터</span>
                              </div>
                            )}
                            {accommodationInfo.facilityOptions.other && (
                              <div className="flex items-center text-green-600">
                                <span>✓ 기타</span>
                                {accommodationInfo.otherFacilityText && (
                                  <span className="text-gray-700 text-sm ml-1">
                                    ({accommodationInfo.otherFacilityText})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          // 기존 구조: facilities 사용 (하위 호환성)
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {accommodationInfo.facilities.map((f: string, i: number) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 비용 정보 */}
                    {(accommodationInfo.deposit || accommodationInfo.roomTypeOptions || accommodationInfo.mealCostType || accommodationInfo.utilitiesCostType) && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">비용 정보</h3>
                        <div className="space-y-2 text-sm">
                          {typeof accommodationInfo.deposit === 'number' && accommodationInfo.deposit > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">보증금</span>
                              <span className="text-gray-900">{(accommodationInfo.deposit || 0).toLocaleString()}원</span>
                            </div>
                          )}
                          
                          {/* 객실 비용 정보 */}
                          {accommodationInfo.roomTypeOptions && (
                            <div className="pt-2 border-t">
                              <div className="text-sm font-medium text-gray-700 mb-1">객실 비용</div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">요금 유형</span>
                                <span className="text-gray-900">
                                  {accommodationInfo.paymentType === 'free' ? '무료' : '유료'}
                                </span>
                              </div>
                              {accommodationInfo.paymentType === 'paid' && accommodationInfo.roomPrices && (
                                <div className="space-y-1 mt-2">
                                  {accommodationInfo.roomTypeOptions.singleRoom && accommodationInfo.roomPrices.singleRoom && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">1인실</span>
                                      <span className="text-gray-900">{accommodationInfo.roomPrices.singleRoom}천원</span>
                                    </div>
                                  )}
                                  {accommodationInfo.roomTypeOptions.doubleRoom && accommodationInfo.roomPrices.doubleRoom && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">2인실</span>
                                      <span className="text-gray-900">{accommodationInfo.roomPrices.doubleRoom}천원</span>
                                    </div>
                                  )}
                                  {accommodationInfo.roomTypeOptions.tripleRoom && accommodationInfo.roomPrices.tripleRoom && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">3인실</span>
                                      <span className="text-gray-900">{accommodationInfo.roomPrices.tripleRoom}천원</span>
                                    </div>
                                  )}
                                  {accommodationInfo.roomTypeOptions.quadRoom && accommodationInfo.roomPrices.quadRoom && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">4인실</span>
                                      <span className="text-gray-900">{accommodationInfo.roomPrices.quadRoom}천원</span>
                                    </div>
                                  )}
                                  {accommodationInfo.roomTypeOptions.otherRoom && accommodationInfo.roomPrices.otherRoom && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">
                                        기타{accommodationInfo.otherRoomType && ` (${accommodationInfo.otherRoomType})`}
                                      </span>
                                      <span className="text-gray-900">{accommodationInfo.roomPrices.otherRoom}천원</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 식사 비용 정보 */}
                          {(accommodationInfo.mealCostType || (accommodationInfo as any).mealNote) && (
                            <div className="pt-2 border-t">
                              <div className="text-sm font-medium text-gray-700 mb-1">식사 비용</div>
                              {accommodationInfo.mealCostType && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">식사 제공</span>
                                  <span className="text-gray-900">
                                    {accommodationInfo.mealCostType === '무료' ? '무료' : `${(accommodationInfo.mealCostAmount || 0).toLocaleString()}원`}
                                  </span>
                                </div>
                              )}
                              {(accommodationInfo as any).mealNote && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {(accommodationInfo as any).mealNote}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 부대비용 정보 */}
                          {accommodationInfo.utilitiesCostType && (
                            <div className="pt-2 border-t">
                              <div className="text-sm font-medium text-gray-700 mb-1">부대비용</div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">사용료</span>
                                <span className="text-gray-900">
                                  {accommodationInfo.utilitiesCostType === '무료' ? '무료' : 
                                   accommodationInfo.utilitiesCostType === '실비' ? '실비' : 
                                   `${(accommodationInfo.utilitiesCostAmount || 0).toLocaleString()}원`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 규칙 */}
                    {accommodationInfo.rules && accommodationInfo.rules.length > 0 && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">기숙사 규칙</h3>
                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                          {accommodationInfo.rules.map((rule: string, i: number) => (
                            <li key={i}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 연락처 */}
                    {(accommodationInfo.contactPerson || accommodationInfo.contactPhone) && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">연락처</h3>
                        <div className="space-y-1 text-sm">
                          {accommodationInfo.contactPerson && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">담당자</span>
                              <span className="text-gray-900">{accommodationInfo.contactPerson}</span>
                            </div>
                          )}
                          {accommodationInfo.contactPhone && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">연락처</span>
                              <span className="text-gray-900">{accommodationInfo.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-orange-600" />
                      </div>
                      기숙사 상세 정보
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/accommodation/${user?.uid}?edit=true`}
                        className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        수정
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Home className="w-8 h-8 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">기숙사 정보가 등록되지 않았습니다</h4>
                    <p className="text-sm text-gray-600 mb-4">구직자들이 기숙사 정보를 확인할 수 있도록 상세 정보를 등록해보세요</p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">• 기숙사 유형 및 위치 정보</p>
                      <p className="text-xs text-gray-500">• 객실별 비용 및 시설 정보</p>
                      <p className="text-xs text-gray-500">• 기숙사 이미지 및 규칙</p>
                    </div>
                    {user?.uid && (
                      <div className="mt-6">
                        <Link
                          to={`/accommodation/${user.uid}?edit=true`}
                          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          기숙사 정보 등록하기
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. 사이드바 - 구인 현황 */}
          <div className="space-y-6">
            {/* 구인 현황 요약 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">구인 현황</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">총 공고</span>
                  <span className="text-lg font-bold text-blue-600">{jobPosts.length}개</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-900">총 지원자</span>
                  <span className="text-lg font-bold text-green-600">{applications.length}명</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-yellow-900">검토 대기</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {applications.filter(app => app.status === 'pending').length}명
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-purple-900">채용 완료</span>
                  <span className="text-lg font-bold text-purple-600">
                    {applications.filter(app => app.status === 'accepted').length}명
                  </span>
                </div>
              </div>
            </div>

            {/* 빠른 액션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
              <div className="space-y-3">
                <Link
                  to="/job-post/new"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 공고 등록
                </Link>
                <Link
                  to="/applications"
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  지원자 관리
                </Link>
                <Link
                  to={`/company/${user?.uid}`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Building className="w-4 h-4 mr-2" />
                  회사 정보 수정
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 구인공고 */}
        <div id="job-posts" className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  구인공고
                </h3>
                <Link
                  to="/job-post/new"
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  새 공고 등록
                </Link>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* 공고 목록 */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
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
                      <div key={post.id} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900 flex-shrink-0">{post.title}</h5>
                              <span className="text-sm text-gray-500 truncate">{post.description}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
                            <span className="text-blue-600 whitespace-nowrap">
                              {post.location}
                            </span>
                            <span className="text-green-600 whitespace-nowrap">
                              {post.salary.min.toLocaleString()}~{post.salary.max.toLocaleString()}원
                            </span>
                            <span className="text-purple-600 whitespace-nowrap">
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
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
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
                    <Users className="w-4 h-4 text-blue-600" />
                    근무타입
                  </h4>
                  <Link
                    to="/work-types"
                    className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
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
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 w-4 mr-1" />
                      근무타입 생성하기
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workTypes.map((workType) => (
                      <div key={workType.id} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                            <span className="text-green-600 whitespace-nowrap">
                              주 {calculateTotalHoursPerWeek(workType.schedules || [])}시간
                            </span>
                            {workType.hourlyWage && workType.hourlyWage > 0 && (
                              <span className="text-blue-600 whitespace-nowrap">
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
  );
};

export default CompanyDashboard;
