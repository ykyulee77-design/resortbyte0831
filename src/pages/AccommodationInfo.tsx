import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AccommodationInfo, ExternalLink } from '../types';
import { 
  Home, MapPin, Phone, Users, DollarSign, CheckCircle, Star, Edit, Save, X,
  Upload, Trash2, Plus, ExternalLink as ExternalLinkIcon, Camera, Wifi, Car, Utensils,
  Shield, Clock, Users as UsersIcon, Bed, Bath, Tv, AirVent,
  ParkingCircle, Dog, Wrench, AlertTriangle, Heart, ThumbsUp, MessageCircle,
  Briefcase, Globe
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { uploadImage, deleteImage, compressImage } from '../utils/imageUpload';

interface CompanyInfo {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  description?: string;
  location?: string;
}


const AccommodationInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const { user } = useAuth();
  const [accommodationInfo, setAccommodationInfo] = useState<AccommodationInfo | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AccommodationInfo>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  const fetchAccommodationInfo = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      // 기숙사 정보 가져오기
      const accommodationRef = doc(db, 'accommodationInfo', employerId);
      const accommodationSnap = await getDoc(accommodationRef);
      
      if (accommodationSnap.exists()) {
        const data = { id: accommodationSnap.id, ...accommodationSnap.data() } as AccommodationInfo;
        console.log('기숙사 정보 로드:', data);
        console.log('이미지 배열:', data.images);
        console.log('기본정보:', {
          name: data.name,
          type: data.type,
          address: data.address,
          contactPerson: data.contactPerson,
          contactPhone: data.contactPhone
        });
        setAccommodationInfo(data);
        setEditForm(data);
      }
      
      // 회사 정보 가져오기
      try {
        const companyRef = doc(db, 'companyInfo', employerId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          const companyData = { id: companySnap.id, ...companySnap.data() } as CompanyInfo;
          console.log('회사 정보 로드:', companyData);
          setCompanyInfo(companyData);
        }
      } catch (companyError) {
        console.log('회사 정보가 없습니다:', companyError);
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
      // 새로운 기숙사 정보 생성 시 "갈멍의 집"과 동일한 기본값 설정
      setEditForm({
        name: '갈멍의 집',
        description: '신축',
        type: 'apartment' as const,
        address: '주소 미등록',
        distanceFromWorkplace: '거리 정보 미등록',
        capacity: 0,
        currentOccupancy: 0,
        roomTypes: [
          {
            type: 'twin',
            capacity: 2,
            price: 0,
            available: 21,
            description: '무료이나 선착순'
          }
        ],
        facilities: ['공용 목욕탕 무료', '워터파크', '체련실'],
        monthlyRent: 0,
        utilities: ['사용료 실비 계산'],
        images: [],
        rules: [],
        contactPerson: '아무개',
        contactPhone: '011111111111',
        isAvailable: false,
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
        totalReviews: 0,
        externalLinks: [],
        isPublic: true
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(accommodationInfo || {});
  };

  const handleSave = async () => {
    if (!employerId) return;
    
    console.log('저장 시작 - editForm:', editForm);
    console.log('저장할 이미지 배열:', editForm.images);
    
    setSaving(true);
    try {
      const ref = doc(db, 'accommodationInfo', employerId);
      
      // 기존 데이터가 있는지 확인
      const docSnap = await getDoc(ref);
      
      if (docSnap.exists()) {
        // 기존 데이터 업데이트
        console.log('기존 문서 업데이트 중...');
        await updateDoc(ref, {
          ...editForm,
          updatedAt: new Date()
        });
        console.log('기존 문서 업데이트 완료');
      } else {
        // 새 데이터 생성
        console.log('새 문서 생성 중...');
        await setDoc(ref, {
          ...editForm,
          id: employerId,
          employerId: employerId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('새 문서 생성 완료');
      }
      
      await fetchAccommodationInfo();
      setIsEditing(false);
      console.log('저장 완료 - accommodationInfo:', accommodationInfo);
      console.log('저장 완료 - editForm:', editForm);
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
        compressedFiles.map(file => uploadImage(file, {
          folder: 'accommodation-images',
          metadata: {
            uploadedBy: employerId,
            uploadType: 'accommodation-image'
          }
        }))
      );

      const newImages = uploadResults
        .filter(result => result.success)
        .map(result => result.url!)
        .filter(Boolean);
      
      console.log('업로드된 이미지 URLs:', newImages);
      
      const updatedImages = [...(editForm.images || []), ...newImages];
      console.log('업데이트된 이미지 배열:', updatedImages);
      
      setEditForm(prev => ({
        ...prev,
        images: updatedImages
      }));

      // 이미지 업로드 후 자동 저장
      console.log('이미지 업로드 후 자동 저장 시작...');
      const updatedForm = {
        ...editForm,
        images: updatedImages
      };
      
      try {
        const ref = doc(db, 'accommodationInfo', employerId!);
        const docSnap = await getDoc(ref);
        
        if (docSnap.exists()) {
          await updateDoc(ref, {
            ...updatedForm,
            images: updatedImages,
            updatedAt: new Date()
          });
          console.log('이미지 자동 저장 성공');
        } else {
          await setDoc(ref, {
            ...updatedForm,
            id: employerId,
            employerId: employerId,
            images: updatedImages,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('이미지 자동 저장 성공 (새 문서)');
        }
        
        // 저장 후 데이터 다시 로드
        await fetchAccommodationInfo();
      } catch (error) {
        console.error('이미지 자동 저장 실패:', error);
        alert('이미지 저장에 실패했습니다. 수동으로 저장 버튼을 눌러주세요.');
      }
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
      // 이미지 삭제
      const result = await deleteImage(imageUrl);
      
      if (result.success) {
        const updatedImages = (editForm.images || []).filter((_, i) => i !== index);
        setEditForm(prev => ({
          ...prev,
          images: updatedImages
        }));
      } else {
        alert('이미지 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  // 이미지 미리보기
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '기숙사 이미지');
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

  // 편집 모드일 때는 editForm을, 표시 모드일 때는 accommodationInfo를 사용
  const displayInfo = useMemo(() => {
    return isEditing ? editForm : (accommodationInfo || {
    id: '',
    employerId: employerId || '',
    name: '갈멍의 집', // 기본값을 "갈멍의 집"으로 설정
    description: '신축', // 기본값을 "신축"으로 설정
    type: 'apartment' as const, // 기본값을 아파트로 변경
    address: '주소 미등록',
    distanceFromWorkplace: '거리 정보 미등록',
    capacity: 0,
    currentOccupancy: 0,
    roomTypes: [
      {
        type: 'twin',
        capacity: 2,
        price: 0,
        available: 21, // 기본값을 21개로 설정
        description: '무료이나 선착순'
      }
    ],
    facilities: ['공용 목욕탕 무료', '워터파크', '체련실'],
    monthlyRent: 0,
    utilities: ['사용료 실비 계산'],
    images: [],
    rules: [],
    contactPerson: '아무개', // 기본값을 "아무개"로 설정
    contactPhone: '011111111111', // 기본값을 "011111111111"로 설정
    isAvailable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    // 새로운 필드들 추가
    deposit: 0,
    contractPeriod: '',
    contractStartDate: '',
    contractEndDate: '',
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
    totalReviews: 0,
    externalLinks: [],
    roomTypeOptions: {
      singleRoom: false,
      doubleRoom: false,
      tripleRoom: false,
      quadRoom: false,
      otherRoom: false
    },
    paymentType: 'free',
    roomPrices: {
      singleRoom: 0,
      doubleRoom: 0,
      tripleRoom: 0,
      quadRoom: 0,
      otherRoom: 0
    },
    otherRoomType: '',
    facilityOptions: {
      parking: false,
      laundry: false,
      kitchen: false,
      gym: false,
      studyRoom: false,
      lounge: false,
      wifi: false,
      security: false,
      elevator: false,
      other: false
    },
    otherFacilities: false,
    otherFacilitiesText: '',
    otherFacilityText: ''
  });
  }, [isEditing, editForm, accommodationInfo, employerId]);

  if (loading) return <LoadingSpinner />;

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? (
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-orange-500 focus:outline-none"
                placeholder="기숙사명을 입력하세요"
              />
            ) : (
              editForm.name || '기숙사명 미등록'
            )}
          </h1>

        </div>
        <div className="flex space-x-2">
          {isOwner && (
            <>
              {isEditing ? (
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
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </button>
              )}
            </>
          )}
          <Link to="/employer-dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            대시보드로
          </Link>
        </div>
      </div>

            <div className="space-y-6">
        {/* 기본정보 */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-2">기본정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">기숙사명</span>
                {isEditing ? (
                  <input
                    type="text"
                  value={editForm.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-right bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none"
                  placeholder="기숙사명"
                  />
                ) : (
                <span className="text-gray-900">{displayInfo.name}</span>
                )}
              </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">유형</span>
              {isEditing ? (
                <select
                  value={editForm.type || 'apartment'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="text-right bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none"
                >
                  <option value="dormitory">기숙사</option>
                  <option value="apartment">아파트</option>
                  <option value="house">단독주택</option>
                  <option value="other">기타</option>
                </select>
              ) : (
                <span className="text-gray-900">
                  {displayInfo.type === 'dormitory' && '기숙사'}
                  {displayInfo.type === 'apartment' && '아파트'}
                  {displayInfo.type === 'house' && '단독주택'}
                  {displayInfo.type === 'other' && '기타'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">주소</span>
                {isEditing ? (
                  <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="text-right bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none"
                  placeholder="주소를 입력하세요 (번지, 호수 포함)"
                  />
                ) : (
                <span className="text-gray-900">{displayInfo.address}</span>
                )}
              </div>
                <div className="flex items-center justify-between">
              <span className="text-gray-500">직장까지 거리</span>
              {isEditing ? (
                  <input
                  type="text"
                  value={editForm.distanceFromWorkplace || ''}
                  onChange={(e) => handleInputChange('distanceFromWorkplace', e.target.value)}
                  className="text-right bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none"
                  placeholder="거리 정보를 입력하세요"
                />
              ) : (
                <span className="text-gray-900">{displayInfo.distanceFromWorkplace}</span>
              )}
            </div>
          </div>
        </div>

        {/* 회사 정보 */}
        {companyInfo && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              회사 정보
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">회사명</span>
                <span className="text-gray-900 font-medium">{companyInfo.name}</span>
              </div>
              {companyInfo.industry && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">업종</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {companyInfo.industry}
                  </span>
                </div>
              )}
              {companyInfo.size && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">회사 규모</span>
                  <span className="text-gray-900">{companyInfo.size}</span>
                </div>
              )}
              {companyInfo.location && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">회사 위치</span>
                  <span className="text-gray-900">{companyInfo.location}</span>
                </div>
              )}
              {companyInfo.website && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">웹사이트</span>
                  <a 
                    href={companyInfo.website.startsWith('http') ? companyInfo.website : `https://${companyInfo.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    방문
                  </a>
                </div>
              )}
              {companyInfo.description && (
                <div className="flex items-start justify-between">
                  <span className="text-gray-500">회사 소개</span>
                  <span className="text-gray-900 text-right max-w-xs">{companyInfo.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 연락처 */}
        {(isEditing || displayInfo.contactPerson || displayInfo.contactPhone) && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">연락처</h3>
            <div className="space-y-1 text-sm">
              {isEditing || displayInfo.contactPerson ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">담당자</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="text-right bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none"
                    placeholder="담당자명을 입력하세요"
                  />
                ) : (
                    <span className="text-gray-900">{displayInfo.contactPerson}</span>
                )}
              </div>
              ) : null}
              {isEditing || displayInfo.contactPhone ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">연락처</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="text-right bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none"
                    placeholder="연락처를 입력하세요"
                  />
                ) : (
                    <span className="text-gray-900">{displayInfo.contactPhone}</span>
                )}
              </div>
              ) : null}
            </div>
          </div>
        )}

        {/* 기숙사 이미지 갤러리 */}
        <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                기숙사 이미지
            </h3>
            {isOwner && isEditing && (
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
            
                        {((isEditing ? editForm.images : displayInfo.images) || []).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(isEditing ? (editForm.images || []) : (displayInfo.images || [])).map((image, index) => (
                  <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                    <img
                      src={image}
                      alt={`기숙사 이미지 ${index + 1}`}
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      onClick={() => handleImagePreview(image, `기숙사 이미지 ${index + 1}`)}
                      onError={(e) => {
                        console.error('이미지 로드 실패:', image);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('이미지 로드 성공:', image);
                      }}
                    />
                    {isOwner && isEditing && (
                      <button
                        onClick={() => handleImageDelete(image, index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                        클릭하여 크게 보기
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>등록된 기숙사 이미지가 없습니다.</p>
              {isOwner && isEditing && (
                <p className="text-sm mt-2">이미지를 추가해보세요.</p>
                )}
              </div>
            )}
          </div>

                {/* 객실 유형 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">객실 Type</h3>
            {isEditing ? (
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="free"
                    checked={editForm.paymentType === 'free'}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        paymentType: e.target.value as 'free' | 'paid'
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>무료</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="paid"
                    checked={editForm.paymentType === 'paid'}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        paymentType: e.target.value as 'free' | 'paid'
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>유료</span>
                </label>
                

              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {displayInfo.paymentType === 'free' ? (
                  <div className="flex items-center text-green-600">
                    <span>✓ 무료</span>
                  </div>
                ) : displayInfo.paymentType === 'paid' ? (
                  <div className="flex items-center">
                    <span className="text-green-600">✓ 유료</span>
                  </div>
                ) : (
                  <div className="text-gray-500">요금 정보 미등록</div>
                )}
              </div>
            )}
          </div>

          {/* 객실 유형 선택 */}
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.roomTypeOptions?.singleRoom || false}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        roomTypeOptions: {
                          ...prev.roomTypeOptions,
                          singleRoom: e.target.checked
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>1인실</span>
                </label>
                {editForm.paymentType === 'paid' && editForm.roomTypeOptions?.singleRoom && (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={editForm.roomPrices?.singleRoom || ''}
                      onChange={(e) => {
                        setEditForm(prev => ({
                          ...prev,
                          roomPrices: {
                            ...prev.roomPrices,
                            singleRoom: parseInt(e.target.value) || 0
                          }
                        }));
                      }}
                      className="w-20 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                      placeholder="월세"
                    />
                    <span className="text-gray-600 text-sm">천원</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.roomTypeOptions?.doubleRoom || false}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        roomTypeOptions: {
                          ...prev.roomTypeOptions,
                          doubleRoom: e.target.checked
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>2인실</span>
                </label>
                {editForm.paymentType === 'paid' && editForm.roomTypeOptions?.doubleRoom && (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={editForm.roomPrices?.doubleRoom || ''}
                      onChange={(e) => {
                        setEditForm(prev => ({
                          ...prev,
                          roomPrices: {
                            ...prev.roomPrices,
                            doubleRoom: parseInt(e.target.value) || 0
                          }
                        }));
                      }}
                      className="w-20 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                      placeholder="월세"
                    />
                    <span className="text-gray-600 text-sm">천원</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.roomTypeOptions?.tripleRoom || false}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        roomTypeOptions: {
                          ...prev.roomTypeOptions,
                          tripleRoom: e.target.checked
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>3인실</span>
                </label>
                {editForm.paymentType === 'paid' && editForm.roomTypeOptions?.tripleRoom && (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={editForm.roomPrices?.tripleRoom || ''}
                      onChange={(e) => {
                        setEditForm(prev => ({
                          ...prev,
                          roomPrices: {
                            ...prev.roomPrices,
                            tripleRoom: parseInt(e.target.value) || 0
                          }
                        }));
                      }}
                      className="w-20 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                      placeholder="월세"
                    />
                    <span className="text-gray-600 text-sm">천원</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.roomTypeOptions?.quadRoom || false}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        roomTypeOptions: {
                          ...prev.roomTypeOptions,
                          quadRoom: e.target.checked
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>4인실</span>
                </label>
                {editForm.paymentType === 'paid' && editForm.roomTypeOptions?.quadRoom && (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={editForm.roomPrices?.quadRoom || ''}
                      onChange={(e) => {
                        setEditForm(prev => ({
                          ...prev,
                          roomPrices: {
                            ...prev.roomPrices,
                            quadRoom: parseInt(e.target.value) || 0
                          }
                        }));
                      }}
                      className="w-20 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                      placeholder="월세"
                    />
                    <span className="text-gray-600 text-sm">천원</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.roomTypeOptions?.otherRoom || false}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        roomTypeOptions: {
                          ...prev.roomTypeOptions,
                          otherRoom: e.target.checked
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>기타</span>
                </label>
                {editForm.roomTypeOptions?.otherRoom && (
                  <input
                    type="text"
                    value={editForm.otherRoomType || ''}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        otherRoomType: e.target.value
                      }));
                    }}
                    className="w-24 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                    placeholder="기타 유형"
                  />
                )}
                {editForm.paymentType === 'paid' && editForm.roomTypeOptions?.otherRoom && (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={editForm.roomPrices?.otherRoom || ''}
                      onChange={(e) => {
                        setEditForm(prev => ({
                          ...prev,
                          roomPrices: {
                            ...prev.roomPrices,
                            otherRoom: parseInt(e.target.value) || 0
                          }
                        }));
                      }}
                      className="w-20 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                      placeholder="월세"
                    />
                    <span className="text-gray-600 text-sm">천원</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayInfo.roomTypeOptions?.singleRoom && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓ 1인실</span>
                  {displayInfo.paymentType === 'paid' && displayInfo.roomPrices?.singleRoom && (
                    <span className="text-gray-700 text-sm">
                      {displayInfo.roomPrices.singleRoom}천원
                    </span>
                  )}
                </div>
              )}
              {displayInfo.roomTypeOptions?.doubleRoom && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓ 2인실</span>
                  {displayInfo.paymentType === 'paid' && displayInfo.roomPrices?.doubleRoom && (
                    <span className="text-gray-700 text-sm">
                      {displayInfo.roomPrices.doubleRoom}천원
                    </span>
                  )}
                </div>
              )}
              {displayInfo.roomTypeOptions?.tripleRoom && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓ 3인실</span>
                  {displayInfo.paymentType === 'paid' && displayInfo.roomPrices?.tripleRoom && (
                    <span className="text-gray-700 text-sm">
                      {displayInfo.roomPrices.tripleRoom}천원
                    </span>
                  )}
                </div>
              )}
              {displayInfo.roomTypeOptions?.quadRoom && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓ 4인실</span>
                  {displayInfo.paymentType === 'paid' && displayInfo.roomPrices?.quadRoom && (
                    <span className="text-gray-700 text-sm">
                      {displayInfo.roomPrices.quadRoom}천원
                    </span>
                  )}
                </div>
              )}
              {displayInfo.roomTypeOptions?.otherRoom && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓ 기타</span>
                  {displayInfo.otherRoomType && (
                    <span className="text-gray-700 text-sm">
                      ({displayInfo.otherRoomType})
                    </span>
                  )}
                  {displayInfo.paymentType === 'paid' && displayInfo.roomPrices?.otherRoom && (
                    <span className="text-gray-700 text-sm">
                      {displayInfo.roomPrices.otherRoom}천원
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 객실 시설 */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-4">객실 시설</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                 <div className="flex items-center space-x-2">
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={editForm.otherFacilities || false}
                       onChange={(e) => handleInputChange('otherFacilities', e.target.checked)}
                       className="mr-2"
                     />
                     <span>기타</span>
                   </label>
                   <input
                     type="text"
                     value={editForm.otherFacilitiesText || ''}
                     onChange={(e) => handleInputChange('otherFacilitiesText', e.target.value)}
                     className="w-32 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                     placeholder="기타 시설"
                   />
                 </div>
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
                 {displayInfo.otherFacilities && (
                   <div className="flex items-center text-green-600">
                     <span>✓ 기타</span>
                     {displayInfo.otherFacilitiesText && (
                       <span className="text-gray-700 text-sm ml-1">
                         ({displayInfo.otherFacilitiesText})
                       </span>
                     )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>



        {/* 부대 시설 */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-4">부대 시설</h3>
                  {isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                  checked={editForm.facilityOptions?.parking || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        parking: e.target.checked
                      }
                    }));
                  }}
                          className="mr-2"
                        />
                <span>주차장</span>
                      </label>
                                              <label className="flex items-center">
                          <input
                            type="checkbox"
                  checked={editForm.facilityOptions?.laundry || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        laundry: e.target.checked
                      }
                    }));
                  }}
                            className="mr-2"
                          />
                <span>세탁실</span>
                        </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.kitchen || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        kitchen: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>공용주방</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.gym || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        gym: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>체육관</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.studyRoom || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        studyRoom: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>스터디룸</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.lounge || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        lounge: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>휴게실</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.wifi || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        wifi: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>와이파이</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.security || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        security: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>보안시설</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.facilityOptions?.elevator || false}
                  onChange={(e) => {
                    setEditForm(prev => ({
                      ...prev,
                      facilityOptions: {
                        ...prev.facilityOptions,
                        elevator: e.target.checked
                      }
                    }));
                  }}
                  className="mr-2"
                />
                <span>엘리베이터</span>
              </label>
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.facilityOptions?.other || false}
                    onChange={(e) => {
                      setEditForm(prev => ({
                        ...prev,
                        facilityOptions: {
                          ...prev.facilityOptions,
                          other: e.target.checked
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  <span>기타</span>
                </label>
                <input
                  type="text"
                  value={editForm.otherFacilityText || ''}
                  onChange={(e) => handleInputChange('otherFacilityText', e.target.value)}
                  className="w-32 p-1 border border-gray-300 rounded text-sm focus:border-orange-500 focus:outline-none"
                  placeholder="기타 시설"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayInfo.facilityOptions?.parking && (
                        <div className="flex items-center text-green-600">
                  <span>✓ 주차장</span>
                        </div>
                      )}
              {displayInfo.facilityOptions?.laundry && (
                        <div className="flex items-center text-green-600">
                  <span>✓ 세탁실</span>
                        </div>
                      )}
              {displayInfo.facilityOptions?.kitchen && (
                <div className="flex items-center text-green-600">
                  <span>✓ 공용주방</span>
                </div>
                  )}
              {displayInfo.facilityOptions?.gym && (
                <div className="flex items-center text-green-600">
                  <span>✓ 체육관</span>
                </div>
              )}
              {displayInfo.facilityOptions?.studyRoom && (
                <div className="flex items-center text-green-600">
                  <span>✓ 스터디룸</span>
              </div>
              )}
              {displayInfo.facilityOptions?.lounge && (
                <div className="flex items-center text-green-600">
                  <span>✓ 휴게실</span>
            </div>
              )}
              {displayInfo.facilityOptions?.wifi && (
                <div className="flex items-center text-green-600">
                  <span>✓ 와이파이</span>
                </div>
              )}
              {displayInfo.facilityOptions?.security && (
                <div className="flex items-center text-green-600">
                  <span>✓ 보안시설</span>
                </div>
              )}
              {displayInfo.facilityOptions?.elevator && (
                <div className="flex items-center text-green-600">
                  <span>✓ 엘리베이터</span>
                </div>
              )}
              {displayInfo.facilityOptions?.other && (
                <div className="flex items-center text-green-600">
                  <span>✓ 기타</span>
                  {displayInfo.otherFacilityText && (
                    <span className="text-gray-700 text-sm ml-1">
                      ({displayInfo.otherFacilityText})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          </div>



        {/* 기숙사 규칙 */}
        {isEditing || (displayInfo.rules && displayInfo.rules.length > 0) ? (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">기숙사 규칙</h3>
            {isEditing ? (
              <textarea
                value={editForm.rules?.join('\n') || ''}
                onChange={(e) => handleInputChange('rules', e.target.value.split('\n').filter(item => item.trim()))}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
                placeholder="기숙사 규칙을 한 줄에 하나씩 입력하세요"
              />
            ) : (
              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                {(displayInfo.rules || []).map((rule: string, i: number) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}





        {/* 기숙사 소개 */}
        {isEditing || displayInfo.description ? (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">기숙사 소개</h3>
            {isEditing ? (
              <textarea
                value={editForm.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
                placeholder="기숙사 소개를 입력하세요"
              />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{displayInfo.description}</p>
            )}
          </div>
        ) : null}

        {/* 관련 링크 */}
        {isEditing || (displayInfo.externalLinks && displayInfo.externalLinks.length > 0) ? (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">관련 링크</h3>
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
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{getExternalLinkTypeLabel(link.type)}</span>
                          <span className="text-sm font-medium text-gray-900">{link.title}</span>
                          {link.description && (
                            <span className="text-sm text-gray-600">{link.description}</span>
                          )}
                        </div>
                        {link.url && (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                          방문
                        </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>등록된 관련 링크가 없습니다.</p>
                {isOwner && isEditing && (
                  <p className="text-sm mt-2">부동산 사이트, 호텔 예약 사이트 등을 추가해보세요.</p>
                )}
              </div>
            )}
          </div>
        ) : null}
        </div>

      {/* 이미지 미리보기 모달 */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        imageName={previewImageName}
      />
    </div>
  );
};

export default AccommodationInfoPage;

