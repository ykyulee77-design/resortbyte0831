import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Building, MapPin, DollarSign, Users, Star, Search, Filter, Briefcase, Phone, Globe } from 'lucide-react';

interface CompanyInfo {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  description?: string;
  location?: string;
}

interface Accommodation {
  id: string;
  employerId: string;
  employerName?: string;
  name: string;
  description: string;
  address: string;
  type: string;
  capacity: number;
  currentOccupancy: number;
  roomTypes: Array<{
    type: string;
    capacity: number;
    price: number;
    available: number;
    description: string;
  }>;
  facilities: string[];
  utilities: string[];
  rules: string[];
  monthlyRent: number;
  deposit: number;
  utilitiesIncluded: boolean;
  images: string[];
  externalLinks: Array<{
    name: string;
    url: string;
  }>;
  isPublic?: boolean;
  createdAt: any;
  companyInfo?: CompanyInfo; // 회사 정보 추가
  avgRating?: number; // 평균 평점 추가
  reviewCount?: number; // 평가 건수 추가
}

const AccommodationList: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('default');

  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        // 기숙사 정보 가져오기
        const accommodationsQuery = query(collection(db, 'accommodationInfo'));
        const accommodationsSnapshot = await getDocs(accommodationsQuery);
        const accommodationsData = accommodationsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            employerId: doc.id,
            ...doc.data(),
          })) as Accommodation[];
        
        const publicAccommodations = accommodationsData.filter(accommodation => accommodation.isPublic !== false);
        
        // 회사 정보 가져오기
        const companyInfoQuery = query(collection(db, 'companyInfo'));
        const companyInfoSnapshot = await getDocs(companyInfoQuery);
        const companyInfoData = companyInfoSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as CompanyInfo[];
        
        // 기숙사 정보와 회사 정보 매칭
        const accommodationsWithCompanyInfo = publicAccommodations.map(accommodation => {
          const companyInfo = companyInfoData.find(company => company.id === accommodation.employerId);
          return {
            ...accommodation,
            companyInfo,
          };
        });

        // 평점 정보 가져오기
        const reviewsQuery = query(collection(db, 'reviews'));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
        
        // 각 기숙사별 평균 평점 계산
        const accommodationsWithRatings = accommodationsWithCompanyInfo.map(accommodation => {
          const accommodationReviews = reviewsData.filter((review: any) => 
            review.resort === accommodation.employerId && review.accommodationRating > 0
          );
          
          let avgRating: number | undefined;
          const reviewCount = accommodationReviews.length;
          if (accommodationReviews.length > 0) {
            const totalRating = accommodationReviews.reduce((sum: number, review: any) => 
              sum + review.accommodationRating, 0
            );
            avgRating = parseFloat((totalRating / accommodationReviews.length).toFixed(1));
          }
          
          return {
            ...accommodation,
            avgRating,
            reviewCount,
          };
        });
        
        setAccommodations(accommodationsWithRatings);
      } catch (error) {
        console.error('기숙사 정보 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  // 가격 포맷팅 함수
  const formatPrice = (price: number): string => {
    if (!price || price === 0) return '무료';
    return `${price.toLocaleString()}원`;
  };

  // 필터링된 기숙사 목록
  const filteredAccommodations = accommodations.filter(accommodation => {
    // 검색어 필터
    const matchesSearch = searchTerm === '' || 
      accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accommodation.companyInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accommodation.address.toLowerCase().includes(searchTerm.toLowerCase());

    // 가격 필터
    const matchesPrice = priceFilter === 'all' || 
      (priceFilter === 'free' && (!accommodation.monthlyRent || accommodation.monthlyRent === 0)) ||
      (priceFilter === 'paid' && accommodation.monthlyRent && accommodation.monthlyRent > 0);

    // 유형 필터
    const matchesType = typeFilter === 'all' || accommodation.type === typeFilter;

    // 지역 필터
    const matchesRegion = regionFilter === 'all' || 
      accommodation.address.includes(regionFilter);

    // 편의시설 필터
    const matchesFacility = facilityFilter === 'all' || 
      (accommodation.facilities && accommodation.facilities.includes(facilityFilter));

    return matchesSearch && matchesPrice && matchesType && matchesRegion && matchesFacility;
  });

  // 정렬 옵션 적용 (평점 높은순/낮은순)
  const sortedAccommodations = (() => {
    const list = [...filteredAccommodations];
    if (sortOption === 'rating_desc') {
      return list.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1));
    }
    if (sortOption === 'rating_asc') {
      return list.sort((a, b) => (a.avgRating ?? Number.MAX_SAFE_INTEGER) - (b.avgRating ?? Number.MAX_SAFE_INTEGER));
    }
    return list;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-resort-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">기숙사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">기숙사 목록</h1>
          <p className="text-gray-600">리조트 근무자를 위한 다양한 기숙사 옵션을 확인해보세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* 검색바 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="기숙사명, 회사명, 주소로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 필터 옵션 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 가격 필터 */}
            <div>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              >
                <option value="all">가격 전체</option>
                <option value="free">무료</option>
                <option value="paid">유료</option>
              </select>
            </div>

            {/* 기숙사 유형 필터 */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              >
                <option value="all">유형 전체</option>
                <option value="dormitory">기숙사</option>
                <option value="apartment">아파트</option>
                <option value="house">주택</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* 지역 필터 */}
            <div>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              >
                <option value="all">지역 전체</option>
                <option value="강원도">강원도</option>
                <option value="경기도">경기도</option>
                <option value="충청도">충청도</option>
                <option value="전라도">전라도</option>
                <option value="경상도">경상도</option>
                <option value="제주도">제주도</option>
              </select>
            </div>

            {/* 정렬 옵션 */}
            <div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              >
                <option value="default">정렬: 기본</option>
                <option value="rating_desc">정렬: 평점 높은순</option>
                <option value="rating_asc">정렬: 평점 낮은순</option>
              </select>
            </div>
          </div>
          
          {/* 편의시설 필터 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">편의시설:</span>
              <button
                onClick={() => setFacilityFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  facilityFilter === 'all' 
                    ? 'bg-resort-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFacilityFilter('wifi')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  facilityFilter === 'wifi' 
                    ? 'bg-resort-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                와이파이
              </button>
              <button
                onClick={() => setFacilityFilter('parking')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  facilityFilter === 'parking' 
                    ? 'bg-resort-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                주차
              </button>
              <button
                onClick={() => setFacilityFilter('laundry')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  facilityFilter === 'laundry' 
                    ? 'bg-resort-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                세탁
              </button>
              <button
                onClick={() => setFacilityFilter('kitchen')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  facilityFilter === 'kitchen' 
                    ? 'bg-resort-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                주방
              </button>
              <button
                onClick={() => setFacilityFilter('gym')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  facilityFilter === 'gym' 
                    ? 'bg-resort-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                체육관
              </button>
            </div>
          </div>
        </div>

        {/* 결과 통계 */}
        <div className="mb-6">
          <p className="text-gray-600">
            총 <span className="font-semibold text-resort-600">{sortedAccommodations.length}</span>개의 기숙사를 찾았습니다
          </p>
        </div>

        {/* 기숙사 목록 */}
        {sortedAccommodations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">기숙사를 찾을 수 없습니다</h3>
            <p className="text-gray-600">검색 조건을 변경해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAccommodations.map((accommodation) => (
              <Link 
                key={accommodation.id} 
                to={`/accommodation-info/${accommodation.employerId}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group block cursor-pointer"
              >
                {/* 이미지 */}
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {accommodation.images && accommodation.images.length > 0 ? (
                    <img
                      src={accommodation.images[0]}
                      alt={accommodation.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {/* 비용 배지 */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      (accommodation.monthlyRent || 0) === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {(accommodation.monthlyRent || 0) === 0 ? '무료' : '유료'}
                    </span>
                  </div>
                  {/* 평점 배지 */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 mr-1" />
                      {typeof accommodation.avgRating === 'number' ? accommodation.avgRating : '-'}
                      {` (${accommodation.reviewCount ?? 0})`}
                    </span>
                  </div>
                </div>

                {/* 정보 */}
                <div className="p-4">
                  {/* 기숙사명 */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                    {accommodation.name}
                  </h3>
                   
                  {/* 회사명 */}
                  {accommodation.companyInfo && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {accommodation.companyInfo.name}
                    </p>
                  )}
                   
                  {/* 위치 */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{accommodation.address}</span>
                  </div>
                   
                  {/* 가격 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-resort-600">
                      {formatPrice(accommodation.monthlyRent)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {accommodation.type === 'dormitory' ? '기숙사' : 
                        accommodation.type === 'apartment' ? '아파트' : 
                          accommodation.type === 'house' ? '주택' : '기타'}
                    </span>
                  </div>

                  {/* 편의시설 미리보기 */}
                  {accommodation.facilities && accommodation.facilities.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {accommodation.facilities.slice(0, 2).map((facility, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md border">
                            {facility}
                          </span>
                        ))}
                        {accommodation.facilities.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-md border">
                             +{accommodation.facilities.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 문의 버튼 */}
                  <div className="flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 문의 기능 구현 예정
                      }}
                      className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        문의
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationList;
