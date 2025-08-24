import React, { useState, useEffect } from 'react';
import { X, Home, MapPin, Users, Calendar, Plus, Trash2, Phone, Mail, Upload, Image, Eye } from 'lucide-react';
import { AccommodationInfo, RoomType } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { optimizeImage, getFileSizeMB, isFileTooLarge, isImageFile, generateSafeFileName, generateStoragePath } from '../utils/imageOptimizer';

interface AccommodationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerId: string;
  workplaceName: string;
}

const AccommodationInfoModal: React.FC<AccommodationInfoModalProps> = ({
  isOpen,
  onClose,
  employerId,
  workplaceName,
}) => {
  const [accommodationInfo, setAccommodationInfo] = useState<Partial<AccommodationInfo>>({
    name: `${workplaceName} 기숙사`,
    description: '',
    type: 'dormitory',
    address: '',
    distanceFromWorkplace: '',
    capacity: 0,
    currentOccupancy: 0,
    roomTypes: [],
    facilities: [],
    monthlyRent: 0,
    utilities: [],
    images: [],
    rules: [],
    contactPerson: '',
    contactPhone: '',
    isAvailable: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 기존 기숙사 정보 불러오기
  useEffect(() => {
    if (isOpen && employerId) {
      loadAccommodationInfo();
    }
  }, [isOpen, employerId]);

  const loadAccommodationInfo = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'accommodationInfo', employerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as AccommodationInfo;
        setAccommodationInfo(data);
      }
    } catch (error) {
      console.error('기숙사 정보 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setAccommodationInfo(prev => ({
        ...prev,
        [name]: Number(value),
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setAccommodationInfo(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setAccommodationInfo(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleArrayChange = (field: keyof AccommodationInfo, index: number, value: string) => {
    setAccommodationInfo(prev => ({
      ...prev,
      [field]: (prev[field] as string[])?.map((item, i) => i === index ? value : item) || [],
    }));
  };

  const addArrayItem = (field: keyof AccommodationInfo) => {
    setAccommodationInfo(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), ''],
    }));
  };

  const removeArrayItem = (field: keyof AccommodationInfo, index: number) => {
    setAccommodationInfo(prev => ({
      ...prev,
      [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleRoomTypeChange = (index: number, field: keyof RoomType, value: string | number | string[]) => {
    setAccommodationInfo(prev => ({
      ...prev,
      roomTypes: prev.roomTypes?.map((room: RoomType, i: number) => 
        i === index ? { ...room, [field]: value } : room,
      ) || [],
    }));
  };

  const addRoomType = () => {
    const newRoomType: RoomType = {
      id: Date.now().toString(),
      name: '',
      description: '',
      capacity: 2,
      price: 0,
      available: 1,
      facilities: [],
      images: [],
      isAvailable: true,
    };
    setAccommodationInfo(prev => ({
      ...prev,
      roomTypes: [...(prev.roomTypes || []), newRoomType],
    }));
  };

  const removeRoomType = (index: number) => {
    setAccommodationInfo(prev => ({
      ...prev,
      roomTypes: prev.roomTypes?.filter((_, i) => i !== index) || [],
    }));
  };

  // 이미지 업로드 함수 (재시도 로직 포함)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const uploadedUrls: string[] = [];

      console.log('=== 이미지 업로드 시작 ===');
      console.log('선택된 파일 수:', files.length);
      console.log('Firebase Storage 설정 확인:', storage ? '✅' : '❌');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`\n--- 파일 ${i + 1}/${files.length} 처리 중 ---`);
        console.log('파일명:', file.name);
        console.log('파일 크기:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('파일 타입:', file.type);
        
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          console.error('파일 크기 초과:', file.name);
          alert(`파일 "${file.name}"의 크기는 5MB 이하여야 합니다.`);
          continue;
        }

        // 파일 타입 체크
        if (!isImageFile(file)) {
          console.error('지원하지 않는 파일 타입:', file.name);
          alert(`파일 "${file.name}"은 이미지 파일이 아닙니다.`);
          continue;
        }

        // 파일 크기 확인 및 최적화
        let optimizedFile = file;
        const originalSizeMB = getFileSizeMB(file);
        
        if (isFileTooLarge(file, 1)) {
          console.log(`파일 크기 최적화 중: ${originalSizeMB.toFixed(2)}MB`);
          try {
            optimizedFile = await optimizeImage(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.8,
              maxSizeMB: 1,
            });
            const optimizedSizeMB = getFileSizeMB(optimizedFile);
            console.log(`최적화 완료: ${originalSizeMB.toFixed(2)}MB → ${optimizedSizeMB.toFixed(2)}MB`);
          } catch (optimizeError) {
            console.error('이미지 최적화 실패:', optimizeError);
            alert(`파일 "${file.name}" 최적화에 실패했습니다. 원본 파일로 진행합니다.`);
          }
        }

        // 재시도 로직
        let retryCount = 0;
        const maxRetries = 3;
        let uploadSuccess = false;

        while (retryCount < maxRetries && !uploadSuccess) {
          try {
            console.log(`\n=== 이미지 업로드 시도 ${retryCount + 1}/${maxRetries} ===`);
            console.log('파일:', optimizedFile.name);
            console.log('크기:', getFileSizeMB(optimizedFile).toFixed(2) + 'MB');
            console.log('employerId:', employerId);
            
            // Firebase Storage에 업로드
            const fileName = generateSafeFileName(employerId, optimizedFile.name, i);
            const storagePath = generateStoragePath(employerId, fileName);
            const storageRef = ref(storage, storagePath);
            
            console.log('파일명:', fileName);
            console.log('Storage 경로:', storagePath);
            console.log('Storage 참조 생성 완료');
            
            // 메타데이터 설정
            const metadata = {
              contentType: optimizedFile.type,
              cacheControl: 'public, max-age=31536000',
            };
            
            console.log('메타데이터:', metadata);
            console.log('업로드 시작...');
            
            const snapshot = await uploadBytes(storageRef, optimizedFile, metadata);
            console.log('업로드 완료:', snapshot.ref.fullPath);
            console.log('업로드된 바이트:' );
            
            const downloadURL = await getDownloadURL(storageRef);
            console.log('다운로드 URL 생성 완료:', downloadURL);
            uploadedUrls.push(downloadURL);
            uploadSuccess = true;
            
            console.log(`✅ 파일 "${file.name}" 업로드 성공!`);
            
          } catch (uploadError: any) {
            retryCount++;
            console.error(`\n❌ 업로드 실패 (시도 ${retryCount}/${maxRetries}):`);
            console.error('오류 코드:', uploadError.code);
            console.error('오류 메시지:', uploadError.message);
            console.error('전체 오류:', uploadError);
            
            if (uploadError.code === 'storage/retry-limit-exceeded') {
              if (retryCount < maxRetries) {
                console.log(`🔄 ${retryCount}초 후 재시도...`);
                await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                continue;
              } else {
                console.error('최대 재시도 횟수 초과');
                alert(`파일 "${file.name}" 업로드 실패: 네트워크 문제입니다.\n\n해결 방법:\n1. 인터넷 연결 확인\n2. 파일 크기 줄이기 (1MB 이하 권장)\n3. 잠시 후 다시 시도`);
                break;
              }
            } else if (uploadError.code === 'storage/unauthorized') {
              console.error('Firebase Storage 권한 문제');
              alert(`파일 "${file.name}" 업로드 실패: Firebase Storage 권한 문제입니다.\n\n해결 방법:\n1. Firebase Console에서 Storage Rules 확인\n2. firebase-storage-rules-emergency.txt 파일의 규칙 사용\n3. FIREBASE_STORAGE_CHECK.md 파일 참조`);
              break;
            } else if (uploadError.code === 'storage/bucket-not-found') {
              console.error('Firebase Storage 버킷을 찾을 수 없음');
              alert(`파일 "${file.name}" 업로드 실패: Firebase Storage가 활성화되지 않았습니다.\n\n해결 방법:\n1. Firebase Console에서 Storage 활성화\n2. 프로젝트 설정 확인`);
              break;
            } else {
              console.error('알 수 없는 오류');
              alert(`파일 "${file.name}" 업로드에 실패했습니다:\n${uploadError.message || uploadError}\n\n오류 코드: ${uploadError.code}`);
              break;
            }
          }
        }
      }

      console.log('\n=== 업로드 완료 요약 ===');
      console.log('성공한 파일 수:', uploadedUrls.length);
      console.log('업로드된 URL들:', uploadedUrls);

      if (uploadedUrls.length > 0) {
        // 기존 이미지와 새로 업로드된 이미지 합치기
        setAccommodationInfo(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls],
        }));

        alert(`✅ ${uploadedUrls.length}개의 이미지가 성공적으로 업로드되었습니다!`);
      } else {
        console.warn('업로드된 파일이 없습니다.');
      }
    } catch (error: any) {
      console.error('이미지 업로드 중 오류:', error);
      alert(`이미지 업로드 중 오류가 발생했습니다:\n${error.message || error}`);
    } finally {
      setUploadingImages(false);
      // 파일 입력 초기화
      event.target.value = '';
      console.log('=== 이미지 업로드 함수 종료 ===');
    }
  };

  // 이미지 삭제 함수
  const handleImageDelete = async (imageUrl: string, index: number) => {
    if (window.confirm('이 이미지를 삭제하시겠습니까?')) {
      try {
        // URL에서 파일 경로 추출
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0]; // 쿼리 파라미터 제거
        const storagePath = `accommodation-images/${employerId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        console.log('삭제할 파일:', fileName);
        console.log('삭제할 경로:', storagePath);
        await deleteObject(storageRef);
        
        // 상태에서 이미지 제거
        setAccommodationInfo(prev => ({
          ...prev,
          images: prev.images?.filter((_, i) => i !== index) || [],
        }));
        
        alert('이미지가 삭제되었습니다.');
      } catch (error) {
        console.error('이미지 삭제 실패:', error);
        alert(`이미지 삭제 중 오류가 발생했습니다: ${error}`);
      }
    }
  };

  // 이미지 미리보기 함수
  const handleImagePreview = (imageUrl: string) => {
    setImagePreview(imageUrl);
  };

  const handleSave = async () => {
    if (!accommodationInfo.name || !accommodationInfo.description || !accommodationInfo.address) {
      alert('기숙사명, 소개, 주소는 필수 입력 항목입니다.');
      return;
    }

    try {
      setSaving(true);
      const accommodationData = {
        ...accommodationInfo,
        employerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accommodationInfo', employerId), accommodationData);
      alert('기숙사 정보가 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error('기숙사 정보 저장 실패:', error);
      alert('기숙사 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">🏠 기숙사 정보 관리</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-resort-500 mx-auto mb-4"></div>
            <p className="text-gray-600">기숙사 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 기본 정보</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기숙사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={accommodationInfo.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="기숙사명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기숙사 소개 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={accommodationInfo.description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors resize-none"
                    placeholder="기숙사의 특징, 환경, 장점 등을 소개해주세요..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기숙사 유형</label>
                  <select
                    name="type"
                    value={accommodationInfo.type || 'dormitory'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                  >
                    <option value="dormitory">기숙사</option>
                    <option value="apartment">아파트</option>
                    <option value="house">단독주택</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={accommodationInfo.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="기숙사 주소를 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">직장까지 거리</label>
                  <input
                    type="text"
                    name="distanceFromWorkplace"
                    value={accommodationInfo.distanceFromWorkplace || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="예: 도보 10분, 차량 5분"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">총 수용 인원</label>
                    <input
                      type="number"
                      name="capacity"
                      value={accommodationInfo.capacity || ''}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 입주 인원</label>
                    <input
                      type="number"
                      name="currentOccupancy"
                      value={accommodationInfo.currentOccupancy || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월세</label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={accommodationInfo.monthlyRent || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="월세 금액을 입력하세요"
                  />
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={accommodationInfo.isAvailable || false}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-resort-600 focus:ring-resort-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 block text-sm font-medium text-gray-900">
                    입주 가능
                  </label>
                </div>
              </div>

              {/* 연락처 및 시설 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📞 연락처 정보</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={accommodationInfo.contactPerson || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="기숙사 담당자명"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={accommodationInfo.contactPhone || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="02-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">공용시설</label>
                  <div className="space-y-3">
                    {[
                      '주차장', '엘리베이터', '헬스장', '독서실',
                      '커뮤니티룸', '정원/테라스', 'CCTV',
                      '세탁실', '공동주방', '휴게실', '야외공간',
                      '직원식당', '셔틀버스',
                    ].map((facility) => (
                      <label key={facility} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={accommodationInfo.facilities?.includes(facility) || false}
                          onChange={(e) => {
                            const currentFacilities = accommodationInfo.facilities || [];
                            if (e.target.checked) {
                              if (!currentFacilities.includes(facility)) {
                                setAccommodationInfo(prev => ({
                                  ...prev,
                                  facilities: [...currentFacilities, facility],
                                }));
                              }
                            } else {
                              setAccommodationInfo(prev => ({
                                ...prev,
                                facilities: currentFacilities.filter(f => f !== facility),
                              }));
                            }
                          }}
                          className="mr-3 h-4 w-4 text-resort-600 focus:ring-resort-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                                 

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기숙사 규칙</label>
                  <div className="space-y-2">
                    {accommodationInfo.rules?.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => handleArrayChange('rules', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                          placeholder="기숙사 규칙을 입력하세요"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('rules', index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('rules')}
                      className="flex items-center text-resort-600 hover:text-resort-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      규칙 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 방 타입 관리 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">🛏️ 방 타입 관리</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    기숙사에서 제공하는 방 종류와 가격 정보를 등록해주세요
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRoomType}
                  className="flex items-center px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  방 타입 추가
                </button>
              </div>

              <div className="space-y-4">
                {accommodationInfo.roomTypes && accommodationInfo.roomTypes.length > 0 ? (
                  accommodationInfo.roomTypes.map((room, index) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-900">방 타입 {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeRoomType(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                           방 타입 (복수 선택 가능) <span className="text-red-500">*</span>
                          </label>
                          <div className="space-y-2">
                            {['1인실', '2인실', '3인실', '4인실', '기타'].map((type) => (
                              <label key={type} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={room.facilities?.includes(type) || false}
                                  onChange={(e) => {
                                    const currentTypes = room.facilities || [];
                                   
                                    if (e.target.checked) {
                                      // 체크된 경우 추가
                                      if (!currentTypes.includes(type)) {
                                        currentTypes.push(type);
                                      }
                                    } else {
                                      // 체크 해제된 경우 제거
                                      const index = currentTypes.indexOf(type);
                                      if (index > -1) {
                                        currentTypes.splice(index, 1);
                                      }
                                    }
                                   
                                    handleRoomTypeChange(index, 'facilities', currentTypes);
                                  }}
                                  className="mr-2 h-4 w-4 text-resort-600 focus:ring-resort-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                          수용 인원 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={room.capacity}
                              onChange={(e) => handleRoomTypeChange(index, 'capacity', Number(e.target.value))}
                              min="1"
                              max="10"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                              placeholder="1"
                              required
                            />
                            <span className="absolute right-3 top-2 text-gray-500 text-sm">명</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                           월세
                          </label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`modalRentType-${index}`}
                                  checked={room.price === 0}
                                  onChange={() => handleRoomTypeChange(index, 'price', 0)}
                                  className="mr-2 h-4 w-4 text-resort-600 focus:ring-resort-500 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">무료</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`modalRentType-${index}`}
                                  checked={room.price > 0}
                                  onChange={() => handleRoomTypeChange(index, 'price', 1)}
                                  className="mr-2 h-4 w-4 text-resort-600 focus:ring-resort-500 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">유료</span>
                              </label>
                            </div>
                            {room.price > 0 && (
                              <div className="relative">
                                <input
                                  type="number"
                                  value={room.price === 1 ? '' : room.price}
                                  onChange={(e) => handleRoomTypeChange(index, 'price', Number(e.target.value))}
                                  min="1"
                                  step="10000"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                                  placeholder="월세 금액을 입력하세요"
                                />
                                <span className="absolute right-3 top-2 text-gray-500 text-sm">원</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                          가능한 방 수 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={room.available}
                              onChange={(e) => handleRoomTypeChange(index, 'available', Number(e.target.value))}
                              min="0"
                              max="50"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                              placeholder="0"
                              required
                            />
                            <span className="absolute right-3 top-2 text-gray-500 text-sm">개</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        방 설명 (선택사항)
                        </label>
                        <textarea
                          value={room.description}
                          onChange={(e) => handleRoomTypeChange(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors resize-none"
                          placeholder="방의 특징, 시설, 편의사항 등을 자세히 설명해주세요..."
                          maxLength={500}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">
                          예: 에어컨, 냉장고, 개별 화장실, 옷장 포함
                          </p>
                          <span className="text-xs text-gray-400">
                            {room.description.length}/500
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2">등록된 방 타입이 없습니다</p>
                    <p className="text-sm text-gray-400">위의 "방 타입 추가" 버튼을 클릭하여 방 정보를 등록해주세요</p>
                  </div>
                )}
              </div>
              
              {/* 방타입 요약 정보 */}
              {accommodationInfo.roomTypes && accommodationInfo.roomTypes.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">📊 방타입 요약</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">총 방 타입</p>
                      <p className="text-lg font-semibold text-resort-600">
                        {accommodationInfo.roomTypes.length}개
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">총 수용 가능 인원</p>
                      <p className="text-lg font-semibold text-resort-600">
                        {accommodationInfo.roomTypes.reduce((sum, room) => sum + ((room.capacity || 0) * (room.available || 0)), 0)}명
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">총 가능한 방 수</p>
                      <p className="text-lg font-semibold text-resort-600">
                        {accommodationInfo.roomTypes.reduce((sum, room) => sum + (room.available || 0), 0)}개
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 이미지 업로드 섹션 */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📸 기숙사 사진</h4>
              
              {/* 이미지 업로드 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기숙사 사진 업로드 (최대 5MB, JPG/PNG)
                </label>
                <div className="flex items-center space-x-4">
                  <label className={`flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingImages 
                      ? 'border-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'border-gray-300 hover:border-resort-500 hover:bg-gray-50'
                  }`}>
                    <div className="text-center">
                      {uploadingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-resort-500 mx-auto mb-2"></div>
                          <span className="text-sm text-gray-500">업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500">사진 추가</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                  </label>
                  <div className="text-sm text-gray-600">
                    <p>• 최대 5MB까지 업로드 가능</p>
                    <p>• JPG, PNG, GIF 파일 지원</p>
                    <p>• 여러 파일을 동시에 선택 가능</p>
                  </div>
                </div>
              </div>

              {/* 업로드된 이미지 목록 */}
              {accommodationInfo.images && accommodationInfo.images.length > 0 && (
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-3">업로드된 사진</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {accommodationInfo.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={imageUrl}
                            alt={`기숙사 사진 ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handleImagePreview(imageUrl)}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                            <button
                              type="button"
                              onClick={() => handleImagePreview(imageUrl)}
                              className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                            >
                              <Eye className="h-4 w-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleImageDelete(imageUrl, index)}
                              className="p-2 bg-red-500 bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이미지 미리보기 모달 */}
        {imagePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={imagePreview}
                alt="기숙사 사진 미리보기"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !accommodationInfo.name || !accommodationInfo.description || !accommodationInfo.address}
            className="px-6 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccommodationInfoModal; 