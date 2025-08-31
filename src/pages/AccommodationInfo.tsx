import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, deleteImage, validateImageFile } from '../utils/imageUpload';
import { Building, Home, Camera, Upload, Trash2, Save, ArrowLeft, Users, Edit3, Wifi, Snowflake, Tv, Refrigerator, BookOpen, Bed, Utensils, Thermometer, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ImagePreviewModal from '../components/ImagePreviewModal';
import AddressSearch, { Address } from '../components/AddressSearch';
import NaverMapScript from '../components/NaverMapScript';

const AccommodationInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = searchParams.get('mode');

  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);

  // 이미지 관련 상태
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 리조트바이트 생활(후기/평점) 상태
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  // 편집 데이터
  const [editData, setEditData] = useState({
    address: '',
    description: '',
    facilities: [] as string[],
    amenities: [] as string[],
    rules: '',
    contactInfo: {
      phone: '',
      email: ''
    },
    contactPerson: '',
    roomTypeOptions: {
      singleRoom: false,
      doubleRoom: false,
      tripleRoom: false,
      quadRoom: false,
      otherRoom: false
    },
    roomPrices: {
      singleRoom: '',
      doubleRoom: '',
      tripleRoom: '',
      quadRoom: '',
      otherRoom: ''
    },
    otherRoomType: '',
    capacity: 0,
    currentOccupancy: 0,
    otherAmenities: '',
    nearbyFacilities: ''
  });

  useEffect(() => {
    if (!employerId) {
      setError('고용주 ID가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchAccommodationInfo = async () => {
      try {
        // 회사 정보 먼저 로드
        const companyDocRef = doc(db, 'companyInfo', employerId);
        const companyDocSnap = await getDoc(companyDocRef);
        let companyData: any = null;
        
        if (companyDocSnap.exists()) {
          companyData = companyDocSnap.data();
          setCompanyInfo(companyData);
        }

        // 기숙사 정보 로드
        const docRef = doc(db, 'accommodationInfo', employerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAccommodationInfo(data);
          setEditData({
            address: data.address || '',
            description: data.description || '',
            facilities: data.facilities || [],
            amenities: data.amenities || [],
            rules: data.rules || '',
            contactInfo: {
              phone: data.contactInfo?.phone || (companyData ? companyData.contactPhone || '' : ''),
              email: data.contactInfo?.email || (companyData ? companyData.contactEmail || '' : '')
            },
            contactPerson: data.contactPerson || (companyData ? companyData.contactPerson || '' : ''),
            roomTypeOptions: data.roomTypeOptions || {
              singleRoom: false,
              doubleRoom: false,
              tripleRoom: false,
              quadRoom: false,
              otherRoom: false
            },
            roomPrices: data.roomPrices || {
              singleRoom: '',
              doubleRoom: '',
              tripleRoom: '',
              quadRoom: '',
              otherRoom: ''
            },
            otherRoomType: data.otherRoomType || '',
            capacity: data.capacity || 0,
            currentOccupancy: data.currentOccupancy || 0,
            otherAmenities: data.otherAmenities || '',
            nearbyFacilities: data.nearbyFacilities || ''
          });
          setImages(data.images || []);
        } else {
          setAccommodationInfo(null);
          // 기숙사 정보가 없을 때 회사 정보로 기본값 설정
          if (companyData) {
            setEditData(prev => ({
              ...prev,
              contactInfo: {
                phone: companyData.contactPhone || '',
                email: companyData.contactEmail || ''
              },
              contactPerson: companyData.contactPerson || ''
            }));
          }
        }

        // 같은 회사의 후기/평점 로드
        try {
          let reviewsData: any[] = [];
          try {
            const reviewsQ = query(
              collection(db, 'reviews'),
              where('resort', '==', employerId),
              orderBy('date', 'desc'),
              limit(20),
            );
            const reviewsSnap = await getDocs(reviewsQ);
            reviewsData = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (orderErr) {
            // orderBy 인덱스 미구성 등으로 실패 시 정렬 없이 가져온 뒤 클라이언트 정렬
            const fallbackQ = query(
              collection(db, 'reviews'),
              where('resort', '==', employerId),
              limit(20),
            );
            const snap = await getDocs(fallbackQ);
            reviewsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            reviewsData.sort((a: any, b: any) => {
              const aTime = a.date?.toDate?.()?.getTime?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
              const bTime = b.date?.toDate?.()?.getTime?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
              return bTime - aTime;
            });
          }
          setReviews(reviewsData);
          const rated = reviewsData.filter((r: any) => (
            (typeof r.accommodationRating === 'number' && r.accommodationRating > 0) ||
            (typeof r.overallRating === 'number' && r.overallRating > 0)
          ));
          if (rated.length > 0) {
            const score = rated.reduce((sum: number, r: any) => sum + (r.accommodationRating || r.overallRating || 0), 0);
            setAvgRating(parseFloat((score / rated.length).toFixed(1)));
          } else {
            setAvgRating(null);
          }
        } catch (e) {
          console.warn('후기/평점 로드 중 경고:', e);
          setReviews([]);
          setAvgRating(null);
        }
      } catch (error) {
        console.error('기숙사 정보 불러오기 실패:', error);
        setError('기숙사 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodationInfo();
  }, [employerId]);



  // 이미지 업로드 처리
  const handleImageUpload = async (files: FileList) => {
    if (!employerId) return;

    setUploadingImages(true);
    try {
      const validFiles = Array.from(files).filter(file => validateImageFile(file));
      
      if (validFiles.length === 0) {
        setError('유효한 이미지 파일을 선택해주세요.');
        return;
      }

      const uploadPromises = validFiles.map(file => 
        uploadImage(file, { folder: `accommodation/${employerId}` })
      );

      const uploadedResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadedResults
        .filter(result => result.success && result.url)
        .map(result => result.url!);
      const newImages = [...images, ...uploadedUrls];
      
      setImages(newImages);
      setError(null);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImages(false);
    }
  };

  // 이미지 삭제 처리
  const handleImageDelete = async (imageUrl: string, index: number) => {
    if (!employerId) return;

    try {
      await deleteImage(imageUrl);
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      setError('이미지 삭제에 실패했습니다.');
    }
  };

  // 이미지 미리보기
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '기숙사 이미지');
  };

  // 저장 처리
  const handleSave = async () => {
    if (!employerId || !user) return;

    setSaving(true);
    try {
      const accommodationData = {
        employerId,
        ...editData,
        images,
        updatedAt: serverTimestamp(),
        createdAt: accommodationInfo?.createdAt || serverTimestamp()
      };

      await updateDoc(doc(db, 'accommodationInfo', employerId), accommodationData);
      
      setAccommodationInfo(accommodationData);
      setIsEditing(false);
      // 저장 후 대시보드로 이동 (지도 업데이트를 위해)
      navigate('/employer-dashboard');
      setError(null);
    } catch (error) {
      console.error('기숙사 정보 저장 실패:', error);
      setError('기숙사 정보 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 시설 토글
  const toggleFacility = (facility: string) => {
    const currentFacilities = editData.facilities || [];
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter(f => f !== facility)
      : [...currentFacilities, facility];
    
    setEditData(prev => ({ ...prev, facilities: newFacilities }));
  };

  // 편의시설 토글
  const toggleAmenity = (amenity: string) => {
    const currentAmenities = editData.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setEditData(prev => ({ ...prev, amenities: newAmenities }));
  };



  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const facilityOptions = [
    '와이파이', '에어컨', '세탁기', '개인욕실', '공용주방', 'TV', '냉장고', '책상', '옷장', '난방'
  ];

  const amenityOptions = [
    '주차장', '헬스장', '독서실', '라운지', '엘리베이터', '보안시스템', '반려동물 허용', '흡연실', '직원식당', '공용주방', '근린시설', '기타'
  ];



  return (
    <NaverMapScript>
      <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">기숙사 상세</h1>
                <p className="text-sm text-gray-500">
                  {accommodationInfo ? '기숙사 정보 관리' : '새 기숙사 정보 등록'}
                </p>
              </div>
            </div>
            
            {!isEditing && user && (user.uid === employerId || user.role === 'admin') && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  // 편집 모드 URL로 이동
                  navigate(`/accommodation-info/${employerId}?mode=edit`);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>편집</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isEditing ? (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-600" />
                기본 정보
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <AddressSearch
                    onAddressSelect={(address: Address) => {
                      console.log('주소 선택됨 - 좌표 포함:', address);
                      setEditData(prev => ({ 
                        ...prev, 
                        address: address.address,
                        latitude: address.latitude,
                        longitude: address.longitude
                      }));
                    }}
                    placeholder="기숙사 주소를 검색하세요 (예: 서울특별시 강남구 테헤란로 427)"
                    value={editData.address}
                    showDetailAddress={true}
                    detailAddressPlaceholder="상세주소 (동/호수, 층수 등)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={editData.contactInfo.phone}
                    onChange={(e) => setEditData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !editData.contactInfo.phone && companyInfo?.contactPhone 
                        ? 'border-gray-300 bg-gray-50 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder={companyInfo?.contactPhone ? `기본값: ${companyInfo.contactPhone}` : "연락처를 입력하세요"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={editData.contactInfo.email}
                    onChange={(e) => setEditData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !editData.contactInfo.email && companyInfo?.contactEmail 
                        ? 'border-gray-300 bg-gray-50 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder={companyInfo?.contactEmail ? `기본값: ${companyInfo.contactEmail}` : "이메일을 입력하세요"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자
                  </label>
                  <input
                    type="text"
                    value={editData.contactPerson}
                    onChange={(e) => setEditData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !editData.contactPerson && companyInfo?.contactPerson 
                        ? 'border-gray-300 bg-gray-50 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder={companyInfo?.contactPerson ? `기본값: ${companyInfo.contactPerson}` : "담당자 이름을 입력하세요"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수용 인원
                  </label>
                  <input
                    type="number"
                    value={editData.capacity}
                    onChange={(e) => setEditData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="수용 가능한 인원 수"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기숙사 설명
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="기숙사에 대한 상세한 설명을 입력하세요"
                />
              </div>
            </div>

            {/* 객실 유형 및 가격 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                객실 유형 및 가격
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'singleRoom', label: '1인실', priceKey: 'singleRoom' },
                  { key: 'doubleRoom', label: '2인실', priceKey: 'doubleRoom' },
                  { key: 'tripleRoom', label: '3인실', priceKey: 'tripleRoom' },
                  { key: 'quadRoom', label: '4인실', priceKey: 'quadRoom' },
                  { key: 'otherRoom', label: '기타', priceKey: 'otherRoom' }
                ].map(({ key, label, priceKey }) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        checked={editData.roomTypeOptions[key as keyof typeof editData.roomTypeOptions]}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          roomTypeOptions: {
                            ...prev.roomTypeOptions,
                            [key]: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">{label}</span>
                    </label>
                    
                    {editData.roomTypeOptions[key as keyof typeof editData.roomTypeOptions] && (
                      <input
                        type="text"
                        value={editData.roomPrices[priceKey as keyof typeof editData.roomPrices]}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          roomPrices: {
                            ...prev.roomPrices,
                            [priceKey]: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="월세 (예: 30만원)"
                      />
                    )}
                  </div>
                ))}
              </div>

              {editData.roomTypeOptions.otherRoom && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기타 객실 유형
                  </label>
                  <input
                    type="text"
                    value={editData.otherRoomType}
                    onChange={(e) => setEditData(prev => ({ ...prev, otherRoomType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="기타 객실 유형을 입력하세요"
                  />
                </div>
              )}
            </div>



            {/* 시설 정보 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-green-600" />
                시설 정보
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {facilityOptions.map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.facilities.includes(option)}
                      onChange={() => toggleFacility(option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 편의시설 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">편의시설</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {amenityOptions.map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.amenities.includes(option)}
                      onChange={() => toggleAmenity(option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>

              {/* 근린시설 입력 */}
              {editData.amenities.includes('근린시설') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    근린시설
                  </label>
                  <input
                    type="text"
                    value={editData.nearbyFacilities}
                    onChange={(e) => setEditData(prev => ({ ...prev, nearbyFacilities: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="근린시설을 입력하세요 (예: 편의점, 병원, 은행 등)"
                  />
                </div>
              )}

              {/* 기타 편의시설 입력 */}
              {editData.amenities.includes('기타') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기타 편의시설
                  </label>
                  <input
                    type="text"
                    value={editData.otherAmenities}
                    onChange={(e) => setEditData(prev => ({ ...prev, otherAmenities: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="기타 편의시설을 입력하세요"
                  />
                </div>
              )}
            </div>



            {/* 이미지 업로드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-red-600" />
                기숙사 이미지
              </h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadingImages ? '업로드 중...' : '이미지를 선택하거나 드래그하세요'}
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`기숙사 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => handleImagePreview(image, `기숙사 이미지 ${index + 1}`)}
                        />
                        <button
                          onClick={() => handleImageDelete(image, index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 이용규칙 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">이용규칙</h2>
              <textarea
                value={editData.rules}
                onChange={(e) => setEditData(prev => ({ ...prev, rules: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="기숙사 이용규칙을 입력하세요"
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  // 조회 모드 URL로 이동
                  navigate(`/accommodation-info/${employerId}`);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '저장 중...' : '저장'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 보기 모드 */
          <div className="space-y-6">
            {accommodationInfo ? (
              <>
                {/* 기본 정보 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-blue-600" />
                    기본 정보
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <p className="text-gray-900">{accommodationInfo.address || '미입력'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                      <p className="text-gray-900">{accommodationInfo.contactInfo?.phone || '미입력'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <p className="text-gray-900">{accommodationInfo.contactInfo?.email || '미입력'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                      <p className="text-gray-900">{accommodationInfo.contactPerson || '미입력'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">수용 인원</label>
                      <p className="text-gray-900">{accommodationInfo.capacity || 0}명</p>
                    </div>
                  </div>

                  {accommodationInfo.description && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{accommodationInfo.description}</p>
                    </div>
                  )}
                </div>

                {/* 객실 유형 */}
                {accommodationInfo.roomTypeOptions && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-600" />
                      객실 유형
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(accommodationInfo.roomTypeOptions).map(([key, available]) => {
                        if (!available) return null;
                        const labels = {
                          singleRoom: '1인실',
                          doubleRoom: '2인실',
                          tripleRoom: '3인실',
                          quadRoom: '4인실',
                          otherRoom: '기타'
                        };
                        const price = accommodationInfo.roomPrices?.[key as keyof typeof accommodationInfo.roomPrices];
                        return (
                          <div key={key} className="border border-gray-200 rounded-lg p-4">
                            <div className="font-medium text-gray-900">{labels[key as keyof typeof labels]}</div>
                            {price && <div className="text-sm text-gray-600 mt-1">{price}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}



                {/* 시설 정보 */}
                {accommodationInfo.facilities && accommodationInfo.facilities.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-green-600" />
                      시설 정보
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {accommodationInfo.facilities.map((facility: string) => (
                        <span key={facility} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 편의시설 */}
                {accommodationInfo.amenities && accommodationInfo.amenities.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">편의시설</h2>
                    <div className="flex flex-wrap gap-2">
                      {accommodationInfo.amenities.map((amenity: string) => (
                        <span key={amenity} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    {accommodationInfo.nearbyFacilities && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">근린시설</h3>
                        <p className="text-gray-900">{accommodationInfo.nearbyFacilities}</p>
                      </div>
                    )}
                    {accommodationInfo.otherAmenities && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">기타 편의시설</h3>
                        <p className="text-gray-900">{accommodationInfo.otherAmenities}</p>
                      </div>
                    )}
                  </div>
                )}



                {/* 이미지 */}
                {accommodationInfo.images && accommodationInfo.images.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-red-600" />
                      기숙사 이미지
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {accommodationInfo.images.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`기숙사 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => handleImagePreview(image, `기숙사 이미지 ${index + 1}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 이용규칙 */}
                {accommodationInfo.rules && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">이용규칙</h2>
                    <p className="text-gray-900 whitespace-pre-wrap">{accommodationInfo.rules}</p>
                  </div>
                )}

                {/* 리조트바이트 생활 (후기/평점) */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                      리조트바이트 생활
                    </h2>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${avgRating !== null ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                      <Star className={`w-4 h-4 ${avgRating !== null ? 'fill-current' : ''}`} />
                      <span>{avgRating !== null ? avgRating : '평점 없음'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      reviews.slice(0, 5).map((rev: any) => (
                        <div key={rev.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-600">
                              {rev.user || '익명'} · {(rev.date?.toDate?.()?.toLocaleDateString?.('ko-KR')) || (rev.createdAt?.toDate?.()?.toLocaleDateString?.('ko-KR')) || ''}
                            </div>
                            {typeof rev.accommodationRating === 'number' || typeof rev.overallRating === 'number' ? (
                              <div className="flex items-center gap-1 text-yellow-600 text-sm">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{rev.accommodationRating || rev.overallRating}</span>
                              </div>
                            ) : null}
                          </div>
                          {rev.content ? (
                            <p className="text-gray-800 text-sm whitespace-pre-wrap">
                              {rev.content.length > 180 ? rev.content.slice(0, 180) + '…' : rev.content}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm">내용이 없습니다.</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p className="text-gray-500 text-sm">아직 등록된 후기가 없습니다.</p>
                      </div>
                    )}
                    <div className="text-right space-x-2">
                      <button
                        onClick={() => {
                          if (!user) {
                            const current = location.pathname + location.search;
                            navigate(`/login?redirect=${encodeURIComponent(current)}`);
                            return;
                          }
                          navigate(`/reviews/new`);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        작성하기
                      </button>
                      <button
                        onClick={() => navigate(`/resort/${employerId}/reviews`)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
                      >
                        후기 더 보기
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">기숙사 정보가 없습니다</h2>
                <p className="text-gray-600 mb-4">기숙사 정보를 등록해주세요.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  기숙사 정보 등록
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          imageName={previewImageName}
          onClose={() => setPreviewImage(null)}
          isOpen={!!previewImage}
        />
      )}
      </div>
    </NaverMapScript>
  );
};

export default AccommodationInfoPage;
