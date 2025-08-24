import React, { useState, useEffect } from 'react';

export interface Address {
  zipCode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  region?: string;
  sido?: string;
  sigungu?: string;
}

export interface AddressSearchProps {
  onAddressSelect: (address: Address) => void;
  placeholder?: string;
  value?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  onAddressSelect, 
  placeholder = '주소를 검색하세요', 
  value = '', 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // value가 변경되면 searchTerm도 업데이트
  useEffect(() => {
    if (value && !isEditing) {
      setSearchTerm(value);
    }
  }, [value, isEditing]);

  // 주소에서 지역 정보 추출
  const extractRegionInfo = (address: string): { region: string; sido: string; sigungu: string } => {
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
  };

  // 샘플 주소 데이터 함수
  const getSampleAddresses = (keyword: string): Address[] => {
    const sampleAddresses: Address[] = [
      {
        zipCode: '06123',
        address: '서울특별시 강남구 테헤란로 427',
        roadAddress: '서울특별시 강남구 테헤란로 427',
        jibunAddress: '서울특별시 강남구 역삼동 737-32',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06124',
        address: '서울특별시 강남구 역삼로 180',
        roadAddress: '서울특별시 강남구 역삼로 180',
        jibunAddress: '서울특별시 강남구 역삼동 737-32',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06125',
        address: '서울특별시 강남구 삼성로 86길 20',
        roadAddress: '서울특별시 강남구 삼성로 86길 20',
        jibunAddress: '서울특별시 강남구 삼성동 159-1',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06131',
        address: '서울특별시 강남구 선릉로 433',
        roadAddress: '서울특별시 강남구 선릉로 433',
        jibunAddress: '서울특별시 강남구 역삼동 737-32',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06134',
        address: '서울특별시 강남구 영동대로 123',
        roadAddress: '서울특별시 강남구 영동대로 123',
        jibunAddress: '서울특별시 강남구 삼성동 123-45',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06136',
        address: '서울특별시 강남구 봉은사로 123',
        roadAddress: '서울특별시 강남구 봉은사로 123',
        jibunAddress: '서울특별시 강남구 삼성동 123-45',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06138',
        address: '서울특별시 강남구 학동로 123',
        roadAddress: '서울특별시 강남구 학동로 123',
        jibunAddress: '서울특별시 강남구 청담동 123-45',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06140',
        address: '서울특별시 강남구 언주로 123',
        roadAddress: '서울특별시 강남구 언주로 123',
        jibunAddress: '서울특별시 강남구 역삼동 123-45',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06142',
        address: '서울특별시 강남구 강남대로 123',
        roadAddress: '서울특별시 강남구 강남대로 123',
        jibunAddress: '서울특별시 강남구 역삼동 123-45',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
      {
        zipCode: '06144',
        address: '서울특별시 강남구 개포로 123',
        roadAddress: '서울특별시 강남구 개포로 123',
        jibunAddress: '서울특별시 강남구 개포동 123-45',
        region: '서울특별시 강남구',
        sido: '서울특별시',
        sigungu: '강남구',
      },
    ];

    // 키워드로 필터링
    return sampleAddresses.filter(addr => {
      const searchLower = keyword.toLowerCase();
      const searchTerms = keyword.split(' ').filter(term => term.length > 0);
      
      const exactMatch = 
        addr.address.toLowerCase().includes(searchLower) ||
        addr.roadAddress.toLowerCase().includes(searchLower) ||
        addr.jibunAddress.toLowerCase().includes(searchLower) ||
        addr.zipCode.includes(keyword) ||
        addr.region?.toLowerCase().includes(searchLower) ||
        addr.sido?.toLowerCase().includes(searchLower) ||
        addr.sigungu?.toLowerCase().includes(searchLower);
      
      const partialMatch = searchTerms.some(term => 
        addr.address.toLowerCase().includes(term.toLowerCase()) ||
        addr.roadAddress.toLowerCase().includes(term.toLowerCase()) ||
        addr.jibunAddress.toLowerCase().includes(term.toLowerCase()) ||
        addr.region?.toLowerCase().includes(term.toLowerCase()) ||
        addr.sido?.toLowerCase().includes(term.toLowerCase()) ||
        addr.sigungu?.toLowerCase().includes(term.toLowerCase()),
      );
      
      return exactMatch || partialMatch;
    });
  };

  // 주소 검색 함수 (실제 API 연동)
  const searchAddresses = async (keyword: string) => {
    if (keyword.length < 1) return;

    setIsLoading(true);
    try {
      // 실제 주소 API 호출 (공공데이터 포털 도로명주소 API)
      const API_KEY = process.env.REACT_APP_JUSO_API_KEY || 'dev';
      
      if (API_KEY === 'dev') {
        // 개발 환경에서는 샘플 데이터 사용
        console.log('개발 환경: 샘플 주소 데이터 사용');
        const sampleAddresses = getSampleAddresses(keyword);
        setAddresses(sampleAddresses);
        setShowDropdown(true);
        return;
      }

      // 실제 API 호출
      const response = await fetch(`https://www.juso.go.kr/addrlink/addrLinkApi.do?currentPage=1&countPerPage=10&keyword=${encodeURIComponent(keyword)}&confmKey=${API_KEY}&resultType=json`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.juso) {
        const apiAddresses: Address[] = data.results.juso.map((juso: any) => ({
          zipCode: juso.zipNo,
          address: juso.roadAddr,
          roadAddress: juso.roadAddr,
          jibunAddress: juso.jibunAddr,
          region: `${juso.admCd.split(' ')[0]} ${juso.admCd.split(' ')[1]}`,
          sido: juso.admCd.split(' ')[0],
          sigungu: juso.admCd.split(' ')[1],
        }));
        
        setAddresses(apiAddresses);
        setShowDropdown(true);
      } else {
        setAddresses([]);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      // API 오류 시 샘플 데이터로 폴백
      const sampleAddresses = getSampleAddresses(keyword);
      setAddresses(sampleAddresses);
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스된 검색
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 1) {
        searchAddresses(searchTerm);
      } else {
        setAddresses([]);
        setShowDropdown(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsEditing(true);
  };

  const handleAddressSelect = (address: Address) => {
    console.log('주소 선택됨:', address);
    
    if (!address.region) {
      const regionInfo = extractRegionInfo(address.address);
      address = { ...address, ...regionInfo };
    }
    
    onAddressSelect(address);
    setSearchTerm(address.address);
    setIsEditing(false);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    if (searchTerm.length >= 1) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setIsEditing(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const regionInfo = extractRegionInfo(searchTerm);
      const customAddress: Address = {
        zipCode: '',
        address: searchTerm,
        roadAddress: searchTerm,
        jibunAddress: searchTerm,
        ...regionInfo,
      };
      onAddressSelect(customAddress);
      setIsEditing(false);
      setShowDropdown(false);
    }
  };

  const handleSearchClick = () => {
    if (searchTerm.length >= 1) {
      searchAddresses(searchTerm);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-l-md focus:outline-none focus:ring-resort-500 focus:border-resort-500 focus:z-10 sm:text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={searchTerm.length < 1 || isLoading}
          className="mt-1 px-4 py-2 bg-resort-600 text-white border border-resort-600 rounded-r-md hover:bg-resort-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-resort-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '검색중...' : '🔍'}
        </button>
      </div>

      {/* 주소 드롭다운 */}
      {showDropdown && addresses.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              검색 중...
            </div>
          )}
          <ul>
            {addresses.map((address, index) => (
              <li
                key={index}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleAddressSelect(address)}
              >
                <div className="font-medium text-sm text-gray-900">
                  📍 {address.address}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                    📮 {address.zipCode}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                    🏘️ {address.region}
                  </span>
                  {address.jibunAddress}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && searchTerm.length >= 1 && addresses.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-4 text-center text-gray-500">
            검색 결과가 없습니다. Enter 키를 눌러 직접 입력하세요.
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-1">
        💡 {searchTerm ? '실제 주소를 검색하거나 직접 입력하세요' : '주소를 입력하고 🔍 버튼을 클릭하거나 Enter를 눌러 검색하세요'}
        <br />
        <span className="text-blue-600">
          📌 실제 주소 API 연동을 원하시면 공공데이터 포털(www.data.go.kr)에서 도로명주소 API 키를 발급받아 .env 파일에 REACT_APP_JUSO_API_KEY로 설정하세요
        </span>
      </div>
    </div>
  );
};

export default AddressSearch;
