declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}

export interface NaverMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  markers?: Array<{
    position: {
      lat: number;
      lng: number;
    };
    title?: string;
    content?: string;
  }>;
  onMapClick?: (event: any, latLng: any) => void;
  onMarkerClick?: (marker: any) => void;
  showCurrentLocation?: boolean;
  onCurrentLocationFound?: (location: {lat: number, lng: number}, address: string) => void;
}

export interface AddressSearchResult {
  lat: number;
  lng: number;
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
}

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}
