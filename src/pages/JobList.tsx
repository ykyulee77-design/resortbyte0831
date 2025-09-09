import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, Search, Filter, Home, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { JobPost, AccommodationInfo } from '../types';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { applyPagination, calculatePagination } from '../utils/pagination';



interface JobListProps {
  simpleMode?: boolean;
}

// '서울특별시 강남구' → '서울특별시', '경기도 수원시' → '경기도', '부산광역시 해운대구' → '부산광역시', '제주특별자치도 제주시' → '제주특별자치도'
function getProvince(region = ''): string {
  const match = region.match(/([\w가-힣]+도|[\w가-힣]+특별시|[\w가-힣]+광역시|[\w가-힣]+특별자치도)/);
  return match ? match[0] : '';
}
// '강원도 평창군' → '평창군', '부산광역시 해운대구' → '해운대구' 등으로 변환
function getDistrict(region = ''): string {
  const match = region.match(/([\w가-힣]+도|[\w가-힣]+광역시)\s*([\w가-힣]+(시|군|구))/);
  return match ? match[2] : '';
}

const JobList: React.FC<JobListProps> = ({ simpleMode = false }) => {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100); // 한 페이지당 100개 아이템

  const [accommodationInfoMap, setAccommodationInfoMap] = useState<{ [key: string]: AccommodationInfo }>({});
  const [companyInfoMap, setCompanyInfoMap] = useState<{ [employerId: string]: any }>({});
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationInfo | null>(null);
  const [reviewInfoMap, setReviewInfoMap] = useState<{ [employerId: string]: { count: number; avg: number } }>({});

  const [dormitoryFilter, setDormitoryFilter] = useState(''); // '', '제공', '미제공'
  const [facilityFilter, setFacilityFilter] = useState('');
  const [regionProvince, setRegionProvince] = useState(''); // 도/광역시
  const [regionDistrict, setRegionDistrict] = useState(''); // 시/군/구
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 홈 카드 요약 항목 표시 선택
  const [summaryOptions, setSummaryOptions] = useState({
    region: true,
    dormitory: true,
    salary: true,
    workPeriod: true,
    workTime: false,
  });

  const toggleSummaryOption = (key: keyof typeof summaryOptions) => {
    setSummaryOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 표시용 도우미: 근무지, 근무시간
  const getDisplayLocation = (jobPost: JobPost): string => {
    const company = companyInfoMap[jobPost.employerId] || {};
    const fromJob = (jobPost.location || '').trim();
    const fromCompany = (company.address || company.region || '').trim();
    return fromJob || fromCompany || '정보 없음';
  };

  const getDisplayWorkTime = (jobPost: JobPost): string => {
    // 1) 구체 스케줄 시간
    if ((jobPost as any)?.workSchedule?.hours) {
      return (jobPost as any).workSchedule.hours as string;
    }
    // 2) workTypes 요약
    if ((jobPost as any)?.workTypes && (jobPost as any).workTypes.length > 0) {
      const wt = (jobPost as any).workTypes[0];
      const hours = wt?.schedules?.[0]?.hours;
      if (hours) return hours;
      if (wt?.hourlyWage) return `시급 ${Number(wt.hourlyWage).toLocaleString()}원`;
      return `근무타입 ${ (jobPost as any).workTypes.length }개`;
    }
    // 3) workTimeType 일반값
    if (jobPost.workTimeType) return jobPost.workTimeType;
    return '정보 없음';
  };

  const getCardImage = (jobPost: JobPost): string | null => {
    const acc = accommodationInfoMap[jobPost.employerId];
    const comp = companyInfoMap[jobPost.employerId];
    const accImg = acc?.images && acc.images.length > 0 ? acc.images[0] : null;
    const compImg = comp?.images && comp.images.length > 0 ? comp.images[0] : null;
    return accImg || compImg || null;
  };

  // 숙소 시설 옵션(CompanyInfoModal과 동일하게 유지)
  const dormitoryFacilityOptions = [
    '와이파이', '에어컨', '세탁기', '개인욕실', '공용주방', 'TV', '냉장고', '책상', '옷장', '난방',
  ];

  // 이미지 미리보기 핸들러
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '이미지');
  };

  // 등록된 회사들의 도/광역시 목록(빈 값/중복 완전 제거)
  const uniqueProvinces = Array.from(new Set(
    Object.values(companyInfoMap)
      .map((info: any) => getProvince(info.region))
      .filter((province: string) => province && province.length > 1),
  ));
  console.log('uniqueProvinces:', uniqueProvinces);
  // 선택된 도/광역시에 속하는 시/군/구 목록
  const uniqueDistricts = Array.from(new Set(Object.values(companyInfoMap)
    .filter((info: any) => getProvince(info.region) === regionProvince)
    .map((info: any) => getDistrict(info.region))
    .filter(Boolean)));

  // 검색/필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, regionProvince, regionDistrict, dormitoryFilter, facilityFilter]);

  useEffect(() => {
    const fetchJobPosts = async () => {
      try {
        console.log('공고 목록 불러오기 시작...');
        
        // 노출 가능한 공고만 가져오기: 승인 + 숨김 아님 + 활성
        const jobPostsQuery = query(
          collection(db, 'jobPosts'),
          // Firestore에서 복수 where을 쓰면 인덱스 필요할 수 있음. 인덱스가 없다면 후단 필터를 보조로 적용.
        );
        const jobPostsSnap = await getDocs(jobPostsQuery);
        console.log('활성화된 공고 수:', jobPostsSnap.size);
        
        const activeJobPosts = jobPostsSnap.docs
          .map(doc => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data,
              workTimeType: data.workTimeType || '무관', // 기본값 설정
            };
          })
          // 승인된 공고 + 숨김 아님 + isActive != false만 노출
          .filter((jp: any) => (jp.status === 'approved') && jp.isHidden !== true && jp.isActive !== false)
          .sort((a, b) => {
            const aDate = (a as any).createdAt?.toDate?.() || new Date(0);
            const bDate = (b as any).createdAt?.toDate?.() || new Date(0);
            return bDate.getTime() - aDate.getTime();
          }) as JobPost[];
        
        console.log('공고 목록:', activeJobPosts);
        setJobPosts(activeJobPosts);

        // 고유한 employerId 목록
        const employerIds = Array.from(new Set(activeJobPosts.map(j => j.employerId)));
        
        // simpleMode에서는 기본 정보만 로드
        if (simpleMode) {
          // 회사 정보만 간단히 로드
          const companyDocs = await Promise.all(
            employerIds.map(async (employerId) => {
              try {
                const docSnap = await getDoc(doc(db, 'companyInfo', employerId));
                return { employerId, data: docSnap.exists() ? docSnap.data() : null };
              } catch (error) {
                return { employerId, data: null };
              }
            }),
          );

          const companyMap: { [employerId: string]: any } = {};
          companyDocs.forEach(({ employerId, data }) => {
            if (data) companyMap[employerId] = data;
          });
          setCompanyInfoMap(companyMap);
        } else {
          // 전체 모드에서는 모든 데이터 병렬 로딩
          const [companyDocs, accommodationDocs, reviewsSnap] = await Promise.all([
            // 회사 정보 병렬 로딩
            Promise.all(
              employerIds.map(async (employerId) => {
                try {
                  const docSnap = await getDoc(doc(db, 'companyInfo', employerId));
                  return { employerId, data: docSnap.exists() ? docSnap.data() : null };
                } catch (error) {
                  console.error(`회사 정보 불러오기 실패 (${employerId}):`, error);
                  return { employerId, data: null };
                }
              }),
            ),
            // 기숙사 정보 병렬 로딩
            Promise.all(
              employerIds.map(async (employerId) => {
                try {
                  const docSnap = await getDoc(doc(db, 'accommodationInfo', employerId));
                  return { employerId, data: docSnap.exists() ? docSnap.data() : null };
                } catch (error) {
                  console.error(`기숙사 정보 불러오기 실패 (${employerId}):`, error);
                  return { employerId, data: null };
                }
              }),
            ),
            // 리뷰 정보 로딩
            getDocs(collection(db, 'reviews')),
          ]);

          // 회사 정보 맵 생성
          const companyMap: { [employerId: string]: any } = {};
          companyDocs.forEach(({ employerId, data }) => {
            if (data) companyMap[employerId] = data;
          });
          setCompanyInfoMap(companyMap);

          // 기숙사 정보 맵 생성
          const accommodationMap: { [key: string]: AccommodationInfo } = {};
          accommodationDocs.forEach(({ employerId, data }) => {
            if (data) accommodationMap[employerId] = data as AccommodationInfo;
          });
          setAccommodationInfoMap(accommodationMap);

          // 리뷰 정보 맵 생성
          const reviewMap: { [employerId: string]: { count: number; avg: number } } = {};
          const allReviews: any[] = reviewsSnap.docs.map(doc => doc.data());
          for (const employerId of employerIds) {
            const reviews = allReviews.filter((r: any) => r.resort === employerId);
            const count = reviews.length;
            const avgRating = count > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / count : 0;
            reviewMap[employerId] = { count, avg: avgRating };
          }
          setReviewInfoMap(reviewMap);
        }
      } catch (error) {
        console.error('공고 목록 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobPosts();
  }, [simpleMode]);



  const filteredJobPosts = jobPosts.filter(jobPost => {
    const company = companyInfoMap[jobPost.employerId] || {};
    const matchesSearch = jobPost.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobPost.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobPost.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = true; // locationFilter는 사용하지 않음
    const matchesSalary = true; // salaryFilter는 사용하지 않음
    const matchesProvince = !regionProvince || getProvince(company.region) === regionProvince;
    const matchesDistrict = !regionDistrict || getDistrict(company.region) === regionDistrict;
    const matchesDormitory = !dormitoryFilter || (dormitoryFilter === '제공' ? company.dormitory : !company.dormitory);
    const matchesFacility = !facilityFilter || (company.dormitoryFacilities || []).includes(facilityFilter);
    
    return matchesSearch && matchesLocation && matchesSalary && matchesProvince && matchesDistrict && matchesDormitory && matchesFacility;
  });
  
  // 페이지네이션 계산
  const pagination = calculatePagination({
    page: currentPage,
    limit: pageSize,
    total: filteredJobPosts.length
  });
  
  // 현재 페이지에 해당하는 데이터만 가져오기
  const paginatedJobPosts = applyPagination(filteredJobPosts, currentPage, pageSize);
  
  console.log('jobPosts.length:', jobPosts.length);
  console.log('filteredJobPosts.length:', filteredJobPosts.length);
  console.log('paginatedJobPosts.data.length:', paginatedJobPosts.data.length);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-resort-500"></div>
      </div>
    );
  }

  // 심플 모드: 필터 없이 간단한 카드만 노출
  if (simpleMode) {
    // 심플 모드에서도 페이지네이션 적용
    const simplePaginatedPosts = applyPagination(jobPosts, 1, pageSize);
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {simplePaginatedPosts.data.map((jobPost) => (
            <Link
              key={jobPost.id}
              to={`/job/${jobPost.id}`}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow block"
              style={{ textDecoration: 'none' }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1 mr-3">{jobPost.title}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">{jobPost.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '날짜 없음'}</span>
                </div>
                <div className="text-sm text-gray-700 mb-1">{jobPost.employerName}</div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                  <span><MapPin className="inline h-4 w-4 mr-1" />{getProvince(companyInfoMap[jobPost.employerId]?.region || jobPost.location)}</span>
                  <span><DollarSign className="inline h-4 w-4 mr-1" />{jobPost.salary.min.toLocaleString()}~{jobPost.salary.max.toLocaleString()}원</span>
                  <span><Home className="inline h-4 w-4 mr-1" />{companyInfoMap[jobPost.employerId]?.dormitory ? '기숙사 제공' : '기숙사 미제공'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-500 font-semibold">평점 {reviewInfoMap[jobPost.employerId]?.avg ? reviewInfoMap[jobPost.employerId].avg.toFixed(1) : '-'}</span>
                  <Link
                    to={`/resort/${jobPost.employerId}/reviews`}
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={e => e.stopPropagation()}
                  >
                    후기 {reviewInfoMap[jobPost.employerId]?.count || 0}개
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header 삭제 */}
      {/* <div className="bg-white shadow-sm"> ... </div> */}
      {/* 이하 카드 리스트만 남김 */}
      {/* ...기존 코드... */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* 검색 */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-[180px]">
              <Search className="text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="직무, 회사명, 키워드 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500"
              />
            </div>
            {/* 도/광역시 + 시/군/구 필터 (깔끔하게 한 줄 배치, 라벨 제거) */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={regionProvince}
                onChange={e => {
                  setRegionProvince(e.target.value);
                  setRegionDistrict('');
                }}
                className="w-48 h-11 px-3 border border-gray-300 rounded-md focus:ring-resort-500 focus:border-resort-500"
              >
                <option value="">도/광역시 선택</option>
                {uniqueProvinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
              <select
                value={regionDistrict}
                onChange={e => setRegionDistrict(e.target.value)}
                className="w-48 h-11 px-3 border border-gray-300 rounded-md focus:ring-resort-500 focus:border-resort-500"
                disabled={!regionProvince}
              >
                <option value="">시/군/구 선택</option>
                {uniqueDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            {/* 기숙사 */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-[120px]">
              <Home className="text-green-500 h-5 w-5" />
              <label className="text-xs text-gray-600">기숙사</label>
              <select
                value={dormitoryFilter}
                onChange={e => setDormitoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500"
              >
                <option value="">전체</option>
                <option value="제공">제공</option>
                <option value="미제공">미제공</option>
              </select>
            </div>
            {/* 숙소 시설 */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-[140px]">
              <span className="text-indigo-400 text-lg">🛏️</span>
              <label className="text-xs text-gray-600">숙소시설</label>
              <select
                value={facilityFilter}
                onChange={e => setFacilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-resort-500 focus:border-resort-500"
              >
                <option value="">전체</option>
                {dormitoryFacilityOptions.map(facility => (
                  <option key={facility} value={facility}>{facility}</option>
                ))}
              </select>
            </div>
            {/* 요약 항목 선택 */}
            <div className="flex flex-wrap items-center gap-3 w-full">
              <span className="text-xs text-gray-600">요약 표시:</span>
              <label className="flex items-center gap-1 text-xs text-gray-700">
                <input type="checkbox" checked={summaryOptions.region} onChange={() => toggleSummaryOption('region')} /> 지역
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-700">
                <input type="checkbox" checked={summaryOptions.dormitory} onChange={() => toggleSummaryOption('dormitory')} /> 기숙사
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-700">
                <input type="checkbox" checked={summaryOptions.salary} onChange={() => toggleSummaryOption('salary')} /> 급여
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-700">
                <input type="checkbox" checked={summaryOptions.workPeriod} onChange={() => toggleSummaryOption('workPeriod')} /> 근무기간
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-700">
                <input type="checkbox" checked={summaryOptions.workTime} onChange={() => toggleSummaryOption('workTime')} /> 근무시간
              </label>
            </div>
            
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              같이 일할 사람을 찾습니다
              <span className="ml-2 text-sm font-normal text-gray-500">(채용 정보)</span>
            </h2>
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-1" />
              필터 적용됨
            </div>
          </div>
        </div>

        {/* Job Posts Grid */}
        {filteredJobPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">
              검색 조건을 변경해보시거나 나중에 다시 확인해보세요.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedJobPosts.data.map((jobPost) => (
              <Link
                key={jobPost.id}
                to={`/job/${jobPost.id}`}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow block overflow-hidden"
                style={{ textDecoration: 'none' }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 bg-gray-100 rounded-t-lg px-4 py-3 overflow-hidden">
                    <div className="flex-1 flex items-start gap-3 min-w-0">
                      {getCardImage(jobPost) && (
                        <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                          <img src={getCardImage(jobPost)!} alt="대표 이미지" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 max-w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {jobPost.title}
                        </h3>
                        <p className="text-gray-600 truncate max-w-full">{companyInfoMap[jobPost.employerId]?.name || jobPost.employerName || '회사명 없음'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        {Number(jobPost.views) > 0 ? Number(jobPost.views) : 0}
                      </div>
                      {/* 리뷰수, 평점, 후기보러가기 */}
                      <div className="flex items-center mt-2 gap-2 flex-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-200 whitespace-nowrap">
                          <Star className="w-3 h-3" />
                          {reviewInfoMap[jobPost.employerId]?.avg ? reviewInfoMap[jobPost.employerId].avg.toFixed(1) : '-'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/resort/${jobPost.employerId}/reviews`, '_blank');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer whitespace-nowrap"
                        >
                          후기 {reviewInfoMap[jobPost.employerId]?.count || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {/* 카드 본문에서는 중복 최소화: 근무일자(기간)만 기본 노출 */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {(jobPost as any)?.startDate?.toDate?.()?.toLocaleDateString?.('ko-KR') || '-'} ~ {(jobPost as any)?.endDate?.toDate?.()?.toLocaleDateString?.('ko-KR') || '-'}
                    </div>
                  </div>
                  
                  {/* 상세보기 버튼 제거, 날짜만 남김 */}
                  <div className="flex justify-end items-center">
                    <span className="text-xs text-gray-500">
                      {jobPost.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '날짜 정보 없음'}
                    </span>
                  </div>

                  {/* 구직자 관점 정보 박스 */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-xs text-gray-700 space-y-1 overflow-hidden">
                    {/* 지역 */}
                    {summaryOptions.region && (
                      <div className="flex items-center truncate">
                        <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                        <span>지역: {getProvince(companyInfoMap[jobPost.employerId]?.region || getDisplayLocation(jobPost))}</span>
                      </div>
                    )}
                    {/* 기숙사 제공 여부 */}
                    {summaryOptions.dormitory && (
                      <div className="flex items-center truncate">
                        <Home className="h-4 w-4 mr-1 text-green-600" />
                        <span>
                          기숙사: {(accommodationInfoMap[jobPost.employerId] || (jobPost as any)?.accommodation?.provided) ? '제공' : '미제공'}
                        </span>
                      </div>
                    )}
                    {/* 급여 범위 */}
                    {summaryOptions.salary && (
                      <div className="flex items-center truncate">
                        <DollarSign className="h-4 w-4 mr-1 text-yellow-500" />
                        <span>
                          급여: {jobPost.salary?.min?.toLocaleString?.() || '정보 없음'}원 ~ {jobPost.salary?.max?.toLocaleString?.() || '정보 없음'}원
                        </span>
                      </div>
                    )}
                    {/* 근무기간 */}
                    {summaryOptions.workPeriod && (
                      <div className="flex items-center truncate">
                        <Calendar className="h-4 w-4 mr-1 text-purple-600" />
                        <span>
                          근무기간: {(jobPost as any)?.startDate?.toDate?.()?.toLocaleDateString?.('ko-KR') || '-'} ~ {(jobPost as any)?.endDate?.toDate?.()?.toLocaleDateString?.('ko-KR') || '-'}
                        </span>
                      </div>
                    )}
                    {/* 근무시간 */}
                    {summaryOptions.workTime && (
                      <div className="flex items-center truncate">
                        <Calendar className="h-4 w-4 mr-1 text-indigo-600" />
                        <span>근무시간: {getDisplayWorkTime(jobPost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 UI */}
        {filteredJobPosts.length > pageSize && (
          <div className="flex items-center justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-resort-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mt-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
                더 많은 기회를 놓치지 마세요
          </h3>
          <p className="text-gray-600 mb-6">
                회원가입하고 지원하시면 더 많은 일자리 정보를 받아보실 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-resort-600 hover:bg-resort-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
                  회원가입하기
            </Link>
            <Link
              to="/login"
              className="border border-resort-600 text-resort-600 hover:bg-resort-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
                  로그인
            </Link>
          </div>
        </div>
      </div>

      {/* 기숙사 정보 모달 */}
      {showAccommodationModal && selectedAccommodation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">🏠 기숙사 정보</h3>
                <button
                  onClick={() => setShowAccommodationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedAccommodation.name}</h4>
                  <p className="text-gray-700 text-sm">{selectedAccommodation.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">기숙사 유형</span>
                    <p className="text-gray-900">
                      {selectedAccommodation.type === 'dormitory' && '기숙사'}
                      {selectedAccommodation.type === 'apartment' && '아파트'}
                      {selectedAccommodation.type === 'house' && '단독주택'}
                      {selectedAccommodation.type === 'other' && '기타'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">월세</span>
                    <p className="text-gray-900">{selectedAccommodation.monthlyRent?.toLocaleString() || '0'}원</p>
                  </div>
                  <div>
                    <span className="text-gray-500">직장까지 거리</span>
                    <p className="text-gray-900">{selectedAccommodation.distanceFromWorkplace}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">입주 가능</span>
                    <p className={`font-medium ${selectedAccommodation.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAccommodation.isAvailable ? '가능' : '불가능'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">주소</span>
                  <p className="text-gray-900 text-sm">{selectedAccommodation.address}</p>
                </div>

                {selectedAccommodation.facilities && selectedAccommodation.facilities.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-sm">시설</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedAccommodation.facilities.map((facility, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAccommodation.images && selectedAccommodation.images.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-sm">기숙사 사진</span>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedAccommodation.images.map((imageUrl, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer group" onClick={() => handleImagePreview(imageUrl, `기숙사 사진 ${index + 1}`)}>
                          <img
                            src={imageUrl}
                            alt={`기숙사 사진 ${index + 1}`}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAccommodationModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default JobList; 