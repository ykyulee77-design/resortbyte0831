import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, getDocs, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Send, AlertCircle, User, MapPin, DollarSign, Clock, FileText, Eye } from 'lucide-react';
import { Resume, WorkType, PositiveReview, JobPost, Application } from '../types';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ApplicationPreview from '../components/ApplicationPreview';

const JobApplication: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [userResume, setUserResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [application, setApplication] = useState<Partial<Application>>({
    coverLetter: '', // 지원 동기 (선택)
    selectedWorkTypeIds: [] as string[], // 선택된 근무타입 ID들 (필수)
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // 공고 정보 가져오기
  useEffect(() => {
    const fetchJobPost = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        const jobDoc = await getDoc(doc(db, 'jobPosts', jobId));
        
        if (jobDoc.exists()) {
          const data = jobDoc.data();
          setJobPost({
            id: jobDoc.id,
            employerId: data.employerId,
            employerName: data.employerName,
            title: data.title,
            description: data.description,
            location: data.location,
            salary: data.salary,
            requirements: data.requirements || [],
            benefits: data.benefits || [],
            workSchedule: data.workSchedule,
            workTypes: data.workTypes || [],
            startDate: data.startDate?.toDate() || new Date(),
            isActive: data.isActive,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            applications: data.applications || [],
          });
        } else {
          setError('공고를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('공고 정보 가져오기 실패:', error);
        setError('공고 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPost();
  }, [jobId]);

  // 사용자 이력서 정보 가져오기
  useEffect(() => {
    const fetchUserResume = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserResume(userData.resume || {});
        }
      } catch (error) {
        console.error('사용자 이력서 가져오기 실패:', error);
      }
    };

    fetchUserResume();
  }, [user?.uid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'selectedWorkTypeIds') {
      const checked = (e.target as HTMLInputElement).checked;
      setApplication(prev => ({
        ...prev,
        selectedWorkTypeIds: checked 
          ? [...(prev.selectedWorkTypeIds || []), value]
          : (prev.selectedWorkTypeIds || []).filter(id => id !== value),
      }));
    } else {
      setApplication(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    }
  };

  // 이력서 완성도 검증
  const isResumeComplete = () => {
    if (!userResume) return false;
    
    const jobTypeValid = Array.isArray(userResume.jobType) 
      ? userResume.jobType.length > 0 
      : userResume.jobType && userResume.jobType.toString().trim() !== '';
    
    const requiredFields = [
      userResume.phone,
      userResume.birth,
      userResume.hourlyWage,
      userResume.preferredTimeType,
    ];
    
    const otherFieldsValid = requiredFields.every(field => 
      field && field.toString().trim() !== '',
    );
    
    return jobTypeValid && otherFieldsValid;
  };

  const isResumeFilled = isResumeComplete();

  // 지원 제출 함수
  const handleSubmitApplication = async () => {
    if (!user || !jobPost || !userResume) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    
    try {
      setError('');
      
      // 필수 항목 검증
      if (!application.selectedWorkTypeIds || application.selectedWorkTypeIds.length === 0) {
        throw new Error('최소 하나의 근무타입을 선택해주세요.');
      }
      
      // 무관 선택 시 모든 근무타입 ID로 변환
      let finalSelectedWorkTypeIds = application.selectedWorkTypeIds;
      if (application.selectedWorkTypeIds.includes('any')) {
        finalSelectedWorkTypeIds = jobPost.workTypes?.map(wt => wt.id) || [];
      }
      
      const applicationData = {
        jobPostId: jobPost.id,
        jobseekerId: user.uid,
        jobseekerName: user.displayName,
        employerId: jobPost.employerId,
        status: 'pending',
        appliedAt: serverTimestamp(),
        coverLetter: application.coverLetter || '',
        experience: '',
        education: userResume.education || '',
        availableStartDate: userResume.availableStartDate ? (() => {
          try {
            const date = new Date(userResume.availableStartDate as string);
            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            return null;
          }
        })() : null,
        skills: [],
        hourlyWage: userResume.hourlyWage || 0,
        message: '',
        selectedWorkTypeIds: finalSelectedWorkTypeIds,
        phone: userResume.phone || '',
        email: user.email || '',
        showEvaluations: userResume.showEvaluations || false,
        jobTitle: jobPost.title || '제목 없음',
        employerName: jobPost.employerName || jobPost.workplaceName || '회사명 없음',
        location: jobPost.location || '위치 정보 없음',
        salary: jobPost.salary,
      };
      
      const docRef = await addDoc(collection(db, 'applications'), applicationData);
      
      const successMessage = `🎉 지원이 성공적으로 완료되었습니다!\n\n공고: ${jobPost.title}\n지원일: ${new Date().toLocaleDateString('ko-KR')}\n\n지원 현황은 대시보드에서 확인하실 수 있습니다.`;
      alert(successMessage);
      navigate('/jobseeker-dashboard');
    } catch (error) {
      console.error('지원 실패:', error);
      throw error;
    }
  };

  // 미리보기 표시
  const handleShowPreview = () => {
    if (!isResumeFilled) {
      setError('이력서를 먼저 완성해주세요. 프로필 페이지에서 이력서를 작성할 수 있습니다.');
      return;
    }
    
    if (!jobPost) {
      setError('공고 정보를 불러올 수 없습니다.');
      return;
    }
    
    setShowPreview(true);
  };

  // 미리보기에서 지원 확인
  const handleConfirmApplication = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      await handleSubmitApplication();
      setShowPreview(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '지원 중 오류가 발생했습니다.';
      setError(errorMessage);
      alert(`지원 실패: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 미리보기 취소
  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  // 미리보기에서 수정
  const handleEditFromPreview = () => {
    setShowPreview(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-resort-500 mx-auto mb-4"></div>
          <p className="text-gray-600">공고 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">지원하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  if (!jobPost) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">공고를 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 공고가 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          뒤로 가기
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">지원하기</h1>
        <p className="text-gray-600">아래 공고에 지원하시겠습니까?</p>
      </div>

      {/* 이력서 완성도 상태 */}
      <div className={`mb-6 p-4 rounded-lg border ${
        isResumeFilled 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isResumeFilled ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <div>
              <h3 className={`font-medium ${
                isResumeFilled ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isResumeFilled ? '✅ 이력서 완성' : '⚠️ 이력서 미완성'}
              </h3>
              <p className={`text-sm ${
                isResumeFilled ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {isResumeFilled 
                  ? '이력서가 완성되었습니다. 지원서를 작성해주세요.' 
                  : '이력서를 먼저 완성해주세요. 프로필 페이지에서 작성할 수 있습니다.'
                }
              </p>
            </div>
          </div>
          {!isResumeFilled && (
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              이력서 작성하기
            </button>
          )}
        </div>
      </div>

      {/* 공고 정보 카드 */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{jobPost.title}</h2>
              <p className="text-gray-600 mb-4">{jobPost.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {jobPost.employerName}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {jobPost.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {jobPost.salary?.min?.toLocaleString()}원 ~ {jobPost.salary?.max?.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 지원 양식 */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">지원 정보 입력</h3>
          
          <form className="space-y-6">
            {/* 근무타입 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                근무타입 선택 *
              </label>
              <div className="space-y-3">
                {jobPost.workTypes && jobPost.workTypes.length > 0 ? (
                  <>
                    {/* 무관 옵션 */}
                    <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-blue-50">
                      <input
                        type="checkbox"
                        name="selectedWorkTypeIds"
                        value="any"
                        checked={application.selectedWorkTypeIds?.includes('any') || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            // 무관 선택 시 다른 모든 선택 해제
                            setApplication(prev => ({
                              ...prev,
                              selectedWorkTypeIds: ['any'],
                            }));
                          } else {
                            // 무관 해제
                            setApplication(prev => ({
                              ...prev,
                              selectedWorkTypeIds: prev.selectedWorkTypeIds?.filter(id => id !== 'any') || [],
                            }));
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">무관 (어떤 근무타입이든 가능)</div>
                        <div className="text-sm text-gray-600 mt-1">모든 근무타입에 지원 가능합니다</div>
                      </div>
                    </label>
                    
                    {/* 개별 근무타입 옵션들 */}
                    {jobPost.workTypes.map((workType) => (
                      <label key={workType.id} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="selectedWorkTypeIds"
                          value={workType.id}
                          checked={application.selectedWorkTypeIds?.includes(workType.id) || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              // 개별 선택 시 무관 해제하고 해당 항목 추가
                              setApplication(prev => ({
                                ...prev,
                                selectedWorkTypeIds: [
                                  ...(prev.selectedWorkTypeIds?.filter(id => id !== 'any') || []),
                                  workType.id,
                                ],
                              }));
                            } else {
                              // 개별 해제
                              setApplication(prev => ({
                                ...prev,
                                selectedWorkTypeIds: prev.selectedWorkTypeIds?.filter(id => id !== workType.id) || [],
                              }));
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{workType.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{workType.description}</div>
                          {workType.hourlyWage && (
                            <div className="text-sm text-blue-600 mt-1">
                              시급: {workType.hourlyWage.toLocaleString()}원
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </>
                ) : (
                  <p className="text-gray-500">등록된 근무타입이 없습니다.</p>
                )}
              </div>
            </div>

            {/* 지원 동기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원 동기 (선택)
              </label>
              <textarea
                name="coverLetter"
                value={application.coverLetter || ''}
                onChange={handleInputChange}
                rows={4}
                placeholder="이 공고에 지원하는 이유나 관련 경험을 간단히 작성해주세요."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* 지원 버튼 */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleShowPreview}
                disabled={!isResumeFilled || submitting}
                className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
                  !isResumeFilled || submitting
                    ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {!isResumeFilled ? '이력서 완성 필요' : '지원서 미리보기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 지원서 미리보기 모달 */}
      {showPreview && jobPost && userResume && (
        <ApplicationPreview
          jobPost={jobPost}
          resume={userResume}
          application={application}
          user={user}
          onConfirm={handleConfirmApplication}
          onCancel={handleCancelPreview}
          onEdit={handleEditFromPreview}
          isSubmitting={submitting}
        />
      )}

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          imageUrl={previewImage}
          imageName={previewImageName}
          onClose={() => {
            setPreviewImage(null);
            setPreviewImageName('');
          }}
        />
      )}
    </div>
  );
};

export default JobApplication; 