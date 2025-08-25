import React, { useState, useEffect, useCallback } from 'react';

// 지도 연동을 위한 확장된 주소 인터페이스
export interface Address {
  // 기본 주소 정보
  zipCode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  
  // 상세주소 (사용자 입력)
  detailAddress?: string;
  
  // 지역 정보 (지도 마커 표시용)
  region?: string;
  sido?: string;
  sigungu?: string;
  emdNm?: string; // 읍면동
  
  // 지도 연동을 위한 좌표 정보 (향후 추가 예정)
  latitude?: number;
  longitude?: number;
  
  // 상세 주소 정보 (지도 표시용)
  buildingName?: string;
  roadName?: string;
  buildingNumber?: string;
  admCd?: string; // 행정구역코드
  
  // 영어 주소 (국제화 지원)
  engAddress?: string;
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

  // 주소에서 지역 정보 추출 (지도 마커 표시용)
  const extractRegionInfo = useCallback((address: string): { region: string; sido: string; sigungu: string } => {
    const parts = address.split(' ');
    let region = '';
    let sido = '';
    let sigungu = '';

    if (parts.length >= 2) {
      sido = parts[0];
      sigungu = parts[1];
      region = `${sido} ${sigungu}`;
    } else if (parts.length === 1) {
      sido = parts[0];
      region = sido;
    }

    return { region, sido, sigungu };
  }, []);

  // 공공데이터 포털 API 응답을 Address 객체로 변환
  const mapApiResponseToAddress = useCallback((juso: any): Address => {
    const regionInfo = extractRegionInfo(juso.roadAddr || juso.jibunAddr);
    
    return {
      // 기본 주소 정보
      zipCode: juso.zipNo || '',
      address: juso.roadAddr || juso.jibunAddr,
      roadAddress: juso.roadAddr || '',
      jibunAddress: juso.jibunAddr || '',
      
      // 지역 정보
      region: regionInfo.region,
      sido: regionInfo.sido,
      sigungu: regionInfo.sigungu,
      emdNm: juso.emdNm || '',
      
      // 상세 주소 정보
      buildingName: juso.bdNm || '',
      roadName: juso.rn || '',
      buildingNumber: juso.buldMnnm || '',
      admCd: juso.admCd || '',
      
      // 영어 주소
      engAddress: juso.engAddr || '',
      
      // 지도 좌표 (향후 지오코딩 API로 추가 예정)
      // latitude: 0,
      // longitude: 0,
    };
  }, [extractRegionInfo]);

  // 공공데이터 포털 API를 통한 주소 검색
  const searchAddresses = useCallback(async (keyword: string) => {
    if (keyword.length < minSearchLength) {
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    console.log('🔍 주소 검색 시작:', keyword);
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `http://localhost:4000/api/geocode?query=${encodeURIComponent(keyword)}`;
      console.log('🌐 API 호출 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 응답 상태:', response.status);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 받은 데이터:', data);
      
      // 공공데이터 포털 API 응답 처리
      if (data.results && data.results.juso && data.results.juso.length > 0) {
        const apiAddresses: Address[] = data.results.juso
          .slice(0, maxResults) // 결과 수 제한
          .map(mapApiResponseToAddress);
        
        setAddresses(apiAddresses);
        setShowDropdown(true);
      } else {
        // 샘플 데이터 사용 (전국 주요 도시 주소)
        console.log('📝 API 응답 없음, 샘플 데이터 사용');
        const sampleAddresses: Address[] = getSampleAddresses(keyword);
        setAddresses(sampleAddresses);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setError('주소 검색 중 오류가 발생했습니다.');
      setAddresses([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [minSearchLength, maxResults, mapApiResponseToAddress]);

  // 샘플 주소 데이터 (API 실패 시 폴백용)
  const getSampleAddresses = useCallback((keyword: string): Address[] => {
    const sampleData: Address[] = [
      // 서울 강남구
      {
        zipCode: '06123',
        address: '서울특별시 강남구 테헤란로 427',
        roadAddress: '서울특별시 강남구 테헤란로 427',
        jibunAddress: '서울특별시 강남구 역삼동 737-32',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
        emdNm: '역삼동',
        buildingName: '강남파이낸스센터',
        roadName: '테헤란로',
        buildingNumber: '427',
        engAddress: '427 Teheran-ro, Gangnam-gu, Seoul',
      },
      {
        zipCode: '06124',
        address: '서울특별시 강남구 역삼로 180',
        roadAddress: '서울특별시 강남구 역삼로 180',
        jibunAddress: '서울특별시 강남구 역삼동 737-32',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
        emdNm: '역삼동',
        buildingName: '역삼빌딩',
        roadName: '역삼로',
        buildingNumber: '180',
        engAddress: '180 Yeoksam-ro, Gangnam-gu, Seoul',
      },
      // 부산 해운대구
      {
        zipCode: '48095',
        address: '부산광역시 해운대구 해운대해변로 264',
        roadAddress: '부산광역시 해운대구 해운대해변로 264',
        jibunAddress: '부산광역시 해운대구 우동 1434',
        region: '부산광역시 해운대구',
        sido: '부산광역시',
        sigungu: '해운대구',
        emdNm: '우동',
        buildingName: '해운대해수욕장',
        roadName: '해운대해변로',
        buildingNumber: '264',
        engAddress: '264 Haeundaehaebyeon-ro, Haeundae-gu, Busan',
      },
    ];

    return sampleData.filter(addr => 
      addr.address.toLowerCase().includes(keyword.toLowerCase()) ||
      addr.roadAddress.toLowerCase().includes(keyword.toLowerCase()) ||
      addr.jibunAddress.toLowerCase().includes(keyword.toLowerCase()) ||
      (addr.region && addr.region.toLowerCase().includes(keyword.toLowerCase()))
    );
  }, []);

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
    console.log('📍 선택된 주소:', address);
    setSelectedAddress(address);
    setSearchTerm(address.address);
    setShowDropdown(false);
    setIsEditing(false);
    
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
      
      console.log('📍 최종 선택된 주소:', finalAddress);
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
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {addresses.map((address, index) => (
              <div
                key={index}
                onClick={() => handleAddressSelect(address)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">
                  {address.roadAddress}
                </div>
                <div className="text-sm text-gray-500">
                  {address.jibunAddress}
                </div>
                {address.buildingName && (
                  <div className="text-xs text-blue-600">
                    {address.buildingName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* 검색 결과 없음 */}
        {showDropdown && !isLoading && addresses.length === 0 && searchTerm.length >= minSearchLength && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="px-3 py-2 text-gray-500 text-center">
              검색 결과가 없습니다.
            </div>
          </div>
        )}
      </div>

      {/* 상세주소 입력 필드 */}
      {showDetailAddress && selectedAddress && (
        <div className="space-y-2">
          <input
            type="text"
            value={detailAddress}
            onChange={handleDetailAddressChange}
            placeholder={detailAddressPlaceholder}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          {/* 선택된 주소 미리보기 */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600 mb-1">선택된 주소:</div>
            <div className="text-sm font-medium text-gray-900">
              {selectedAddress.address}
              {detailAddress.trim() && (
                <span className="text-blue-600"> {detailAddress.trim()}</span>
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
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
