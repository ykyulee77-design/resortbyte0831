import React, { useState, useEffect } from 'react';
import { X, Globe, Building, Users, Calendar, Plus, Trash2, Upload, Image, Eye } from 'lucide-react';
import { CompanyInfo } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadImage, deleteImage, validateImageFile, compressImage } from '../utils/imageUpload';
import ImagePreviewModal from './ImagePreviewModal';

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerId: string;
  companyName: string;
}

const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({
  isOpen,
  onClose,
  employerId,
  companyName
}) => {
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfo>>({
    name: companyName,
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
    region: '',
    dormitory: false,
    dormitoryFacilities: [],
    salaryRange: '',
    environment: '도심',
    workTimeType: '무관',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  // 기존 회사 정보 불러오기
  useEffect(() => {
    if (isOpen && employerId) {
      loadCompanyInfo();
    }
  }, [isOpen, employerId]);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'companyInfo', employerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CompanyInfo;
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('회사 정보 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBenefitChange = (index: number, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      benefits: prev.benefits?.map((benefit, i) => i === index ? value : benefit) || []
    }));
  };

  const addBenefit = () => {
    setCompanyInfo(prev => ({
      ...prev,
      benefits: [...(prev.benefits || []), '']
    }));
  };

  const removeBenefit = (index: number) => {
    setCompanyInfo(prev => ({
      ...prev,
      benefits: prev.benefits?.filter((_, i) => i !== index) || []
    }));
  };

  // 숙소 시설 체크박스 옵션
  const dormitoryFacilityOptions = [
    '와이파이', '에어컨', '세탁기', '개인욕실', '공용주방', 'TV', '냉장고', '책상', '옷장', '난방'
  ];

  // handleDormitoryFacilitiesChange 함수 추가
  const handleDormitoryFacilitiesChange = (facility: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      dormitoryFacilities: prev.dormitoryFacilities?.includes(facility)
        ? prev.dormitoryFacilities.filter(f => f !== facility)
        : [...(prev.dormitoryFacilities || []), facility]
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
            uploadedBy: employerId,
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
        setCompanyInfo(prev => ({
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

    try {
      // 이미지 삭제
      const result = await deleteImage(imageUrl);
      
      if (result.success) {
        // 상태에서 이미지 제거
        setCompanyInfo(prev => ({
          ...prev,
          images: prev.images?.filter((_, i) => i !== index) || []
        }));
        
        alert('이미지가 삭제되었습니다.');
      } else {
        alert('이미지 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 이미지 미리보기 함수
  const handleImagePreview = (imageUrl: string, imageName?: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageName(imageName || '회사 이미지');
  };

  const handleSave = async () => {
    if (!companyInfo.name || !companyInfo.description) {
      alert('회사명과 회사 소개는 필수 입력 항목입니다.');
      return;
    }

    try {
      setSaving(true);
      const companyData = {
        ...companyInfo,
        employerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'companyInfo', employerId), companyData);
      alert('회사 정보가 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error('회사 정보 저장 실패:', error);
      alert('회사 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">🏢 회사 소개 관리</h3>
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
            <p className="text-gray-600">회사 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 기본 정보</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={companyInfo.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사 소개 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={companyInfo.description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors resize-none"
                    placeholder="회사의 비전, 미션, 주요 사업 분야 등을 소개해주세요..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    홈페이지
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      name="website"
                      value={companyInfo.website || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">업종</label>
                  <input
                    type="text"
                    name="industry"
                    value={companyInfo.industry || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="예: 관광업, 서비스업"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">회사 규모</label>
                  <select
                    name="companySize"
                    value={companyInfo.companySize || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                  >
                    <option value="">규모 선택</option>
                    <option value="1-10명">1-10명</option>
                    <option value="11-50명">11-50명</option>
                    <option value="51-200명">51-200명</option>
                    <option value="201-500명">201-500명</option>
                    <option value="500명 이상">500명 이상</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설립년도</label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={companyInfo.foundedYear || ''}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="예: 2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                  <input
                    type="text"
                    name="address"
                    value={companyInfo.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="회사 주소를 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처 이메일</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={companyInfo.contactEmail || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처 전화번호</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={companyInfo.contactPhone || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="02-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={companyInfo.contactPerson || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="담당자 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">회사 문화</label>
                  <textarea
                    name="culture"
                    value={companyInfo.culture || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors resize-none"
                    placeholder="회사의 문화, 가치관, 근무 환경 등을 설명해주세요..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">복리후생</label>
                  <div className="space-y-2">
                    {companyInfo.benefits?.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => handleBenefitChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                          placeholder="복리후생 항목을 입력하세요"
                        />
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="flex items-center text-resort-600 hover:text-resort-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      복리후생 추가
                    </button>
                  </div>
                </div>

                {/* 회사 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">회사 이미지</label>
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

                    {/* 업로드 중 표시 */}
                    {uploadingImages && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-resort-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">이미지 업로드 중...</p>
                      </div>
                    )}

                    {/* 업로드된 이미지 목록 */}
                    {companyInfo.images && companyInfo.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {companyInfo.images.map((imageUrl, index) => (
                          <div key={index} className="relative group cursor-pointer">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={`회사 이미지 ${index + 1}`}
                                className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                onClick={() => handleImagePreview(imageUrl, `회사 이미지 ${index + 1}`)}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                                <button
                                  onClick={() => handleImagePreview(imageUrl, `회사 이미지 ${index + 1}`)}
                                  className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                                  title="미리보기"
                                >
                                  <Eye className="h-4 w-4 text-gray-700" />
                                </button>
                                <button
                                  onClick={() => handleImageDelete(imageUrl, index)}
                                  className="p-2 bg-red-500 bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 회사 조건 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🏢 회사 조건</h4>
                
                {/* 지역 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
                  <input
                    type="text"
                    name="region"
                    value={companyInfo.region || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="예: 강원도 평창"
                  />
                </div>

                {/* 기숙사 제공 여부 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="dormitory"
                    checked={!!companyInfo.dormitory}
                    onChange={e => setCompanyInfo(prev => ({ ...prev, dormitory: e.target.checked }))}
                    className="h-4 w-4 text-resort-600 border-gray-300 rounded"
                    id="dormitory-checkbox"
                  />
                  <label htmlFor="dormitory-checkbox" className="text-sm font-medium text-gray-700">기숙사 제공</label>
                </div>

                {/* 숙소 시설 */}
                {companyInfo.dormitory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">숙소 시설</label>
                    <div className="flex flex-wrap gap-2">
                      {dormitoryFacilityOptions.map(option => (
                        <label key={option} className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={companyInfo.dormitoryFacilities?.includes(option) || false}
                            onChange={() => handleDormitoryFacilitiesChange(option)}
                            className="h-4 w-4 text-resort-600 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 급여 범위 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">급여 범위</label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={companyInfo.salaryRange || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                    placeholder="예: 200~250만원"
                  />
                </div>

                {/* 주변 환경 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">주변 환경</label>
                  <select
                    name="environment"
                    value={companyInfo.environment || '도심'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                  >
                    <option value="도심">도심</option>
                    <option value="준생활권">준생활권</option>
                    <option value="외진곳">외진곳</option>
                  </select>
                </div>

                {/* 근무타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">근무타입</label>
                  <select
                    name="workTimeType"
                    value={companyInfo.workTimeType || '무관'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-resort-500 transition-colors"
                  >
                                         <option value="무관">무관</option>
                     <option value="주간 근무타입">주간 근무타입</option>
                     <option value="야간 근무타입">야간 근무타입</option>
                     <option value="주말근무타입">주말근무타입</option>
                     <option value="주중근무타입">주중근무타입</option>
                  </select>
                </div>
              </div>
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
            disabled={saving || !companyInfo.name || !companyInfo.description}
            className="px-6 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
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

export default CompanyInfoModal; 