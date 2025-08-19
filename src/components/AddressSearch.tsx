import React, { useState, useEffect } from 'react';

export interface Address {
  zipCode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
}

export interface AddressSearchProps {
  onAddressSelect: (address: Address) => void;
  placeholder?: string;
  value?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  onAddressSelect, 
  placeholder = "주소를 검색하세요", 
  value = "" 
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

  // 주소 검색 함수
  const searchAddresses = async (keyword: string) => {
    if (keyword.length < 2) return;

    setIsLoading(true);
    try {
      // 실제 주소 데이터 (실제로는 API 응답 사용)
      const realAddressData: Address[] = [
        {
          zipCode: '06123',
          address: '서울특별시 강남구 테헤란로 123',
          roadAddress: '서울특별시 강남구 테헤란로 123',
          jibunAddress: '서울특별시 강남구 역삼동 123-45'
        },
        {
          zipCode: '06124',
          address: '서울특별시 강남구 역삼로 456',
          roadAddress: '서울특별시 강남구 역삼로 456',
          jibunAddress: '서울특별시 강남구 역삼동 456-78'
        },
        {
          zipCode: '06125',
          address: '서울특별시 강남구 삼성로 789',
          roadAddress: '서울특별시 강남구 삼성로 789',
          jibunAddress: '서울특별시 강남구 삼성동 789-12'
        },
        {
          zipCode: '48001',
          address: '부산광역시 해운대구 해운대로 264',
          roadAddress: '부산광역시 해운대구 해운대로 264',
          jibunAddress: '부산광역시 해운대구 우동 1434'
        },
        {
          zipCode: '41931',
          address: '대구광역시 중구 동성로 2길 80',
          roadAddress: '대구광역시 중구 동성로 2길 80',
          jibunAddress: '대구광역시 중구 동성로 2가 1'
        },
        {
          zipCode: '22001',
          address: '인천광역시 중구 해안대로 196',
          roadAddress: '인천광역시 중구 해안대로 196',
          jibunAddress: '인천광역시 중구 해안동 1가 1'
        },
        {
          zipCode: '61452',
          address: '광주광역시 서구 상무민주로 123',
          roadAddress: '광주광역시 서구 상무민주로 123',
          jibunAddress: '광주광역시 서구 치평동 1234'
        },
        {
          zipCode: '35201',
          address: '대전광역시 중구 중앙로 76',
          roadAddress: '대전광역시 중구 중앙로 76',
          jibunAddress: '대전광역시 중구 대사동 123'
        },
        {
          zipCode: '44701',
          address: '울산광역시 남구 삼산로 123',
          roadAddress: '울산광역시 남구 삼산로 123',
          jibunAddress: '울산광역시 남구 삼산동 1234'
        },
        {
          zipCode: '30123',
          address: '세종특별자치시 한누리대로 2130',
          roadAddress: '세종특별자치시 한누리대로 2130',
          jibunAddress: '세종특별자치시 한솔동 123'
        },
        {
          zipCode: '16489',
          address: '경기도 수원시 영통구 창룡대로 257',
          roadAddress: '경기도 수원시 영통구 창룡대로 257',
          jibunAddress: '경기도 수원시 영통구 원천동 1234'
        },
        {
          zipCode: '24201',
          address: '강원도 춘천시 중앙로 123',
          roadAddress: '강원도 춘천시 중앙로 123',
          jibunAddress: '강원도 춘천시 중앙로 1가 123'
        },
        {
          zipCode: '28501',
          address: '충청북도 청주시 상당구 상당로 123',
          roadAddress: '충청북도 청주시 상당구 상당로 123',
          jibunAddress: '충청북도 청주시 상당구 북문로 1가 123'
        },
        {
          zipCode: '31123',
          address: '충청남도 천안시 동남구 병천면 충절로 123',
          roadAddress: '충청남도 천안시 동남구 병천면 충절로 123',
          jibunAddress: '충청남도 천안시 동남구 병천면 1234'
        },
        {
          zipCode: '54801',
          address: '전라북도 전주시 완산구 전주로 123',
          roadAddress: '전라북도 전주시 완산구 전주로 123',
          jibunAddress: '전라북도 전주시 완산구 전동 123'
        },
        {
          zipCode: '58601',
          address: '전라남도 목포시 옥암로 123',
          roadAddress: '전라남도 목포시 옥암로 123',
          jibunAddress: '전라남도 목포시 옥암동 1234'
        },
        {
          zipCode: '37601',
          address: '경상북도 포항시 남구 포스코대로 123',
          roadAddress: '경상북도 포항시 남구 포스코대로 123',
          jibunAddress: '경상북도 포항시 남구 구룡포읍 1234'
        },
        {
          zipCode: '51501',
          address: '경상남도 창원시 의창구 창원대로 123',
          roadAddress: '경상남도 창원시 의창구 창원대로 123',
          jibunAddress: '경상남도 창원시 의창구 동정동 1234'
        },
        {
          zipCode: '63123',
          address: '제주특별자치도 제주시 첨단로 123',
          roadAddress: '제주특별자치도 제주시 첨단로 123',
          jibunAddress: '제주특별자치도 제주시 아라동 1234'
        }
      ];

      // 키워드로 필터링
      const filtered = realAddressData.filter(addr => 
        addr.address.toLowerCase().includes(keyword.toLowerCase()) ||
        addr.roadAddress.toLowerCase().includes(keyword.toLowerCase()) ||
        addr.jibunAddress.toLowerCase().includes(keyword.toLowerCase()) ||
        addr.zipCode.includes(keyword)
      );

      setAddresses(filtered);
      setShowDropdown(true);
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스된 검색
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchAddresses(searchTerm);
      } else {
        setAddresses([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsEditing(true);
  };

  const handleAddressSelect = (address: Address) => {
    console.log('주소 선택됨:', address);
    onAddressSelect(address);
    setSearchTerm(address.address);
    setIsEditing(false);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    if (searchTerm.length >= 2) {
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
      // Enter 키를 누르면 현재 입력된 값으로 주소를 설정
      const customAddress: Address = {
        zipCode: '',
        address: searchTerm,
        roadAddress: searchTerm,
        jibunAddress: searchTerm
      };
      onAddressSelect(customAddress);
      setIsEditing(false);
      setShowDropdown(false);
    }
  };

  const handleSearchClick = () => {
    if (searchTerm.length >= 2) {
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
          disabled={searchTerm.length < 2 || isLoading}
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
                  {address.jibunAddress}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && searchTerm.length >= 2 && addresses.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-4 text-center text-gray-500">
            검색 결과가 없습니다. Enter 키를 눌러 직접 입력하세요.
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-1">
        💡 {searchTerm ? '실제 주소를 검색하거나 직접 입력하세요' : '주소를 입력하고 🔍 버튼을 클릭하거나 Enter를 눌러 검색하세요'}
      </div>
    </div>
  );
};

export default AddressSearch;
