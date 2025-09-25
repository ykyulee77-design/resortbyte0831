import React, { useEffect, useMemo, useState } from 'react';
import NaverMap from './NaverMap';

type Coordinates = {
  lat: number;
  lng: number;
};

interface AddressMarkerMapProps {
  address: string;
  height?: number | string;
  title?: string;
  zoom?: number;
}

const DEFAULT_CENTER: Coordinates = { lat: 37.5665, lng: 126.9780 };

const AddressMarkerMap: React.FC<AddressMarkerMapProps> = ({ address, height = 400, title, zoom = 14 }) => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCoords = async () => {
      if (!address || address.trim().length < 2) {
        setCoords(null);
        return;
      }
      setLoading(true);
      try {
        const url = `/api/geocode/coordinates?address=${encodeURIComponent(address)}`;
        const resp = await fetch(url);
        const data = await resp.json();
        const result = data?.data || data; // 서버가 success 래핑 또는 직접 반환 둘 다 대응
        const lat = parseFloat(result?.lat);
        const lng = parseFloat(result?.lng);
        if (!cancelled && Number.isFinite(lat) && Number.isFinite(lng)) {
          setCoords({ lat, lng });
        }
      } catch (_) {
        if (!cancelled) setCoords(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCoords();
    return () => { cancelled = true; };
  }, [address]);

  const center = useMemo(() => coords || DEFAULT_CENTER, [coords]);

  const markers = useMemo(() => {
    if (!coords) return [] as any[];
    return [
      {
        position: { lat: coords.lat, lng: coords.lng },
        title: title || address,
        content: address,
      },
    ];
  }, [coords, address, title]);

  return (
    <div style={{ width: '100%', height }}>
      <NaverMap
        center={center}
        zoom={coords ? zoom : 11}
        markers={markers}
      />
      {!coords && !loading && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6c757d' }}>주소를 찾지 못해 기본 위치를 표시했습니다.</div>
      )}
    </div>
  );
};

export default AddressMarkerMap;


