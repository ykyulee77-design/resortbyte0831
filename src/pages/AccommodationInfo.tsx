import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Building, 
  MapPin, 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  X, 
  Edit3,
  Users,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadImage, deleteImage, compressImage } from '../utils/imageUpload';
import AddressSearch from '../components/AddressSearch';

interface AccommodationData {
  name: string;
  type: string;
  address: string;
  detailAddress: string;


  capacity: string;
  monthlyRent: string;
  other: string;
  utilities: string;
  facilities: string[];
  amenities: string[]; // 부대시설
  roomTypes: { [key: string]: boolean }; // 객실 타입
  roomPrices: { [key: string]: string }; // 객실별 가격
  roomFacilities: { [key: string]: string[] }; // 객실별 시설
  paymentType: string; // 결제 방식
  rules: string;
  images: string[];
  imageDescriptions: string[];
  isPublic: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const AccommodationInfo: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 객실 타입 옵션 (1~4인실 + 기타)
  const ROOM_TYPE_OPTIONS = ['1인실', '2인실', '3인실', '4인실', '기타'];

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accommodationInfo, setAccommodationInfo] = useState<AccommodationData | null>(null);
  const [avgAccommodationRating, setAvgAccommodationRating] = useState<number | null>(null);
  const [editData, setEditData] = useState<AccommodationData>({
    name: '',
    type: 'dormitory',
    address: '',
    detailAddress: '',


    capacity: '',
    monthlyRent: '',
    other: '',
    utilities: '',
    facilities: [],
    amenities: [],
    roomTypes: {
      '1인실': false,
      '2인실': false,
      '3인실': false,
      '4인실': false,
      '기타': false
    },
    roomPrices: {
      '1인실': '',
      '2인실': '',
      '3인실': '',
      '4인실': '',
      '기타': ''
    },
    roomFacilities: {
      '1인실': [],
      '2인실': [],
      '3인실': [],
      '4인실': [],
      '기타': []
    },
    paymentType: 'monthly',
    rules: '',
    images: [],
    imageDescriptions: [],
    isPublic: true
  });

  const isOwner = user?.uid === employerId;

  // URL 파라미터로 edit 모드 감지
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'edit' && isOwner) {
      setIsEditing(true);
    }
  }, [searchParams, isOwner]);

  // 기숙사 정보 로딩
  useEffect(() => {
    const loadAccommodationInfo = async () => {
      if (!employerId) return;

      try {
        setLoading(true);
        
        // 1. 회사 정보를 먼저 가져와서 기본 기숙사명 설정
        let defaultName = '기숙사';
        try {
          const companyRef = doc(db, 'companyInfo', employerId);
          const companySnap = await getDoc(companyRef);
          
          if (companySnap.exists()) {
            const companyData = companySnap.data();
            defaultName = `${companyData.name || '회사'} 기숙사`;
          }
        } catch (companyError) {
          console.error('회사 정보 로딩 실패:', companyError);
        }
        
        // 2. 기숙사 정보 로딩
        const accommodationRef = doc(db, 'accommodationInfo', employerId);
        const accommodationSnap = await getDoc(accommodationRef);

        if (accommodationSnap.exists()) {
          const data = accommodationSnap.data() as AccommodationData;
          setAccommodationInfo(data);
          
          // 기존 데이터에 새로운 필드들이 없을 수 있으므로 기본값으로 채움
          const finalData = {
            name: data.name && data.name.trim() !== '' ? data.name : defaultName,
            type: data.type || 'dormitory',
            address: data.address || '',
            detailAddress: data.detailAddress || '',
      
      
            capacity: data.capacity || '',
            monthlyRent: data.monthlyRent || '',
            other: data.other || '',
            utilities: data.utilities || '',
            facilities: data.facilities || [],
            amenities: data.amenities || [],
            roomTypes: data.roomTypes || {
              '1인실': false,
              '2인실': false,
              '3인실': false,
              '4인실': false,
              '기타': false
            },
            roomPrices: data.roomPrices || {
              '1인실': '',
              '2인실': '',
              '3인실': '',
              '4인실': '',
              '기타': ''
            },
            roomFacilities: data.roomFacilities || {
              '1인실': [],
              '2인실': [],
              '3인실': [],
              '4인실': [],
              '기타': []
            },
            paymentType: data.paymentType || 'monthly',
            rules: data.rules || '',
            images: data.images || [],
            imageDescriptions: data.imageDescriptions || [],
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
          
          setEditData(finalData);
        } else {
          // 기숙사 정보가 없으면 기본값으로 설정
          setEditData(prev => ({
            ...prev,
            name: defaultName
          }));
        }
      } catch (error) {
        console.error('기숙사 정보 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccommodationInfo();
  }, [employerId]);

  // 평균 평점 로딩
  useEffect(() => {
    const loadRating = async () => {
      if (!employerId) return;
      try {
        const snap = await getDocs(query(collection(db, 'reviews'), where('resort', '==', employerId)));
        const ratings = snap.docs
          .map(d => (d.data() as any).accommodationRating || 0)
          .filter((n: number) => typeof n === 'number' && n > 0);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          setAvgAccommodationRating(parseFloat(avg.toFixed(1)));
        } else {
          setAvgAccommodationRating(null);
        }
      } catch (e) {
        console.log('평점 로딩 실패:', e);
        setAvgAccommodationRating(null);
      }
    };
    loadRating();
  }, [employerId]);

  // 입력 필드 변경 핸들러
  const handleInputChange = (field: keyof AccommodationData, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 주소 검색 핸들러
  const handleAddressSelect = (addressData: any) => {
    setEditData(prev => ({
      ...prev,
      address: addressData.address || addressData.roadAddress || '',
      detailAddress: addressData.detailAddress || ''
    }));
  };

  // 배열 필드 변경 핸들러
  const handleArrayChange = (field: keyof AccommodationData, index: number, value: string) => {
    setEditData(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  // 배열 항목 추가
  const addArrayItem = (field: keyof AccommodationData) => {
    setEditData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  // 배열 항목 제거
  const removeArrayItem = (field: keyof AccommodationData, index: number) => {
    setEditData(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  // 객실 타입 변경 핸들러
  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    setEditData(prev => ({
      ...prev,
      roomTypes: {
        ...prev.roomTypes,
        [roomType]: checked
      }
    }));
  };

  // 객실별 가격 변경 핸들러
  const handleRoomPriceChange = (roomType: string, price: string) => {
    setEditData(prev => ({
      ...prev,
      roomPrices: {
        ...prev.roomPrices,
        [roomType]: price
      }
    }));
  };

  // 객실별 시설 변경 핸들러
  const handleRoomFacilityChange = (roomType: string, facility: string, checked: boolean) => {
    setEditData(prev => {
      const currentFacilities = prev.roomFacilities[roomType] || [];
      const newFacilities = checked 
        ? [...currentFacilities, facility]
        : currentFacilities.filter(f => f !== facility);
      
      return {
        ...prev,
        roomFacilities: {
          ...prev.roomFacilities,
          [roomType]: newFacilities
        }
      };
    });
  };

  // 결제 방식 변경 핸들러
  const handlePaymentTypeChange = (paymentType: string) => {
    setEditData(prev => ({
      ...prev,
      paymentType
    }));
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await compressImage(file);
        const result = await uploadImage(compressedFile, { folder: 'accommodation' });
        return result.success ? result.url : null;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null) as string[];
      
      setEditData(prev => ({
        ...prev,
        images: [...prev.images, ...validUrls],
        imageDescriptions: [...prev.imageDescriptions, ...Array(validUrls.length).fill('')]
      }));
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = async (index: number) => {
    try {
      const imageUrl = editData.images[index];
      await deleteImage(imageUrl);
      
      setEditData(prev => {
        const newImages = [...prev.images];
        const newDescriptions = [...prev.imageDescriptions];
        newImages.splice(index, 1);
        newDescriptions.splice(index, 1);
        return {
          ...prev,
          images: newImages,
          imageDescriptions: newDescriptions
        };
      });
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!employerId) return;

    try {
      setSaving(true);
      
      // 기숙사명이 비어있으면 회사명 + "기숙사"로 자동 설정
      let finalEditData = { ...editData };
      if (!finalEditData.name || finalEditData.name.trim() === '') {
        try {
          const companyRef = doc(db, 'companyInfo', employerId);
          const companySnap = await getDoc(companyRef);
          
          if (companySnap.exists()) {
            const companyData = companySnap.data();
            finalEditData.name = `${companyData.name || '회사'} 기숙사`;
          } else {
            finalEditData.name = '기숙사';
          }
        } catch (companyError) {
          console.error('회사 정보 로딩 실패:', companyError);
          finalEditData.name = '기숙사';
        }
      }

      // 데이터 정규화: 트림 및 키 보정
      const ROOM_KEYS = ['1인실', '2인실', '3인실', '4인실', '기타'];
      finalEditData = {
        ...finalEditData,
        name: (finalEditData.name || '').trim(),
        type: (finalEditData.type || 'dormitory').trim(),
        address: (finalEditData.address || '').trim(),
        detailAddress: (finalEditData.detailAddress || '').trim(),
        capacity: (finalEditData.capacity || '').toString().trim(),
        monthlyRent: (finalEditData.monthlyRent || '').toString().trim(),
        utilities: (finalEditData.utilities || '').toString().trim(),
        other: (finalEditData.other || '').toString().trim(),
        rules: (finalEditData.rules || '').toString().trim(),
        facilities: Array.isArray(finalEditData.facilities) ? finalEditData.facilities : [],
        amenities: Array.isArray(finalEditData.amenities) ? finalEditData.amenities : [],
        roomTypes: ROOM_KEYS.reduce((acc: any, key) => {
          acc[key] = !!(finalEditData.roomTypes && (finalEditData.roomTypes as any)[key]);
          return acc;
        }, {} as Record<string, boolean>),
        roomPrices: ROOM_KEYS.reduce((acc: any, key) => {
          acc[key] = ((finalEditData.roomPrices && (finalEditData.roomPrices as any)[key]) || '').toString();
          return acc;
        }, {} as Record<string, string>),
        roomFacilities: ROOM_KEYS.reduce((acc: any, key) => {
          const list = finalEditData.roomFacilities && (finalEditData.roomFacilities as any)[key];
          acc[key] = Array.isArray(list) ? list : [];
          return acc;
        }, {} as Record<string, string[]>),
        images: Array.isArray(finalEditData.images) ? finalEditData.images : [],
        imageDescriptions: (() => {
          const images = Array.isArray(finalEditData.images) ? finalEditData.images : [];
          const desc = Array.isArray(finalEditData.imageDescriptions) ? finalEditData.imageDescriptions : [];
          if (desc.length < images.length) {
            return [...desc, ...Array(images.length - desc.length).fill('')];
          }
          return desc.slice(0, images.length);
        })(),
      } as AccommodationData;

      // 디버그: 저장 데이터 로깅
      console.log('[AccommodationInfo] Saving data:', finalEditData);

      // 구형 스키마 호환 필드 동시 저장 (대시보드의 잔여 참조 대비)
      const legacyRoomTypeOptions = {
        singleRoom: !!finalEditData.roomTypes['1인실'],
        doubleRoom: !!finalEditData.roomTypes['2인실'],
        tripleRoom: !!finalEditData.roomTypes['3인실'],
        quadRoom: !!finalEditData.roomTypes['4인실'],
        otherRoom: !!finalEditData.roomTypes['기타'],
      } as any;
      const legacyRoomPrices = {
        singleRoom: finalEditData.roomPrices['1인실'] || '',
        doubleRoom: finalEditData.roomPrices['2인실'] || '',
        tripleRoom: finalEditData.roomPrices['3인실'] || '',
        quadRoom: finalEditData.roomPrices['4인실'] || '',
        otherRoom: finalEditData.roomPrices['기타'] || '',
      } as any;
      const otherRoomType = '';
      
      const docRef = doc(db, 'accommodationInfo', employerId);
      
      await setDoc(docRef, {
        ...finalEditData,
        // 호환 필드 병행 저장
        roomTypeOptions: legacyRoomTypeOptions,
        roomPrices: {
          ...finalEditData.roomPrices,
          ...legacyRoomPrices,
        },
        otherRoomType,
        updatedAt: serverTimestamp(),
        createdAt: accommodationInfo?.createdAt || serverTimestamp()
      });

      // 저장 직후 최신 데이터 재조회하여 반영
      const savedSnap = await getDoc(docRef);
      const savedData = savedSnap.exists() ? (savedSnap.data() as AccommodationData) : finalEditData;

      setAccommodationInfo(savedData);
      setEditData(savedData);
      setIsEditing(false);
      alert('기숙사 정보가 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (accommodationInfo) {
      setEditData(accommodationInfo);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">기숙사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const displayInfo = isEditing ? editData : accommodationInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-green-100 bg-green-50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/employer-dashboard"
                  className="inline-flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  대시보드로
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shadow-sm mr-3">
                      <Home className="w-5 h-5 text-green-600" />
                    </div>
                    {displayInfo?.name || '기숙사 정보'}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 ml-13">
                    {avgAccommodationRating !== null ? (
                      <span className="inline-flex items-center px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        {avgAccommodationRating}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        평점 없음
                      </span>
                    )}
                    {displayInfo?.type && (
                      <span className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {displayInfo.type === 'dormitory' && '기숙사'}
                        {displayInfo.type === 'apartment' && '아파트'}
                        {displayInfo.type === 'house' && '단독주택'}
                        {displayInfo.type === 'other' && '기타'}
                      </span>
                    )}
                    {displayInfo?.capacity && (
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        객실 수: {displayInfo.capacity}
                      </span>
                    )}
                    {displayInfo?.monthlyRent && (
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        월세: {displayInfo.monthlyRent}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isOwner && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        <X className="h-4 w-4 mr-2" />
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      수정
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 통합된 기숙사 정보 헤더 */}
          {displayInfo?.address && (
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm mx-4 mb-4">
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                <span className="text-sm">
                  {displayInfo.address}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 정보 (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Building className="w-5 h-5 mr-2 text-green-600" />
                기본 정보
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기숙사명
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="기숙사명을 입력하세요 (비워두면 회사명 + '기숙사'로 자동 설정)"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{displayInfo?.name || '미등록'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    유형
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="dormitory">기숙사</option>
                      <option value="apartment">아파트</option>
                      <option value="house">단독주택</option>
                      <option value="other">기타</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {displayInfo?.type === 'dormitory' && '기숙사'}
                      {displayInfo?.type === 'apartment' && '아파트'}
                      {displayInfo?.type === 'house' && '단독주택'}
                      {displayInfo?.type === 'other' && '기타'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    객실 수
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="예: 10실"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{displayInfo?.capacity || '미등록'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <AddressSearch
                        onAddressSelect={handleAddressSelect}
                        placeholder="기숙사 주소를 검색하세요"
                        showDetailAddress={false}
                      />
                      {editData.address && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            상세 주소
                          </label>
                          <input
                            type="text"
                            value={editData.detailAddress}
                            onChange={(e) => handleInputChange('detailAddress', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="상세 주소를 입력하세요 (동, 호수 등)"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-gray-900 font-medium">{displayInfo?.address || '미등록'}</p>
                      {displayInfo?.detailAddress && (
                        <p className="text-gray-600 text-sm">{displayInfo.detailAddress}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>





            {/* 시설 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                시설 정보
              </h2>
              
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['에어컨', '냉장고', 'TV', '인터넷', '옷장', '책상', '침대', '욕실', '주방', '세탁기', '건조기', '전자레인지'].map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.facilities?.includes(facility) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditData(prev => ({
                              ...prev,
                              facilities: [...(prev.facilities || []), facility]
                            }));
                          } else {
                            setEditData(prev => ({
                              ...prev,
                              facilities: (prev.facilities || []).filter(f => f !== facility)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{facility}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(displayInfo?.facilities || []).map((facility, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                      {facility}
                    </span>
                  ))}
                  {(!displayInfo?.facilities || displayInfo.facilities.length === 0) && (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">등록된 시설 정보가 없습니다</p>
                      <p className="text-xs mt-1">구직자들이 관심을 가질 수 있는 시설을 등록해보세요</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 부대시설 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                부대시설
              </h2>
              
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['공용 주방', '세탁실', '휴게실', '주차장', '운동시설', '독서실', '컴퓨터실', '게임룸', 'BBQ시설', '정원', '테라스', '엘리베이터'].map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.amenities?.includes(amenity) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditData(prev => ({
                              ...prev,
                              amenities: [...(prev.amenities || []), amenity]
                            }));
                          } else {
                            setEditData(prev => ({
                              ...prev,
                              amenities: (prev.amenities || []).filter(a => a !== amenity)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(displayInfo?.amenities || []).map((amenity, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                      {amenity}
                    </span>
                  ))}
                  {(!displayInfo?.amenities || displayInfo.amenities.length === 0) && (
                    <div className="text-center py-6 text-gray-500">
                      <Building className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">등록된 부대시설이 없습니다</p>
                      <p className="text-xs mt-1">공용 시설이나 편의시설을 등록해보세요</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 객실 타입 및 가격 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Home className="w-5 h-5 mr-2 text-indigo-600" />
                객실 타입 및 가격
              </h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  {/* 결제 방식 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      결제 방식
                    </label>
                    <select
                      value={editData.paymentType}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="monthly">월세</option>
                      <option value="daily">일세</option>
                      <option value="weekly">주세</option>
                      <option value="free">무료</option>
                    </select>
                  </div>

                  {/* 객실 타입 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제공 객실 타입
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.keys(editData.roomTypes).map((roomType) => (
                        <label key={roomType} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editData.roomTypes[roomType]}
                            onChange={(e) => handleRoomTypeChange(roomType, e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{roomType}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 객실별 가격 */}
                  {Object.keys(editData.roomTypes).some(type => editData.roomTypes[type]) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        객실별 가격
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.keys(editData.roomTypes).map((roomType) => (
                          editData.roomTypes[roomType] && (
                            <div key={roomType} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 w-16">{roomType}</span>
                              <input
                                type="text"
                                value={editData.roomPrices[roomType]}
                                onChange={(e) => handleRoomPriceChange(roomType, e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="가격 입력"
                              />
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 객실별 시설 입력은 사용하지 않음 (단일 시설 체크박스로 통일) */}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 결제 방식 표시 */}
                  <div>
                    <span className="text-sm font-medium text-gray-700">결제 방식: </span>
                    <span className="text-sm text-gray-900">
                      {displayInfo?.paymentType === 'monthly' && '월세'}
                      {displayInfo?.paymentType === 'daily' && '일세'}
                      {displayInfo?.paymentType === 'weekly' && '주세'}
                      {displayInfo?.paymentType === 'free' && '무료'}
                    </span>
                  </div>

                  {/* 객실 타입 및 가격 표시 */}
                  {displayInfo?.roomTypes && Object.keys(displayInfo.roomTypes || {}).some(type => displayInfo.roomTypes[type]) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {Object.keys(displayInfo.roomTypes || {}).map((roomType) => (
                        displayInfo.roomTypes[roomType] && (
                          <div key={roomType} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">{roomType}</span>
                              {displayInfo.roomPrices && displayInfo.roomPrices[roomType] && (
                                <span className="text-sm text-green-600 font-medium">
                                  {displayInfo.roomPrices[roomType]}
                                </span>
                              )}
                            </div>
                                                         {displayInfo.roomFacilities && displayInfo.roomFacilities[roomType] && displayInfo.roomFacilities[roomType].length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {displayInfo.roomFacilities[roomType].map((facility, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {facility}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {(!displayInfo?.roomTypes || !Object.keys(displayInfo.roomTypes || {}).some(type => displayInfo.roomTypes[type])) && (
                    <div className="text-center py-6 text-gray-500">
                      <Home className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">등록된 객실 정보가 없습니다</p>
                      <p className="text-xs mt-1">제공하는 객실 타입과 가격을 등록해보세요</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 비용 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                비용 정보
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    관리비
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.utilities}
                      onChange={(e) => handleInputChange('utilities', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="예: 5만원 (전기, 수도 포함)"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{displayInfo?.utilities || '미등록'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기타
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.other}
                      onChange={(e) => handleInputChange('other', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="기타 비용이나 특이사항을 입력하세요"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{displayInfo?.other || '미등록'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 이용 규칙 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                이용 규칙
              </h2>
              
              {isEditing ? (
                <textarea
                  value={editData.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="기숙사 이용 규칙을 입력하세요"
                />
              ) : (
                displayInfo?.rules ? (
                  <p className="text-gray-900 whitespace-pre-wrap">{displayInfo.rules}</p>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">등록된 이용 규칙이 없습니다</p>
                    <p className="text-xs mt-1">기숙사 이용 시 주의사항을 등록해보세요</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 사이드바 (1/3) */}
          <div className="space-y-6">
            {/* 기숙사 이미지 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                기숙사 이미지
                {(displayInfo?.images || []).length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({(displayInfo?.images || []).length}장)
                  </span>
                )}
              </h2>
              
              {isEditing && (
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="accommodation-image-upload"
                  />
                  <label
                    htmlFor="accommodation-image-upload"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    이미지 추가
                  </label>
                </div>
              )}
              
              {(displayInfo?.images || []).length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {(displayInfo?.images || []).map((image, index) => {
                    const description = (displayInfo?.imageDescriptions || [])[index] || '';
                    
                    return (
                      <div key={index} className="group">
                        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`기숙사 이미지 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isEditing && (
                            <button
                              onClick={() => handleImageDelete(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="이미지 삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {isEditing && (
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => handleArrayChange('imageDescriptions', index, e.target.value)}
                            className="w-full mt-2 text-xs bg-gray-50 border border-gray-300 rounded p-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="이미지 설명"
                          />
                        )}
                        {!isEditing && description && (
                          <p className="text-xs text-gray-600 mt-1 text-center truncate px-1">
                            {description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">등록된 기숙사 이미지가 없습니다</p>
                  <p className="text-sm">기숙사 이미지를 등록하여 구직자들에게 더 나은 인상을 남겨보세요</p>
                </div>
              )}
            </div>

            {/* 공개 설정 */}
            {isOwner && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  공개 설정
                </h2>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">구직자에게 공개</span>
                  {isEditing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.isPublic}
                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  ) : (
                    <span className={`text-sm font-medium ${displayInfo?.isPublic ? 'text-green-600' : 'text-gray-500'}`}>
                      {displayInfo?.isPublic ? '공개' : '비공개'}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  비공개로 설정하면 구직자들이 기숙사 목록에서 해당 정보를 볼 수 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationInfo;

