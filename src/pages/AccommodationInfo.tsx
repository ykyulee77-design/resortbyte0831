import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AccommodationInfo, ExternalLink } from '../types';
import { 
  Home, MapPin, Phone, Users, Calendar, DollarSign, CheckCircle, Star, Edit, Save, X,
  Upload, Trash2, Plus, ExternalLink as ExternalLinkIcon, Camera, Wifi, Car, Utensils,
  Shield, Clock, Users as UsersIcon, Bed, Bath, Tv, AirVent,
  ParkingCircle, Dog, Wrench, AlertTriangle, Heart, ThumbsUp, MessageCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, deleteImage, compressImage } from '../utils/imageUpload';


const AccommodationInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const { user } = useAuth();
  const [accommodationInfo, setAccommodationInfo] = useState<AccommodationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AccommodationInfo>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAccommodationInfo = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const ref = doc(db, 'accommodationInfo', employerId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as AccommodationInfo;
        setAccommodationInfo(data);
        setEditForm(data);
      }
    } catch (error) {
      console.error('기숙사 정보 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodationInfo();
  }, [employerId]);

  const handleEdit = () => {
    setIsEditing(true);
    if (accommodationInfo) {
      setEditForm({
        ...accommodationInfo,
        roomTypes: accommodationInfo.roomTypes || [],
        facilities: accommodationInfo.facilities || [],
        utilities: accommodationInfo.utilities || [],
        rules: accommodationInfo.rules || [],
        externalLinks: accommodationInfo.externalLinks || [],
        images: accommodationInfo.images || []
      });
    } else {
      setEditForm({
        roomTypes: [],
        facilities: [],
        utilities: [],
        rules: [],
        externalLinks: [],
        images: []
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(accommodationInfo || {});
  };

  const handleSave = async () => {
    if (!employerId) return;
    
    setSaving(true);
    try {
      const ref = doc(db, 'accommodationInfo', employerId);
      
      // 기존 데이터가 있는지 확인
      const docSnap = await getDoc(ref);
      
      if (docSnap.exists()) {
        // 기존 데이터 업데이트
        await updateDoc(ref, {
          ...editForm,
          updatedAt: new Date()
        });
      } else {
        // 새 데이터 생성
        await setDoc(ref, {
          ...editForm,
          id: employerId,
          employerId: employerId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await fetchAccommodationInfo();
      setIsEditing(false);
    } catch (error) {
      console.error('기숙사 정보 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AccommodationInfo, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !employerId) return;

    setUploadingImages(true);
    try {
      const compressedFiles = await Promise.all(
        Array.from(files).map(file => compressImage(file))
      );

      const uploadResults = await Promise.all(
        compressedFiles.map(file => uploadImage(file, 'accommodation-images', employerId))
      );

      const newImages = uploadResults.map(result => result.url);
      const updatedImages = [...(editForm.images || []), ...newImages];
      
      setEditForm(prev => ({
        ...prev,
        images: updatedImages
      }));
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageDelete = async (imageUrl: string, index: number) => {
    if (!window.confirm('이 이미지를 삭제하시겠습니까?')) return;

    try {
      const updatedImages = (editForm.images || []).filter((_, i) => i !== index);
      setEditForm(prev => ({
        ...prev,
        images: updatedImages
      }));
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  const handleExternalLinkAdd = () => {
    const newLink: ExternalLink = {
      type: 'real_estate',
      title: '',
      url: '',
      description: ''
    };
    
    setEditForm(prev => ({
      ...prev,
      externalLinks: [...(prev.externalLinks || []), newLink]
    }));
  };

  const handleExternalLinkUpdate = (index: number, field: keyof ExternalLink, value: string) => {
    const updatedLinks = [...(editForm.externalLinks || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    
    setEditForm(prev => ({
      ...prev,
      externalLinks: updatedLinks
    }));
  };

  const handleExternalLinkDelete = (index: number) => {
    const updatedLinks = (editForm.externalLinks || []).filter((_, i) => i !== index);
    setEditForm(prev => ({
      ...prev,
      externalLinks: updatedLinks
    }));
  };

  if (loading) return <LoadingSpinner />;
  
  // 데이터가 없어도 기본 구조는 표시하되, 데이터는 공란으로 처리
  const displayInfo = accommodationInfo || {
    id: '',
    employerId: employerId || '',
    name: '기숙사명 미등록',
    description: '기숙사 소개가 등록되지 않았습니다.',
    type: 'dormitory' as const,
    address: '주소 미등록',
    distanceFromWorkplace: '거리 정보 미등록',
    capacity: 0,
    currentOccupancy: 0,
    roomTypes: [],
    facilities: [],
    monthlyRent: 0,
    utilities: [],
    images: [],
    rules: [],
    contactPerson: '담당자 미등록',
    contactPhone: '연락처 미등록',
    isAvailable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    // 새로운 필드들 추가
    deposit: 0,
    contractPeriod: '',
    wifi: false,
    tv: false,
    refrigerator: false,
    airConditioning: false,
    laundry: false,
    kitchen: false,
    parkingAvailable: false,
    petAllowed: false,
    smokingAllowed: false,
    averageRating: 0,
    totalReviews: 0
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dormitory': return '기숙사';
      case 'apartment': return '아파트';
      case 'house': return '주택';
      default: return '기타';
    }
  };

  const getExternalLinkTypeLabel = (type: string) => {
    switch (type) {
      case 'real_estate': return '부동산';
      case 'hotel': return '호텔';
      case 'booking': return '예약';
      case 'review': return '리뷰';
      default: return '기타';
    }
  };

  // 현재 사용자가 이 기숙사의 소유자인지 확인
  const isOwner = user?.uid === employerId;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-3xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-3 py-2 w-full"
                placeholder="기숙사명을 입력하세요"
              />
              <div className="flex items-center text-gray-600 space-x-4">
                <select
                  value={editForm.type || 'dormitory'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="bg-white border border-gray-300 rounded px-3 py-1"
                >
                  <option value="dormitory">기숙사</option>
                  <option value="apartment">아파트</option>
                  <option value="house">주택</option>
                </select>
                <span>•</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>수용인원: </span>
                  <input
                    type="number"
                    value={editForm.capacity || 0}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 w-16 ml-1"
                  />
                  <span>명</span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <span>현재: </span>
                  <input
                    type="number"
                    value={editForm.currentOccupancy || 0}
                    onChange={(e) => handleInputChange('currentOccupancy', parseInt(e.target.value) || 0)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 w-16 ml-1"
                  />
                  <span>명</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayInfo.name}</h1>
              <div className="flex items-center text-gray-600 space-x-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{displayInfo.averageRating ? displayInfo.averageRating.toFixed(1) : '0.0'}</span>
                  <span className="text-gray-500 ml-1">({displayInfo.totalReviews || 0}개 리뷰)</span>
                </div>
                <Link 
                  to={`/resort/${employerId}/reviews`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  리뷰 보기
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="flex space-x-2">
          {isOwner && (
            isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                수정
              </button>
            )
          )}
          <Link to="/jobs" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            목록으로
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 기숙사 이미지 갤러리 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                기숙사 이미지
              </h2>
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadingImages ? '업로드 중...' : '이미지 추가'}
                  </button>
                </div>
              )}
            </div>
            
            {editForm.images && editForm.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {editForm.images.map((image, index) => (
                  <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`기숙사 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isOwner && isEditing && (
                      <button
                        onClick={() => handleImageDelete(image, index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>등록된 기숙사 이미지가 없습니다.</p>
                {isOwner && (
                  <p className="text-sm mt-2">수정 버튼을 눌러 이미지를 추가해보세요.</p>
                )}
              </div>
            )}
          </div>

          {/* 기숙사 소개 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">기숙사 소개</h2>
            {isEditing ? (
              <textarea
                value={editForm.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
                placeholder="기숙사 소개를 입력하세요"
              />
            ) : (
              <p className="text-gray-800 leading-7 whitespace-pre-wrap">{displayInfo.description}</p>
            )}
          </div>

          {/* 상세 시설 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">상세 시설 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 기본 편의시설 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 border-b pb-2">기본 편의시설</h3>
                <div className="space-y-2">
                  {isEditing ? (
                    <>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.wifi || false}
                          onChange={(e) => handleInputChange('wifi', e.target.checked)}
                          className="mr-2"
                        />
                        <Wifi className="h-4 w-4 mr-2" />
                        와이파이
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.tv || false}
                          onChange={(e) => handleInputChange('tv', e.target.checked)}
                          className="mr-2"
                        />
                        <Tv className="h-4 w-4 mr-2" />
                        TV
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.refrigerator || false}
                          onChange={(e) => handleInputChange('refrigerator', e.target.checked)}
                          className="mr-2"
                        />
                        냉장고
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.airConditioning || false}
                          onChange={(e) => handleInputChange('airConditioning', e.target.checked)}
                          className="mr-2"
                        />
                        <AirVent className="h-4 w-4 mr-2" />
                        에어컨
                      </label>
                    </>
                  ) : (
                    <>
                      {displayInfo.wifi && (
                        <div className="flex items-center text-green-600">
                          <Wifi className="h-4 w-4 mr-2" />
                          <span>와이파이</span>
                        </div>
                      )}
                      {displayInfo.tv && (
                        <div className="flex items-center text-green-600">
                          <Tv className="h-4 w-4 mr-2" />
                          <span>TV</span>
                        </div>
                      )}
                      {displayInfo.refrigerator && (
                        <div className="flex items-center text-green-600">
                          <span>냉장고</span>
                        </div>
                      )}
                      {displayInfo.airConditioning && (
                        <div className="flex items-center text-green-600">
                          <AirVent className="h-4 w-4 mr-2" />
                          <span>에어컨</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 생활 편의시설 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 border-b pb-2">생활 편의시설</h3>
                <div className="space-y-2">
                  {isEditing ? (
                    <>
                                              <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.laundry || false}
                            onChange={(e) => handleInputChange('laundry', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="mr-2">🧺</span>
                          세탁기
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.kitchen || false}
                            onChange={(e) => handleInputChange('kitchen', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="mr-2">🍳</span>
                          주방
                        </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.parkingAvailable || false}
                          onChange={(e) => handleInputChange('parkingAvailable', e.target.checked)}
                          className="mr-2"
                        />
                        <ParkingCircle className="h-4 w-4 mr-2" />
                        주차 가능
                      </label>
                    </>
                  ) : (
                    <>
                      {displayInfo.laundry && (
                        <div className="flex items-center text-green-600">
                          <span>🧺 세탁기</span>
                        </div>
                      )}
                      {displayInfo.kitchen && (
                        <div className="flex items-center text-green-600">
                          <span>🍳 주방</span>
                        </div>
                      )}
                      {displayInfo.parkingAvailable && (
                        <div className="flex items-center text-green-600">
                          <ParkingCircle className="h-4 w-4 mr-2" />
                          <span>주차 가능</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 정책 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 border-b pb-2">정책</h3>
                <div className="space-y-2">
                  {isEditing ? (
                    <>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.petAllowed || false}
                          onChange={(e) => handleInputChange('petAllowed', e.target.checked)}
                          className="mr-2"
                        />
                        <Dog className="h-4 w-4 mr-2" />
                        반려동물 허용
                      </label>
                                              <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.smokingAllowed || false}
                            onChange={(e) => handleInputChange('smokingAllowed', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="mr-2">🚬</span>
                          흡연 허용
                        </label>
                    </>
                  ) : (
                    <>
                      {displayInfo.petAllowed && (
                        <div className="flex items-center text-green-600">
                          <Dog className="h-4 w-4 mr-2" />
                          <span>반려동물 허용</span>
                        </div>
                      )}
                      {displayInfo.smokingAllowed && (
                        <div className="flex items-center text-green-600">
                          <span>🚬 흡연 허용</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 외부 링크 */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ExternalLinkIcon className="h-5 w-5 mr-2" />
                관련 링크
              </h2>
              {isOwner && isEditing && (
                <button
                  onClick={handleExternalLinkAdd}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  링크 추가
                </button>
              )}
            </div>
            
            {editForm.externalLinks && editForm.externalLinks.length > 0 ? (
              <div className="space-y-4">
                {editForm.externalLinks.map((link, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <select
                            value={link.type}
                            onChange={(e) => handleExternalLinkUpdate(index, 'type', e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="real_estate">부동산</option>
                            <option value="hotel">호텔</option>
                            <option value="booking">예약</option>
                            <option value="review">리뷰</option>
                            <option value="other">기타</option>
                          </select>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => handleExternalLinkUpdate(index, 'title', e.target.value)}
                            placeholder="링크 제목"
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleExternalLinkDelete(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleExternalLinkUpdate(index, 'url', e.target.value)}
                          placeholder="URL"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                        <input
                          type="text"
                          value={link.description || ''}
                          onChange={(e) => handleExternalLinkUpdate(index, 'description', e.target.value)}
                          placeholder="설명 (선택사항)"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {getExternalLinkTypeLabel(link.type)}
                            </span>
                            <span className="font-medium">{link.title}</span>
                          </div>
                          {link.description && (
                            <span className="text-gray-600 text-sm">{link.description}</span>
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-1" />
                          방문
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ExternalLinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>등록된 관련 링크가 없습니다.</p>
                {isOwner && isEditing && (
                  <p className="text-sm mt-2">부동산 사이트, 호텔 예약 사이트 등을 추가해보세요.</p>
                )}
              </div>
            )}
          </div>

          {/* 객실 유형 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">객실 유형</h2>
            {isEditing ? (
              <div className="space-y-4">
                {(editForm.roomTypes || []).map((roomType, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">객실 유형</label>
                        <input
                          type="text"
                          value={roomType.type || ''}
                          onChange={(e) => {
                            const updatedRoomTypes = [...(editForm.roomTypes || [])];
                            updatedRoomTypes[index] = { ...updatedRoomTypes[index], type: e.target.value };
                            setEditForm(prev => ({ ...prev, roomTypes: updatedRoomTypes }));
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="예: 월세형"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">수용인원</label>
                        <input
                          type="number"
                          value={roomType.capacity || ''}
                          onChange={(e) => {
                            const updatedRoomTypes = [...(editForm.roomTypes || [])];
                            updatedRoomTypes[index] = { ...updatedRoomTypes[index], capacity: parseInt(e.target.value) || 0 };
                            setEditForm(prev => ({ ...prev, roomTypes: updatedRoomTypes }));
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="명"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">월세</label>
                        <input
                          type="number"
                          value={roomType.price || ''}
                          onChange={(e) => {
                            const updatedRoomTypes = [...(editForm.roomTypes || [])];
                            updatedRoomTypes[index] = { ...updatedRoomTypes[index], price: parseInt(e.target.value) || 0 };
                            setEditForm(prev => ({ ...prev, roomTypes: updatedRoomTypes }));
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="원"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">가용실</label>
                        <input
                          type="number"
                          value={roomType.available || ''}
                          onChange={(e) => {
                            const updatedRoomTypes = [...(editForm.roomTypes || [])];
                            updatedRoomTypes[index] = { ...updatedRoomTypes[index], available: parseInt(e.target.value) || 0 };
                            setEditForm(prev => ({ ...prev, roomTypes: updatedRoomTypes }));
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="개"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                      <input
                        type="text"
                        value={roomType.description || ''}
                        onChange={(e) => {
                          const updatedRoomTypes = [...(editForm.roomTypes || [])];
                          updatedRoomTypes[index] = { ...updatedRoomTypes[index], description: e.target.value };
                          setEditForm(prev => ({ ...prev, roomTypes: updatedRoomTypes }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="추가 설명"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updatedRoomTypes = (editForm.roomTypes || []).filter((_, i) => i !== index);
                        setEditForm(prev => ({ ...prev, roomTypes: updatedRoomTypes }));
                      }}
                      className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newRoomType = {
                      type: '',
                      capacity: 0,
                      price: 0,
                      available: 0,
                      description: ''
                    };
                    setEditForm(prev => ({
                      ...prev,
                      roomTypes: [...(prev.roomTypes || []), newRoomType]
                    }));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + 객실 유형 추가
                </button>
              </div>
            ) : (
              displayInfo.roomTypes && displayInfo.roomTypes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayInfo.roomTypes.map((roomType, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{roomType.type}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          roomType.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {roomType.available > 0 ? '예약 가능' : '예약 불가'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>수용인원: {roomType.capacity}명</div>
                        <div>월세: {(roomType.price || 0).toLocaleString()}원</div>
                        <div>가용실: {roomType.available}개</div>
                        {roomType.description && (
                          <div className="text-gray-700 mt-2">{roomType.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">등록된 객실 유형이 없습니다.</p>
              )
            )}
          </div>

          {/* 시설 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">시설 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">제공 시설</h3>
                {isEditing ? (
                  <textarea
                    value={editForm.facilities?.join('\n') || ''}
                    onChange={(e) => handleInputChange('facilities', e.target.value.split('\n').filter(item => item.trim()))}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
                    placeholder="시설을 한 줄에 하나씩 입력하세요"
                  />
                ) : (
                  displayInfo.facilities && displayInfo.facilities.length > 0 ? (
                    <div className="space-y-2">
                      {displayInfo.facilities.map((facility, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-gray-800">{facility}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">등록된 시설 정보가 없습니다.</p>
                  )
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">공과금</h3>
                {isEditing ? (
                  <textarea
                    value={editForm.utilities?.join('\n') || ''}
                    onChange={(e) => handleInputChange('utilities', e.target.value.split('\n').filter(item => item.trim()))}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
                    placeholder="공과금을 한 줄에 하나씩 입력하세요"
                  />
                ) : (
                  displayInfo.utilities && displayInfo.utilities.length > 0 ? (
                    <div className="space-y-2">
                      {displayInfo.utilities.map((utility, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-gray-800">{utility}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">등록된 공과금 정보가 없습니다.</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 기숙사 규칙 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">기숙사 규칙</h2>
            {isEditing ? (
              <textarea
                value={editForm.rules?.join('\n') || ''}
                onChange={(e) => handleInputChange('rules', e.target.value.split('\n').filter(item => item.trim()))}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
                placeholder="기숙사 규칙을 한 줄에 하나씩 입력하세요"
              />
            ) : (
              displayInfo.rules && displayInfo.rules.length > 0 ? (
                <ul className="space-y-2">
                  {displayInfo.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-800">{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">등록된 기숙사 규칙이 없습니다.</p>
              )
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">기숙사 유형</div>
                <div className="text-gray-900">{getTypeLabel(displayInfo.type)}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">총 수용인원</div>
                <div className="text-gray-900">{displayInfo.capacity}명</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">현재 입주자</div>
                <div className="text-gray-900">{displayInfo.currentOccupancy}명</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">가용성</div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  displayInfo.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {displayInfo.isAvailable ? '입주 가능' : '입주 불가'}
                </div>
              </div>

              {displayInfo.deposit && (
                <div>
                  <div className="text-sm font-medium text-gray-700">보증금</div>
                  <div className="text-gray-900">{(displayInfo.deposit || 0).toLocaleString()}원</div>
                </div>
              )}

              {displayInfo.contractPeriod && (
                <div>
                  <div className="text-sm font-medium text-gray-700">계약기간</div>
                  <div className="text-gray-900">{displayInfo.contractPeriod}</div>
                </div>
              )}
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">위치 정보</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">주소</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mt-1"
                      placeholder="주소를 입력하세요"
                    />
                  ) : (
                    <div className="text-gray-800">{displayInfo.address}</div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">업장까지 거리</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.distanceFromWorkplace || ''}
                    onChange={(e) => handleInputChange('distanceFromWorkplace', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mt-1"
                    placeholder="거리 정보를 입력하세요"
                  />
                ) : (
                  <div className="text-gray-800">{displayInfo.distanceFromWorkplace}</div>
                )}
              </div>
            </div>
          </div>

          {/* 비용 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">비용 정보</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">기본 월세</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.monthlyRent || 0}
                    onChange={(e) => handleInputChange('monthlyRent', parseInt(e.target.value) || 0)}
                    className="w-24 p-2 border border-gray-300 rounded text-right"
                    placeholder="0"
                  />
                ) : (
                  <span className="text-gray-900 font-semibold">{(displayInfo.monthlyRent || 0).toLocaleString()}원</span>
                )}
              </div>
              
              {isEditing && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">보증금</span>
                  <input
                    type="number"
                    value={editForm.deposit || 0}
                    onChange={(e) => handleInputChange('deposit', parseInt(e.target.value) || 0)}
                    className="w-24 p-2 border border-gray-300 rounded text-right"
                    placeholder="0"
                  />
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="text-sm font-medium text-gray-700 mb-2">객실별 월세</div>
                {displayInfo.roomTypes && displayInfo.roomTypes.length > 0 ? (
                  <div className="space-y-1">
                    {displayInfo.roomTypes.map((roomType, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{roomType.type}</span>
                        <span className="text-gray-900">{(roomType.price || 0).toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">등록된 객실 정보가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">연락처</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">담당자</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.contactPerson || ''}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mt-1"
                      placeholder="담당자명을 입력하세요"
                    />
                  ) : (
                    <div className="text-gray-800">{displayInfo.contactPerson}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">연락처</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.contactPhone || ''}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mt-1"
                      placeholder="연락처를 입력하세요"
                    />
                  ) : (
                    <div className="text-gray-800">{displayInfo.contactPhone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* 등록 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">등록 정보</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">등록일</div>
                <div className="text-gray-900">
                  {displayInfo.createdAt instanceof Date ? 
                    displayInfo.createdAt.toLocaleDateString('ko-KR') : 
                    displayInfo.createdAt.toDate().toLocaleDateString('ko-KR')}
                </div>
              </div>
              
              {displayInfo.updatedAt && (
                <div>
                  <div className="text-sm font-medium text-gray-700">수정일</div>
                  <div className="text-gray-900">
                    {displayInfo.updatedAt instanceof Date ? 
                      displayInfo.updatedAt.toLocaleDateString('ko-KR') : 
                      displayInfo.updatedAt.toDate().toLocaleDateString('ko-KR')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationInfoPage;
