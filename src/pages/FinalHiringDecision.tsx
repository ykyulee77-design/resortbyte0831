import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, JobPost, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User as UserIcon,
  Building,
  Calendar,
  Phone,
  Mail,
  Send
} from 'lucide-react';

const FinalHiringDecision: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [jobseeker, setJobseeker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 채용 결정 관련 상태
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [hiringReason, setHiringReason] = useState('');
  const [offerDetails, setOfferDetails] = useState({
    salary: '',
    startDate: '',
    position: '',
    benefits: '',
    conditions: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          hourlyWage: data.hourlyWage || 0,
          message: data.message || '',
          jobTitle: data.jobTitle,
          employerName: data.employerName,
          location: data.location,
          salary: data.salary,
          selectedWorkTypeIds: data.selectedWorkTypeIds || [],
          processStage: data.processStage || 'applied',
          priority: data.priority || 'medium',
          tags: data.tags || [],
          employerFeedback: data.employerFeedback,
          interviewContactInfo: data.interviewContactInfo,
          interviewDate: data.interviewDate,
          resume: data.resume,
        };
        setApplication(applicationData);

        // 공고 정보 가져오기
        const jobPostDoc = await getDoc(doc(db, 'jobPosts', applicationData.jobPostId));
        if (jobPostDoc.exists()) {
          setJobPost({ id: jobPostDoc.id, ...jobPostDoc.data() } as JobPost);
        }

        // 지원자 정보 가져오기
        const jobseekerDoc = await getDoc(doc(db, 'users', applicationData.jobseekerId));
        if (jobseekerDoc.exists()) {
          setJobseeker({ id: jobseekerDoc.id, ...jobseekerDoc.data() } as User);
        }

        setLoading(false);
      } catch (error) {
        console.error('지원서 정보 로딩 실패:', error);
        alert('지원서 정보를 불러오는데 실패했습니다.');
        navigate('/dashboard');
      }
    };

    fetchApplicationDetails();
  }, [applicationId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !user?.uid) return;

    setSubmitting(true);

    try {
      // 지원서 상태 업데이트
      await updateDoc(doc(db, 'applications', application.id), {
        status: decision,
        employerFeedback: decision === 'accepted' 
          ? `[채용 확정] ${hiringReason}`
          : `[채용 거절] ${rejectionReason}`,
        employerFeedbackAt: new Date(),
        updatedAt: new Date(),
      });

      // 알림 생성
      await addDoc(collection(db, 'notifications'), {
        userId: application.jobseekerId,
        title: decision === 'accepted' ? '채용 확정' : '채용 거절',
        message: decision === 'accepted' 
          ? `축하합니다! ${jobPost?.title} 공고에 최종 채용이 확정되었습니다.`
          : `안타깝게도 ${jobPost?.title} 공고에 대한 채용이 거절되었습니다.`,
        type: 'application_status',
        isRead: false,
        createdAt: new Date(),
        applicationId: application.id,
        status: decision,
      });

      alert(decision === 'accepted' ? '채용이 확정되었습니다!' : '채용 거절이 완료되었습니다.');
      navigate('/dashboard');
    } catch (error) {
      console.error('채용 결정 처리 중 오류 발생:', error);
      alert('채용 결정 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/application-detail/${application.id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">최종 채용 결정</h1>
            </div>
            <div className="text-sm text-gray-500">
              지원일: {formatDate(application.appliedAt)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼 - 지원자 및 공고 정보 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 지원자 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-green-600" />
                지원자 정보
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{application.jobseekerName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{jobseeker.email}</span>
                </div>
                
                {jobseeker.resume?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{jobseeker.resume.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 공고 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                공고 정보
              </h2>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">{jobPost.title}</h3>
                <p className="text-sm text-gray-600">{jobPost.employerName}</p>
                <p className="text-sm text-gray-600">{jobPost.location}</p>
                <p className="text-sm text-gray-600">
                  {jobPost.salary.min.toLocaleString()} - {jobPost.salary.max.toLocaleString()} {jobPost.salary.type}
                </p>
              </div>
            </div>

            {/* 면접 노트 요약 */}
            {application.employerFeedback && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  면접 노트 요약
                </h2>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-700 text-sm line-clamp-3">
                    {application.employerFeedback}
                  </p>
                  {application.interviewDate && (
                    <p className="text-xs text-purple-600 mt-2">
                      면접일: {application.interviewDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 - 채용 결정 폼 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">최종 채용 결정</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 결정 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">채용 결정</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="accepted"
                        checked={decision === 'accepted'}
                        onChange={(e) => setDecision(e.target.value as 'accepted' | 'rejected')}
                        className="mr-2"
                      />
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-700 font-medium">채용 확정</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="rejected"
                        checked={decision === 'rejected'}
                        onChange={(e) => setDecision(e.target.value as 'accepted' | 'rejected')}
                        className="mr-2"
                      />
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-700 font-medium">채용 거절</span>
                    </label>
                  </div>
                </div>

                {/* 채용 확정 시 */}
                {decision === 'accepted' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        채용 확정 사유 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={hiringReason}
                        onChange={(e) => setHiringReason(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="면접 내용을 바탕으로 한 채용 확정 사유를 작성해주세요..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">제안 급여</label>
                        <input
                          type="text"
                          value={offerDetails.salary}
                          onChange={(e) => setOfferDetails(prev => ({ ...prev, salary: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="예: 15,000원/시간"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">근무 시작일</label>
                        <input
                          type="date"
                          value={offerDetails.startDate}
                          onChange={(e) => setOfferDetails(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">복리후생</label>
                      <textarea
                        value={offerDetails.benefits}
                        onChange={(e) => setOfferDetails(prev => ({ ...prev, benefits: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="제공되는 복리후생을 작성해주세요..."
                      />
                    </div>
                  </div>
                )}

                {/* 채용 거절 시 */}
                {decision === 'rejected' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      거절 사유 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="면접 내용을 바탕으로 한 거절 사유를 작성해주세요..."
                      required
                    />
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate(`/application-detail/${application.id}`)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (decision === 'accepted' && !hiringReason) || (decision === 'rejected' && !rejectionReason)}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {decision === 'accepted' ? '채용 확정' : '채용 거절'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalHiringDecision;
