import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, getDocs, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Send, AlertCircle, User, MapPin, DollarSign, Clock, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Resume, WorkType, PositiveReview } from '../types';

interface JobPost {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  location: string;
  salary: { min: number; max: number; type: string };
  requirements: string[];
  benefits: string[];
  workSchedule: { days: string[]; hours: string };
  workTypes?: WorkType[];
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  applications: any[];
}

const JobApplication: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedWorkTypeId, setExpandedWorkTypeId] = useState<string | null>(null);
  
  const [application, setApplication] = useState({
    coverLetter: '', // 지원 동기 및 관련 경험 (선택)
    selectedWorkTypeIds: [] as string[] // 선택된 근무타입 ID들 (필수)
  });

  // 모달 관련 상태 제거
  const [resumeEdit, setResumeEdit] = useState<Resume>(user?.resume || {});
  const [resumeSaving, setResumeSaving] = useState(false);
  const [evaluations, setEvaluations] = useState<PositiveReview[]>([]);
  const [showEvaluations, setShowEvaluations] = useState(false);

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
            applications: data.applications || []
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

  // 사용자 이력서 정보 및 평가 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setResumeEdit(userData.resume || {});
        }

        // 평가 정보 가져오기
        const evaluationsQuery = collection(db, 'positiveReviews');
        const evaluationsSnapshot = await getDocs(evaluationsQuery);
        const evaluationsData = evaluationsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as PositiveReview))
          .filter(review => 
            review.jobseekerId === user.uid && 
            review.isPublic
          );
        setEvaluations(evaluationsData);
      } catch (error) {
        console.error('사용자 데이터 가져오기 실패:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'selectedWorkTypeIds') {
      // 체크박스 처리
      const checked = (e.target as HTMLInputElement).checked;
      setApplication(prev => ({
        ...prev,
        selectedWorkTypeIds: checked 
          ? [...prev.selectedWorkTypeIds, value]
          : prev.selectedWorkTypeIds.filter(id => id !== value)
      }));
    } else {
      // 기존 입력 처리
      setApplication(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setResumeEdit(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleResumeSaveAndApply = async () => {
    if (!user) return;
    setResumeSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { resume: resumeEdit });
      window.location.reload(); // 강제 새로고침으로 user 최신화
    } catch (e) {
      alert('이력서 저장 실패');
    } finally {
      setResumeSaving(false);
    }
  };

  // 지원 제출 함수 분리
  const handleSubmitLatent = async () => {
    if (!user || !jobPost) return;
    try {
      setSubmitting(true);
      setError('');
      const applicationData = {
        jobPostId: jobPost.id,
        jobseekerId: user.uid,
        jobseekerName: user.displayName,
        status: 'pending',
        appliedAt: serverTimestamp(),
        coverLetter: application.coverLetter,
        experience: '', // 통합된 지원 동기에 포함
        education: resumeEdit.education || '', // 이력서에서 자동 가져오기
        availableStartDate: resumeEdit.availableStartDate ? new Date(resumeEdit.availableStartDate as string) : null, // 이력서에서 자동 가져오기
        skills: [], // 통합된 지원 동기에 포함
        hourlyWage: resumeEdit.hourlyWage || 0, // 시급 (원)
        message: '', // 추가 정보는 제거
        selectedWorkTypeIds: application.selectedWorkTypeIds, // 선택된 근무타입 ID들 배열로 변경
        // 연락처 정보 추가
        phone: resumeEdit.phone || '',
        email: user.email || '',
        // 평가 노출 여부 추가
        showEvaluations: resumeEdit.showEvaluations || false,
        // 지원 당시 공고 정보도 함께 저장
        jobTitle: jobPost.title,
        employerName: jobPost.employerName,
        location: jobPost.location,
        salary: jobPost.salary
      };
      await addDoc(collection(db, 'applications'), applicationData);
      alert('지원이 성공적으로 완료되었습니다!');
              navigate('/dashboard');
      window.location.reload();
    } catch (error) {
      console.error('지원 실패:', error);
      setError('지원 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const isResumeFilled = !!(
    resumeEdit &&
    typeof resumeEdit.phone === 'string' && resumeEdit.phone.trim() &&
    typeof resumeEdit.birth === 'string' && resumeEdit.birth.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jobPost) return;
    if (!isResumeFilled) {
      setError('기본 정보(연락처, 생년월일)를 모두 입력해주세요.');
      return;
    }
    setResumeSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { resume: resumeEdit });
      await handleSubmitLatent();
    } catch (e) {
      setError('이력서 저장 또는 지원 중 오류가 발생했습니다.');
    } finally {
      setResumeSaving(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">지원서 작성</h1>
        <p className="text-gray-600">아래 공고에 지원하시겠습니까?</p>
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
                  <span>{jobPost.employerName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{jobPost.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{jobPost.salary.min.toLocaleString()}원 ~ {jobPost.salary.max.toLocaleString()}원</span>
                </div>
              </div>

              {jobPost.requirements.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">요구사항</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobPost.requirements.map((req, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jobPost.benefits.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">혜택</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobPost.benefits.map((benefit, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <input 
                value={user.displayName || ''} 
                disabled 
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-50 text-gray-500" 
                placeholder="계정 정보에서 가져옵니다"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">이메일</label>
              <input 
                value={user.email || ''} 
                disabled 
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-50 text-gray-500" 
                placeholder="계정 정보에서 가져옵니다"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">연락처 *</label>
              <input 
                name="phone" 
                value={resumeEdit.phone || ''} 
                onChange={handleResumeChange} 
                className="mt-1 block w-full border rounded px-2 py-1" 
                placeholder="010-1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">생년월일 *</label>
              <input 
                name="birth" 
                value={resumeEdit.birth || ''} 
                onChange={handleResumeChange} 
                className="mt-1 block w-full border rounded px-2 py-1" 
                placeholder="예: 1990-01-01" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 이력서 정보 (수정 가능) */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">이력서 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">희망직무</label>
              <input 
                name="jobType"
                value={resumeEdit.jobType || ''} 
                onChange={handleResumeChange}
                className="mt-1 block w-full border rounded px-2 py-1" 
                placeholder="희망하는 직무를 입력해주세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">경력</label>
              <input 
                name="career"
                value={resumeEdit.career || ''} 
                onChange={handleResumeChange}
                className="mt-1 block w-full border rounded px-2 py-1" 
                placeholder="경력을 입력해주세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">학력사항</label>
              <select 
                name="education"
                value={resumeEdit.education || ''} 
                onChange={handleResumeChange}
                className="mt-1 block w-full border rounded px-2 py-1" 
              >
                <option value="">학력을 선택해주세요</option>
                <option value="중학교 졸업">중학교 졸업</option>
                <option value="고등학교 졸업">고등학교 졸업</option>
                <option value="전문대학 재학">전문대학 재학</option>
                <option value="전문대학 졸업">전문대학 졸업</option>
                <option value="대학교 재학">대학교 재학</option>
                <option value="대학교 졸업">대학교 졸업</option>
                <option value="대학원 재학">대학원 재학</option>
                <option value="대학원 졸업">대학원 졸업</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
                              <label className="block text-sm font-medium text-gray-700">희망 시급 (원/시간)</label>
              <input 
                                name="hourlyWage"
                type="number"
                value={resumeEdit.hourlyWage || ''}
                onChange={handleResumeChange}
                min="10000"
                step="1000"
                className="mt-1 block w-full border rounded px-2 py-1"
                placeholder="희망 시급을 입력해주세요 (최소 10,000원)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">자기소개</label>
              <textarea 
                name="intro"
                value={resumeEdit.intro || ''} 
                onChange={handleResumeChange}
                rows={3}
                className="mt-1 block w-full border rounded px-2 py-1 resize-none" 
                placeholder="자기소개를 입력해주세요"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">평가 노출 여부</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="showEvaluations"
                    checked={resumeEdit.showEvaluations || false}
                    onChange={(e) => setResumeEdit(prev => ({ ...prev, showEvaluations: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">이력서에 받은 평가를 포함하여 노출</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  체크하면 구인자가 이력서에서 받은 긍정적 평가를 확인할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 다시 같이 일하고 싶어요 평가 요약 */}
            {evaluations.length > 0 && (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                    <span>다시 같이 일하고 싶어요</span>
                    <Users className="h-4 w-4 text-blue-500" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEvaluations(!showEvaluations)}
                    className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors"
                  >
                    {showEvaluations ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        펼치기
                      </>
                    )}
                  </button>
                </div>
                {showEvaluations && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">
                        총 {evaluations.length}개의 "다시 같이 일하고 싶어요" 평가
                      </span>
                      <span className="text-xs text-green-600">
                        최근 {evaluations.length > 0 ? evaluations[0].createdAt.toDate().toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {evaluations.slice(0, 3).map((evaluation) => (
                        <div key={evaluation.id} className="bg-white rounded p-2 border border-green-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-green-800">다시 같이 일하고 싶어요</h4>
                                <Users className="h-4 w-4 text-blue-500" />
                              </div>
                              <p className="text-xs text-green-700 line-clamp-2">{evaluation.description}</p>
                            </div>
                            <div className="text-xs text-green-600 ml-2">
                              {evaluation.createdAt.toDate().toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {evaluations.length > 3 && (
                      <p className="text-xs text-green-600 mt-2 text-center">
                        외 {evaluations.length - 3}개의 평가가 더 있습니다
                      </p>
                    )}
                  </div>
                )}
                {!showEvaluations && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">
                        총 {evaluations.length}개의 "다시 같이 일하고 싶어요" 평가가 있습니다
                      </span>
                      <span className="text-xs text-green-600">
                        최근 {evaluations.length > 0 ? evaluations[0].createdAt.toDate().toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-800">이력서 정보를 수정할 수 있습니다. 수정된 내용은 이 지원서에만 적용됩니다.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 지원서 작성 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">지원서 작성</h2>
          <p className="text-sm text-gray-600 mt-1">이 공고에 지원하기 위한 정보를 입력해주세요. (근무타입 선택은 필수, 이력서 정보는 수정 가능)</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* 근무타입 선택 섹션 추가 */}
            {jobPost.workTypes && jobPost.workTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  근무타입 선택
                </label>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-800">복수 선택 가능</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {jobPost.workTypes.map((workType) => {
                    const isExpanded = expandedWorkTypeId === workType.id;
                    const isSelected = application.selectedWorkTypeIds.includes(workType.id);
                    
                    return (
                      <div key={workType.id} className={`border rounded-lg p-4 transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}>
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="selectedWorkTypeIds"
                            value={workType.id}
                            checked={isSelected}
                            onChange={handleInputChange}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{workType.name}</div>
                                {workType.description && (
                                  <div className="text-sm text-gray-600 mt-1">{workType.description}</div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setExpandedWorkTypeId(isExpanded ? null : workType.id);
                                }}
                                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    접기
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    펼치기
                                  </>
                                )}
                              </button>
                            </div>
                            
                            {/* 스케줄 시각화 */}
                            {isExpanded && workType.schedules && workType.schedules.length > 0 && (
                              <div className="mt-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-xs">
                                    {/* 요일 헤더 */}
                                    <div className="grid grid-cols-8 gap-1 mb-2">
                                      <div className="text-gray-500 font-medium text-[10px]">시간</div>
                                      {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                                        <div key={day} className="text-center text-gray-500 font-medium text-[10px]">{day}</div>
                                      ))}
                                    </div>
                                    
                                    {/* 시간대별 행 (0-23시 범위) */}
                                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                      <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                                        <div className="text-gray-500 text-right pr-1 font-medium text-[9px]">{hour}:00</div>
                                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                          const isWorking = workType.schedules.some(s => 
                                            s.day === day && s.start <= hour && s.end > hour
                                          );
                                          
                                          return (
                                            <div 
                                              key={day} 
                                              className={`h-3 rounded-sm ${
                                                isWorking ? 'bg-blue-500' : 'bg-gray-200'
                                              }`}
                                              title={`${['일','월','화','수','목','금','토'][day]} ${hour}:00`}
                                            />
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
                {application.selectedWorkTypeIds.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        {application.selectedWorkTypeIds.length}개의 근무타입을 선택했습니다.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                지원동기 및 관련 경험 (선택)
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows={6}
                value={application.coverLetter}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-resort-500 focus:border-resort-500"
                placeholder="이 일자리에 지원하게 된 이유, 관련 경험, 보유 스킬 등을 자유롭게 작성해주세요. (선택사항)"
              />
            </div>


          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-resort-600 hover:bg-resort-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-resort-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? '지원 중...' : '지원하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplication; 