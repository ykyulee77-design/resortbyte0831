import { Address } from '../components/AddressSearch';

/**
 * 주소 검증 함수
 * @param address 주소 문자열
 * @returns 검증 결과
 */
export const validateAddress = (address: string): {isValid: boolean, message?: string} => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, message: '주소를 입력해주세요.' };
  }
  
  if (address.trim().length < 5) {
    return { isValid: false, message: '주소가 너무 짧습니다.' };
  }
  
  // 특수문자 검증
  const specialChars = /[%=><]/;
  if (specialChars.test(address)) {
    return { isValid: false, message: '특수문자를 포함할 수 없습니다.' };
  }
  
  // SQL 인젝션 방지
  const sqlKeywords = ['OR', 'SELECT', 'INSERT', 'DELETE', 'UPDATE', 'CREATE', 'DROP', 'EXEC', 'UNION', 'FETCH', 'DECLARE', 'TRUNCATE'];
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(address)) {
      return { isValid: false, message: `"${keyword}"와 같은 특정문자로 검색할 수 없습니다.` };
    }
  }
  
  return { isValid: true };
};

/**
 * 주소 포맷팅 함수
 * @param address 주소 객체
 * @param format 포맷 타입 ('full' | 'short' | 'road' | 'jibun')
 * @returns 포맷된 주소 문자열
 */
export const formatAddress = (address: Address, format: 'full' | 'short' | 'road' | 'jibun' = 'full'): string => {
  switch (format) {
    case 'full':
      return address.address;
    case 'short':
      return address.region || address.address;
    case 'road':
      return address.roadAddress;
    case 'jibun':
      return address.jibunAddress;
    default:
      return address.address;
  }
};

/**
 * 주소 비교 함수
 * @param addr1 첫 번째 주소
 * @param addr2 두 번째 주소
 * @returns 동일 여부
 */
export const compareAddresses = (addr1: Address, addr2: Address): boolean => {
  return addr1.address === addr2.address && addr1.zipCode === addr2.zipCode;
};

/**
 * 주소 검색 히스토리 관리
 */
export class AddressHistory {
  private static readonly STORAGE_KEY = 'address_search_history';
  private static readonly MAX_HISTORY = 10;

  static addToHistory(address: Address): void {
    try {
      const history = this.getHistory();
      const existingIndex = history.findIndex(addr => compareAddresses(addr, address));
      
      if (existingIndex > -1) {
        // 기존 항목 제거
        history.splice(existingIndex, 1);
      }
      
      // 새 항목을 맨 앞에 추가
      history.unshift(address);
      
      // 최대 개수 제한
      if (history.length > this.MAX_HISTORY) {
        history.splice(this.MAX_HISTORY);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('주소 히스토리 저장 오류:', error);
    }
  }

  static getHistory(): Address[] {
    try {
      const history = localStorage.getItem(this.STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('주소 히스토리 로드 오류:', error);
      return [];
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('주소 히스토리 삭제 오류:', error);
    }
  }
}

/**
 * 주소 데이터 정규화
 * @param rawAddress API 응답의 원시 주소 데이터
 * @returns 정규화된 Address 객체
 */
export const normalizeAddressData = (rawAddress: any): Address => {
  return {
    zipCode: rawAddress.zipNo || rawAddress.zipCode || '',
    address: rawAddress.roadAddr || rawAddress.address || '',
    roadAddress: rawAddress.roadAddr || '',
    jibunAddress: rawAddress.jibunAddr || '',
    region: rawAddress.region || '',
    sido: rawAddress.siNm || rawAddress.sido || '',
    sigungu: rawAddress.sggNm || rawAddress.sigungu || '',
    emdNm: rawAddress.emdNm || '',
    buildingName: rawAddress.bdNm || '',
    roadName: rawAddress.rn || '',
    buildingNumber: rawAddress.buldMnnm || '',
    admCd: rawAddress.admCd || '',
    engAddress: rawAddress.engAddr || '',
  };
};
