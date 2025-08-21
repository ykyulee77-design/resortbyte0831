import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Building, MapPin, DollarSign, Users, Star, Search, Filter } from 'lucide-react';

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
  createdAt: any;
}

const AccommodationList: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        const accommodationsQuery = query(collection(db, 'accommodationInfo'));
        const snapshot = await getDocs(accommodationsQuery);
        const accommodationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          employerId: doc.id,
          ...doc.data()
        })) as Accommodation[];
        
        setAccommodations(accommodationsData);
      } catch (error) {
        console.error('기숙사 정보 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  const filteredAccommodations = accommodations.filter(accommodation => {
    const matchesSearch = accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (accommodation.employerName && accommodation.employerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         accommodation.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'low' && (accommodation.monthlyRent || 0) <= 200000) ||
                        (priceFilter === 'medium' && (accommodation.monthlyRent || 0) > 200000 && (accommodation.monthlyRent || 0) <= 400000) ||
                        (priceFilter === 'high' && (accommodation.monthlyRent || 0) > 400000);
    
    const matchesType = typeFilter === 'all' || 
                       (accommodation.roomTypes && accommodation.roomTypes.some(room => room.type.includes(typeFilter)));

    return matchesSearch && matchesPrice && matchesType;
  });

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) {
      return '가격 정보 없음';
    }
    if (price === 0) {
      return '무료';
    }
    return `${price.toLocaleString()}원/월`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-resort-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">기숙사 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🏠 기숙사 정보
            </h1>
            <p className="text-lg text-gray-600">
              구인자들이 제공하는 기숙사 정보를 한눈에 확인하세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="기숙사명, 구인자명, 주소로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 가격 필터 */}
            <div className="lg:w-48">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              >
                <option value="all">가격 전체</option>
                <option value="low">20만원 이하</option>
                <option value="medium">20-40만원</option>
                <option value="high">40만원 이상</option>
              </select>
            </div>

            {/* 타입 필터 */}
            <div className="lg:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              >
                <option value="all">타입 전체</option>
                <option value="1인실">1인실</option>
                <option value="2인실">2인실</option>
                <option value="4인실">4인실</option>
                <option value="6인실">6인실</option>
              </select>
            </div>
          </div>
        </div>

        {/* 결과 통계 */}
        <div className="mb-6">
          <p className="text-gray-600">
            총 <span className="font-semibold text-resort-600">{filteredAccommodations.length}</span>개의 기숙사를 찾았습니다
          </p>
        </div>

        {/* 기숙사 목록 */}
        {filteredAccommodations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">기숙사를 찾을 수 없습니다</h3>
            <p className="text-gray-600">검색 조건을 변경해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccommodations.map((accommodation) => (
              <div key={accommodation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* 이미지 */}
                <div className="h-48 bg-gray-200 relative">
                  {accommodation.images && accommodation.images.length > 0 ? (
                    <img
                      src={accommodation.images[0]}
                      alt={accommodation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                </div>

                {/* 정보 */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {accommodation.name}
                  </h3>
                  
                                     <p className="text-sm text-gray-600 mb-3">
                     {accommodation.employerName || '구인자 정보 없음'}
                   </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{accommodation.address}</span>
                    </div>
                    
                                         <div className="flex items-center gap-2 text-sm text-gray-600">
                       <DollarSign className="w-4 h-4" />
                       <span className="font-semibold text-resort-600">
                         {formatPrice(accommodation.monthlyRent)}
                       </span>
                     </div>
                    
                                         <div className="flex items-center gap-2 text-sm text-gray-600">
                       <Users className="w-4 h-4" />
                       <span>{accommodation.roomTypes ? accommodation.roomTypes.map(room => `${room.type}(${room.capacity}인실)`).join(', ') : '방 정보 없음'}</span>
                     </div>
                  </div>

                                     {/* 편의시설 */}
                   {accommodation.facilities && accommodation.facilities.length > 0 && (
                     <div className="mb-4">
                       <p className="text-xs text-gray-500 mb-2">편의시설</p>
                       <div className="flex flex-wrap gap-1">
                         {accommodation.facilities.slice(0, 3).map((facility, index) => (
                           <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                             {facility}
                           </span>
                         ))}
                         {accommodation.facilities.length > 3 && (
                           <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                             +{accommodation.facilities.length - 3}
                           </span>
                         )}
                       </div>
                     </div>
                   )}

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                                         <Link
                       to={`/accommodation-info/${accommodation.employerId}`}
                       className="flex-1 bg-resort-500 hover:bg-resort-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                     >
                       상세보기
                     </Link>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      문의
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationList;
