import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Home, ChevronRight, ChevronDown, Plus, FileText, Users, MessageSquare, Eye, User, Clock, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCompanySectionCollapsed, setIsCompanySectionCollapsed] = useState(true);
  const [isAccommodationSectionCollapsed, setIsAccommodationSectionCollapsed] = useState(true);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        
        // companyInfo 컬렉션에서 검색
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

        // users 컬렉션에서 검색
        if (!companyData) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              if (userData.employerInfo) {
                companyData = userData.employerInfo;
              } else {
                companyData = userData;
              }
            }
          } catch (error) {
            console.error('users 컬렉션 검색 오류:', error);
          }
        }

        setCompanyInfo(companyData);

        // 2. 기숙사 정보 로딩
        try {
          const accommodationInfoQuery = query(
            collection(db, 'accommodationInfo'),
            where('employerId', '==', user.uid)
          );
          const accommodationSnapshot = await getDocs(accommodationInfoQuery);
          
          if (!accommodationSnapshot.empty) {
            const accommodationData = accommodationSnapshot.docs[0].data();
            setAccommodationInfo(accommodationData);
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

      } catch (error) {
        console.error('전체 데이터 로딩 오류:', error);
      } finally {
      setLoading(false);
      }
    };

    if (user?.uid) {
      loadData();
    }
  }, [user?.uid]); // user.uid만 의존성으로 설정

  // 특정 공고의 지원자 수 계산
  const getApplicationsForJob = (jobPostId: string) => {
    return applications.filter(app => app.jobPostId === jobPostId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">회사 대시보드를 이용하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          회사 대시보드
        </h1>
        <p className="text-gray-600">
          안녕하세요, {companyInfo?.name || companyInfo?.companyName || user?.displayName}님! 회사 정보와 구인 현황을 관리하세요.
        </p>
      </div>

      {/* Profile Info */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              프로필 정보
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">이름:</span>
                <span className="text-gray-900 font-medium">{user?.displayName || '이름 미등록'}</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">이메일:</span>
                <span className="text-gray-900">{user?.email || '이메일 미등록'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Company Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsCompanySectionCollapsed(!isCompanySectionCollapsed)}
                className="mr-3 p-1 hover:bg-blue-100 rounded transition-colors"
              >
                {isCompanySectionCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                )}
              </button>
              <h2 className="text-xl font-bold text-blue-900 flex items-center">
                <Building className="h-6 w-6 mr-2" />
                회사
              </h2>
            </div>
            <Link
              to={`/company/${user.uid}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              수정
            </Link>
          </div>
          

          {!isCompanySectionCollapsed && (
            <div className="space-y-4">
              {/* 기본 정보 & 연락처 */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">회사명</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.name || companyInfo?.companyName || '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">업종</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.industry || '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">규모</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.companySize || '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">설립년도</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.foundedYear ? `${companyInfo.foundedYear}년` : '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">담당자</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.contactPerson || '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">이메일</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.contactEmail || '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">전화번호</h4>
                    <p className="text-sm font-medium text-gray-900">{companyInfo?.contactPhone || '미등록'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">웹사이트</h4>
                    {companyInfo?.website ? (
                      <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                        {companyInfo.website}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">미등록</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 회사 소개 & 이미지 */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">회사 소개</h3>
                <p className="text-sm text-gray-800 leading-6 whitespace-pre-wrap mb-3">
                  {companyInfo?.description || '회사 소개가 등록되지 않았습니다.'}
                </p>
                {companyInfo?.images && companyInfo.images.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {companyInfo.images.map((image: string, index: number) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img
                          src={image}
                          alt={`회사 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 복리후생 & 회사 문화 & 근무 환경 */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">복리후생 & 근무환경</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">복리후생</h4>
                    {companyInfo?.benefits && companyInfo.benefits.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {companyInfo.benefits.map((benefit: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">등록된 복리후생 정보가 없습니다.</p>
                    )}
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">근무 환경</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-blue-600 font-medium">환경:</span>
                        <span className="text-sm font-medium text-blue-900">{companyInfo?.environment || '미등록'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-blue-600 font-medium">근무타입:</span>
                        <span className="text-sm font-medium text-blue-900">{companyInfo?.workTimeType || '미등록'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-blue-600 font-medium">급여:</span>
                        <span className="text-sm font-medium text-blue-900">{companyInfo?.salaryRange || '미등록'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {companyInfo?.culture && (
                  <div className="mt-3 bg-purple-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">회사 문화</h4>
                    <p className="text-sm font-medium text-purple-900">{companyInfo.culture}</p>
                  </div>
                )}
              </div>

              {/* 기숙사 정보 */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  기숙사 정보
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide mr-2">기숙사 제공:</span>
                      <span className="text-sm font-medium text-orange-900">{companyInfo?.dormitory ? '제공' : '미제공'}</span>
                    </div>
                    {companyInfo?.dormitory && companyInfo?.dormitoryFacilities && companyInfo.dormitoryFacilities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">시설:</p>
                        <div className="flex flex-wrap gap-1">
                          {companyInfo.dormitoryFacilities.map((facility: string, index: number) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800 font-medium">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {companyInfo?.dormitory && (
                    <Link
                      to={`/accommodation/${user.uid}`}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Home className="h-3 w-3 mr-1" />
                      상세정보
                    </Link>
                  )}
                </div>
              </div>
              
              
            </div>
          )}
        </div>
      </div>

      {/* 2. Accommodation Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsAccommodationSectionCollapsed(!isAccommodationSectionCollapsed)}
                className="mr-3 p-1 hover:bg-green-100 rounded transition-colors"
              >
                {isAccommodationSectionCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-green-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-green-600" />
                )}
              </button>
              <h2 className="text-xl font-bold text-green-900 flex items-center">
                <Home className="h-6 w-6 mr-2" />
                기숙사
              </h2>
            </div>
            <Link
              to={`/accommodation/${user.uid}`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              수정
            </Link>
          </div>
          

          {!isAccommodationSectionCollapsed && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">기숙사명</h3>
                  <p className="text-gray-600">{accommodationInfo?.name || '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">기숙사 유형</h3>
                  <p className="text-gray-600">{accommodationInfo?.type || '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">주소</h3>
                  <p className="text-gray-600">{accommodationInfo?.address || '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">업무지 거리</h3>
                  <p className="text-gray-600">{accommodationInfo?.distanceFromWorkplace || '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">수용 인원</h3>
                  <p className="text-gray-600">{accommodationInfo?.capacity ? `${accommodationInfo.capacity}명` : '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">현재 거주자</h3>
                  <p className="text-gray-600">{accommodationInfo?.currentOccupancy ? `${accommodationInfo.currentOccupancy}명` : '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">월세</h3>
                  <p className="text-gray-600">{accommodationInfo?.monthlyRent ? `${accommodationInfo.monthlyRent.toLocaleString()}원` : '미등록'}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">보증금</h3>
                  <p className="text-gray-600">{accommodationInfo?.deposit ? `${accommodationInfo.deposit.toLocaleString()}원` : '미등록'}</p>
                </div>
              </div>
              
              {accommodationInfo?.description && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">기숙사 소개</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{accommodationInfo.description}</p>
                </div>
              )}
              
              {accommodationInfo?.facilities && accommodationInfo.facilities.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">시설</h3>
                  <div className="flex flex-wrap gap-2">
                    {accommodationInfo.facilities.map((facility: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {accommodationInfo?.roomTypes && accommodationInfo.roomTypes.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">객실 유형</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accommodationInfo.roomTypes.map((roomType: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-1">{roomType.name}</h4>
                        <p className="text-sm text-gray-600">수용인원: {roomType.capacity}명</p>
                        <p className="text-sm text-gray-600">월세: {roomType.monthlyRent?.toLocaleString()}원</p>
                        {roomType.description && (
                          <p className="text-sm text-gray-600 mt-1">{roomType.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {accommodationInfo?.utilities && accommodationInfo.utilities.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">공과금</h3>
                  <div className="flex flex-wrap gap-2">
                    {accommodationInfo.utilities.map((utility: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {utility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {accommodationInfo?.rules && accommodationInfo.rules.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">기숙사 규칙</h3>
                  <div className="space-y-2">
                    {accommodationInfo.rules.map((rule: string, index: number) => (
                      <p key={index} className="text-gray-600 text-sm">• {rule}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {accommodationInfo?.contactPerson && accommodationInfo?.contactPhone && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">기숙사 연락처</h3>
                  <div className="space-y-1">
                    <p className="text-gray-600">담당자: {accommodationInfo.contactPerson}</p>
                    <p className="text-gray-600">전화: {accommodationInfo.contactPhone}</p>
                  </div>
                </div>
              )}
              
              {accommodationInfo?.contractPeriod && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">계약 기간</h3>
                  <p className="text-gray-600">{accommodationInfo.contractPeriod}</p>
                </div>
              )}
              
              {accommodationInfo?.images && accommodationInfo.images.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">기숙사 이미지</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {accommodationInfo.images.map((image: string, index: number) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`기숙사 이미지 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Recruitment Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-purple-900 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              구인
            </h2>
          </div>

          {/* 구인 등록 */}
          <div className="bg-white rounded-lg border border-purple-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">
              구인 등록
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-purple-900">근무유형 관리</h4>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  근무 유형을 생성하고 관리하세요.
                </p>
                <Link
                  to="/work-types"
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  근무유형 관리
                </Link>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <FileText className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-purple-900">공고 등록</h4>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  새로운 구인공고를 등록하세요.
                </p>
                <Link
                  to="/job-post/new"
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  공고 등록
                </Link>
              </div>
            </div>
          </div>

          {/* 구인 현황 */}
          <div className="bg-white rounded-lg border border-purple-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">
              구인 현황
            </h3>
            {jobPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">등록된 공고가 없습니다.</p>
                <Link
                  to="/job-post/new"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  첫 공고 등록하기
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {jobPosts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{post.location}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>급여: {post.salary.min.toLocaleString()}~{post.salary.max.toLocaleString()}원</span>
                          <span>근무유형: {post.workTypes?.length || 0}개</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>지원자: {getApplicationsForJob(post.id).length}명</span>
                        <span>등록일: {post.createdAt?.toDate?.() ? post.createdAt.toDate().toLocaleDateString() : '날짜 없음'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/job/${post.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          보기
                        </Link>
                        <Link
                          to={`/applications?jobId=${post.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          지원자
                        </Link>
                      </div>
                    </div>
          </div>
        ))}
      </div>
            )}
          </div>
        </div>

        {/* 채용 */}
        <div className="bg-white rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">
            채용
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-900">지원자 관리</h4>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                지원자들의 이력서를 확인하고 채용 프로세스를 진행하세요.
              </p>
              <div className="text-sm text-purple-700 mb-3">
                <div className="flex justify-between mb-1">
                  <span>총 지원자:</span>
                  <span className="font-semibold">{applications.length}명</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>검토 대기:</span>
                  <span className="font-semibold">{applications.filter(app => app.status === 'pending').length}명</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>채용 완료:</span>
                  <span className="font-semibold">{applications.filter(app => app.status === 'accepted').length}명</span>
                </div>
              </div>
              <Link
                to="/applications"
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
              >
                <Users className="h-4 w-4 mr-1" />
                지원자 목록
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-900">채용 완료자</h4>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                채용이 완료된 지원자들을 확인하세요.
              </p>
              <div className="text-sm text-purple-700 mb-3">
                <div className="flex justify-between">
                  <span>채용 완료:</span>
                  <span className="font-semibold">{applications.filter(app => app.status === 'accepted').length}명</span>
                </div>
              </div>
              <Link
                to="/applications?status=accepted"
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                채용 완료자
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard; 
