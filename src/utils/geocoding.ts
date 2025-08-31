import { AddressSearchResult } from '../types/naverMap';

export const searchAddress = async (address: string): Promise<AddressSearchResult | null> => {
  try {
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.REACT_APP_NAVER_CLIENT_ID!,
          'X-NCP-APIGW-API-KEY': process.env.REACT_APP_NAVER_CLIENT_SECRET!
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.addresses && data.addresses.length > 0) {
      const addressData = data.addresses[0];
      return {
        lat: parseFloat(addressData.y),
        lng: parseFloat(addressData.x),
        address: addressData.roadAddress || addressData.jibunAddress,
        roadAddress: addressData.roadAddress,
        jibunAddress: addressData.jibunAddress
      };
    }
    
    return null;
  } catch (error) {
    console.error('주소 검색 실패:', error);
    return null;
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&sourcecrs=epsg:4326&targetcrs=epsg:4326&orders=legalcode,admcode,addr,roadaddr&output=json`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.REACT_APP_NAVER_CLIENT_ID!,
          'X-NCP-APIGW-API-KEY': process.env.REACT_APP_NAVER_CLIENT_SECRET!
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return result.region.area1.name + ' ' + result.region.area2.name + ' ' + result.region.area3.name;
    }
    
    return null;
  } catch (error) {
    console.error('역지오코딩 실패:', error);
    return null;
  }
};

export const validateAddress = (address: string): boolean => {
  // 기본적인 주소 유효성 검사
  const addressPattern = /^[가-힣0-9\s\-()]+$/;
  return addressPattern.test(address) && address.length >= 5;
};

export const formatAddress = (address: string): string => {
  // 주소 포맷팅 (예: 서울시 강남구 -> 서울 강남구)
  return address
    .replace(/시\s+/g, ' ')
    .replace(/구\s+/g, '구 ')
    .replace(/동\s+/g, '동 ')
    .trim();
};
