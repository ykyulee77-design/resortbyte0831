import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, JobPost, User, PositiveReview } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  User as UserIcon, 
  Phone, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  Award, 
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Send
} from 'lucide-react';

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', text: '지원완료' },
      reviewing: { color: 'bg-blue-100 text-blue-800', text: '검토중' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', text: '면접예정' },
      interview_completed: { color: 'bg-indigo-100 text-indigo-800', text: '면접완료' },
      offer_sent: { color: 'bg-orange-100 text-orange-800', text: '채용제안' },
      accepted: { color: 'bg-green-100 text-green-800', text: '최종채용' },
      rejected: { color: 'bg-red-100 text-red-800', text: '거절됨' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', text: '취소됨' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
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
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">지원서 상세 보기</h1>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(application.status)}
              <span className="text-sm text-gray-500">
                지원일: {application.appliedAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼 - 공고 정보 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 등록 공고 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                등록 공고 정보
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">{jobPost.title}</h3>
                  <p className="text-blue-700 text-sm">{jobPost.jobTitle}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{jobPost.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{jobPost.workplaceName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {jobPost.salary.min.toLocaleString()} - {jobPost.salary.max.toLocaleString()} {jobPost.salary.type}
                    </span>
                  </div>
                  
                  {jobPost.workSchedule && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{jobPost.workSchedule.hours}</span>
                    </div>
                  )}
                </div>

                {jobPost.description && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">공고 설명</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{jobPost.description}</p>
                  </div>
                )}

                {jobPost.requirements && jobPost.requirements.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">요구사항</h4>
                    <div className="flex flex-wrap gap-1">
                      {jobPost.requirements.map((req, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {jobPost.benefits && jobPost.benefits.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">복리후생</h4>
                    <div className="flex flex-wrap gap-1">
                      {jobPost.benefits.map((benefit, index) => (
                        <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 지원자 기본 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-green-600" />
                지원자 정보
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{application.jobseekerName || jobseeker.displayName}</span>
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
                
                {jobseeker.resume?.birth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{jobseeker.resume.birth}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 - 이력서 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 이력서 상세 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                이력서 상세 정보
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 학력 및 자격 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      학력사항
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.education || jobseeker.resume?.education ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.education || jobseeker.resume?.education}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      자격증/특기
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {jobseeker.resume?.certs && jobseeker.resume.certs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {jobseeker.resume.certs.map((cert, index) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              {cert}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 경력 및 기술 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-600" />
                      경력사항
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.experience || jobseeker.resume?.career ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.experience || jobseeker.resume?.career}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-600" />
                      보유 기술
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.skills && application.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {application.skills.map((skill, index) => (
                            <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 희망 조건 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">희망 조건</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">희망 급여</h4>
                    <p className="text-blue-700">
                      {application.expectedSalary || jobseeker.resume?.expectedSalary ? 
                        `${(application.expectedSalary || jobseeker.resume?.expectedSalary || 0).toLocaleString()}원` : 
                        '미입력'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">입사 가능일</h4>
                                         <p className="text-green-700">
                       {application.availableStartDate || jobseeker.resume?.availableStartDate ? 
                         (() => {
                           const date = application.availableStartDate || jobseeker.resume?.availableStartDate;
                           if (date instanceof Date) {
                             return date.toLocaleDateString();
                           } else if (typeof date === 'string') {
                             return new Date(date).toLocaleDateString();
                           }
                           return '미입력';
                         })() : 
                         '미입력'
                       }
                     </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-1">희망 직무</h4>
                    <p className="text-purple-700">
                      {application.jobTitle || jobseeker.resume?.jobType || '미입력'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">자기소개</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {application.coverLetter || jobseeker.resume?.intro ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {application.coverLetter || jobseeker.resume?.intro}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">작성되지 않음</p>
                  )}
                </div>
              </div>

              {/* 선택한 근무타입 */}
              {application.selectedWorkTypeIds && application.selectedWorkTypeIds.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">선택한 근무타입</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {application.selectedWorkTypeIds.map((workTypeId, index) => {
                        const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
                        return (
                          <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                            {workType ? workType.name : `근무타입 ${index + 1}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 추가 메시지 */}
              {application.message && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    추가 메시지
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-700">{application.message}</p>
                  </div>
                </div>
              )}

              {/* 평가 정보 */}
              {application.showEvaluations && evaluations.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    이전 근무 평가
                  </h3>
                  <div className="space-y-3">
                    {evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800 mb-2">다시 같이 일하고 싶어요</h4>
                            <p className="text-green-700 text-sm leading-relaxed">{evaluation.description}</p>
                          </div>
                          <div className="text-xs text-green-600 ml-4">
                            {evaluation.createdAt.toDate().toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 구인자 피드백 */}
            {application.employerFeedback && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  구인자 피드백
                </h2>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-orange-700 whitespace-pre-wrap leading-relaxed">{application.employerFeedback}</p>
                  <p className="text-sm text-orange-600 mt-2">
                    작성일: {application.employerFeedbackAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* 상태 변경 버튼 - 구인자만 */}
            {user?.role === 'employer' && application.status === 'pending' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">지원 상태 변경</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleStatusChange('accepted')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    승인하기
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    거절하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 피드백 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
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
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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