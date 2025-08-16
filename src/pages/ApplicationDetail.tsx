import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, JobPost, User, PositiveReview } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Users } from 'lucide-react';

const ApplicationDetail: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [jobseeker, setJobseeker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [evaluations, setEvaluations] = useState<PositiveReview[]>([]);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!applicationId) return;

      try {
        // 지원서 정보 가져오기
        const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!applicationDoc.exists()) {
          alert('지원서를 찾을 수 없습니다.');
          navigate('/dashboard');
          return;
        }

        const data = applicationDoc.data();
        const raw = data.appliedAt;
        let appliedAt: Date;
        if (raw instanceof Date) {
          appliedAt = raw;
        } else if (raw && typeof raw.toDate === 'function') {
          appliedAt = raw.toDate();
        } else if (typeof raw === 'string' || typeof raw === 'number') {
          appliedAt = new Date(raw);
        } else {
          appliedAt = new Date();
        }
        
        const applicationData: Application = {
          id: applicationDoc.id,
          jobPostId: data.jobPostId,
          jobseekerId: data.jobseekerId,
          jobseekerName: data.jobseekerName,
          status: data.status,
          appliedAt,
          coverLetter: data.coverLetter || '',
          experience: data.experience || '',
          education: data.education || '',
          availableStartDate: data.availableStartDate ? (data.availableStartDate.toDate ? data.availableStartDate.toDate() : new Date(data.availableStartDate)) : undefined,
          skills: data.skills || [],
          expectedSalary: data.expectedSalary || 0,
          message: data.message || '',
          jobTitle: data.jobTitle,
          employerName: data.employerName,
          location: data.location,
          salary: data.salary,
          selectedWorkTypeIds: data.selectedWorkTypeIds || []
        };
        setApplication(applicationData);

        // 공고 정보 가져오기
        const jobPostDoc = await getDoc(doc(db, 'jobPosts', applicationData.jobPostId));
        if (jobPostDoc.exists()) {
          setJobPost({ id: jobPostDoc.id, ...jobPostDoc.data() } as JobPost);
        }

        // 지원자 정보 가져오기
        const userDoc = await getDoc(doc(db, 'users', applicationData.jobseekerId));
        if (userDoc.exists()) {
          setJobseeker({ uid: userDoc.id, ...userDoc.data() } as User);
        }

        // 평가 정보 가져오기 (평가 노출이 허용된 경우에만)
        if (data.showEvaluations) {
          const evaluationsQuery = collection(db, 'positiveReviews');
          const evaluationsSnapshot = await getDocs(evaluationsQuery);
          const evaluationsData = evaluationsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as PositiveReview))
            .filter(review => 
              review.jobseekerId === applicationData.jobseekerId && 
              review.isPublic
            );
          setEvaluations(evaluationsData);
        }

        setStatus(applicationData.status as 'pending' | 'accepted' | 'rejected');
      } catch (error) {
        console.error('지원서 정보를 가져오는 중 오류 발생:', error);
        alert('지원서 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId, navigate]);

  const handleStatusChange = async (newStatus: 'accepted' | 'rejected') => {
    if (!application) return;

    try {
      setShowFeedbackModal(true);
      setStatus(newStatus);
    } catch (error) {
      console.error('상태 변경 중 오류 발생:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!application) return;

    try {
      // 지원서 상태 업데이트
      await updateDoc(doc(db, 'applications', application.id), {
        status: status,
        employerFeedback: feedback,
        employerFeedbackAt: new Date(),
        updatedAt: new Date()
      });

      // 알림 생성
      await addDoc(collection(db, 'notifications'), {
        userId: application.jobseekerId,
        title: `지원 상태 변경: ${status === 'accepted' ? '승인' : '거절'}`,
        message: status === 'accepted' 
          ? `축하합니다! ${jobPost?.title} 공고에 지원하신 내용이 승인되었습니다.`
          : `안타깝게도 ${jobPost?.title} 공고에 지원하신 내용이 거절되었습니다.`,
        type: 'application_status',
        isRead: false,
        createdAt: new Date(),
        applicationId: application.id,
        status: status
      });

      setShowFeedbackModal(false);
      setFeedback('');
      alert('지원 상태가 성공적으로 변경되었습니다.');
      navigate('/dashboard');
    } catch (error) {
      console.error('피드백 제출 중 오류 발생:', error);
      alert('피드백 제출 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">지원서 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!application || !jobPost || !jobseeker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">지원서를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">지원서 상세 보기</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              뒤로가기
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {user?.role === 'employer' ? '공고 정보' : '지원한 공고'}
            </h2>
            <p className="text-gray-600 mb-1"><strong>제목:</strong> {jobPost.title}</p>
            <p className="text-gray-600 mb-1"><strong>위치:</strong> {jobPost.location}</p>
            <p className="text-gray-600 mb-1">
              <strong>급여:</strong> {jobPost.salary.min.toLocaleString()} - {jobPost.salary.max.toLocaleString()} {jobPost.salary.type}
            </p>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">지원자 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">이름:</span>
                  <span className="text-gray-900 font-medium">{application.jobseekerName || jobseeker.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일:</span>
                  <span className="text-gray-900">{application.email || jobseeker.email}</span>
                </div>
                {application.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">연락처:</span>
                    <span className="text-gray-900">{application.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">지원일:</span>
                  <span className="text-gray-900">{application.appliedAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">지원 상태</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">상태:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    application.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    application.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                    application.status === 'interview_scheduled' ? 'bg-purple-100 text-purple-800' :
                    application.status === 'interview_completed' ? 'bg-indigo-100 text-indigo-800' :
                    application.status === 'offer_sent' ? 'bg-orange-100 text-orange-800' :
                    application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {application.status === 'pending' ? '지원완료' : 
                     application.status === 'reviewing' ? '검토중' :
                     application.status === 'interview_scheduled' ? '면접예정' :
                     application.status === 'interview_completed' ? '면접완료' :
                     application.status === 'offer_sent' ? '채용제안' :
                     application.status === 'accepted' ? '최종채용' :
                     application.status === 'rejected' ? '거절됨' :
                     application.status === 'withdrawn' ? '취소됨' : '검토중'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 지원서 내용 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">지원서 내용</h2>
          


          {/* 학력사항 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">학력사항</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {application.education ? (
                <p className="text-gray-700 whitespace-pre-wrap">{application.education}</p>
              ) : (
                <p className="text-gray-500 italic">작성되지 않음</p>
              )}
            </div>
          </div>

          {/* 보유 기술 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">보유 기술</h3>
            {application.skills && application.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {application.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">작성되지 않음</p>
            )}
          </div>

          {/* 희망 시급 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">희망 시급</h3>
            {application.expectedSalary ? (
              <p className="text-gray-700">{Math.round(application.expectedSalary / 1000)}천원/시간</p>
            ) : (
              <p className="text-gray-500 italic">작성되지 않음</p>
            )}
          </div>

          {/* 입사 가능일 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">입사 가능일</h3>
            {application.availableStartDate ? (
              <p className="text-gray-700">{application.availableStartDate?.toLocaleDateString()}</p>
            ) : (
              <p className="text-gray-500 italic">작성되지 않음</p>
            )}
          </div>

          {/* 추가 메시지 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">추가 메시지</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {application.message ? (
                <p className="text-gray-700">{application.message}</p>
              ) : (
                <p className="text-gray-500 italic">작성되지 않음</p>
              )}
            </div>
          </div>

          {/* 선택한 근무타입 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">선택한 근무타입</h3>
            {application.selectedWorkTypeIds && application.selectedWorkTypeIds.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {application.selectedWorkTypeIds.map((workTypeId, index) => {
                    const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
                    return (
                      <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {workType ? workType.name : `근무타입 ${index + 1}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">선택되지 않음</p>
            )}
          </div>

          {/* 지원 동기 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">지원 동기</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {application.coverLetter ? (
                <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
              ) : (
                <p className="text-gray-500 italic">작성되지 않음</p>
              )}
            </div>
          </div>

          {/* 관련 경험 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">관련 경험</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {application.experience ? (
                <p className="text-gray-700 whitespace-pre-wrap">{application.experience}</p>
              ) : (
                <p className="text-gray-500 italic">작성되지 않음</p>
              )}
            </div>
          </div>

          {/* 다시 같이 일하고 싶어요 평가 */}
          {application.showEvaluations && (
            <div className="mb-6">
                             <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                 <span>다시 같이 일하고 싶어요</span>
                 <Users className="h-5 w-5 text-blue-500" />
               </h3>
              {evaluations.length > 0 ? (
                <div className="space-y-3">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                                                     <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium text-green-800">다시 같이 일하고 싶어요</h4>
                             <Users className="h-5 w-5 text-blue-500" />
                           </div>
                          <p className="text-green-700 text-sm">{evaluation.description}</p>
                        </div>
                        <div className="text-xs text-green-600 ml-4">
                          {evaluation.createdAt.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 italic">아직 받은 평가가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 구인자 피드백 */}
        {application.employerFeedback && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">구인자 피드백</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{application.employerFeedback}</p>
              <p className="text-sm text-gray-500 mt-2">
                작성일: {application.employerFeedbackAt?.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* 상태 변경 버튼 - 구인자만 */}
        {user?.role === 'employer' && application.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">지원 상태 변경</h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleStatusChange('accepted')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex-1"
              >
                승인하기
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex-1"
              >
                거절하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 피드백 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {status === 'accepted' ? '승인' : '거절'} 피드백 작성
            </h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`지원자를 ${status === 'accepted' ? '승인' : '거절'}하는 이유를 작성해주세요...`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail; 