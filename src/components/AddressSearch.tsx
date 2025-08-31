import React, { useState, useEffect, useCallback } from 'react';

// 주소 검색을 위한 인터페이스
export interface Address {
  // 기본 주소 정보
  zipCode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  
  // 상세주소 (사용자 입력)
  detailAddress?: string;
  
  // 지역 정보
  region?: string;
  sido?: string;
  sigungu?: string;
  emdNm?: string; // 읍면동
  
  // 상세 주소 정보
  buildingName?: string;
  roadName?: string;
  buildingNumber?: string;
  admCd?: string; // 행정구역코드
  
  // 영어 주소 (국제화 지원)
  engAddress?: string;
  
  // 좌표 정보
  latitude?: number;
  longitude?: number;
}

export interface AddressSearchProps {
  onAddressSelect: (address: Address) => void;
  placeholder?: string;
  value?: string;
  className?: string;
  disabled?: boolean;
  minSearchLength?: number;
  maxResults?: number;
  showDetailAddress?: boolean; // 상세주소 필드 표시 여부
  detailAddressPlaceholder?: string; // 상세주소 플레이스홀더
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  onAddressSelect, 
  placeholder = '주소를 검색하세요', 
  value = '', 
  className = '',
  disabled = false,
  minSearchLength = 3,
  maxResults = 10,
  showDetailAddress = true,
  detailAddressPlaceholder = '상세주소 (아파트 동/호수, 사무실 번호 등)'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [detailAddress, setDetailAddress] = useState('');

  // value가 변경되면 searchTerm도 업데이트
  useEffect(() => {
    if (value && !isEditing) {
      setSearchTerm(value);
    }
  }, [value, isEditing]);

  // 네이버 지도 API의 내장 지오코딩을 통한 주소 검색

  // 네이버 지도 API의 내장 지오코딩을 통한 주소 검색
  const searchAddresses = useCallback(async (keyword: string) => {
    if (keyword.length < minSearchLength) {
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 네이버 지도 API가 로드되었는지 확인
      if (window.naver && window.naver.maps && window.naver.maps.Service) {
        console.log('네이버 지도 API 사용하여 주소 검색:', keyword);
        
        // 네이버 지도 API의 내장 지오코딩 사용
        window.naver.maps.Service.geocode({
          query: keyword
        }, function(status: any, response: any) {
          console.log('네이버 지오코딩 응답:', status, response);
          
          if (status === window.naver.maps.Service.Status.OK) {
            const result = response.v2;
            if (result.meta.totalCount > 0) {
              const apiAddresses: Address[] = result.addresses
                .slice(0, maxResults)
                .map((item: any) => ({
                  zipCode: item.zipcode || '',
                  address: item.roadAddress || item.jibunAddress,
                  roadAddress: item.roadAddress || '',
                  jibunAddress: item.jibunAddress || '',
                  region: item.region || '',
                  sido: item.sido || '',
                  sigungu: item.sigungu || '',
                  emdNm: item.emdNm || '',
                  buildingName: item.buildingName || '',
                  roadName: item.roadName || '',
                  buildingNumber: item.buildingNumber || '',
                  admCd: item.admCd || '',
                  engAddress: item.engAddress || '',
                  latitude: parseFloat(item.y),
                  longitude: parseFloat(item.x),
                }));
              
              console.log('네이버 API 주소 검색 결과:', apiAddresses);
              setAddresses(apiAddresses);
              setShowDropdown(true);
            } else {
              console.log('네이버 API 검색 결과 없음');
              setError('검색 결과가 없습니다. 정확한 주소를 입력해주세요. (예: 서울특별시 강남구 테헤란로 427)');
              setAddresses([]);
              setShowDropdown(false);
            }
          } else {
            console.log('네이버 API 오류');
            setError('검색 결과가 없습니다. 정확한 주소를 입력해주세요. (예: 서울특별시 강남구 테헤란로 427)');
            setAddresses([]);
            setShowDropdown(false);
          }
          setIsLoading(false);
        });
      } else {
        console.log('네이버 지도 API가 로드되지 않음');
        setError('네이버 지도 API가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        setAddresses([]);
        setShowDropdown(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setError('주소 검색 중 오류가 발생했습니다.');
      setAddresses([]);
      setShowDropdown(false);
      setIsLoading(false);
    }
  }, [minSearchLength, maxResults]);

  // 샘플 데이터 제거 - 실제 API만 사용

  // 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= minSearchLength) {
        searchAddresses(searchTerm);
      } else {
        setAddresses([]);
        setShowDropdown(false);
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [searchTerm, minSearchLength, searchAddresses]);

  // 주소 선택 처리
  const handleAddressSelect = useCallback((address: Address) => {

    setSelectedAddress(address);
    setSearchTerm(address.address);
    setShowDropdown(false); // 드롭다운 즉시 숨김
    setIsEditing(false);
    setAddresses([]); // 검색 결과도 초기화
    
    // 상세주소가 표시되지 않는 경우 바로 콜백 호출
    if (!showDetailAddress) {
      onAddressSelect(address);
    }
  }, [onAddressSelect, showDetailAddress]);

  // 상세주소 입력 처리
  const handleDetailAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDetailAddress(value);
  }, []);

  // 상세주소 포함하여 최종 주소 선택
  const handleFinalAddressSelect = useCallback(() => {
    if (selectedAddress) {
      const finalAddress: Address = {
        ...selectedAddress,
        detailAddress: detailAddress.trim(),
        // 상세주소가 있는 경우 전체 주소에 포함
        address: detailAddress.trim() 
          ? `${selectedAddress.address} ${detailAddress.trim()}`
          : selectedAddress.address
      };
      
  
      onAddressSelect(finalAddress);
    }
  }, [selectedAddress, detailAddress, onAddressSelect]);

  // 입력 필드 포커스 처리
  const handleFocus = useCallback(() => {
    setIsEditing(true);
    if (addresses.length > 0) {
      setShowDropdown(true);
    }
  }, [addresses.length]);

  // 입력 필드 블러 처리
  const handleBlur = useCallback(() => {
    // 드롭다운 클릭을 위한 지연
    setTimeout(() => {
      setShowDropdown(false);
      setIsEditing(false);
    }, 200);
  }, []);

  // 입력값 변경 처리
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsEditing(true);
    setError(null);
    setSelectedAddress(null); // 검색어 변경 시 선택된 주소 초기화
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 주소 검색 입력 필드 */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* 주소 검색 결과 드롭다운 */}
        {showDropdown && addresses.length > 0 && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
            {addresses.map((address, index) => (
              <div
                key={index}
                onClick={() => handleAddressSelect(address)}
                className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {address.roadAddress}
                </div>
                <div className="text-sm text-gray-500">
                  {address.jibunAddress}
                </div>
                {address.buildingName && (
                  <div className="text-xs text-blue-600 font-medium">
                    🏢 {address.buildingName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* 검색 결과 없음 */}
        {showDropdown && !isLoading && addresses.length === 0 && searchTerm.length >= minSearchLength && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl">
            <div className="px-3 py-3 text-gray-500 text-center">
              검색 결과가 없습니다.
            </div>
          </div>
        )}
      </div>

      {/* 상세주소 입력 필드 */}
      {showDetailAddress && selectedAddress && (
        <div className="space-y-2 mt-2">
          <input
            type="text"
            value={detailAddress}
            onChange={handleDetailAddressChange}
            placeholder={detailAddressPlaceholder}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoFocus // 상세주소 입력필드에 자동 포커스
          />
          
          {/* 선택된 주소 미리보기 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-700 mb-1 font-medium">✅ 선택된 주소:</div>
            <div className="text-sm font-medium text-gray-900">
              {selectedAddress.address}
              {detailAddress.trim() && (
                <span className="text-blue-600 font-semibold"> {detailAddress.trim()}</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedAddress.jibunAddress}
            </div>
          </div>
          
          {/* 확인 버튼 */}
          <button
            onClick={handleFinalAddressSelect}
            disabled={disabled}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            주소 확인
          </button>
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
