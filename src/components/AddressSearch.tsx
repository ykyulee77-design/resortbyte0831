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
  showDetailAddress = false, // 기본값을 false로 변경
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

  // 서버 API를 통한 주소 검색
  const searchAddresses = useCallback(async (keyword: string) => {
    if (keyword.length < minSearchLength) {
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('서버 API를 사용하여 주소 검색:', keyword);
      
      // 배포/개발 모두 동작하도록 상대 경로 사용
      const response = await fetch(`/api/geocode?query=${encodeURIComponent(keyword)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('서버 API 주소 검색 결과:', data);
        
        // 1) 네이버 지도 지오코딩 응답 처리
        if (Array.isArray(data.addresses) && data.addresses.length > 0) {
          const mapped: Address[] = data.addresses.slice(0, maxResults).map((item: any) => {
            // postalCode 추출 시도
            let zip = '';
            if (Array.isArray(item.addressElements)) {
              const postal = item.addressElements.find((el: any) => el.types?.includes('POSTAL_CODE'));
              zip = postal?.longName || postal?.shortName || '';
            }
            return {
              zipCode: zip,
              address: item.roadAddress || item.jibunAddress || item.address || '',
              roadAddress: item.roadAddress || '',
              jibunAddress: item.jibunAddress || '',
              region: item.region || '',
              sido: item.region || '',
              sigungu: item.city || item.district || '',
              emdNm: item.town || '',
              buildingName: item.buildingName || '',
              roadName: item.roadName || '',
              buildingNumber: item.mainAddressNo || '',
              admCd: '',
              engAddress: item.englishAddress || '',
              latitude: item.y ? Number(item.y) : undefined,
              longitude: item.x ? Number(item.x) : undefined,
            } as Address;
          });
          setAddresses(mapped);
          setShowDropdown(true);
        }
        // 2) 공공데이터 포털 응답 처리 (호환성)
        else if (data.results && data.results.juso && data.results.juso.length > 0) {
          const apiAddresses: Address[] = data.results.juso
            .slice(0, maxResults)
            .map((item: any) => ({
              zipCode: item.zipNo || '',
              address: item.roadAddr || item.jibunAddr,
              roadAddress: item.roadAddr || '',
              jibunAddress: item.jibunAddr || '',
              region: item.siNm || '',
              sido: item.siNm || '',
              sigungu: item.sggNm || '',
              emdNm: item.emdNm || '',
              buildingName: item.bdNm || '',
              roadName: item.roadNm || '',
              buildingNumber: item.bdNo || '',
              admCd: item.admCd || '',
              engAddress: item.engAddr || '',
              latitude: undefined,
              longitude: undefined,
            }));
          setAddresses(apiAddresses);
          setShowDropdown(true);
        } else {
          console.log('서버 API 검색 결과 없음');
          setError('검색 결과가 없습니다. 정확한 주소를 입력해주세요. (예: 서울특별시 강남구 테헤란로 427)');
          setAddresses([]);
          setShowDropdown(false);
        }
      } else {
        console.log('서버 API 오류:', response.status);
        setError('주소 검색 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setAddresses([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setError('주소 검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      setAddresses([]);
      setShowDropdown(false);
    } finally {
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
