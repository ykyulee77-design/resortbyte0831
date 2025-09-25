import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, deleteImage, validateImageFile } from '../utils/imageUpload';
import { Building, Home, Camera, Upload, Trash2, Save, ArrowLeft, Users, Edit3, Wifi, Snowflake, Tv, Refrigerator, BookOpen, Bed, Utensils, Thermometer, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ImagePreviewModal from '../components/ImagePreviewModal';
import AddressSearch, { Address } from '../components/AddressSearch';
import NaverMapScript from '../components/NaverMapScript';
import NaverMap from '../components/NaverMap';

const AccommodationInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = searchParams.get('mode');

  // 수용인원 표시 텍스트 변환 함수
  const getCapacityDisplayText = (capacity: number): string => {
    if (capacity === 0) return '미설정';
    if (capacity === 10) return '10명 이하';
    if (capacity === 15) return '11-15명';
    if (capacity === 20) return '16-20명';
    if (capacity === 30) return '21-30명';
    if (capacity === 50) return '31-50명';
    if (capacity === 100) return '51-100명';
    if (capacity === 200) return '100명 이상';
    return `${capacity}명`;
  };

  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);

  // 이미지 관련 상태
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 리조트바이트 생활(후기/평점) 상태
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  // 전체화면 지도 모달
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

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
    capacity: 0,
    currentOccupancy: 0,
    otherAmenities: '',
    nearbyFacilities: '',
    roomTypeOptions: {
      singleRoom: false,
      doubleRoom: false,
      tripleRoom: false,
      quadRoom: false,
      otherRoom: false
    },
    // 좌표 정보 추가
    latitude: null as number | null,
    longitude: null as number | null
  });

  // 댓글 관련 상태
  const [commentInputs, setCommentInputs] = useState<{ [reviewId: string]: string }>({});
  const [showCommentForms, setShowCommentForms] = useState<{ [reviewId: string]: boolean }>({});

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
            capacity: data.capacity || 0,
            currentOccupancy: data.currentOccupancy || 0,
            otherAmenities: data.otherAmenities || '',
            nearbyFacilities: data.nearbyFacilities || '',
            roomTypeOptions: data.roomTypeOptions || {
              singleRoom: false,
              doubleRoom: false,
              tripleRoom: false,
              quadRoom: false,
              otherRoom: false
            },
            // 좌표 정보 포함
            latitude: data.latitude || null,
            longitude: data.longitude || null
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
          } else if (user) {
            // 회사 정보가 없어도 현재 사용자 정보로 기본값 설정
            setEditData(prev => ({
              ...prev,
              contactInfo: {
                phone: user.contactPhone || '',
                email: user.email || ''
              },
              contactPerson: user.displayName || ''
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

        setError('기숙사 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodationInfo();
  }, [employerId]);

  // 주소는 있는데 좌표가 없거나 0일 때 자동 지오코딩으로 보정
  useEffect(() => {
    // 서울 기본 좌표인지 확인 (37.5665, 126.9780)
    const isSeoulDefault = accommodationInfo?.latitude === 37.5665 && accommodationInfo?.longitude === 126.9780;
    
    // 더 넓은 범위로 서울 좌표 감지 (37.5~37.6, 126.9~127.0)
    const isSeoulRange = accommodationInfo?.latitude >= 37.5 && accommodationInfo?.latitude <= 37.6 && 
                         accommodationInfo?.longitude >= 126.9 && accommodationInfo?.longitude <= 127.0;
    
    const needsGeocode = Boolean(
      accommodationInfo?.address && (
        !accommodationInfo.latitude || !accommodationInfo.longitude ||
        Number.isNaN(accommodationInfo.latitude) || Number.isNaN(accommodationInfo.longitude) ||
        isSeoulDefault || isSeoulRange // 서울 범위 좌표인 경우도 지오코딩 실행
      )
    );
    
    console.log('자동 지오코딩 체크:', {
      hasAddress: !!accommodationInfo?.address,
      hasLatitude: !!accommodationInfo?.latitude,
      hasLongitude: !!accommodationInfo?.longitude,
      needsGeocode,
      address: accommodationInfo?.address,
      currentLatitude: accommodationInfo?.latitude,
      currentLongitude: accommodationInfo?.longitude,
      isSeoulDefault,
      isSeoulRange,
      reason: isSeoulDefault ? '서울 기본 좌표 감지' : 
              isSeoulRange ? '서울 범위 좌표 감지' : '기타 조건'
    });
    
    if (!needsGeocode || !employerId) return;

    const run = async () => {
      try {
        console.log('자동 지오코딩 시작:', accommodationInfo.address);
        
        // 네이버 클라이언트 사이드 지오코딩 사용
        if (window.naver && window.naver.maps && window.naver.maps.Service) {
          console.log('네이버 클라이언트 지오코딩 사용');
          
          await new Promise<void>((resolve, reject) => {
            window.naver.maps.Service.geocode({
              query: accommodationInfo.address
            }, (status: any, response: any) => {
              try {
                console.log('네이버 지오코딩 응답:', { status, response });
                
                if (status !== window.naver.maps.Service.Status.OK) {
                  console.warn('네이버 지오코딩 실패:', status);
                  return reject(new Error(`지오코딩 실패: ${status}`));
                }
                
                console.log('네이버 지오코딩 응답 구조:', {
                  response: response,
                  result: response?.result,
                  items: response?.result?.items,
                  length: response?.result?.items?.length
                });
                
                const result = response.result;
                if (result && result.items && result.items.length > 0) {
                  const item = result.items[0];
                  console.log('첫 번째 아이템:', item);
                  const lat = parseFloat(item.point.y);
                  const lng = parseFloat(item.point.x);
                  
                  console.log('네이버 지오코딩 성공:', { lat, lng, address: accommodationInfo.address });
                  
                  setAccommodationInfo((prev: any) => ({ ...(prev || {}), latitude: lat, longitude: lng }));
                  setEditData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                  
                  // 지도 중심도 업데이트
                  console.log('지도 중심 업데이트:', { lat, lng });
                  setMapCenter({ lat, lng });
                  
                  // 강제로 지도 리렌더링을 위한 상태 업데이트
                  setTimeout(() => {
                    setMapCenter({ lat, lng });
                    console.log('지도 중심 강제 업데이트:', { lat, lng });
                  }, 100);

                  try {
                    const targetRef = doc(db, 'accommodationInfo', employerId);
                    updateDoc(targetRef, { latitude: lat, longitude: lng, updatedAt: serverTimestamp() });
                    console.log('데이터베이스 업데이트 완료');
                  } catch (error) {
                    console.error('데이터베이스 업데이트 실패:', error);
                  }
                  
                  resolve();
                } else {
                  console.warn('지오코딩 결과가 없습니다');
                  console.log('응답 구조 분석:', {
                    hasResult: !!result,
                    hasItems: !!result?.items,
                    itemsLength: result?.items?.length,
                    fullResponse: response
                  });
                  
                  // 다른 가능한 응답 구조 확인
                  if (response && response.v2 && response.v2.addresses) {
                    console.log('v2.addresses 구조 발견:', response.v2.addresses);
                    const addresses = response.v2.addresses;
                    if (addresses.length > 0) {
                      const addr = addresses[0];
                      const lat = parseFloat(addr.y);
                      const lng = parseFloat(addr.x);
                      console.log('v2.addresses에서 좌표 추출:', { lat, lng });
                      
                      setAccommodationInfo((prev: any) => ({ ...(prev || {}), latitude: lat, longitude: lng }));
                      setEditData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                      setMapCenter({ lat, lng });
                      resolve();
                      return;
                    }
                  }
                  
                  reject(new Error('지오코딩 결과가 없습니다'));
                }
              } catch (error) {
                console.error('지오코딩 처리 중 오류:', error);
                reject(error);
              }
            });
          });
        } else {
          console.warn('네이버 지도 API를 사용할 수 없습니다');
        }
      } catch (error) {
        console.error('자동 지오코딩 실패:', error);
      }
    };
    run();
  }, [accommodationInfo?.address, accommodationInfo?.latitude, accommodationInfo?.longitude, employerId]);



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
      
      setError('이미지 삭제에 실패했습니다.');
    }
  };

  // 이미지 미리보기
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '기숙사 이미지');
  };

  // 저장 처리
  // 댓글 삭제 함수
  const handleDeleteComment = async (reviewId: string, commentIndex: number) => {
    if (!user) return;

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        const currentComments = reviewDoc.data().comments || [];
        const commentToDelete = currentComments[commentIndex];
        
        // 권한 확인 (작성자 또는 리조트 담당자만 삭제 가능)
        if (user.uid !== commentToDelete.userId && user.uid !== employerId) {
          alert('댓글을 삭제할 권한이 없습니다.');
          return;
        }

        const updatedComments = currentComments.filter((_: any, index: number) => index !== commentIndex);
        
        await updateDoc(reviewRef, {
          comments: updatedComments,
          updatedAt: new Date()
        });

        // 로컬 상태 업데이트
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, comments: updatedComments }
            : review
        ));

        alert('댓글이 삭제되었습니다.');
      }
    } catch (error) {
      
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 추가 함수
  const handleAddComment = async (reviewId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const commentData = {
        content: content.trim(),
        userName: user.displayName || user.email || '익명',
        userId: user.uid,
        isEmployer: user.uid === employerId,
        createdAt: new Date(),
        reviewId: reviewId
      };

      // Firestore에 댓글 추가
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        const currentComments = reviewDoc.data().comments || [];
        const updatedComments = [...currentComments, commentData];
        
        await updateDoc(reviewRef, {
          comments: updatedComments,
          updatedAt: new Date()
        });

        // 로컬 상태 업데이트
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, comments: updatedComments }
            : review
        ));

        // 댓글 입력 필드 초기화
        setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));

        alert('댓글이 추가되었습니다.');
      }
    } catch (error) {
      
      alert('댓글 추가에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!employerId || !user) return;

    setSaving(true);
    try {
      // 연락처 정보가 비어있으면 회사 정보나 사용자 정보로 자동 채우기
      const finalContactInfo = {
        phone: editData.contactInfo.phone || companyInfo?.contactPhone || user.contactPhone || '',
        email: editData.contactInfo.email || companyInfo?.contactEmail || user.email || ''
      };
      
      const finalContactPerson = editData.contactPerson || companyInfo?.contactPerson || user.displayName || '';

      const accommodationData = {
        employerId,
        ...editData,
        contactInfo: finalContactInfo,
        contactPerson: finalContactPerson,
        images,
        // 좌표 정보 명시적으로 포함
        latitude: editData.latitude,
        longitude: editData.longitude,
        updatedAt: serverTimestamp(),
        createdAt: accommodationInfo?.createdAt || serverTimestamp()
      };
      
      console.log('저장할 기숙사 데이터:', accommodationData);

      const targetRef = doc(db, 'accommodationInfo', employerId);
      const existing = await getDoc(targetRef);

      if (existing.exists()) {
        await updateDoc(targetRef, accommodationData);
      } else {
        await setDoc(targetRef, accommodationData);
      }
      
      setAccommodationInfo(accommodationData);
      setIsEditing(false);
      // 편집 모드에서 조회 모드로 URL 변경
      navigate(`/accommodation-info/${employerId}`);
      setError(null);
    } catch (error) {
      
      setError('기숙사 정보 저장에 실패했습니다. (권한/네트워크/규칙 확인)');
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
    <div className="min-h-screen bg-gray-50">
      <NaverMapScript />
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
                      console.log('주소 선택됨:', address);
                      setEditData(prev => ({ 
                        ...prev, 
                        address: address.address,
                        latitude: address.latitude || null,
                        longitude: address.longitude || null
                      }));
                      // 지도 중심도 업데이트
                      if (address.latitude && address.longitude) {
                        setMapCenter({
                          lat: address.latitude,
                          lng: address.longitude
                        });
                      }
                    }}
                    placeholder="기숙사 주소를 검색하세요 (예: 서울특별시 강남구 테헤란로 427)"
                    value={editData.address}
                    showDetailAddress={true}
                    detailAddressPlaceholder="동/호수, 층수, 사무실 번호 등 (선택사항)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 연락처
                  </label>
                  <input
                    type="text"
                    value={editData.contactInfo.phone}
                    onChange={(e) => setEditData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !editData.contactInfo.phone && (companyInfo?.contactPhone || user?.contactPhone) 
                        ? 'border-blue-300 bg-blue-50 text-blue-700' 
                        : 'border-gray-300'
                    }`}
                    placeholder={
                      companyInfo?.contactPhone 
                        ? `회사 담당자: ${companyInfo.contactPhone}` 
                        : user?.contactPhone 
                        ? `현재 사용자: ${user.contactPhone}` 
                        : "담당자 연락처를 입력하세요"
                    }
                  />
                  {(companyInfo?.contactPhone || user?.contactPhone) && !editData.contactInfo.phone && (
                    <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      💡 회사 담당자 연락처가 자동으로 연계됩니다. 다른 연락처를 사용하려면 직접 입력하세요.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 이메일
                  </label>
                  <input
                    type="email"
                    value={editData.contactInfo.email}
                    onChange={(e) => setEditData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !editData.contactInfo.email && (companyInfo?.contactEmail || user?.email) 
                        ? 'border-blue-300 bg-blue-50 text-blue-700' 
                        : 'border-gray-300'
                    }`}
                    placeholder={
                      companyInfo?.contactEmail 
                        ? `회사 담당자: ${companyInfo.contactEmail}` 
                        : user?.email 
                        ? `현재 사용자: ${user.email}` 
                        : "담당자 이메일을 입력하세요"
                    }
                  />
                  {(companyInfo?.contactEmail || user?.email) && !editData.contactInfo.email && (
                    <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      💡 회사 담당자 정보가 자동으로 연계됩니다. 다른 이메일을 사용하려면 직접 입력하세요.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 이름
                  </label>
                  <input
                    type="text"
                    value={editData.contactPerson}
                    onChange={(e) => setEditData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !editData.contactPerson && (companyInfo?.contactPerson || user?.displayName) 
                        ? 'border-blue-300 bg-blue-50 text-blue-700' 
                        : 'border-gray-300'
                    }`}
                    placeholder={
                      companyInfo?.contactPerson 
                        ? `회사 담당자: ${companyInfo.contactPerson}` 
                        : user?.displayName 
                        ? `현재 사용자: ${user.displayName}` 
                        : "담당자 이름을 입력하세요"
                    }
                  />
                  {(companyInfo?.contactPerson || user?.displayName) && !editData.contactPerson && (
                    <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      💡 회사 담당자 이름이 자동으로 연계됩니다. 다른 담당자를 사용하려면 직접 입력하세요.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수용 인원
                  </label>
                  <select
                    value={editData.capacity}
                    onChange={(e) => setEditData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>선택해주세요</option>
                    <option value={10}>10명 이하</option>
                    <option value={15}>11-15명</option>
                    <option value={20}>16-20명</option>
                    <option value={30}>21-30명</option>
                    <option value={50}>31-50명</option>
                    <option value={100}>51-100명</option>
                    <option value={200}>100명 이상</option>
                  </select>
                </div>
              </div>

              {/* 객실 유형 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  객실 유형
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { key: 'singleRoom', label: '1인실' },
                    { key: 'doubleRoom', label: '2인실' },
                    { key: 'tripleRoom', label: '3인실' },
                    { key: 'quadRoom', label: '4인실' },
                    { key: 'otherRoom', label: '기타' }
                  ].map(room => (
                    <label key={room.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.roomTypeOptions?.[room.key as keyof typeof editData.roomTypeOptions] || false}
                        onChange={(e) => {
                          const newRoomTypeOptions = {
                            ...editData.roomTypeOptions,
                            [room.key]: e.target.checked
                          };
                          setEditData(prev => ({ ...prev, roomTypeOptions: newRoomTypeOptions }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{room.label}</span>
                    </label>
                  ))}
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
                {/* 기본 정보와 지도를 2열로 배치 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Home className="w-5 h-5 mr-2 text-blue-600" />
                      기본 정보
                    </h2>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                        <p className="text-gray-900 text-sm">{accommodationInfo.address || '미입력'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                        <p className="text-gray-900 text-sm">{accommodationInfo.contactInfo?.phone || '미입력'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <p className="text-gray-900 text-sm">{accommodationInfo.contactInfo?.email || '미입력'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                        <p className="text-gray-900 text-sm">{accommodationInfo.contactPerson || '미입력'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">수용 인원</label>
                        <p className="text-gray-900 text-sm">{getCapacityDisplayText(accommodationInfo.capacity || 0)}</p>
                      </div>
                      {accommodationInfo.roomTypeOptions && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">객실 유형</label>
                          <div className="flex flex-wrap gap-2">
                            {accommodationInfo.roomTypeOptions.singleRoom && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                1인실
                              </span>
                            )}
                            {accommodationInfo.roomTypeOptions.doubleRoom && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                2인실
                              </span>
                            )}
                            {accommodationInfo.roomTypeOptions.tripleRoom && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                3인실
                              </span>
                            )}
                            {accommodationInfo.roomTypeOptions.quadRoom && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                4인실
                              </span>
                            )}
                            {accommodationInfo.roomTypeOptions.otherRoom && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                기타
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {accommodationInfo.description && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{accommodationInfo.description}</p>
                      </div>
                    )}
                  </div>

                  {/* 지도 섹션 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-green-600" />
                      위치
                    </h2>
                    {/* 
                      중요: NaverMap 컴포넌트는 항상 렌더링되어야 함!
                      조건부 렌더링({accommodationInfo?.address && ...})을 사용하면 
                      mapRef.current가 null이 되어 무한 루프 발생
                      마커만 조건부로 설정: markers={accommodationInfo?.address ? [...] : []}
                    */}
                    <div
                      style={{ height: '280px', position: 'relative' }}
                      className="cursor-pointer group"
                      onClick={() => setIsMapFullscreen(true)}
                      title="지도를 클릭하면 전체화면으로 확대됩니다"
                    >
                      {accommodationInfo?.address ? (
                        <NaverMap
                          key={`main-${accommodationInfo.latitude}-${accommodationInfo.longitude}-${mapCenter?.lat}-${mapCenter?.lng}-${Date.now()}-${Math.random()}`}
                          center={(() => {
                            const center = mapCenter || {
                              lat: accommodationInfo.latitude || 37.5665,
                              lng: accommodationInfo.longitude || 126.9780
                            };
                            console.log('지도 중심 설정:', center, 'mapCenter:', mapCenter, 'accommodationInfo:', {
                              lat: accommodationInfo.latitude,
                              lng: accommodationInfo.longitude
                            });
                            console.log('지도 중심이 서울인가?', center.lat === 37.5665 && center.lng === 126.978);
                            return center;
                          })()}
                          zoom={15}
                          markers={[
                            {
                              position: {
                                lat: accommodationInfo.latitude || 37.5665,
                                lng: accommodationInfo.longitude || 126.9780
                              },
                              title: accommodationInfo.name || '기숙사',
                              content: accommodationInfo.address
                            }
                          ]}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 bg-gray-100 rounded-lg">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🗺️</div>
                            <div>주소를 입력하면 지도가 표시됩니다</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        전체화면 보기
                      </div>
                    </div>
                  </div>
                </div>

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
                          
                          {/* 댓글 섹션 */}
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">댓글</h4>
                            
                            {/* 기존 댓글들 */}
                            {rev.comments && rev.comments.length > 0 ? (
                              <div className="space-y-3 mb-4">
                                {rev.comments.map((comment: any, commentIndex: number) => (
                                  <div key={commentIndex} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-blue-600 text-xs font-medium">
                                        {comment.isEmployer ? '리' : '크'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                          {comment.isEmployer ? '리조트 담당자' : comment.userName || '익명'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {comment.createdAt?.toDate?.()?.toLocaleDateString?.('ko-KR') || 
                                           comment.timestamp?.toDate?.()?.toLocaleDateString?.('ko-KR') || ''}
                                        </span>
                                        {comment.isEmployer && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                            공식
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                      
                                      {/* 댓글 삭제 버튼 (작성자 또는 리조트 담당자만) */}
                                      {(user?.uid === comment.userId || user?.uid === employerId) && (
                                        <button
                                          onClick={() => handleDeleteComment(rev.id, commentIndex)}
                                          className="mt-2 text-xs text-red-600 hover:text-red-800 transition-colors"
                                        >
                                          삭제
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mb-4">아직 댓글이 없습니다.</p>
                            )}
                            
                            {/* 댓글 작성 섹션 */}
                            {!showCommentForms[rev.id] ? (
                              // 댓글 작성 버튼
                              <div className="flex justify-end">
                                {user ? (
                                  <button
                                    onClick={() => setShowCommentForms(prev => ({
                                      ...prev,
                                      [rev.id]: true
                                    }))}
                                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                                  >
                                    작성
                                  </button>
                                ) : (
                                  <div className="text-right">
                                    <button
                                      onClick={() => {
                                        const current = location.pathname + location.search;
                                        navigate(`/login?redirect=${encodeURIComponent(current)}`);
                                      }}
                                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                                    >
                                      작성
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // 댓글 작성 폼
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                                    <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 text-xs">💬</span>
                                    </span>
                                    댓글 작성
                                  </h5>
                                  
                                  {/* 폼 닫기 버튼 */}
                                  <button
                                    onClick={() => setShowCommentForms(prev => ({
                                      ...prev,
                                      [rev.id]: false
                                    }))}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {user ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-green-600 text-xs font-medium">
                                          {user.uid === employerId ? '리' : '크'}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <textarea
                                          placeholder={user.uid === employerId ? 
                                            "리조트 담당자로서 댓글을 작성해주세요..." : 
                                            "댓글을 작성해주세요..."
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                          rows={3}
                                          value={commentInputs[rev.id] || ''}
                                          onChange={(e) => {
                                            setCommentInputs(prev => ({
                                              ...prev,
                                              [rev.id]: e.target.value
                                            }));
                                          }}
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-blue-600 font-medium">
                                          {user.uid === employerId ? '리조트 담당자로 댓글 작성' : '크루로 댓글 작성'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          ({commentInputs[rev.id]?.length || 0}자)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          handleAddComment(rev.id, commentInputs[rev.id] || '');
                                          // 폼 닫기
                                          setShowCommentForms(prev => ({
                                            ...prev,
                                            [rev.id]: false
                                          }));
                                        }}
                                        disabled={!commentInputs[rev.id] || commentInputs[rev.id].trim().length === 0}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                      >
                                        댓글 작성
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
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

      {/* 전체화면 지도 모달 */}
      {isMapFullscreen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center">
          <div className="w-[95vw] h-[85vh] bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col">
            {/* 헤더 영역 */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">기숙사 위치</h3>
              <button
                className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2"
                onClick={() => setIsMapFullscreen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                닫기
              </button>
            </div>
            {/* 지도 영역 */}
            <div className="flex-1 relative">
              {accommodationInfo?.address ? (
                <NaverMap
                  key={`fullscreen-${accommodationInfo.latitude}-${accommodationInfo.longitude}-${mapCenter?.lat}-${mapCenter?.lng}-${Date.now()}`}
                  center={mapCenter || {
                    lat: accommodationInfo.latitude || 37.5665,
                    lng: accommodationInfo.longitude || 126.9780
                  }}
                  zoom={16}
                  markers={[{
                    position: {
                      lat: accommodationInfo.latitude || 37.5665,
                      lng: accommodationInfo.longitude || 126.9780
                    },
                    title: accommodationInfo.name || '기숙사',
                    content: accommodationInfo.address
                  }]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <div>위치 정보가 없습니다</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccommodationInfoPage;
