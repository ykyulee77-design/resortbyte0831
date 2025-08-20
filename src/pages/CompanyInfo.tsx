import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CompanyInfo } from '../types';
import { Building, MapPin, Phone, Mail, Globe, Users, Calendar, Home, Star, CheckCircle, Edit, Save, X, Plus, Trash2, Upload, Eye } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import AddressSearch, { Address } from '../components/AddressSearch';
import { uploadImage, deleteImage, validateImageFile, compressImage } from '../utils/imageUpload';
import ImagePreviewModal from '../components/ImagePreviewModal';

const CompanyInfoPage: React.FC = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const [customDormitoryFacility, setCustomDormitoryFacility] = useState<string>('');

  // URL 파라미터로 수정 모드 확인
  const shouldEdit = searchParams.get('edit') === 'true';

  const fetchCompanyInfo = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      // 1. companyInfo 컬렉션에서 회사 정보 가져오기
      const ref = doc(db, 'companyInfo', employerId);
      const snap = await getDoc(ref);
      
      let companyData: any = {};
      
      if (snap.exists()) {
        companyData = { id: snap.id, ...snap.data() } as CompanyInfo;
      } else {
        // 새로 생성할 경우 기본값 설정
        companyData = {
          id: '',
          employerId: employerId,
          name: '',
          description: '',
          website: '',
          industry: '',
          companySize: '',
          foundedYear: undefined,
          benefits: [],
          culture: '',
          images: [],
          contactEmail: '',
          contactPhone: '',
          contactPerson: '',
          address: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          region: ''
        };
      }

      // 2. users 컬렉션에서 이메일 정보 가져오기
      try {
        const userRef = doc(db, 'users', employerId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // 이메일 정보가 있으면 companyData에 추가
          if (userData.email) {
            companyData.contactEmail = userData.email;
          }
        }
      } catch (userError) {
        console.error('사용자 정보 가져오기 실패:', userError);
      }

      setCompanyInfo(companyData);
      setFormData(companyData);
      
      // URL 파라미터에 따라 수정 모드로 전환
      if (shouldEdit && isOwner) {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('회사 정보 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, [employerId]);

  // 현재 사용자가 이 회사의 소유자인지 확인
  const isOwner = user?.uid === employerId;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }));
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('선택된 파일이 없습니다.');
      return;
    }

    console.log(`이미지 업로드 시작: ${files.length}개 파일 선택됨`);
    
    try {
      setUploadingImages(true);
      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        console.log(`파일 처리 중: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // 파일 검증
        const validation = validateImageFile(file);
        if (!validation.valid) {
          console.error(`파일 검증 실패: ${file.name} - ${validation.error}`);
          alert(`파일 "${file.name}": ${validation.error}`);
          continue;
        }
        console.log(`파일 검증 통과: ${file.name}`);

        // 이미지 압축 (필요시)
        let processedFile = file;
        if (file.size > 1024 * 1024) { // 1MB 이상인 경우 압축
          console.log(`이미지 압축 시작: ${file.name}`);
          try {
            processedFile = await compressImage(file, 1920);
            console.log(`이미지 압축 완료: ${file.name}`);
          } catch (compressError) {
            console.error('이미지 압축 실패:', compressError);
            // 압축 실패시 원본 파일 사용
          }
        }

        // 이미지 업로드
        console.log(`Firebase Storage 업로드 시작: ${file.name}`);
        const result = await uploadImage(processedFile, {
          folder: 'company-images',
          metadata: {
            uploadedBy: employerId || '',
            uploadType: 'company-info',
            originalName: file.name
          }
        });

        if (result.success && result.url) {
          console.log(`업로드 성공: ${file.name} -> ${result.url}`);
          uploadedUrls.push(result.url);
        } else {
          console.error(`업로드 실패: ${file.name} - ${result.error}`);
          alert(`파일 "${file.name}" 업로드에 실패했습니다: ${result.error}`);
        }
      }

      // 업로드된 이미지들을 기존 이미지 배열에 추가
      if (uploadedUrls.length > 0) {
        console.log(`업로드 완료: ${uploadedUrls.length}개 파일 성공`);
        setFormData((prev: any) => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls]
        }));
        alert(`${uploadedUrls.length}개 이미지가 성공적으로 업로드되었습니다.`);
      } else {
        console.log('업로드된 파일이 없습니다.');
      }

    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setUploadingImages(false);
      console.log('이미지 업로드 프로세스 완료');
    }
  };

  // 이미지 삭제 함수
  const handleImageDelete = async (imageUrl: string, index: number) => {
    if (!window.confirm('이 이미지를 삭제하시겠습니까?')) return;

    console.log(`이미지 삭제 시작: index=${index}`);
    console.log(`이미지 URL: ${imageUrl}`);
    console.log(`이미지 URL 타입: ${typeof imageUrl}`);
    console.log(`이미지 URL 길이: ${imageUrl?.length || 0}`);

    // 빈 이미지 항목인지 확인
    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'undefined' || imageUrl === 'null') {
      console.log('빈 이미지 항목 감지, UI에서만 제거합니다.');
      
      // 상태에서 이미지 제거 (Firebase Storage 삭제 없이)
      setFormData((prev: any) => {
        const newImages = prev.images?.filter((_: string, i: number) => i !== index) || [];
        console.log(`빈 이미지 항목 제거: ${prev.images?.length}개 -> ${newImages.length}개`);
        return {
          ...prev,
          images: newImages
        };
      });
      
      alert('빈 이미지 항목이 제거되었습니다.');
      return;
    }

    try {
      // 실제 이미지인 경우 Firebase Storage에서 삭제
      const result = await deleteImage(imageUrl);
      
      if (result.success) {
        console.log('Firebase Storage에서 이미지 삭제 성공');
        
        // 상태에서 이미지 제거
        setFormData((prev: any) => {
          const newImages = prev.images?.filter((_: string, i: number) => i !== index) || [];
          console.log(`이미지 배열 업데이트: ${prev.images?.length}개 -> ${newImages.length}개`);
          return {
            ...prev,
            images: newImages
          };
        });
        
        alert('이미지가 삭제되었습니다.');
      } else {
        console.error('Firebase Storage에서 이미지 삭제 실패:', result.error);
        alert('이미지 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('이미지 삭제 중 예외 발생:', error);
      alert('이미지 삭제 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  // 이미지 미리보기 함수
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '회사 이미지');
  };

  const handleSave = async () => {
    if (!employerId) return;
    
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date()
      };

      if (companyInfo?.id) {
        // 기존 데이터 업데이트
        await updateDoc(doc(db, 'companyInfo', employerId), dataToSave);
      } else {
        // 새 데이터 생성
        await setDoc(doc(db, 'companyInfo', employerId), {
          ...dataToSave,
          createdAt: new Date()
        });
      }

      await fetchCompanyInfo();
      setIsEditing(false);
      
      // 저장 후 대시보드로 리다이렉트
      navigate('/employer-dashboard');
    } catch (error) {
      console.error('회사 정보 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(companyInfo || {});
    setIsEditing(false);
  };

  if (loading) return <LoadingSpinner />;
  
  // 데이터가 없어도 기본 구조는 표시하되, 데이터는 공란으로 처리
  const displayInfo = formData;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? (
              <input
                type="text"
                value={displayInfo.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                placeholder="회사명을 입력하세요"
              />
            ) : (
              displayInfo.name || '회사명 미등록'
            )}
          </h1>
          <div className="flex items-center text-gray-600">
            <Building className="h-4 w-4 mr-1" />
            <span>
              {isEditing ? (
                <input
                  type="text"
                  value={displayInfo.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="업종"
                />
              ) : (
                displayInfo.industry || '업종 미등록'
              )}
            </span>
            <span className="mx-2">•</span>
            <Users className="h-4 w-4 mr-1" />
            <span>
              {isEditing ? (
                <input
                  type="text"
                  value={displayInfo.companySize || ''}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="회사 규모"
                />
              ) : (
                displayInfo.companySize || '규모 미등록'
              )}
            </span>
          </div>
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
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </button>
              )}
            </>
          )}
          <Link to="/jobs" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            목록으로
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 회사 소개 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">회사 소개</h2>
            <p className="text-gray-800 leading-7 whitespace-pre-wrap">
              {isEditing ? (
                <textarea
                  value={displayInfo.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full h-full bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="회사 소개를 입력하세요"
                />
              ) : (
                displayInfo.description || '회사 소개가 등록되지 않았습니다.'
              )}
            </p>
          </div>

          {/* 회사 이미지 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">회사 이미지</h2>
            {isEditing ? (
              <div className="space-y-4">
                {/* 이미지 업로드 버튼 */}
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                    uploadingImages 
                      ? 'border-orange-300 bg-orange-50 cursor-not-allowed' 
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'
                  }`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                          <p className="mb-2 text-sm text-orange-600 font-semibold">업로드 중...</p>
                          <p className="text-xs text-orange-500">잠시만 기다려주세요</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG, HEIC (최대 10MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                  </label>
                </div>

                {/* 업로드된 이미지 목록 */}
                {displayInfo.images && displayInfo.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {displayInfo.images.map((image: string, index: number) => {
                      // 빈 이미지 항목인지 확인
                      const isEmptyImage = !image || image.trim() === '' || image === 'undefined' || image === 'null';
                      
                      return (
                        <div key={index} className="relative group cursor-pointer">
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {isEmptyImage ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <div className="text-center">
                                  <div className="text-gray-400 text-4xl mb-2">📷</div>
                                  <p className="text-gray-500 text-sm">빈 이미지</p>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={image}
                                alt={`회사 이미지 ${index + 1}`}
                                className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                              {!isEmptyImage && (
                                <button
                                  onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}
                                  className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                                  title="미리보기"
                                >
                                  <Eye className="h-4 w-4 text-gray-700" />
                                </button>
                              )}
                              <button
                                onClick={() => handleImageDelete(image, index)}
                                className="p-2 bg-red-500 bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                                title={isEmptyImage ? "빈 항목 삭제" : "이미지 삭제"}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayInfo.images && displayInfo.images.length > 0 ? (
                  displayInfo.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}>
                      <img
                        src={image}
                        alt={`회사 이미지 ${index + 1}`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">등록된 회사 이미지가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 복리후생 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">복리후생</h2>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayInfo.benefits && displayInfo.benefits.length > 0 ? (
                  displayInfo.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                        className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                        placeholder="복리후생 항목"
                      />
                      <button
                        onClick={() => removeArrayItem('benefits', index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="항목 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">등록된 복리후생 정보가 없습니다.</p>
                )}
                <button
                  onClick={() => addArrayItem('benefits')}
                  className="col-span-full md:col-span-1 bg-green-100 text-green-600 rounded-lg p-3 flex items-center justify-center hover:bg-green-200"
                >
                  <Plus className="h-6 w-6 mr-2" />
                  복리후생 항목 추가
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayInfo.benefits && displayInfo.benefits.length > 0 ? (
                  displayInfo.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-gray-800">{benefit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">등록된 복리후생 정보가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 회사 문화 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">회사 문화</h2>
            <p className="text-gray-800 leading-7">
              {isEditing ? (
                <textarea
                  value={displayInfo.culture || ''}
                  onChange={(e) => handleInputChange('culture', e.target.value)}
                  className="w-full h-full bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="회사 문화를 입력하세요"
                />
              ) : (
                displayInfo.culture || '회사 문화 정보가 등록되지 않았습니다.'
              )}
            </p>
          </div>



          {/* 기숙사 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              기숙사 정보
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">기숙사 제공</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <select
                        value={displayInfo.dormitory ? '제공' : '미제공'}
                        onChange={(e) => handleInputChange('dormitory', e.target.value === '제공')}
                        className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="제공">제공</option>
                        <option value="미제공">미제공</option>
                      </select>
                    ) : (
                      displayInfo.dormitory ? '제공' : '미제공'
                    )}
                  </div>
                </div>
                {displayInfo.dormitory && (
                  <Link
                    to={`/accommodation/${employerId}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    기숙사 상세정보
                  </Link>
                )}
              </div>
              
              {displayInfo.dormitory && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">기숙사 시설</div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
                        {[
                          '주차장', '엘리베이터', '헬스장', '독서실',
                          '커뮤니티룸', '정원/테라스', 'CCTV',
                          '세탁실', '공동주방', '휴게실', '야외공간',
                          '직원식당', '셔틀버스'
                        ].map((facility) => (
                          <label key={facility} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(displayInfo.dormitoryFacilities || []).includes(facility)}
                              onChange={(e) => {
                                const current = displayInfo.dormitoryFacilities || [];
                                if (e.target.checked) {
                                  if (!current.includes(facility)) {
                                    handleInputChange('dormitoryFacilities', [...current, facility]);
                                  }
                                } else {
                                  handleInputChange('dormitoryFacilities', current.filter((f: string) => f !== facility));
                                }
                              }}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{facility}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 mr-3">기타</span>
                        <input
                          type="text"
                          value={customDormitoryFacility}
                          onChange={(e) => setCustomDormitoryFacility(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = customDormitoryFacility.trim();
                              if (!val) return;
                              const current = displayInfo.dormitoryFacilities || [];
                              if (!current.includes(val)) {
                                handleInputChange('dormitoryFacilities', [...current, val]);
                              }
                              setCustomDormitoryFacility('');
                            }
                          }}
                          onBlur={() => {
                            const val = customDormitoryFacility.trim();
                            if (!val) return;
                            const current = displayInfo.dormitoryFacilities || [];
                            if (!current.includes(val)) {
                              handleInputChange('dormitoryFacilities', [...current, val]);
                            }
                            setCustomDormitoryFacility('');
                          }}
                          placeholder="기타 항목 직접 입력"
                          className="flex-1 p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    (displayInfo.dormitoryFacilities && displayInfo.dormitoryFacilities.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {displayInfo.dormitoryFacilities.map((facility: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            {facility}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">등록된 기숙사 시설이 없습니다.</p>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
            <div className="space-y-4">
              {displayInfo.foundedYear && (
                <div>
                  <div className="text-sm font-medium text-gray-700">설립년도</div>
                  <div className="text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        value={displayInfo.foundedYear || ''}
                        onChange={(e) => handleInputChange('foundedYear', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="예시: 2000"
                      />
                    ) : (
                      displayInfo.foundedYear + '년'
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-700">업종</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="업종을 입력하세요"
                    />
                  ) : (
                    displayInfo.industry || '업종 미등록'
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">회사 규모</div>
                <div className="text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayInfo.companySize || ''}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="회사 규모를 입력하세요"
                    />
                  ) : (
                    displayInfo.companySize || '규모 미등록'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">연락처</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="주소를 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.address || '주소 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="연락처를 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.contactPhone || '연락처 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="email"
                    value={displayInfo.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="이메일을 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.contactEmail || '이메일 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="text"
                    value={displayInfo.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="담당자를 입력하세요"
                  />
                ) : (
                  <span className="text-gray-800">{displayInfo.contactPerson || '담당자 미등록'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-gray-500 mr-3" />
                {isEditing ? (
                  <input
                    type="url"
                    value={displayInfo.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-grow"
                    placeholder="웹사이트 URL을 입력하세요"
                  />
                ) : (
                  displayInfo.website ? (
                    <a
                      href={displayInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {displayInfo.website}
                    </a>
                  ) : (
                    <span className="text-gray-800">웹사이트 미등록</span>
                  )
                )}
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

export default CompanyInfoPage;
