import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, Phone, Globe, FileText, Users, ArrowLeft, CheckCircle, User, Camera, Upload, Trash2, X } from 'lucide-react';
import AddressSearch, { Address } from './AddressSearch';
import NaverMapScript from './NaverMapScript';
import { uploadImage, deleteImage, compressImage } from '../utils/imageUpload';
import ImagePreviewModal from './ImagePreviewModal';

interface CompanyInfoFormProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ onComplete, onCancel }) => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: (user as any)?.companyName || '',
    companyAddress: (user as any)?.companyAddress || '',
    companyDetailAddress: (user as any)?.companyDetailAddress || '',
    companyPhone: (user as any)?.companyPhone || '',
    companyWebsite: (user as any)?.companyWebsite || '',
    businessNumber: (user as any)?.businessNumber || '',
    industry: (user as any)?.industry || '',
    companySize: (user as any)?.companySize || '',
    description: (user as any)?.description || '',
    culture: (user as any)?.culture || '',
    benefits: (user as any)?.benefits || [],
    images: (user as any)?.images || [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (benefitToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((benefit: string) => benefit !== benefitToRemove),
    }));
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await compressImage(file);
        const result = await uploadImage(compressedFile, {
          folder: `company-images/${user?.uid}`,
        });
        return result.url;
      });

      const uploadedResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadedResults.filter((url): url is string => url !== undefined);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setError('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploadingImages(false);
    }
  };

  // 이미지 삭제 처리
  const handleImageDelete = async (imageUrl: string, index: number) => {
    try {
      await deleteImage(imageUrl);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_: string, i: number) => i !== index),
      }));
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      setError('이미지 삭제에 실패했습니다.');
    }
  };

  // 이미지 미리보기 처리
  const handleImagePreview = (imageUrl: string, description?: string) => {
    setPreviewImage(imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('CompanyInfoForm - 폼 제출 시작:', e.type);
    setError('');

    // 필수 필드 검증
    if (!formData.companyName || !formData.companyAddress || !formData.companyPhone) {
      setError('회사명, 주소, 연락처는 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);

      // 회사 정보 업데이트 (undefined 값 필터링)
      const updateData = Object.fromEntries(
        Object.entries({
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyDetailAddress: formData.companyDetailAddress,
          companyPhone: formData.companyPhone,
          companyWebsite: formData.companyWebsite,
          businessNumber: formData.businessNumber,
          industry: formData.industry,
          companySize: formData.companySize,
          description: formData.description,
          culture: formData.culture,
          benefits: formData.benefits,
          images: formData.images,
        }).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      console.log('CompanyInfoForm - 저장할 데이터:', updateData);
      await updateUserProfile(updateData);
      console.log('CompanyInfoForm - 데이터 저장 완료');

      // 완료 콜백 호출 또는 대시보드로 이동
      if (onComplete) {
        onComplete();
      } else {
        navigate('/employer-dashboard');
      }
    } catch (error: any) {
      console.error('회사 정보 저장 실패:', error);
      setError('회사 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="bg-blue-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <Building className="w-8 h-8 mr-3" />
                  리조트 회사 등록
                </h1>
                <p className="text-blue-100 mt-2">
                  담당자 가입이 완료되었습니다. 이제 회사 정보를 입력하여 리조트 등록을 완성해주세요
                </p>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex items-center px-4 py-2 text-blue-200 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  취소
                </button>
              )}
            </div>
          </div>

          {/* 폼 */}
          <div className="px-6 py-8">
            {/* 담당자 정보 섹션 */}
            <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">담당자 정보</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900">
                    {user?.displayName || user?.contactPerson || '정보 없음'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900">
                    {user?.email || '정보 없음'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900">
                    {user?.contactPhone || '정보 없음'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    역할
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900">
                    리조트 담당자
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 회사 정보 섹션 제목 */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center mb-6">
                  <Building className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">회사 정보</h3>
                </div>
              </div>

              {/* 회사명 */}
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  회사명 *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="리조트명 또는 회사명을 입력하세요"
                />
              </div>

              {/* 회사 주소 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 회사 주소 *
                </label>
                <AddressSearch
                  onAddressSelect={(address: Address) => {
                    console.log('CompanyInfoForm - 주소 선택됨:', address);
                    setFormData(prev => ({
                      ...prev,
                      companyAddress: address.address,
                      companyDetailAddress: address.detailAddress || '',
                    }));
                    // 주소 선택 후 자동 제출 방지 - 사용자가 명시적으로 "리조트 등록 완료" 버튼을 클릭해야 함
                  }}
                  onInputChange={(text: string) => {
                    console.log('CompanyInfoForm - 주소 입력 중:', text);
                    setFormData(prev => ({ ...prev, companyAddress: text }));
                  }}
                  value={formData.companyAddress || ''}
                  placeholder="도로명주소나 건물명을 입력하세요 (예: 선릉로 513, 강남구청)"
                  showDetailAddress={true}
                  detailAddressPlaceholder="상세주소 (동/호수, 사무실 번호 등)"
                  className="bg-white"
                />
              </div>

              {/* 회사 연락처 */}
              <div>
                <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                  회사 연락처 *
                </label>
                <input
                  id="companyPhone"
                  name="companyPhone"
                  type="tel"
                  required
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="회사 대표 연락처를 입력하세요"
                />
              </div>

              {/* 웹사이트 */}
              <div>
                <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                  회사 웹사이트
                </label>
                <input
                  id="companyWebsite"
                  name="companyWebsite"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>

              {/* 사업자등록번호 */}
              <div>
                <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700">
                  사업자등록번호
                </label>
                <input
                  id="businessNumber"
                  name="businessNumber"
                  type="text"
                  value={formData.businessNumber}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="123-45-67890"
                />
              </div>

              {/* 업종 */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  업종
                </label>
                <input
                  id="industry"
                  name="industry"
                  type="text"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="예: 관광업, 숙박업, 레저업"
                />
              </div>

              {/* 회사 규모 */}
              <div>
                <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                  회사 규모
                </label>
                <select
                  id="companySize"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">선택하세요</option>
                  <option value="1-10">1-10명</option>
                  <option value="11-50">11-50명</option>
                  <option value="51-200">51-200명</option>
                  <option value="201-500">201-500명</option>
                  <option value="500+">500명 이상</option>
                </select>
              </div>

              {/* 회사 소개 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  회사 소개
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="회사에 대한 소개를 작성해주세요"
                />
              </div>

              {/* 회사 문화 */}
              <div>
                <label htmlFor="culture" className="block text-sm font-medium text-gray-700">
                  회사 문화
                </label>
                <textarea
                  id="culture"
                  name="culture"
                  rows={3}
                  value={formData.culture}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="회사의 문화와 가치관을 설명해주세요"
                />
              </div>

              {/* 복리후생 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복리후생
                </label>
                <div className="space-y-3">
                  {/* 복리후생 추가 입력 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="복리후생 항목을 입력하세요 (예: 4대보험, 휴가비 지원)"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      추가
                    </button>
                  </div>
                  
                  {/* 복리후생 목록 */}
                  {formData.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((benefit: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
                        >
                          {benefit}
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(benefit)}
                            className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 회사 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회사 이미지
                </label>
                <div className="space-y-4">
                  {/* 이미지 업로드 버튼 */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingImages ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm text-gray-500">업로드 중...</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">클릭하여 이미지 업로드</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, JPEG (최대 10MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                      />
                    </label>
                  </div>

                  {/* 업로드된 이미지 목록 */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {formData.images.map((image: string, index: number) => (
                        <div key={index} className="relative group">
                          <div 
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
                            onClick={() => handleImagePreview(image, `회사 이미지 ${index + 1}`)}
                          >
                            <img
                              src={image}
                              alt={`회사 이미지 ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageDelete(image, index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      담당자 가입 완료!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        이제 회사 정보를 입력하면 리조트 등록이 완료되고, 구인 공고를 등록하고 크루를 모집할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      리조트 등록 완료
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <NaverMapScript />
      
      {/* 이미지 미리보기 모달 */}
      <ImagePreviewModal
        isOpen={previewImage !== null}
        imageUrl={previewImage || ''}
        onClose={() => setPreviewImage(null)}
        imageName="회사 이미지"
      />
    </div>
  );
};

export default CompanyInfoForm;
