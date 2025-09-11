import React, { useState, useEffect, useCallback } from 'react';
import '../types/naverMap';

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
  onInputChange?: (text: string) => void;
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
  onInputChange,
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
  const [isComposing, setIsComposing] = useState(false);

  // 짧은/조합 입력 시 호출 억제 규칙
  const shouldSearch = useCallback((term: string) => {
    const normalized = (term || '').trim();
    if (isComposing) return false; // IME 조합 중에는 검색하지 않음
    // 5자 이상이거나, 공백 포함(구/로/번지 조합), 숫자 포함(번지)일 때만 검색
    return (
      normalized.length >= 5 ||
      /\d/.test(normalized) ||
      normalized.includes(' ')
    );
  }, [isComposing]);

  // value가 변경되면 searchTerm도 업데이트
  useEffect(() => {
    if (value && !isEditing) {
      setSearchTerm(value);
    }
  }, [value, isEditing]);

  // 네이버 지도 API의 내장 지오코딩을 통한 주소 검색

  // 서버 API를 통한 주소 검색 (재시도 로직 포함)
  const searchAddresses = useCallback(async (keyword: string, retryCount = 0) => {
    if (keyword.length < minSearchLength) {
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const maxRetries = 3;
    const retryDelay = 1000; // 1초
    
    try {
      // 1) 네이버 클라이언트 지오코더 우선 시도 (CORS 회피)
      if (window.naver && window.naver.maps && window.naver.maps.Service?.geocode) {
        try {
          setError(null);
          await new Promise<void>((resolve, reject) => {
            window.naver.maps.Service.geocode({ query: keyword }, (status: any, response: any) => {
              try {
                if (status !== window.naver.maps.Service.Status.OK) {
                  return reject(new Error(`NAVER_GEOCODER_FAILED(${status})`));
                }
                // v3 응답 포맷 대응: v2.addresses 또는 result.items
                const v2Addresses = Array.isArray(response?.v2?.addresses) ? response.v2.addresses : [];
                const v3Items = Array.isArray(response?.result?.items) ? response.result.items : [];
                const items = v2Addresses.length > 0 ? v2Addresses : v3Items;
                if (items.length === 0) return reject(new Error('NO_RESULTS'));
                const mapped: Address[] = items.slice(0, maxResults).map((item: any) => {
                  // v2 주소
                  const isV2 = !!(item.roadAddress || item.jibunAddress || item.x || item.y);
                  if (isV2) {
                    return {
                      zipCode: '',
                      address: item.roadAddress || item.jibunAddress || '',
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
                  }
                  // v3 items 포맷: item.addrdetail, item.point.x/y, item.address
                  return {
                    zipCode: '',
                    address: item.address || '',
                    roadAddress: item.addrdetail?.road ? item.address : '',
                    jibunAddress: item.addrdetail?.dongmyun ? item.address : '',
                    region: item.addrdetail?.sido || '',
                    sido: item.addrdetail?.sido || '',
                    sigungu: item.addrdetail?.sigugun || '',
                    emdNm: item.addrdetail?.dongmyun || '',
                    buildingName: item.addrdetail?.buildingName || '',
                    roadName: item.addrdetail?.road || '',
                    buildingNumber: item.addrdetail?.buildingNumber || '',
                    admCd: '',
                    engAddress: '',
                    latitude: item.point?.y ? Number(item.point.y) : undefined,
                    longitude: item.point?.x ? Number(item.point.x) : undefined,
                  } as Address;
                });
                setAddresses(mapped);
                setShowDropdown(true);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          });
          // 클라이언트 결과가 있으면 서버 호출 생략
          return;
        } catch (clientErr) {
          console.warn('네이버 클라이언트 지오코더 우선 시도 실패, 서버로 폴백:', clientErr);
        }
      }

      console.log(`서버 API를 사용하여 주소 검색 (시도 ${retryCount + 1}/${maxRetries + 1}):`, keyword);
      
      // API 베이스 URL 후보 구성: 환경변수 우선, 실패 시 상대경로
      const apiBaseFromEnv = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
      const envDirectPath = apiBaseFromEnv
        ? (apiBaseFromEnv.endsWith('/api') ? `${apiBaseFromEnv}/geocode` : `${apiBaseFromEnv}/api/geocode`)
        : '';
      const projectId = (process.env.REACT_APP_FIREBASE_PROJECT_ID || 'resortbyte').trim();
      const region = (process.env.REACT_APP_FUNCTIONS_REGION || 'asia-northeast3').trim();
      // Cloud Functions 직접 호출 URL (함수 이름이 api이므로, 내부 라우트는 /api/.. → 최종 경로는 /api/geocode)
      const functionDirect1stGen = `https://${region}-${projectId}.cloudfunctions.net/api/geocode`;
      const functionDirectNewGen = `https://api-${region}-${projectId}.cloudfunctions.net/api/geocode`;
      const apiCandidates = [
        `/api/geocode`, // 동일 출처 우선 (리라이트/프록시)
        envDirectPath,
        functionDirect1stGen,
        functionDirectNewGen,
      ].filter(Boolean) as string[];

      let data: any = null;
      let lastError: any = null;

      for (const base of apiCandidates) {
        try {
          const url = `${base}?query=${encodeURIComponent(keyword)}`;
          console.log('주소 검색 요청 URL:', url);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            lastError = new Error(`서버 오류: ${response.status}`);
            continue;
          }

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const rawText = await response.text();
            console.warn('서버가 JSON이 아닌 응답을 반환했습니다. content-type:', contentType, '응답 미리보기:', rawText?.slice(0, 200));
            lastError = new Error('INVALID_CONTENT_TYPE');
            continue;
          }

          data = await response.json();
          break; // 성공
        } catch (innerErr: any) {
          lastError = innerErr;
          continue;
        }
      }

      if (!data) {
        throw lastError || new Error('NO_RESPONSE_DATA');
      }

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
    } catch (error: any) {
      console.error('주소 검색 오류:', error);
      
      // 재시도 가능한 오류인지 확인
      const isRetryableError = error.name === 'AbortError' || 
                              error.message.includes('ENOTFOUND') || 
                              error.message.includes('ECONNREFUSED') ||
                              error.message.includes('timeout') ||
                              error.message.includes('INVALID_CONTENT_TYPE');
      
      if (isRetryableError && retryCount < maxRetries) {
        console.log(`${retryDelay}ms 후 재시도... (${retryCount + 1}/${maxRetries})`);
        setError(`연결 중... (${retryCount + 1}/${maxRetries + 1})`);
        
        setTimeout(() => {
          searchAddresses(keyword, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // 서버 경로가 HTML을 반환하는 경우 등 최종 실패 시: 네이버 클라이언트 지오코더 폴백 시도
      const canUseNaver = !!(window.naver && window.naver.maps && window.naver.maps.Service && window.naver.maps.Service.geocode);
      if (canUseNaver) {
        try {
          setError('서버 연결 문제로 지도 검색으로 시도합니다...');
          await new Promise<void>((resolve, reject) => {
            window.naver.maps.Service.geocode({ query: keyword }, (status: any, response: any) => {
              try {
                if (status !== window.naver.maps.Service.Status.OK) {
                  return reject(new Error(`NAVER_GEOCODER_FAILED(${status})`));
                }
                const items = Array.isArray(response.v2?.addresses) ? response.v2.addresses : [];
                if (items.length === 0) {
                  setError('검색 결과가 없습니다. 정확한 주소를 입력해주세요. (예: 서울특별시 강남구 테헤란로 427)');
                  setAddresses([]);
                  setShowDropdown(false);
                  return resolve();
                }
                const mapped: Address[] = items.slice(0, maxResults).map((item: any) => ({
                  zipCode: '',
                  address: item.roadAddress || item.jibunAddress || '',
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
                }));
                setAddresses(mapped);
                setShowDropdown(true);
                setError(null);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          });
          return;
        } catch (geocodeErr) {
          console.error('네이버 클라이언트 지오코더 폴백 실패:', geocodeErr);
        }
      }

      // 폴백도 실패한 경우 사용자 메시지 처리
      if (error.name === 'AbortError') {
        setError('주소 검색 시간이 초과되었습니다. 다시 시도해주세요.');
      } else if (String(error.message || '').includes('INVALID_CONTENT_TYPE')) {
        setError('주소 검색 응답이 올바르지 않습니다. 잠시 후 다시 시도해주세요.');
      } else if (String(error.message || '').includes('ENOTFOUND')) {
        setError('인터넷 연결을 확인해주세요.');
      } else {
        setError('주소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }

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
      if (shouldSearch(searchTerm)) {
        searchAddresses(searchTerm);
      } else {
        setAddresses([]);
        setShowDropdown(false);
      }
    }, 500); // 500ms 디바운스로 완화

    return () => clearTimeout(timer);
  }, [searchTerm, shouldSearch, searchAddresses]);

  // 주소 선택 처리
  const handleAddressSelect = useCallback((address: Address) => {
    console.log('AddressSearch - 주소 선택됨:', address);
    setSelectedAddress(address);
    setSearchTerm(address.address);
    setShowDropdown(false); // 드롭다운 즉시 숨김
    setIsEditing(false);
    setAddresses([]); // 검색 결과도 초기화
    
    // 상세주소가 표시되지 않는 경우 바로 콜백 호출
    if (!showDetailAddress) {
      console.log('AddressSearch - onAddressSelect 호출 (상세주소 없음)');
      onAddressSelect(address);
    } else {
      console.log('AddressSearch - 상세주소 입력 모드');
      // 상세주소 입력 모드에서는 자동으로 상세주소 필드에 포커스
      setTimeout(() => {
        const detailInput = document.querySelector('input[placeholder*="상세주소"]') as HTMLInputElement;
        if (detailInput) {
          detailInput.focus();
        }
      }, 100);
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
    onInputChange?.(value);
  }, []);

  // 조합 입력 이벤트 처리(한글 등)
  const handleCompositionStart = useCallback(() => setIsComposing(true), []);
  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    // 조합 종료 시점에 규칙 충족하면 즉시 검색 시도
    const term = (e.target as HTMLInputElement).value;
    onInputChange?.(term);
    if (shouldSearch(term)) {
      searchAddresses(term);
    }
  }, [shouldSearch, searchAddresses]);

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
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
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
              검색 결과가 없습니다. 도로명+번지로 입력해 보세요. 예: "선릉로 513"
            </div>
          </div>
        )}
      </div>

      {/* 상세주소 입력 필드 - 단순화된 버전 */}
      {showDetailAddress && selectedAddress && (
        <div className="space-y-3 mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {/* 선택된 주소 표시 */}
          <div className="text-sm">
            <div className="text-gray-600 mb-1">📍 선택된 주소:</div>
            <div className="font-medium text-gray-900">{selectedAddress.address}</div>
            {selectedAddress.jibunAddress && selectedAddress.jibunAddress !== selectedAddress.address && (
              <div className="text-xs text-gray-500 mt-1">지번: {selectedAddress.jibunAddress}</div>
            )}
          </div>
          
          {/* 상세주소 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상세주소 <span className="text-gray-400 text-xs">(선택사항)</span>
            </label>
            <input
              type="text"
              value={detailAddress}
              onChange={handleDetailAddressChange}
              placeholder="동/호수, 층수, 사무실 번호 등"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              autoFocus
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 상세주소는 선택사항입니다. 건물명이나 동호수만 입력하세요.
            </div>
          </div>
          
          {/* 최종 주소 미리보기 */}
          {detailAddress.trim() && (
            <div className="p-2 bg-white border border-blue-200 rounded text-sm">
              <div className="text-blue-700 font-medium mb-1">📋 최종 주소:</div>
              <div className="text-gray-900">
                {selectedAddress.address} <span className="text-blue-600 font-semibold">{detailAddress.trim()}</span>
              </div>
            </div>
          )}
          
          {/* 액션 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={handleFinalAddressSelect}
              disabled={disabled}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              ✅ 주소 확인
            </button>
            <button
              onClick={() => {
                setSelectedAddress(null);
                setDetailAddress('');
                setSearchTerm('');
              }}
              disabled={disabled}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-sm"
            >
              다시 선택
            </button>
          </div>
        </div>
      )}
      
      {/* 에러 메시지 - 개선된 버전 */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">주소 검색 오류</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
              {error.includes('연결') && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      setError(null);
                      if (searchTerm.length >= minSearchLength) {
                        searchAddresses(searchTerm);
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-500 underline"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
