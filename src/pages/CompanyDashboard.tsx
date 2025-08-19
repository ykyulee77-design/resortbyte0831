import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Home, ChevronRight, ChevronDown, Plus, FileText, Users, Eye, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ImagePreviewModal from '../components/ImagePreviewModal';

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
  const [isCompanySectionCollapsed, setIsCompanySectionCollapsed] = useState(false);
  const [isAccommodationSectionCollapsed, setIsAccommodationSectionCollapsed] = useState(false);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 이미지 미리보기 핸들러
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '이미지');
  };

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
                        to={`/company/${user?.uid}`}
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
                        <p className="text-gray-900 font-medium">{companyInfo?.name || '미등록'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">지역</span>
                        <p className="text-gray-900 font-medium">{companyInfo?.region || '미등록'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">업종</span>
                        <p className="text-gray-900 font-medium">{companyInfo?.industry || '미등록'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">규모</span>
                        <p className="text-gray-900 font-medium">{companyInfo?.size || '미등록'}</p>
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
                                             {companyInfo?.dormitory && user?.uid && (
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
                        to={`/accommodation/${user?.uid}`}
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
                          <div className="flex justify-between">
                            <span className="text-gray-500">월세:</span>
                            <span className="font-medium">{accommodationInfo.monthlyRent?.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">입주 가능:</span>
                            <span className={`font-medium ${accommodationInfo.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                              {accommodationInfo.isAvailable ? '가능' : '불가능'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">위치 정보</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">주소:</span>
                            <p className="font-medium">{accommodationInfo.address}</p>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">직장까지 거리:</span>
                            <span className="font-medium">{accommodationInfo.distanceFromWorkplace}</span>
                          </div>
                          {accommodationInfo.contractPeriod && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">계약 기간:</span>
                              <span className="font-medium">{accommodationInfo.contractPeriod}</span>
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

                    {/* 기숙사 소개 */}
                    {accommodationInfo.description && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">기숙사 소개</h3>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{accommodationInfo.description}</p>
                      </div>
                    )}

                    {/* 객실 유형 */}
                    {accommodationInfo.roomTypes && accommodationInfo.roomTypes.length > 0 && (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">객실 유형</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {accommodationInfo.roomTypes.map((room: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-gray-900">{room.type}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${room.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{room.available > 0 ? '예약 가능' : '예약 불가'}</span>
                              </div>
                              <div className="text-sm text-gray-700 space-y-0.5">
                                <div>수용인원: {room.capacity}명</div>
                                <div>월세: {(room.price || 0).toLocaleString()}원</div>
                                <div>가용실: {room.available}개</div>
                                {room.description && <div className="text-gray-600">{room.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 시설 / 공과금 */}
                    {(accommodationInfo.facilities && accommodationInfo.facilities.length > 0) || (accommodationInfo.utilities && accommodationInfo.utilities.length > 0) ? (
                      <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">시설 정보</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">제공 시설</h4>
                            {accommodationInfo.facilities && accommodationInfo.facilities.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                {accommodationInfo.facilities.map((f: string, i: number) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">등록된 시설이 없습니다.</p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">공과금</h4>
                            {accommodationInfo.utilities && accommodationInfo.utilities.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                {accommodationInfo.utilities.map((u: string, i: number) => (
                                  <li key={i}>{u}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">등록된 공과금 정보가 없습니다.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* 비용 정보 */}
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">비용 정보</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">기본 월세</span>
                          <span className="text-gray-900 font-semibold">{(accommodationInfo.monthlyRent || 0).toLocaleString()}원</span>
                        </div>
                        {typeof accommodationInfo.deposit === 'number' && accommodationInfo.deposit > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">보증금</span>
                            <span className="text-gray-900">{(accommodationInfo.deposit || 0).toLocaleString()}원</span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium text-gray-700 mb-1">객실별 월세</div>
                          {accommodationInfo.roomTypes && accommodationInfo.roomTypes.length > 0 ? (
                            <div className="space-y-1">
                              {accommodationInfo.roomTypes.map((room: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">{room.type}</span>
                                  <span className="text-gray-900">{(room.price || 0).toLocaleString()}원</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">등록된 객실 정보가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    </div>

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
                        to={`/accommodation/${user?.uid}`}
                        className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        수정
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">등록된 기숙사 정보가 없습니다.</p>
                    {user?.uid && (
                      <Link
                        to={`/accommodation/${user.uid}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        기숙사 정보 등록
                      </Link>
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

        {/* 4. 구인공고 목록 */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  구인공고 목록
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
            
            <div className="p-6">
              {jobPosts.length === 0 ? (
                <div className="text-center py-8">
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
                <div className="space-y-4">
                  {jobPosts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{post.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {post.location}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {post.salary.min.toLocaleString()}원 ~ {post.salary.max.toLocaleString()}원
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {post.isActive ? '활성' : '비활성'}
                            </span>
                          </div>
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
